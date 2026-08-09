import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const collection = JSON.parse(await readFile(path.join(repositoryRoot, "docs/palari-v2/collection.json"), "utf8"));
const outputRoot = path.join(repositoryRoot, "public/palari-v2-web");
const layerRecipes = {
  source: { lossless: false, quality: 90 },
  material: { lossless: true, quality: 100 },
  characteristic: { lossless: true, quality: 100 },
};

function run(command, arguments_, captureOutput = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, arguments_, {
      cwd: repositoryRoot,
      stdio: captureOutput ? ["ignore", "pipe", "pipe"] : ["ignore", "ignore", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => { stdout += chunk; });
    child.stderr?.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${command} exited with code ${code}: ${stderr.trim()}`));
    });
  });
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function relative(filePath) {
  return path.relative(repositoryRoot, filePath).split(path.sep).join("/");
}

async function encode(sourcePath, outputPath, recipe) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await run("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
    "-i", sourcePath,
    "-frames:v", "1",
    "-c:v", "libwebp",
    "-lossless", recipe.lossless ? "1" : "0",
    "-compression_level", "6",
    "-q:v", String(recipe.quality),
    outputPath,
  ]);
  if (recipe.lossless) {
    await run("compare", ["-metric", "AE", sourcePath, outputPath, "null:"], true);
  }
}

async function prepareAvatar(avatar) {
  const assets = {};
  await Promise.all(Object.entries(layerRecipes).map(async ([layer, recipe]) => {
    const sourcePath = path.join(repositoryRoot, `public/palari-v2/${avatar.id}/${layer}.png`);
    const outputPath = path.join(outputRoot, avatar.id, `${layer}.webp`);
    await encode(sourcePath, outputPath, recipe);
    const [sourceBuffer, outputBuffer, sourceStats, outputStats] = await Promise.all([
      readFile(sourcePath), readFile(outputPath), stat(sourcePath), stat(outputPath),
    ]);
    assets[layer] = {
      source: { path: relative(sourcePath), bytes: sourceStats.size, sha256: sha256(sourceBuffer) },
      output: {
        path: relative(outputPath),
        bytes: outputStats.size,
        sha256: sha256(outputBuffer),
        width: 1254,
        height: 1254,
        lossless: recipe.lossless,
        quality: recipe.quality,
        differingPixels: recipe.lossless ? 0 : null,
      },
    };
  }));
  return { avatarId: avatar.id, assets };
}

const results = [];
for (let index = 0; index < collection.avatars.length; index += 4) {
  results.push(...await Promise.all(collection.avatars.slice(index, index + 4).map(prepareAvatar)));
}

const [ffmpegVersion, compareVersion] = await Promise.all([
  run("ffmpeg", ["-version"], true),
  run("compare", ["-version"], true),
]);
const manifest = {
  schemaVersion: 1,
  recipeVersion: 1,
  generator: {
    encoder: ffmpegVersion.stdout.split("\n")[0].trim(),
    pixelVerifier: compareVersion.stdout.split("\n")[0].trim(),
    codec: "libwebp",
    compressionLevel: 6,
  },
  avatars: results,
};
await mkdir(outputRoot, { recursive: true });
await writeFile(path.join(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

const sourceBytes = results.flatMap((entry) => Object.values(entry.assets)).reduce((sum, entry) => sum + entry.source.bytes, 0);
const outputBytes = results.flatMap((entry) => Object.values(entry.assets)).reduce((sum, entry) => sum + entry.output.bytes, 0);
console.log(`Prepared ${results.length * 3} Palari V2 WebPs (${(outputBytes / 1_048_576).toFixed(1)} MiB from ${(sourceBytes / 1_048_576).toFixed(1)} MiB).`);
