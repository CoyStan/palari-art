import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const collection = JSON.parse(await readFile(path.join(repositoryRoot, "docs/palari-v3/collection.json"), "utf8"));
const outputRoot = path.join(repositoryRoot, "public/palari-v3-icons-web");
const recipes = {
  icon: { width: 1024, height: 1024, quality: 88 },
  thumbnail: { width: 256, height: 256, quality: 82 },
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

function pngDimensions(buffer, fileName) {
  if (buffer.length < 29 || buffer.toString("ascii", 1, 4) !== "PNG" || buffer.toString("ascii", 12, 16) !== "IHDR") {
    throw new Error(`${fileName} is not a PNG.`);
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

async function encode(sourcePath, outputPath, recipe) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await run("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
    "-i", sourcePath,
    "-frames:v", "1",
    "-vf", `scale=${recipe.width}:${recipe.height}:flags=lanczos`,
    "-c:v", "libwebp",
    "-lossless", "0",
    "-compression_level", "6",
    "-q:v", String(recipe.quality),
    outputPath,
  ]);
}

async function prepareAvatar(avatar) {
  const sourcePath = path.join(repositoryRoot, avatar.source);
  const sourceBuffer = await readFile(sourcePath);
  const sourceStats = await stat(sourcePath);
  const dimensions = pngDimensions(sourceBuffer, avatar.source);
  if (dimensions.width !== 1254 || dimensions.height !== 1254) throw new Error(`${avatar.source} must be 1254 x 1254.`);

  const assets = {};
  for (const [name, recipe] of Object.entries(recipes)) {
    const outputPath = path.join(repositoryRoot, "public", name === "icon" ? avatar.icon : avatar.thumbnail);
    if (avatar.sourceKind === "v3-generated") await encode(sourcePath, outputPath, recipe);
    const outputBuffer = await readFile(outputPath);
    const outputStats = await stat(outputPath);
    assets[name] = {
      path: relative(outputPath),
      bytes: outputStats.size,
      sha256: sha256(outputBuffer),
      width: recipe.width,
      height: recipe.height,
      quality: recipe.quality,
      reused: avatar.sourceKind === "v2-curated",
    };
  }

  return {
    avatarId: avatar.id,
    sourceKind: avatar.sourceKind,
    sourceId: avatar.sourceId ?? null,
    source: {
      path: avatar.source,
      bytes: sourceStats.size,
      sha256: sha256(sourceBuffer),
      width: dimensions.width,
      height: dimensions.height,
    },
    assets,
  };
}

const results = [];
for (let index = 0; index < collection.avatars.length; index += 4) {
  results.push(...await Promise.all(collection.avatars.slice(index, index + 4).map(prepareAvatar)));
}

const ffmpegVersion = await run("ffmpeg", ["-version"], true);
await mkdir(outputRoot, { recursive: true });
await writeFile(path.join(outputRoot, "manifest.json"), `${JSON.stringify({
  schemaVersion: 1,
  recipeVersion: 1,
  generator: {
    encoder: ffmpegVersion.stdout.split("\n")[0].trim(),
    codec: "libwebp",
    compressionLevel: 6,
  },
  avatars: results,
}, null, 2)}\n`);

const newCount = results.filter((entry) => entry.sourceKind === "v3-generated").length;
console.log(`Prepared ${newCount * 2} native V3 WebPs and registered ${results.length} avatars.`);
