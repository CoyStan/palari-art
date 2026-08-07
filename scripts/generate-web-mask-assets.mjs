import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { availableParallelism } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const sourceRoot = path.join(repositoryRoot, "public/masks");
const outputRoot = path.join(repositoryRoot, "public/masks-web");
const manifestPath = path.join(outputRoot, "manifest.json");
const registryPath = path.join(repositoryRoot, "src/data/avatar-masks.json");
const force = process.argv.includes("--force");
const concurrencyOption = process.argv.find((argument) => argument.startsWith("--concurrency="));
const requestedConcurrency = concurrencyOption
  ? Number.parseInt(concurrencyOption.split("=")[1], 10)
  : Math.min(8, Math.max(1, availableParallelism() - 1));

if (!Number.isInteger(requestedConcurrency) || requestedConcurrency < 1) {
  throw new Error("--concurrency must be a positive integer.");
}

const baseRuntimeFiles = ["foreground.png", "matte.png", "shirt.png"];
const hairRuntimeFiles = [
  "hair.png",
  "hair-region.png",
  "hair-matte.png",
  "hair-foreground.png",
  "hair-underlay.png",
  "hair-underlay-kind.png",
];

function manifestPathFor(filePath) {
  return path.relative(repositoryRoot, filePath).split(path.sep).join("/");
}

function outputPathFor(id, fileName) {
  return path.join(outputRoot, id, fileName.replace(/\.png$/i, ".webp"));
}

function pngDimensions(buffer, fileName) {
  if (
    buffer.length < 24
    || buffer.toString("ascii", 1, 4) !== "PNG"
    || buffer.toString("ascii", 12, 16) !== "IHDR"
  ) {
    throw new Error(`${fileName} is not a valid PNG file.`);
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
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

async function encodeLosslessWebp(sourcePath, outputPath) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await run("ffmpeg", [
    "-hide_banner",
    "-loglevel", "error",
    "-nostdin",
    "-y",
    "-i", sourcePath,
    "-frames:v", "1",
    "-c:v", "libwebp",
    "-lossless", "1",
    "-compression_level", "6",
    "-q:v", "100",
    outputPath,
  ]);

  await run("compare", ["-metric", "AE", sourcePath, outputPath, "null:"], true);
}

const registry = JSON.parse(await readFile(registryPath, "utf8"));
const expectedSources = registry.avatars.flatMap((avatar) => {
  const useHairMatting = avatar.hairMatting !== false
    && (registry.hairMattingCoverage === "all" || avatar.hairPilot);
  const fileNames = useHairMatting
    ? [...baseRuntimeFiles, ...hairRuntimeFiles]
    : baseRuntimeFiles;
  return fileNames.map((fileName) => ({ id: avatar.id, fileName }));
});

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
const results = new Array(expectedSources.length);
let nextIndex = 0;
let generated = 0;
let completed = 0;

async function processSource({ id, fileName }) {
  const sourcePath = path.join(sourceRoot, id, fileName);
  const outputPath = outputPathFor(id, fileName);
  const sourcePathInManifest = manifestPathFor(sourcePath);
  const sourceBuffer = await readFile(sourcePath);
  const sourceHash = sha256(sourceBuffer);
  const dimensions = pngDimensions(sourceBuffer, sourcePathInManifest);
  const previous = previousBySource.get(sourcePathInManifest);
  const reusable = !force
    && previous?.source.sha256 === sourceHash
    && previous?.output.lossless === true
    && await exists(outputPath)
    && sha256(await readFile(outputPath)) === previous.output.sha256;

  if (!reusable) {
    await encodeLosslessWebp(sourcePath, outputPath);
    generated += 1;
  }

  const [sourceStats, outputStats, outputBuffer] = await Promise.all([
    stat(sourcePath),
    stat(outputPath),
    readFile(outputPath),
  ]);

  return {
    avatarId: id,
    layer: fileName.replace(/\.png$/i, ""),
    source: {
      path: sourcePathInManifest,
      width: dimensions.width,
      height: dimensions.height,
      bytes: sourceStats.size,
      sha256: sourceHash,
    },
    output: {
      path: manifestPathFor(outputPath),
      width: dimensions.width,
      height: dimensions.height,
      lossless: true,
      differingPixels: 0,
      bytes: outputStats.size,
      sha256: sha256(outputBuffer),
    },
  };
}

async function worker() {
  while (nextIndex < expectedSources.length) {
    const index = nextIndex;
    nextIndex += 1;
    results[index] = await processSource(expectedSources[index]);
    completed += 1;
    if (completed % 50 === 0 || completed === expectedSources.length) {
      console.log(`Processed ${completed}/${expectedSources.length} runtime mask layers.`);
    }
  }
}

const [ffmpegVersion, compareVersion] = await Promise.all([
  run("ffmpeg", ["-version"], true),
  run("compare", ["-version"], true),
]);
await Promise.all(Array.from(
  { length: Math.min(requestedConcurrency, expectedSources.length) },
  () => worker(),
));

const manifest = {
  schemaVersion: 1,
  recipeVersion: 1,
  generator: {
    encoder: ffmpegVersion.stdout.split("\n")[0].trim(),
    pixelVerifier: compareVersion.stdout.split("\n")[0].trim(),
    codec: "libwebp",
    lossless: true,
    quality: 100,
    compressionLevel: 6,
  },
  assets: results,
};

await mkdir(outputRoot, { recursive: true });
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

const sourceBytes = results.reduce((sum, asset) => sum + asset.source.bytes, 0);
const outputBytes = results.reduce((sum, asset) => sum + asset.output.bytes, 0);
const savings = ((1 - outputBytes / sourceBytes) * 100).toFixed(1);

console.log(
  `Prepared ${results.length} lossless runtime-mask WebPs (${generated} regenerated) with ${savings}% fewer bytes and zero differing pixels.`,
);
console.log(
  `PNG ${(sourceBytes / 1_048_576).toFixed(1)} MiB -> WebP ${(outputBytes / 1_048_576).toFixed(1)} MiB.`,
);
