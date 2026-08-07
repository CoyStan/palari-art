import { createHash } from "node:crypto";
import { access, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fal } from "@fal-ai/client";
import maskRegistry from "../src/data/avatar-masks.json" with { type: "json" };

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(repositoryRoot, "public");
const requestedId = process.argv.find((argument) => argument.startsWith("--id="))?.slice(5);
const requestedPrefix = process.argv.find((argument) => argument.startsWith("--prefix="))?.slice(9);
const includeAll = process.argv.includes("--all");
const force = process.argv.includes("--force");
const maxNewArgument = process.argv.find((argument) => argument.startsWith("--max-new="))?.slice(10);
const maxNew = maxNewArgument === undefined ? Number.POSITIVE_INFINITY : Number(maxNewArgument);

if (!Number.isInteger(maxNew) && maxNew !== Number.POSITIVE_INFINITY) {
  throw new Error("--max-new must be a non-negative integer.");
}
if (maxNew < 0) throw new Error("--max-new must be a non-negative integer.");

if (!process.env.FAL_KEY) {
  throw new Error("FAL_KEY is missing. Add it to .env.local and run npm run hair:generate.");
}

const selectedAvatars = (requestedId
  ? maskRegistry.avatars.filter((avatar) => avatar.id === requestedId)
  : requestedPrefix
    ? maskRegistry.avatars.filter((avatar) => avatar.id.startsWith(requestedPrefix))
    : includeAll
      ? maskRegistry.avatars
      : maskRegistry.avatars.filter((avatar) => avatar.hairPilot))
  .filter((avatar) => avatar.hairMatting !== false);

if (selectedAvatars.length === 0) {
  throw new Error("No avatars matched the requested hair-mask selection.");
}

const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function pngDimensions(buffer, label) {
  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    throw new Error(`${label} is not a valid PNG.`);
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

async function withRetry(label, operation, attempts = 4) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      await new Promise((resolve) => setTimeout(resolve, 750 * 2 ** (attempt - 1)));
      console.warn(`${label}: retrying after attempt ${attempt}/${attempts}.`);
    }
  }
  throw lastError;
}

let newRequestCount = 0;

for (const [index, avatar] of selectedAvatars.entries()) {
  const sourcePath = path.join(publicRoot, avatar.source);
  const maskDirectory = path.join(publicRoot, "masks", avatar.id);
  const metadataPath = path.join(maskDirectory, "metadata.json");
  const hairPath = path.join(maskDirectory, "hair.png");
  const sourceBuffer = await readFile(sourcePath);
  const sourceHash = sha256(sourceBuffer);
  const sourceDimensions = pngDimensions(sourceBuffer, avatar.source);
  const metadata = JSON.parse(await readFile(metadataPath, "utf8"));

  if (
    !force
    && await exists(hairPath)
    && metadata.source?.sha256 === sourceHash
    && metadata.hairLayer?.model === maskRegistry.model
    && metadata.hairLayer?.mask?.sha256 === sha256(await readFile(hairPath))
  ) {
    console.log(`[${index + 1}/${selectedAvatars.length}] ${avatar.id}: current hair mask exists; skipping.`);
    continue;
  }

  if (newRequestCount >= maxNew) {
    throw new Error(`Paid SAM request cap reached (${maxNew}); ${avatar.id} was not submitted.`);
  }

  const sourceFile = new File([sourceBuffer], path.basename(sourcePath), { type: "image/png" });
  const imageUrl = await withRetry(`${avatar.id} upload`, () => fal.storage.upload(sourceFile));
  newRequestCount += 1;
  const result = await fal.subscribe(maskRegistry.model, {
    input: {
      image_url: imageUrl,
      prompt: "hair",
      apply_mask: false,
      output_format: "png",
      return_multiple_masks: false,
      max_masks: 1,
      include_scores: true,
      include_boxes: true,
    },
  });
  const mask = result.data?.masks?.[0];
  if (!mask?.url) throw new Error(`${avatar.id}: SAM 3 returned no hair mask.`);
  const response = await fetch(mask.url);
  if (!response.ok) throw new Error(`${avatar.id}: mask download failed with HTTP ${response.status}.`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const dimensions = pngDimensions(buffer, `${avatar.id}/hair.png`);
  if (dimensions.width !== sourceDimensions.width || dimensions.height !== sourceDimensions.height) {
    throw new Error(`${avatar.id}: hair mask dimensions do not match the source.`);
  }
  const temporaryPath = `${hairPath}.tmp`;
  await writeFile(temporaryPath, buffer);
  await rename(temporaryPath, hairPath);

  metadata.hairLayer = {
    version: 1,
    status: "unreviewed",
    generatedAt: new Date().toISOString(),
    provider: maskRegistry.provider,
    model: maskRegistry.model,
    purpose: "Semantic search region for local, color-independent hair-edge decontamination.",
    mask: {
      file: "hair.png",
      prompt: "hair",
      requestId: result.requestId,
      score: result.data.metadata?.[0]?.score ?? result.data.scores?.[0] ?? null,
      box: result.data.metadata?.[0]?.box ?? result.data.boxes?.[0] ?? null,
      ...dimensions,
      bytes: buffer.length,
      sha256: sha256(buffer),
    },
    review: null,
  };
  await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
  console.log(`[${index + 1}/${selectedAvatars.length}] ${avatar.id}: saved unreviewed hair mask.`);
}

console.log(
  `Hair-mask generation complete after ${newRequestCount} new SAM request(s). Review masks before registering them in production.`,
);
