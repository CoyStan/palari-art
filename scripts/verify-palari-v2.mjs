import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const grammar = JSON.parse(await readFile(path.join(repositoryRoot, "docs/palari-v2/shape-grammar.json"), "utf8"));
const collection = JSON.parse(await readFile(path.join(repositoryRoot, "docs/palari-v2/collection.json"), "utf8"));
const webManifest = JSON.parse(await readFile(path.join(repositoryRoot, "public/palari-v2-web/manifest.json"), "utf8"));
const iconWebManifest = JSON.parse(await readFile(path.join(repositoryRoot, "public/palari-v2-icons-web/manifest.json"), "utf8"));
const runtimeRegistry = await readFile(path.join(repositoryRoot, "src/v2/data.ts"), "utf8");
const problems = [];

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function pngDetails(buffer, fileName) {
  if (buffer.length < 29 || buffer.toString("ascii", 1, 4) !== "PNG" || buffer.toString("ascii", 12, 16) !== "IHDR") {
    throw new Error(`${fileName} is not a PNG.`);
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20), colorType: buffer[25] };
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

if (grammar.version !== "1.0.0" || grammar.status !== "frozen-v1") problems.push("visual grammar must be frozen at 1.0.0.");
if (collection.visualGrammar !== grammar.version || collection.avatars.length !== 41) problems.push("collection must contain 41 grammar-1.0 avatars.");
if (webManifest.schemaVersion !== 1 || webManifest.recipeVersion !== 1 || webManifest.avatars.length !== 41) problems.push("V2 WebP manifest is incomplete.");
if (iconWebManifest.schemaVersion !== 1 || iconWebManifest.recipeVersion !== 1 || iconWebManifest.avatars.length !== 41) problems.push("V2 emoticon WebP manifest is incomplete.");
if (!runtimeRegistry.includes("palari-v2-icons-web/${id}") || !runtimeRegistry.includes("emoticonThumbnail")) problems.push("V2 emoticons are missing from the runtime registry.");

const characteristicById = new Map(grammar.characteristicColors.map((color) => [color.id, color.uiSwatch.toUpperCase()]));
const materialById = new Map(grammar.materials.map((material) => [material.id, material.uiSwatch.toUpperCase()]));
const expectedIds = collection.avatars.map((_, index) => `palari-${String(index + 1).padStart(3, "0")}`);
const actualDirectories = (await readdir(path.join(repositoryRoot, "public/palari-v2"), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
if (JSON.stringify(actualDirectories) !== JSON.stringify(expectedIds)) problems.push(`production V2 directory IDs are not exactly palari-001 through palari-${String(collection.avatars.length).padStart(3, "0")}.`);

for (const [index, avatar] of collection.avatars.entries()) {
  if (avatar.id !== expectedIds[index]) problems.push(`${avatar.id}: collection IDs are not contiguous.`);
  if (!runtimeRegistry.includes(`avatar("${avatar.id}"`)) problems.push(`${avatar.id}: missing from the V2 runtime registry.`);
  const directory = path.join(repositoryRoot, "public/palari-v2", avatar.id);
  let metadata;
  try { metadata = JSON.parse(await readFile(path.join(directory, "metadata.json"), "utf8")); }
  catch (error) { problems.push(`${avatar.id}: unreadable metadata (${error.message}).`); continue; }
  if (metadata.avatarId !== avatar.id || metadata.review?.status !== "pass") problems.push(`${avatar.id}: metadata is not reviewed/pass.`);
  if (
    metadata.version !== 3
    || metadata.algorithm?.name !== "deterministic-source-color-key"
    || metadata.algorithm?.independentColorKeys !== true
    || metadata.algorithm?.ambiguousPixelsRemainSource !== true
  ) {
    problems.push(`${avatar.id}: masks must use independent deterministic source-color keys with ambiguous pixels preserved.`);
  }
  if (metadata.expectedCharacteristicColor?.toUpperCase() !== characteristicById.get(avatar.baseCharacteristic)) {
    problems.push(`${avatar.id}: expected characteristic color does not match the collection.`);
  }
  if (metadata.expectedMaterialColor?.toUpperCase() !== materialById.get(avatar.baseMaterial)) {
    problems.push(`${avatar.id}: expected material color does not match the collection.`);
  }
  for (const [layer, colorType] of Object.entries({ source: 6, foreground: 0, material: 0, characteristic: 0 })) {
    const fileName = `${layer}.png`;
    try {
      const buffer = await readFile(path.join(directory, fileName));
      const details = pngDetails(buffer, `${avatar.id}/${fileName}`);
      if (details.width !== 1254 || details.height !== 1254 || details.colorType !== colorType) problems.push(`${avatar.id}/${fileName}: incorrect PNG dimensions or color type.`);
      if (sha256(buffer) !== metadata.checksums[layer]) problems.push(`${avatar.id}/${fileName}: checksum does not match metadata.`);
    } catch (error) { problems.push(error.message); }
  }

  const webEntry = webManifest.avatars.find((entry) => entry.avatarId === avatar.id);
  if (!webEntry) { problems.push(`${avatar.id}: missing WebP manifest entry.`); continue; }
  for (const layer of ["source", "material", "characteristic"]) {
    const record = webEntry.assets[layer];
    try {
      const sourceBuffer = await readFile(path.join(repositoryRoot, record.source.path));
      const outputBuffer = await readFile(path.join(repositoryRoot, record.output.path));
      if (sha256(sourceBuffer) !== record.source.sha256 || sha256(outputBuffer) !== record.output.sha256) problems.push(`${avatar.id}/${layer}: WebP manifest checksum mismatch.`);
      const dimensions = webpDimensions(outputBuffer, record.output.path);
      if (dimensions.width !== 1254 || dimensions.height !== 1254) problems.push(`${record.output.path}: incorrect dimensions.`);
      if (layer !== "source" && (record.output.lossless !== true || record.output.differingPixels !== 0)) problems.push(`${avatar.id}/${layer}: mask WebP must be verified lossless.`);
    } catch (error) { problems.push(error.message); }
  }

  const iconEntry = iconWebManifest.avatars.find((entry) => entry.avatarId === avatar.id);
  if (!iconEntry) { problems.push(`${avatar.id}: missing emoticon WebP manifest entry.`); continue; }
  try {
    const sourceBuffer = await readFile(path.join(repositoryRoot, iconEntry.source.path));
    if (sha256(sourceBuffer) !== iconEntry.source.sha256) problems.push(`${avatar.id}: emoticon source checksum mismatch.`);
    const sourceDetails = pngDetails(sourceBuffer, iconEntry.source.path);
    if (sourceDetails.width !== 1254 || sourceDetails.height !== 1254 || sourceDetails.colorType !== 2) problems.push(`${iconEntry.source.path}: emoticon source must be an opaque 1254 x 1254 RGB PNG.`);
  } catch (error) { problems.push(error.message); }
  for (const [assetName, expectedSize] of Object.entries({ icon: 1024, thumbnail: 256 })) {
    const record = iconEntry.assets[assetName];
    try {
      const outputBuffer = await readFile(path.join(repositoryRoot, record.path));
      if (sha256(outputBuffer) !== record.sha256) problems.push(`${avatar.id}/${assetName}: emoticon WebP checksum mismatch.`);
      const dimensions = webpDimensions(outputBuffer, record.path);
      if (dimensions.width !== expectedSize || dimensions.height !== expectedSize) problems.push(`${record.path}: incorrect dimensions.`);
    } catch (error) { problems.push(error.message); }
  }
}

if (problems.length) {
  console.error("Palari V2 verification failed:\n");
  for (const problem of problems) console.error(`- ${problem}`);
  process.exitCode = 1;
} else {
  console.log(`Verified frozen grammar 1.0, ${collection.avatars.length} reviewed V2 masters, independent deterministic color-key masks, ${collection.avatars.length * 3} ceramic and ${collection.avatars.length * 2} emoticon delivery WebPs, runtime registration, dimensions, and checksums.`);
}
