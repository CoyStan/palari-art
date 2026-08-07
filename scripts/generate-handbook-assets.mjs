import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const registryPath = path.join(repositoryRoot, "docs/art-guide/assets/plates.json");
const outputRoot = path.join(repositoryRoot, "public/handbook/assets");
const manifestPath = path.join(outputRoot, "manifest.json");
const force = process.argv.includes("--force");
const tiers = {
  full: { maxWidth: 1280, quality: 84 },
  compact: { maxWidth: 640, quality: 76 },
};

function run(command, args, captureOutput = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
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
      else reject(new Error(`${command} exited with ${code}: ${stderr.trim()}`));
    });
  });
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function sha256(filePath) {
  return createHash("sha256").update(await readFile(filePath)).digest("hex");
}

async function dimensions(filePath) {
  const result = await run("ffprobe", [
    "-v", "error",
    "-select_streams", "v:0",
    "-show_entries", "stream=width,height",
    "-of", "csv=s=x:p=0",
    filePath,
  ], true);
  const [width, height] = result.stdout.trim().split("x").map(Number);
  return { width, height };
}

async function encode(sourcePath, outputPath, tier) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await run("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
    "-i", sourcePath,
    "-vf", `scale=${tier.maxWidth}:-2:force_original_aspect_ratio=decrease:flags=lanczos`,
    "-frames:v", "1",
    "-c:v", "libwebp",
    "-lossless", "0",
    "-compression_level", "6",
    "-q:v", String(tier.quality),
    "-pix_fmt", "yuv420p",
    outputPath,
  ]);
}

const registry = JSON.parse(await readFile(registryPath, "utf8"));
const previous = await readFile(manifestPath, "utf8").then(JSON.parse).catch(() => undefined);
const previousById = new Map(previous?.plates?.map((plate) => [plate.id, plate]) ?? []);
const generated = [];

for (const plate of registry.plates) {
  const sourcePath = path.join(repositoryRoot, plate.source);
  const sourceHash = await sha256(sourcePath);
  const sourceStats = await stat(sourcePath);
  const sourceDimensions = await dimensions(sourcePath);
  const outputs = {};
  const old = previousById.get(plate.id);

  for (const [tierName, tier] of Object.entries(tiers)) {
    const outputPath = path.join(outputRoot, tierName, `${plate.slug}.webp`);
    const reusable = !force
      && old?.source?.sha256 === sourceHash
      && old?.outputs?.[tierName]?.quality === tier.quality
      && old?.outputs?.[tierName]?.maxWidth === tier.maxWidth
      && await exists(outputPath)
      && await sha256(outputPath) === old.outputs[tierName].sha256;
    if (!reusable) await encode(sourcePath, outputPath, tier);
    const outputStats = await stat(outputPath);
    outputs[tierName] = {
      path: path.relative(repositoryRoot, outputPath).split(path.sep).join("/"),
      ...await dimensions(outputPath),
      maxWidth: tier.maxWidth,
      quality: tier.quality,
      bytes: outputStats.size,
      sha256: await sha256(outputPath),
    };
  }

  generated.push({
    id: plate.id,
    slug: plate.slug,
    title: plate.title,
    alt: plate.alt,
    source: {
      path: plate.source,
      ...sourceDimensions,
      bytes: sourceStats.size,
      sha256: sourceHash,
    },
    outputs,
  });
}

const ffmpeg = await run("ffmpeg", ["-version"], true);
const manifest = {
  schemaVersion: 1,
  recipeVersion: 1,
  generatedAt: new Date().toISOString(),
  generator: {
    name: "ffmpeg/libwebp",
    version: ffmpeg.stdout.split("\n")[0],
    resizeFilter: "lanczos",
    pixelFormat: "yuv420p",
  },
  tiers,
  plates: generated,
};

await mkdir(outputRoot, { recursive: true });
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

const sourceBytes = generated.reduce((sum, plate) => sum + plate.source.bytes, 0);
const webBytes = generated.reduce(
  (sum, plate) => sum + Object.values(plate.outputs).reduce((total, output) => total + output.bytes, 0),
  0,
);
console.log(`Prepared ${generated.length} handbook plates.`);
console.log(`PNG ${(sourceBytes / 1_048_576).toFixed(1)} MiB -> WebP ${(webBytes / 1_048_576).toFixed(1)} MiB.`);
