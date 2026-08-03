import { createHash } from "node:crypto";
import { access, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fal } from "@fal-ai/client";
import pilot from "../src/data/mask-pilot.json" with { type: "json" };

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(repositoryRoot, "public");
const force = process.argv.includes("--force");
const requestedId = process.argv.find((argument) => argument.startsWith("--id="))?.slice(5);
const prompts = {
  person: ["person"],
  shirt: ["sweater", "shirt", "upper clothing", "top"],
};

if (!process.env.FAL_KEY) {
  throw new Error("FAL_KEY is missing. Add it to .env.local and run through npm run masks:pilot.");
}

const selectedAvatars = requestedId
  ? pilot.avatars.filter((avatar) => avatar.id === requestedId)
  : pilot.avatars;

if (selectedAvatars.length === 0) {
  throw new Error(`Unknown pilot avatar id: ${requestedId}`);
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function assertPng(buffer, label) {
  const signature = "89504e470d0a1a0a";
  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== signature) {
    throw new Error(`${label} did not return a valid PNG mask.`);
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

async function downloadMask(url, targetPath, label) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${label} download failed with HTTP ${response.status}.`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const dimensions = assertPng(buffer, label);
  const temporaryPath = `${targetPath}.tmp`;
  await writeFile(temporaryPath, buffer);
  await rename(temporaryPath, targetPath);
  return { ...dimensions, bytes: buffer.length, sha256: sha256(buffer) };
}

async function generateMask(imageUrl, promptCandidates, targetPath, label) {
  const attempts = [];
  for (const prompt of promptCandidates) {
    const result = await fal.subscribe(pilot.model, {
      input: {
        image_url: imageUrl,
        prompt,
        apply_mask: false,
        output_format: "png",
        return_multiple_masks: false,
        max_masks: 1,
        include_scores: true,
        include_boxes: true,
      },
    });
    const mask = result.data?.masks?.[0];
    attempts.push({ prompt, requestId: result.requestId, found: Boolean(mask?.url) });
    if (!mask?.url) {
      console.log(`${label}: prompt “${prompt}” found no mask; trying the next prompt.`);
      continue;
    }

    const file = await downloadMask(mask.url, targetPath, label);
    const metadata = result.data.metadata?.[0];
    return {
      file: path.basename(targetPath),
      prompt,
      attempts,
      requestId: result.requestId,
      score: metadata?.score ?? result.data.scores?.[0] ?? null,
      box: metadata?.box ?? result.data.boxes?.[0] ?? null,
      ...file,
    };
  }
  throw new Error(`${label} returned no mask for prompts: ${promptCandidates.join(", ")}.`);
}

for (const [index, avatar] of selectedAvatars.entries()) {
  const sourcePath = path.join(publicRoot, avatar.source);
  const outputDirectory = path.join(publicRoot, "masks", avatar.id);
  const metadataPath = path.join(outputDirectory, "metadata.json");
  const personPath = path.join(outputDirectory, "person.png");
  const shirtPath = path.join(outputDirectory, "shirt.png");
  const sourceBuffer = await readFile(sourcePath);
  const sourceDimensions = assertPng(sourceBuffer, avatar.id);
  const sourceHash = sha256(sourceBuffer);

  if (!force && await exists(metadataPath) && await exists(personPath) && await exists(shirtPath)) {
    const existing = JSON.parse(await readFile(metadataPath, "utf8"));
    if (existing.source?.sha256 === sourceHash && existing.model === pilot.model) {
      console.log(`[${index + 1}/${selectedAvatars.length}] ${avatar.id}: current masks already exist; skipping.`);
      continue;
    }
  }

  await mkdir(outputDirectory, { recursive: true });
  console.log(`[${index + 1}/${selectedAvatars.length}] ${avatar.id}: uploading source.`);
  const sourceFile = new File([sourceBuffer], path.basename(sourcePath), { type: "image/png" });
  const imageUrl = await fal.storage.upload(sourceFile);

  console.log(`[${index + 1}/${selectedAvatars.length}] ${avatar.id}: generating person mask.`);
  const person = await generateMask(imageUrl, prompts.person, personPath, `${avatar.id} person`);
  console.log(`[${index + 1}/${selectedAvatars.length}] ${avatar.id}: generating shirt mask.`);
  const shirt = await generateMask(imageUrl, prompts.shirt, shirtPath, `${avatar.id} shirt`);

  const metadata = {
    version: 1,
    avatarId: avatar.id,
    status: "pilot-unreviewed",
    generatedAt: new Date().toISOString(),
    provider: pilot.provider,
    model: pilot.model,
    reason: avatar.reason,
    source: {
      file: avatar.source,
      sha256: sourceHash,
      ...sourceDimensions,
    },
    masks: { person, shirt },
    review: null,
  };
  await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
  console.log(`[${index + 1}/${selectedAvatars.length}] ${avatar.id}: saved masks and metadata.`);
}

console.log("Mask pilot generation complete. Review every result before changing its status.");
