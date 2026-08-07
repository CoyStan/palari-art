import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const avatarRoot = path.join(repositoryRoot, "public/avatars");
const outputRoot = path.join(repositoryRoot, "public/avatars-web");
const manifestPath = path.join(outputRoot, "manifest.json");
const expectedCount = 157;
const expectedTiers = {
  full: { size: 1024, quality: 82 },
  thumbnail: { size: 256, quality: 72 },
};

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

function uint24le(buffer, offset) {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

function webpDimensions(buffer, fileName) {
  if (
    buffer.length < 30
    || buffer.toString("ascii", 0, 4) !== "RIFF"
    || buffer.toString("ascii", 8, 12) !== "WEBP"
  ) {
    throw new Error(`${fileName} is not a valid WebP file.`);
  }

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunk = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const dataOffset = offset + 8;

    if (chunk === "VP8X" && dataOffset + 10 <= buffer.length) {
      return {
        width: uint24le(buffer, dataOffset + 4) + 1,
        height: uint24le(buffer, dataOffset + 7) + 1,
      };
    }
    if (chunk === "VP8 " && dataOffset + 10 <= buffer.length) {
      return {
        width: buffer.readUInt16LE(dataOffset + 6) & 0x3fff,
        height: buffer.readUInt16LE(dataOffset + 8) & 0x3fff,
      };
    }
    if (chunk === "VP8L" && dataOffset + 5 <= buffer.length && buffer[dataOffset] === 0x2f) {
      const bits = buffer.readUInt32LE(dataOffset + 1);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >>> 14) & 0x3fff) + 1,
      };
    }

    offset = dataOffset + chunkSize + (chunkSize % 2);
  }

  throw new Error(`${fileName} does not contain a supported WebP image chunk.`);
}

const problems = [];
let manifest;
try {
  manifest = JSON.parse(await readFile(manifestPath, "utf8"));
} catch (error) {
  console.error(`Web avatar verification failed: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}

if (manifest.schemaVersion !== 1 || manifest.recipeVersion !== 1) {
  problems.push("manifest schemaVersion and recipeVersion must both be 1.");
}
if (manifest.assets.length !== expectedCount) {
  problems.push(`manifest has ${manifest.assets.length} assets; expected ${expectedCount}.`);
}
for (const [tier, expected] of Object.entries(expectedTiers)) {
  const actual = manifest.tiers?.[tier];
  if (actual?.size !== expected.size || actual?.quality !== expected.quality) {
    problems.push(`${tier} recipe must be ${expected.size}px at quality ${expected.quality}.`);
  }
}

const sourceFiles = (await walkFiles(avatarRoot))
  .filter((fileName) => fileName.toLowerCase().endsWith(".png"))
  .map((fileName) => `public/avatars/${fileName}`);
const manifestSources = manifest.assets.map((asset) => asset.source.path).sort();
const missingSources = sourceFiles.filter((fileName) => !manifestSources.includes(fileName));
const unexpectedSources = manifestSources.filter((fileName) => !sourceFiles.includes(fileName));
if (missingSources.length > 0) problems.push(`manifest is missing ${missingSources.join(", ")}.`);
if (unexpectedSources.length > 0) problems.push(`manifest has unexpected ${unexpectedSources.join(", ")}.`);

const expectedOutputFiles = new Set(["manifest.json"]);
let sourceBytes = 0;
let webBytes = 0;

for (const asset of manifest.assets) {
  const sourcePath = path.join(repositoryRoot, asset.source.path);
  let sourceBuffer;
  try {
    sourceBuffer = await readFile(sourcePath);
  } catch (error) {
    problems.push(`${asset.source.path}: ${error instanceof Error ? error.message : error}`);
    continue;
  }
  const sourceStats = await stat(sourcePath);
  sourceBytes += sourceStats.size;
  if (sourceStats.size !== asset.source.bytes) problems.push(`${asset.source.path}: byte count changed.`);
  if (sha256(sourceBuffer) !== asset.source.sha256) problems.push(`${asset.source.path}: checksum changed.`);

  const relativeSource = asset.source.path.replace(/^public\/avatars\//, "").replace(/\.png$/i, ".webp");
  for (const [tier, expected] of Object.entries(expectedTiers)) {
    const output = asset[tier];
    const expectedPath = `public/avatars-web/${tier}/${relativeSource}`;
    if (output.path !== expectedPath) problems.push(`${asset.source.path}: incorrect ${tier} path.`);
    if (output.width !== expected.size || output.height !== expected.size) {
      problems.push(`${output.path}: manifest dimensions must be ${expected.size}x${expected.size}.`);
    }
    if (output.quality !== expected.quality) problems.push(`${output.path}: incorrect quality record.`);
    expectedOutputFiles.add(output.path.replace(/^public\/avatars-web\//, ""));

    let outputBuffer;
    try {
      outputBuffer = await readFile(path.join(repositoryRoot, output.path));
    } catch (error) {
      problems.push(`${output.path}: ${error instanceof Error ? error.message : error}`);
      continue;
    }
    webBytes += outputBuffer.length;
    if (outputBuffer.length !== output.bytes) problems.push(`${output.path}: byte count changed.`);
    if (sha256(outputBuffer) !== output.sha256) problems.push(`${output.path}: checksum changed.`);
    try {
      const dimensions = webpDimensions(outputBuffer, output.path);
      if (dimensions.width !== expected.size || dimensions.height !== expected.size) {
        problems.push(`${output.path}: is ${dimensions.width}x${dimensions.height}; expected ${expected.size}x${expected.size}.`);
      }
    } catch (error) {
      problems.push(error instanceof Error ? error.message : String(error));
    }
    if (tier === "full" && outputBuffer.length >= sourceBuffer.length) {
      problems.push(`${output.path}: is not smaller than its PNG master.`);
    }
    if (tier === "thumbnail" && outputBuffer.length > 80_000) {
      problems.push(`${output.path}: exceeds the 80 KB thumbnail ceiling.`);
    }
  }
}

const actualOutputFiles = await walkFiles(outputRoot);
const unexpectedOutputs = actualOutputFiles.filter((fileName) => !expectedOutputFiles.has(fileName));
const missingOutputs = [...expectedOutputFiles].filter((fileName) => !actualOutputFiles.includes(fileName));
if (unexpectedOutputs.length > 0) problems.push(`unexpected web assets: ${unexpectedOutputs.join(", ")}.`);
if (missingOutputs.length > 0) problems.push(`missing web assets: ${missingOutputs.join(", ")}.`);

if (problems.length > 0) {
  console.error("Web avatar verification failed:\n");
  for (const problem of problems) console.error(`- ${problem}`);
  process.exitCode = 1;
} else {
  const savings = ((1 - webBytes / sourceBytes) * 100).toFixed(1);
  console.log(
    `Verified ${manifest.assets.length} full WebP avatars and thumbnails (${savings}% fewer bytes than PNG masters).`,
  );
}
