import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pilot from "../src/data/mask-pilot.json" with { type: "json" };

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(repositoryRoot, "public");
const expectedLayers = ["person", "shirt"];
const problems = [];

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function pngDimensions(buffer, label) {
  const signature = "89504e470d0a1a0a";
  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== signature) {
    throw new Error(`${label} is not a valid PNG.`);
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

const ids = pilot.avatars.map((avatar) => avatar.id);
if (new Set(ids).size !== ids.length) problems.push("Pilot avatar IDs must be unique.");

for (const avatar of pilot.avatars) {
  try {
    const sourcePath = path.join(publicRoot, avatar.source);
    const sourceBuffer = await readFile(sourcePath);
    const sourceDimensions = pngDimensions(sourceBuffer, avatar.source);
    const maskDirectory = path.join(publicRoot, "masks", avatar.id);
    const metadata = JSON.parse(await readFile(path.join(maskDirectory, "metadata.json"), "utf8"));

    if (metadata.avatarId !== avatar.id) problems.push(`${avatar.id}: metadata avatarId does not match.`);
    if (metadata.model !== pilot.model) problems.push(`${avatar.id}: metadata model does not match config.`);
    if (metadata.status !== "pilot-reviewed") problems.push(`${avatar.id}: pilot has not been reviewed.`);
    if (metadata.source?.file !== avatar.source) problems.push(`${avatar.id}: metadata source does not match.`);
    if (metadata.source?.sha256 !== sha256(sourceBuffer)) {
      problems.push(`${avatar.id}: source changed after masks were generated.`);
    }

    for (const layer of expectedLayers) {
      const maskPath = path.join(maskDirectory, `${layer}.png`);
      const maskBuffer = await readFile(maskPath);
      const dimensions = pngDimensions(maskBuffer, `${avatar.id}/${layer}.png`);
      if (dimensions.width !== sourceDimensions.width || dimensions.height !== sourceDimensions.height) {
        problems.push(`${avatar.id}/${layer}.png: dimensions do not match its source.`);
      }
      if (metadata.masks?.[layer]?.sha256 !== sha256(maskBuffer)) {
        problems.push(`${avatar.id}/${layer}.png: checksum does not match metadata.`);
      }
      if (!metadata.masks?.[layer]?.prompt || !Number.isFinite(metadata.masks?.[layer]?.score)) {
        problems.push(`${avatar.id}/${layer}.png: prompt or score metadata is missing.`);
      }
    }
  } catch (error) {
    problems.push(`${avatar.id}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (problems.length > 0) {
  console.error("Mask pilot verification failed:\n");
  for (const problem of problems) console.error(`- ${problem}`);
  process.exitCode = 1;
} else {
  console.log(`Verified ${pilot.avatars.length} semantic mask pilot avatars.`);
}
