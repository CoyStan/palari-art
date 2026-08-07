import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { access, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { availableParallelism } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const avatarRoot = path.join(repositoryRoot, "public/avatars");
const outputRoot = path.join(repositoryRoot, "public/avatars-web");
const manifestPath = path.join(outputRoot, "manifest.json");
const force = process.argv.includes("--force");
const concurrencyOption = process.argv.find((argument) => argument.startsWith("--concurrency="));
const requestedConcurrency = concurrencyOption
  ? Number.parseInt(concurrencyOption.split("=")[1], 10)
  : Math.min(4, Math.max(1, availableParallelism() - 1));

if (!Number.isInteger(requestedConcurrency) || requestedConcurrency < 1) {
  throw new Error("--concurrency must be a positive integer.");
}

const tiers = {
  full: { size: 1024, quality: 82 },
  thumbnail: { size: 256, quality: 72 },
};

async function walkPngFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = path.join(prefix, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkPngFiles(path.join(directory, entry.name), relativePath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".png")) {
      files.push(relativePath);
    }
  }
  return files.sort();
}

async function sha256(filePath) {
  return createHash("sha256").update(await readFile(filePath)).digest("hex");
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

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

async function encodeWebp(sourcePath, outputPath, { size, quality }) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await run("ffmpeg", [
    "-hide_banner",
    "-loglevel", "error",
    "-nostdin",
    "-y",
    "-i", sourcePath,
    "-vf", `scale=${size}:${size}:flags=lanczos`,
    "-frames:v", "1",
    "-c:v", "libwebp",
    "-lossless", "0",
    "-compression_level", "6",
    "-q:v", String(quality),
    "-pix_fmt", "yuv420p",
    outputPath,
  ]);
}

function manifestPathFor(filePath) {
  return path.relative(repositoryRoot, filePath).split(path.sep).join("/");
}

function outputPathFor(relativeSourcePath, tier) {
  return path.join(outputRoot, tier, relativeSourcePath.replace(/\.png$/i, ".webp"));
}

let previousManifest;
try {
  previousManifest = JSON.parse(await readFile(manifestPath, "utf8"));
} catch {
  previousManifest = undefined;
}

const previousBySource = new Map(
  previousManifest?.recipeVersion === 1
    ? previousManifest.assets.map((asset) => [asset.source.path, asset])
    : [],
);
const sourceFiles = await walkPngFiles(avatarRoot);
const results = new Array(sourceFiles.length);
let nextIndex = 0;
let generated = 0;

async function processSource(relativeSourcePath) {
  const sourcePath = path.join(avatarRoot, relativeSourcePath);
  const sourcePathInManifest = manifestPathFor(sourcePath);
  const sourceHash = await sha256(sourcePath);
  const fullPath = outputPathFor(relativeSourcePath, "full");
  const thumbnailPath = outputPathFor(relativeSourcePath, "thumbnail");
  const previous = previousBySource.get(sourcePathInManifest);
  const reusable = !force
    && previous?.source.sha256 === sourceHash
    && previous?.full.width === tiers.full.size
    && previous?.full.quality === tiers.full.quality
    && previous?.thumbnail.width === tiers.thumbnail.size
    && previous?.thumbnail.quality === tiers.thumbnail.quality
    && await exists(fullPath)
    && await exists(thumbnailPath)
    && await sha256(fullPath) === previous?.full.sha256
    && await sha256(thumbnailPath) === previous?.thumbnail.sha256;

  if (!reusable) {
    await encodeWebp(sourcePath, fullPath, tiers.full);
    await encodeWebp(sourcePath, thumbnailPath, tiers.thumbnail);
    generated += 1;
  }

  const [sourceStats, fullStats, thumbnailStats, fullHash, thumbnailHash] = await Promise.all([
    stat(sourcePath),
    stat(fullPath),
    stat(thumbnailPath),
    sha256(fullPath),
    sha256(thumbnailPath),
  ]);

  return {
    source: {
      path: sourcePathInManifest,
      bytes: sourceStats.size,
      sha256: sourceHash,
    },
    full: {
      path: manifestPathFor(fullPath),
      width: tiers.full.size,
      height: tiers.full.size,
      quality: tiers.full.quality,
      bytes: fullStats.size,
      sha256: fullHash,
    },
    thumbnail: {
      path: manifestPathFor(thumbnailPath),
      width: tiers.thumbnail.size,
      height: tiers.thumbnail.size,
      quality: tiers.thumbnail.quality,
      bytes: thumbnailStats.size,
      sha256: thumbnailHash,
    },
  };
}

async function worker() {
  while (nextIndex < sourceFiles.length) {
    const index = nextIndex;
    nextIndex += 1;
    results[index] = await processSource(sourceFiles[index]);
  }
}

const versionResult = await run("ffmpeg", ["-version"], true);
await Promise.all(Array.from(
  { length: Math.min(requestedConcurrency, sourceFiles.length) },
  () => worker(),
));

const manifest = {
  schemaVersion: 1,
  recipeVersion: 1,
  generator: {
    name: "ffmpeg/libwebp",
    version: versionResult.stdout.split("\n")[0].trim(),
    resizeFilter: "lanczos",
    compressionLevel: 6,
    pixelFormat: "yuv420p",
  },
  tiers,
  assets: results,
};

await mkdir(outputRoot, { recursive: true });
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

const sourceBytes = results.reduce((sum, asset) => sum + asset.source.bytes, 0);
const fullBytes = results.reduce((sum, asset) => sum + asset.full.bytes, 0);
const thumbnailBytes = results.reduce((sum, asset) => sum + asset.thumbnail.bytes, 0);
const percent = ((1 - (fullBytes + thumbnailBytes) / sourceBytes) * 100).toFixed(1);

console.log(
  `Prepared ${results.length} web avatar pairs (${generated} regenerated) with ${percent}% fewer bytes than the PNG masters.`,
);
console.log(
  `PNG ${(sourceBytes / 1_048_576).toFixed(1)} MiB -> full WebP ${(fullBytes / 1_048_576).toFixed(1)} MiB + thumbnails ${(thumbnailBytes / 1_048_576).toFixed(1)} MiB.`,
);
