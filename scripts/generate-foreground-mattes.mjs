import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { access, copyFile, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { fal } from "@fal-ai/client";
import maskRegistry from "../src/data/avatar-masks.json" with { type: "json" };

const runFile = promisify(execFile);
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(repositoryRoot, "public");
const force = process.argv.includes("--force");
const reprocess = process.argv.includes("--reprocess");
const derivePerson = process.argv.includes("--derive-person");
const requestedId = process.argv.find((argument) => argument.startsWith("--id="))?.slice(5);
const requestedPrefix = process.argv.find((argument) => argument.startsWith("--prefix="))?.slice(9);

if (!process.env.FAL_KEY) {
  throw new Error("FAL_KEY is missing. Add it to .env.local and run npm run mattes:generate.");
}

const selectedAvatars = requestedId
  ? maskRegistry.avatars.filter((avatar) => avatar.id === requestedId)
  : requestedPrefix
    ? maskRegistry.avatars.filter((avatar) => avatar.id.startsWith(requestedPrefix))
    : maskRegistry.avatars;

if (selectedAvatars.length === 0) {
  throw new Error(`No avatars matched ${requestedId ?? requestedPrefix}.`);
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

async function withRetry(label, operation, attempts = 4) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      const delay = 750 * 2 ** (attempt - 1);
      console.warn(`${label}: attempt ${attempt}/${attempts} failed; retrying in ${delay}ms.`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

function assertPng(buffer, label) {
  const signature = "89504e470d0a1a0a";
  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== signature) {
    throw new Error(`${label} is not a valid PNG.`);
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

async function download(url, targetPath, label) {
  return withRetry(label, async () => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${label} download failed with HTTP ${response.status}.`);
    const buffer = Buffer.from(await response.arrayBuffer());
    assertPng(buffer, label);
    await writeFile(targetPath, buffer);
    return buffer;
  });
}

async function normalizePng(inputPath, outputPath, width, height, extractAlpha = false) {
  const temporaryOutput = `${outputPath}.tmp.png`;
  const argumentsList = [
    inputPath,
    "-filter", "Lanczos",
    "-resize", `${width}x${height}!`,
  ];
  if (extractAlpha) argumentsList.push("-alpha", "extract", "-colorspace", "Gray");
  else argumentsList.push("-colorspace", "sRGB");
  argumentsList.push("-depth", "8", temporaryOutput);
  await runFile("convert", argumentsList);
  const buffer = await readFile(temporaryOutput);
  const dimensions = assertPng(buffer, temporaryOutput);
  if (dimensions.width !== width || dimensions.height !== height) {
    throw new Error(`Normalized matte is ${dimensions.width}x${dimensions.height}; expected ${width}x${height}.`);
  }
  await rename(temporaryOutput, outputPath);
  return { ...dimensions, bytes: buffer.length, sha256: sha256(buffer) };
}

for (const [index, avatar] of selectedAvatars.entries()) {
  const sourcePath = path.join(publicRoot, avatar.source);
  const outputDirectory = path.join(publicRoot, "masks", avatar.id);
  const metadataPath = path.join(outputDirectory, "metadata.json");
  const cutoutPath = path.join(outputDirectory, "foreground.png");
  const mattePath = path.join(outputDirectory, "matte.png");
  const personPath = path.join(outputDirectory, "person.png");
  const temporaryApiOutput = path.join(outputDirectory, ".foreground-api-output.tmp.png");
  const sourceBuffer = await readFile(sourcePath);
  const sourceDimensions = assertPng(sourceBuffer, avatar.source);
  const sourceHash = sha256(sourceBuffer);
  const metadata = JSON.parse(await readFile(metadataPath, "utf8"));
  const sourceChanged = metadata.source?.sha256 !== sourceHash;

  if (
    !force
    && await exists(cutoutPath)
    && await exists(mattePath)
    && metadata.source?.sha256 === sourceHash
    && metadata.foregroundMatte?.model === maskRegistry.matting.model
    && metadata.foregroundMatte?.variant === maskRegistry.matting.variant
    && metadata.foregroundMatte?.operatingResolution === maskRegistry.matting.operatingResolution
    && metadata.foregroundMatte?.cutout?.file === path.basename(cutoutPath)
    && metadata.foregroundMatte?.matte?.file === path.basename(mattePath)
  ) {
    console.log(`[${index + 1}/${selectedAvatars.length}] ${avatar.id}: current foreground matte already exists; skipping.`);
    continue;
  }

  let result;
  if (reprocess && metadata.foregroundMatte?.requestId) {
    console.log(`[${index + 1}/${selectedAvatars.length}] ${avatar.id}: reprocessing existing API result.`);
    result = await fal.queue.result(maskRegistry.matting.model, {
      requestId: metadata.foregroundMatte.requestId,
    });
  } else {
    console.log(`[${index + 1}/${selectedAvatars.length}] ${avatar.id}: uploading source.`);
    const sourceFile = new File([sourceBuffer], path.basename(sourcePath), { type: "image/png" });
    const imageUrl = await withRetry(
      `${avatar.id} upload`,
      () => fal.storage.upload(sourceFile),
    );

    console.log(`[${index + 1}/${selectedAvatars.length}] ${avatar.id}: generating 2048px matting foreground.`);
    result = await withRetry(
      `${avatar.id} matting`,
      () => fal.subscribe(maskRegistry.matting.model, {
        input: {
          image_url: imageUrl,
          model: maskRegistry.matting.variant,
          operating_resolution: maskRegistry.matting.operatingResolution,
          output_mask: true,
          refine_foreground: true,
          output_format: "png",
          mask_only: false,
        },
      }),
    );
  }
  const output = result.data?.image;
  if (!output?.url) throw new Error(`${avatar.id}: BiRefNet returned no foreground image.`);

  try {
    const apiBuffer = await download(output.url, temporaryApiOutput, `${avatar.id} foreground`);
    const apiDimensions = assertPng(apiBuffer, `${avatar.id} foreground`);
    const cutout = await normalizePng(
      temporaryApiOutput,
      cutoutPath,
      sourceDimensions.width,
      sourceDimensions.height,
    );
    const matte = await normalizePng(
      temporaryApiOutput,
      mattePath,
      sourceDimensions.width,
      sourceDimensions.height,
      true,
    );
    let person = null;
    if (derivePerson) {
      await copyFile(mattePath, personPath);
      const personBuffer = await readFile(personPath);
      const personDimensions = assertPng(personBuffer, `${avatar.id} person mask`);
      person = {
        file: path.basename(personPath),
        width: personDimensions.width,
        height: personDimensions.height,
        bytes: personBuffer.length,
        sha256: sha256(personBuffer),
        prompt: "derived from refined foreground matte",
        attempts: [],
        requestId: result.requestId,
        score: 1,
        box: [0, 0, sourceDimensions.width, sourceDimensions.height],
        derivedFrom: path.basename(mattePath),
      };
    }
    metadata.status = "unreviewed";
    metadata.generatedAt = new Date().toISOString();
    metadata.source = {
      file: avatar.source,
      sha256: sourceHash,
      ...sourceDimensions,
    };
    metadata.review = null;
    if (sourceChanged) delete metadata.masks;
    if (person) metadata.masks = { person };
    metadata.foregroundMatte = {
      status: "unreviewed",
      generatedAt: new Date().toISOString(),
      provider: maskRegistry.matting.provider,
      model: maskRegistry.matting.model,
      variant: maskRegistry.matting.variant,
      operatingResolution: maskRegistry.matting.operatingResolution,
      refineForeground: true,
      sourceOutput: "refined-transparent-image-and-alpha",
      requestId: result.requestId,
      apiOutput: {
        width: apiDimensions.width,
        height: apiDimensions.height,
        contentType: output.content_type ?? null,
      },
      cutout: { file: path.basename(cutoutPath), ...cutout },
      matte: { file: path.basename(mattePath), ...matte },
      review: null,
    };
    await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
    console.log(`[${index + 1}/${selectedAvatars.length}] ${avatar.id}: saved foreground matte and metadata.`);
  } finally {
    await rm(temporaryApiOutput, { force: true });
  }
}

console.log("Foreground matte generation complete. Review every new matte before integrating it.");
