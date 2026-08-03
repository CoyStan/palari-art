import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import maskRegistry from "../src/data/avatar-masks.json" with { type: "json" };

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(repositoryRoot, "public");
const expectedLayers = ["person", "shirt"];
const allowUnreviewed = process.argv.includes("--allow-unreviewed");
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

const ids = maskRegistry.avatars.map((avatar) => avatar.id);
if (new Set(ids).size !== ids.length) problems.push("Avatar mask IDs must be unique.");
if (ids.length !== 38) problems.push(`Expected 38 bundled avatars, found ${ids.length}.`);

for (const avatar of maskRegistry.avatars) {
  try {
    const sourcePath = path.join(publicRoot, avatar.source);
    const sourceBuffer = await readFile(sourcePath);
    const sourceDimensions = pngDimensions(sourceBuffer, avatar.source);
    const maskDirectory = path.join(publicRoot, "masks", avatar.id);
    const metadata = JSON.parse(await readFile(path.join(maskDirectory, "metadata.json"), "utf8"));

    if (metadata.avatarId !== avatar.id) problems.push(`${avatar.id}: metadata avatarId does not match.`);
    if (metadata.provider !== maskRegistry.provider) problems.push(`${avatar.id}: metadata provider does not match config.`);
    if (metadata.model !== maskRegistry.model) problems.push(`${avatar.id}: metadata model does not match config.`);
    if (!allowUnreviewed && metadata.status !== "reviewed") problems.push(`${avatar.id}: masks have not been reviewed.`);
    if (!allowUnreviewed && (metadata.review?.outcome !== "pass" || !metadata.review?.reviewedAt)) {
      problems.push(`${avatar.id}: passing review metadata is missing.`);
    }
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

    const foreground = metadata.foregroundMatte;
    if (foreground?.provider !== maskRegistry.matting.provider) {
      problems.push(`${avatar.id}: foreground provider does not match config.`);
    }
    if (foreground?.model !== maskRegistry.matting.model) {
      problems.push(`${avatar.id}: foreground model does not match config.`);
    }
    if (foreground?.variant !== maskRegistry.matting.variant) {
      problems.push(`${avatar.id}: foreground model variant does not match config.`);
    }
    if (foreground?.operatingResolution !== maskRegistry.matting.operatingResolution) {
      problems.push(`${avatar.id}: foreground operating resolution does not match config.`);
    }
    if (!allowUnreviewed && foreground?.status !== "reviewed") {
      problems.push(`${avatar.id}: foreground matte has not been reviewed.`);
    }
    if (!allowUnreviewed && (foreground?.review?.outcome !== "pass" || !foreground?.review?.reviewedAt)) {
      problems.push(`${avatar.id}: passing foreground review metadata is missing.`);
    }

    for (const [kind, expectedFile] of [["cutout", "foreground.png"], ["matte", "matte.png"]]) {
      const fileMetadata = foreground?.[kind];
      const filePath = path.join(maskDirectory, expectedFile);
      const fileBuffer = await readFile(filePath);
      const dimensions = pngDimensions(fileBuffer, `${avatar.id}/${expectedFile}`);
      if (fileMetadata?.file !== expectedFile) {
        problems.push(`${avatar.id}/${expectedFile}: filename metadata does not match.`);
      }
      if (dimensions.width !== sourceDimensions.width || dimensions.height !== sourceDimensions.height) {
        problems.push(`${avatar.id}/${expectedFile}: dimensions do not match its source.`);
      }
      if (fileMetadata?.sha256 !== sha256(fileBuffer)) {
        problems.push(`${avatar.id}/${expectedFile}: checksum does not match metadata.`);
      }
    }
  } catch (error) {
    problems.push(`${avatar.id}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (problems.length > 0) {
  console.error("Avatar mask verification failed:\n");
  for (const problem of problems) console.error(`- ${problem}`);
  process.exitCode = 1;
} else {
  const qualifier = allowUnreviewed ? "generated" : "reviewed";
  console.log(`Verified ${maskRegistry.avatars.length} ${qualifier} semantic-mask avatars.`);
}
