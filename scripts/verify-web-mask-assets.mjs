import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const sourceRoot = path.join(repositoryRoot, "public/masks");
const outputRoot = path.join(repositoryRoot, "public/masks-web");
const manifestPath = path.join(outputRoot, "manifest.json");
const registryPath = path.join(repositoryRoot, "src/data/avatar-masks.json");
const baseRuntimeFiles = ["foreground.png", "matte.png", "shirt.png"];
const hairRuntimeFiles = [
  "hair.png",
  "hair-region.png",
  "hair-matte.png",
  "hair-foreground.png",
  "hair-underlay.png",
  "hair-underlay-kind.png",
];

async function walkFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = path.join(prefix, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkFiles(path.join(directory, entry.name), relativePath));
    } else if (entry.isFile()) {
      files.push(relativePath.split(path.sep).join("/"));
    }
  }
  return files.sort();
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
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

function uint24le(buffer, offset) {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

function inspectWebp(buffer, fileName) {
  if (
    buffer.length < 25
    || buffer.toString("ascii", 0, 4) !== "RIFF"
    || buffer.toString("ascii", 8, 12) !== "WEBP"
  ) {
    throw new Error(`${fileName} is not a valid WebP file.`);
  }

  let offset = 12;
  let dimensions;
  let lossless = false;
  while (offset + 8 <= buffer.length) {
    const chunk = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const dataOffset = offset + 8;
    if (chunk === "VP8X" && dataOffset + 10 <= buffer.length) {
      dimensions = {
        width: uint24le(buffer, dataOffset + 4) + 1,
        height: uint24le(buffer, dataOffset + 7) + 1,
      };
    }
    if (chunk === "VP8L" && dataOffset + 5 <= buffer.length && buffer[dataOffset] === 0x2f) {
      const bits = buffer.readUInt32LE(dataOffset + 1);
      dimensions ??= {
        width: (bits & 0x3fff) + 1,
        height: ((bits >>> 14) & 0x3fff) + 1,
      };
      lossless = true;
    }
    offset = dataOffset + chunkSize + (chunkSize % 2);
  }

  if (!dimensions) throw new Error(`${fileName} does not contain WebP dimensions.`);
  return { ...dimensions, lossless };
}

const problems = [];
let manifest;
let registry;
try {
  [manifest, registry] = await Promise.all([
    readFile(manifestPath, "utf8").then(JSON.parse),
    readFile(registryPath, "utf8").then(JSON.parse),
  ]);
} catch (error) {
  console.error(`Web mask verification failed: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}

if (manifest.schemaVersion !== 1 || manifest.recipeVersion !== 1) {
  problems.push("manifest schemaVersion and recipeVersion must both be 1.");
}
if (manifest.generator?.lossless !== true || manifest.generator?.codec !== "libwebp") {
  problems.push("manifest must record lossless libwebp generation.");
}

const expectedAssets = registry.avatars.flatMap((avatar) => {
  const useHairMatting = avatar.hairMatting !== false
    && (registry.hairMattingCoverage === "all" || avatar.hairPilot);
  const fileNames = useHairMatting
    ? [...baseRuntimeFiles, ...hairRuntimeFiles]
    : baseRuntimeFiles;
  return fileNames.map((fileName) => ({
    avatarId: avatar.id,
    layer: fileName.replace(/\.png$/i, ""),
    sourcePath: `public/masks/${avatar.id}/${fileName}`,
    outputPath: `public/masks-web/${avatar.id}/${fileName.replace(/\.png$/i, ".webp")}`,
  }));
});
const expectedBySource = new Map(expectedAssets.map((asset) => [asset.sourcePath, asset]));
const manifestBySource = new Map(manifest.assets.map((asset) => [asset.source.path, asset]));

if (manifest.assets.length !== expectedAssets.length) {
  problems.push(`manifest has ${manifest.assets.length} assets; expected ${expectedAssets.length}.`);
}
for (const expected of expectedAssets) {
  if (!manifestBySource.has(expected.sourcePath)) problems.push(`manifest is missing ${expected.sourcePath}.`);
}
for (const asset of manifest.assets) {
  if (!expectedBySource.has(asset.source.path)) problems.push(`manifest has unexpected ${asset.source.path}.`);
}

const expectedOutputFiles = new Set(["manifest.json"]);
let sourceBytes = 0;
let outputBytes = 0;

for (const expected of expectedAssets) {
  const asset = manifestBySource.get(expected.sourcePath);
  if (!asset) continue;
  if (asset.avatarId !== expected.avatarId || asset.layer !== expected.layer) {
    problems.push(`${expected.sourcePath}: incorrect avatarId or layer record.`);
  }
  if (asset.output.path !== expected.outputPath) {
    problems.push(`${expected.sourcePath}: incorrect output path.`);
  }
  if (asset.output.lossless !== true || asset.output.differingPixels !== 0) {
    problems.push(`${expected.sourcePath}: output must be lossless with zero differing pixels.`);
  }
  expectedOutputFiles.add(expected.outputPath.replace(/^public\/masks-web\//, ""));

  let sourceBuffer;
  let outputBuffer;
  try {
    [sourceBuffer, outputBuffer] = await Promise.all([
      readFile(path.join(repositoryRoot, expected.sourcePath)),
      readFile(path.join(repositoryRoot, expected.outputPath)),
    ]);
  } catch (error) {
    problems.push(`${expected.sourcePath}: ${error instanceof Error ? error.message : error}`);
    continue;
  }

  const [sourceStats, outputStats] = await Promise.all([
    stat(path.join(repositoryRoot, expected.sourcePath)),
    stat(path.join(repositoryRoot, expected.outputPath)),
  ]);
  sourceBytes += sourceStats.size;
  outputBytes += outputStats.size;
  if (asset.source.bytes !== sourceStats.size || asset.source.sha256 !== sha256(sourceBuffer)) {
    problems.push(`${expected.sourcePath}: source bytes or checksum changed.`);
  }
  if (asset.output.bytes !== outputStats.size || asset.output.sha256 !== sha256(outputBuffer)) {
    problems.push(`${expected.outputPath}: output bytes or checksum changed.`);
  }

  try {
    const sourceDimensions = pngDimensions(sourceBuffer, expected.sourcePath);
    const outputDetails = inspectWebp(outputBuffer, expected.outputPath);
    if (!outputDetails.lossless) problems.push(`${expected.outputPath}: WebP bitstream is not lossless.`);
    if (
      sourceDimensions.width !== outputDetails.width
      || sourceDimensions.height !== outputDetails.height
      || asset.source.width !== sourceDimensions.width
      || asset.source.height !== sourceDimensions.height
      || asset.output.width !== sourceDimensions.width
      || asset.output.height !== sourceDimensions.height
    ) {
      problems.push(`${expected.outputPath}: dimensions do not match its PNG master.`);
    }
  } catch (error) {
    problems.push(error instanceof Error ? error.message : String(error));
  }
}

const actualOutputFiles = await walkFiles(outputRoot);
const unexpectedOutputs = actualOutputFiles.filter((fileName) => !expectedOutputFiles.has(fileName));
const missingOutputs = [...expectedOutputFiles].filter((fileName) => !actualOutputFiles.includes(fileName));
if (unexpectedOutputs.length > 0) problems.push(`unexpected web masks: ${unexpectedOutputs.join(", ")}.`);
if (missingOutputs.length > 0) problems.push(`missing web masks: ${missingOutputs.join(", ")}.`);
if (outputBytes >= sourceBytes) problems.push("lossless WebP runtime layers are not smaller in aggregate than PNG masters.");

if (problems.length > 0) {
  console.error("Web mask verification failed:\n");
  for (const problem of problems) console.error(`- ${problem}`);
  process.exitCode = 1;
} else {
  const savings = ((1 - outputBytes / sourceBytes) * 100).toFixed(1);
  console.log(
    `Verified ${expectedAssets.length} lossless runtime-mask WebPs (${savings}% fewer bytes, zero recorded pixel differences).`,
  );
}
