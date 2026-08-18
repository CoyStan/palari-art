import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const collection = JSON.parse(await readFile(path.join(repositoryRoot, "docs/palari-v2/collection.json"), "utf8"));
const sourceRoot = path.join(repositoryRoot, "docs/palari-v2/ip-icons");
const outputRoot = path.join(repositoryRoot, "public/palari-v2-icons-web");
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

async function discoverSources() {
  const sources = new Map();
  const directories = (await readdir(sourceRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && /^pilot-\d+$/.test(entry.name));

  for (const directory of directories) {
    const directoryPath = path.join(sourceRoot, directory.name);
    for (const entry of await readdir(directoryPath, { withFileTypes: true })) {
      const match = entry.isFile() && /^(palari-\d{3})\.png$/.exec(entry.name);
      if (!match) continue;
      if (sources.has(match[1])) throw new Error(`${match[1]} has more than one icon source.`);
      sources.set(match[1], path.join(directoryPath, entry.name));
    }
  }
  return sources;
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

const sources = await discoverSources();
const expectedIds = collection.avatars.map((avatar) => avatar.id);
if (sources.size !== expectedIds.length || expectedIds.some((id) => !sources.has(id))) {
  throw new Error(`Expected one icon source for each of ${expectedIds.length} Palari V2 avatars; found ${sources.size}.`);
}

async function prepareAvatar(avatar) {
  const sourcePath = sources.get(avatar.id);
  const sourceBuffer = await readFile(sourcePath);
  const sourceStats = await stat(sourcePath);
  const sourceDimensions = pngDimensions(sourceBuffer, relative(sourcePath));
  if (sourceDimensions.width !== 1254 || sourceDimensions.height !== 1254) {
    throw new Error(`${relative(sourcePath)} must be 1254 x 1254.`);
  }

  const assets = {};
  await Promise.all(Object.entries(recipes).map(async ([name, recipe]) => {
    const outputPath = path.join(outputRoot, avatar.id, `${name}.webp`);
    await encode(sourcePath, outputPath, recipe);
    const outputBuffer = await readFile(outputPath);
    const outputStats = await stat(outputPath);
    assets[name] = {
      path: relative(outputPath),
      bytes: outputStats.size,
      sha256: sha256(outputBuffer),
      width: recipe.width,
      height: recipe.height,
      lossless: false,
      quality: recipe.quality,
    };
  }));

  return {
    avatarId: avatar.id,
    source: {
      path: relative(sourcePath),
      bytes: sourceStats.size,
      sha256: sha256(sourceBuffer),
      width: sourceDimensions.width,
      height: sourceDimensions.height,
    },
    assets,
  };
}

const results = [];
for (let index = 0; index < collection.avatars.length; index += 4) {
  results.push(...await Promise.all(collection.avatars.slice(index, index + 4).map(prepareAvatar)));
}

const ffmpegVersion = await run("ffmpeg", ["-version"], true);
const manifest = {
  schemaVersion: 1,
  recipeVersion: 1,
  generator: {
    encoder: ffmpegVersion.stdout.split("\n")[0].trim(),
    codec: "libwebp",
    compressionLevel: 6,
  },
  avatars: results,
};
await mkdir(outputRoot, { recursive: true });
await writeFile(path.join(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

const sourceBytes = results.reduce((sum, entry) => sum + entry.source.bytes, 0);
const outputBytes = results.flatMap((entry) => Object.values(entry.assets)).reduce((sum, entry) => sum + entry.bytes, 0);
console.log(`Prepared ${results.length * 2} Palari V2 emoticon WebPs (${(outputBytes / 1_048_576).toFixed(1)} MiB from ${(sourceBytes / 1_048_576).toFixed(1)} MiB).`);
