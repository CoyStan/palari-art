import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const collection = JSON.parse(await readFile(path.join(repositoryRoot, "docs/palari-v3/collection.json"), "utf8"));
const manifest = JSON.parse(await readFile(path.join(repositoryRoot, "public/palari-v3-icons-web/manifest.json"), "utf8"));
const runtimeRegistry = await readFile(path.join(repositoryRoot, "src/v3/data.ts"), "utf8");
const problems = [];

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function pngDimensions(buffer, fileName) {
  if (buffer.length < 29 || buffer.toString("ascii", 1, 4) !== "PNG" || buffer.toString("ascii", 12, 16) !== "IHDR") {
    throw new Error(`${fileName} is not a PNG.`);
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function uint24le(buffer, offset) {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

function webpDimensions(buffer, fileName) {
  if (buffer.length < 30 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") {
    throw new Error(`${fileName} is not a WebP.`);
  }
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunk = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const data = offset + 8;
    if (chunk === "VP8X") return { width: uint24le(buffer, data + 4) + 1, height: uint24le(buffer, data + 7) + 1 };
    if (chunk === "VP8 ") return { width: buffer.readUInt16LE(data + 6) & 0x3fff, height: buffer.readUInt16LE(data + 8) & 0x3fff };
    if (chunk === "VP8L") {
      const bits = buffer.readUInt32LE(data + 1);
      return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
    }
    offset = data + size + (size % 2);
  }
  throw new Error(`${fileName} has no supported image chunk.`);
}

if (collection.version !== 3 || collection.avatars.length !== 24) problems.push("V3 collection must contain exactly 24 avatars.");
if (manifest.schemaVersion !== 1 || manifest.recipeVersion !== 1 || manifest.avatars.length !== 24) problems.push("V3 WebP manifest is incomplete.");
if (!runtimeRegistry.includes("collection.avatars") || !runtimeRegistry.includes("assetUrl")) problems.push("V3 runtime registry is incomplete.");

const expectedIds = collection.avatars.map((_, index) => `palari-v3-${String(index + 1).padStart(3, "0")}`);
if (JSON.stringify(collection.avatars.map((avatar) => avatar.id)) !== JSON.stringify(expectedIds)) problems.push("V3 IDs are not contiguous.");
if (new Set(collection.avatars.map((avatar) => avatar.name)).size !== 24) problems.push("V3 avatar names must be unique.");

for (const avatar of collection.avatars) {
  const entry = manifest.avatars.find((candidate) => candidate.avatarId === avatar.id);
  if (!entry) { problems.push(`${avatar.id}: missing manifest entry.`); continue; }
  try {
    const sourceBuffer = await readFile(path.join(repositoryRoot, avatar.source));
    const sourceDimensions = pngDimensions(sourceBuffer, avatar.source);
    if (sourceDimensions.width !== 1254 || sourceDimensions.height !== 1254) problems.push(`${avatar.source}: incorrect dimensions.`);
    if (sha256(sourceBuffer) !== entry.source.sha256) problems.push(`${avatar.id}: source checksum mismatch.`);
  } catch (error) { problems.push(error.message); }

  for (const [assetName, expectedSize] of Object.entries({ icon: 1024, thumbnail: 256 })) {
    const record = entry.assets[assetName];
    const collectionPath = `public/${avatar[assetName]}`;
    if (record.path !== collectionPath) problems.push(`${avatar.id}/${assetName}: collection and manifest paths differ.`);
    try {
      const outputBuffer = await readFile(path.join(repositoryRoot, record.path));
      if (sha256(outputBuffer) !== record.sha256) problems.push(`${avatar.id}/${assetName}: checksum mismatch.`);
      const dimensions = webpDimensions(outputBuffer, record.path);
      if (dimensions.width !== expectedSize || dimensions.height !== expectedSize) problems.push(`${record.path}: incorrect dimensions.`);
    } catch (error) { problems.push(error.message); }
  }
}

const newDirectories = (await readdir(path.join(repositoryRoot, "public/palari-v3-icons-web"), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
if (newDirectories.length !== 18 || newDirectories[0] !== "palari-v3-007" || newDirectories[17] !== "palari-v3-024") {
  problems.push("V3 delivery directory must contain the 18 native avatars.");
}

if (problems.length) {
  console.error("Palari V3 verification failed:\n");
  for (const problem of problems) console.error(`- ${problem}`);
  process.exitCode = 1;
} else {
  console.log("Verified 24 V3 avatars, six curated V2 sources, 18 native masters, and all WebP delivery checksums and dimensions.");
}
