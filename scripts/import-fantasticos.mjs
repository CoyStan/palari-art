import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import {
  access,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { fal } from "@fal-ai/client";
import maskRegistry from "../src/data/avatar-masks.json" with { type: "json" };
import sourceManifest from "../src/data/fantasticos-sources.json" with { type: "json" };

const runFile = promisify(execFile);
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(repositoryRoot, "public");
const sourceDirectory = process.argv.find((argument) => argument.startsWith("--source-dir="))?.slice(13);
const requestedId = process.argv.find((argument) => argument.startsWith("--id="))?.slice(5);
const force = process.argv.includes("--force");
const concurrencyArgument = process.argv.find((argument) => argument.startsWith("--concurrency="))?.slice(14);
const concurrency = Math.max(1, Math.min(6, Number(concurrencyArgument ?? 4)));
const outputSize = 1254;
const foregroundWidth = 760;
const foregroundX = Math.floor((outputSize - foregroundWidth) / 2);
const foregroundY = -80;
const backgroundColor = "#DCE8F7";

if (!process.env.FAL_KEY) {
  throw new Error("FAL_KEY is missing. Add it to .env.local before importing Los 5 fantásticos.");
}
if (!sourceDirectory) {
  throw new Error("Pass the downloaded Drive folder as --source-dir=<directory>.");
}
if (!Number.isFinite(concurrency)) throw new Error("--concurrency must be a number.");

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function md5(buffer) {
  return createHash("md5").update(buffer).digest("hex");
}

function assertPng(buffer, label) {
  const signature = "89504e470d0a1a0a";
  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== signature) {
    throw new Error(`${label} is not a valid PNG.`);
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
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

async function describePng(filePath) {
  const buffer = await readFile(filePath);
  return { file: path.basename(filePath), ...assertPng(buffer, filePath), bytes: buffer.length, sha256: sha256(buffer) };
}

async function download(url, targetPath, label) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${label} download failed with HTTP ${response.status}.`);
  const buffer = Buffer.from(await response.arrayBuffer());
  assertPng(buffer, label);
  await writeFile(targetPath, buffer);
  return buffer;
}

const candidates = sourceManifest.groups.flatMap((group, groupIndex) =>
  Array.from({ length: sourceManifest.charactersPerGroup }, (_, positionIndex) => {
    const sequence = groupIndex * sourceManifest.charactersPerGroup + positionIndex + 1;
    const number = String(sequence).padStart(3, "0");
    return {
      id: `fantasticos-${number}`,
      number,
      group,
      position: positionIndex + 1,
    };
  }),
);
const selected = requestedId ? candidates.filter((candidate) => candidate.id === requestedId) : candidates;
if (selected.length === 0) throw new Error(`Unknown avatar id: ${requestedId}`);

async function validateSourceDirectory() {
  const directoryEntries = await readdir(sourceDirectory, { withFileTypes: true });
  const actualPngs = directoryEntries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".png"))
    .map((entry) => entry.name)
    .toSorted();
  const expectedPngs = sourceManifest.groups.map((group) => group.file).toSorted();
  if (JSON.stringify(actualPngs) !== JSON.stringify(expectedPngs)) {
    const missing = expectedPngs.filter((file) => !actualPngs.includes(file));
    const unexpected = actualPngs.filter((file) => !expectedPngs.includes(file));
    throw new Error(
      `Drive source inventory mismatch. Missing: ${missing.join(", ") || "none"}. Unexpected: ${unexpected.join(", ") || "none"}.`,
    );
  }
  for (const group of sourceManifest.groups) {
    const buffer = await readFile(path.resolve(sourceDirectory, group.file));
    assertPng(buffer, group.file);
    if (md5(buffer) !== group.md5) {
      throw new Error(`${group.file}: Drive source checksum does not match the manifest.`);
    }
  }
}

await validateSourceDirectory();

const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "palari-fantasticos-"));
let completed = 0;

async function processCandidate(candidate) {
  const avatarRelativePath = `avatars/los-5-fantasticos/fantastico-${candidate.number}.png`;
  const avatarPath = path.join(publicRoot, avatarRelativePath);
  const maskDirectory = path.join(publicRoot, "masks", candidate.id);
  const foregroundPath = path.join(maskDirectory, "foreground.png");
  const mattePath = path.join(maskDirectory, "matte.png");
  const personPath = path.join(maskDirectory, "person.png");
  const metadataPath = path.join(maskDirectory, "metadata.json");

  if (!force && await exists(avatarPath) && await exists(foregroundPath) && await exists(mattePath) && await exists(personPath) && await exists(metadataPath)) {
    const avatarBuffer = await readFile(avatarPath);
    const metadata = JSON.parse(await readFile(metadataPath, "utf8"));
    if (
      metadata.source?.sha256 === sha256(avatarBuffer)
      && metadata.foregroundMatte?.model === maskRegistry.matting.model
      && metadata.foregroundMatte?.provenance?.groupMd5 === candidate.group.md5
      && metadata.foregroundMatte?.provenance?.position === candidate.position
      && metadata.foregroundMatte?.framing?.foregroundWidth === foregroundWidth
      && metadata.foregroundMatte?.framing?.foregroundX === foregroundX
      && metadata.foregroundMatte?.framing?.foregroundY === foregroundY
    ) {
      completed += 1;
      console.log(`[${completed}/${selected.length}] ${candidate.id}: current import exists; skipping.`);
      return;
    }
  }

  const groupPath = path.resolve(sourceDirectory, candidate.group.file);
  const groupBuffer = await readFile(groupPath);
  const groupDimensions = assertPng(groupBuffer, candidate.group.file);
  if (md5(groupBuffer) !== candidate.group.md5) {
    throw new Error(`${candidate.group.file}: Drive source checksum does not match the manifest.`);
  }

  await mkdir(path.dirname(avatarPath), { recursive: true });
  await mkdir(maskDirectory, { recursive: true });
  const candidateRoot = path.join(temporaryRoot, candidate.id);
  await mkdir(candidateRoot, { recursive: true });
  const panelPath = path.join(candidateRoot, "panel.png");
  const apiOutputPath = path.join(candidateRoot, "api-output.png");
  const normalizedCutoutPath = path.join(candidateRoot, "normalized-cutout.png");
  const startX = Math.floor((candidate.position - 1) * groupDimensions.width / sourceManifest.charactersPerGroup);
  const endX = Math.floor(candidate.position * groupDimensions.width / sourceManifest.charactersPerGroup);
  const panelWidth = endX - startX;

  await runFile("convert", [
    groupPath,
    "-crop", `${panelWidth}x${groupDimensions.height}+${startX}+0`,
    "+repage",
    "-colorspace", "sRGB",
    "-depth", "8",
    panelPath,
  ]);
  const panelBuffer = await readFile(panelPath);
  const imageUrl = await withRetry(
    `${candidate.id} upload`,
    () => fal.storage.upload(new File([panelBuffer], `${candidate.id}.png`, { type: "image/png" })),
  );
  console.log(`${candidate.id}: generating identity-preserving foreground matte.`);
  const result = await withRetry(
    `${candidate.id} foreground matte`,
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
  const output = result.data?.image;
  if (!output?.url) throw new Error(`${candidate.id}: BiRefNet returned no foreground image.`);
  const apiBuffer = await download(output.url, apiOutputPath, `${candidate.id} foreground`);
  const apiDimensions = assertPng(apiBuffer, `${candidate.id} foreground`);

  await runFile("convert", [
    apiOutputPath,
    "-filter", "Lanczos",
    "-resize", `${panelWidth}x${groupDimensions.height}!`,
    "-colorspace", "sRGB",
    "-depth", "8",
    normalizedCutoutPath,
  ]);
  const temporaryForegroundPath = `${foregroundPath}.tmp.png`;
  await runFile("convert", [
    "-size", `${outputSize}x${outputSize}`,
    "xc:none",
    "(", normalizedCutoutPath, "-filter", "Lanczos", "-resize", `${foregroundWidth}x`, ")",
    "-gravity", "northwest",
    "-geometry", `+${foregroundX}${foregroundY}`,
    "-composite",
    "-colorspace", "sRGB",
    "-depth", "8",
    temporaryForegroundPath,
  ]);
  await rename(temporaryForegroundPath, foregroundPath);
  await runFile("convert", [foregroundPath, "-alpha", "extract", "-colorspace", "Gray", "-depth", "8", `${mattePath}.tmp.png`]);
  await rename(`${mattePath}.tmp.png`, mattePath);
  await writeFile(personPath, await readFile(mattePath));
  await runFile("convert", [
    "-size", `${outputSize}x${outputSize}`,
    `xc:${backgroundColor}`,
    foregroundPath,
    "-composite",
    "-colorspace", "sRGB",
    "-depth", "8",
    `${avatarPath}.tmp.png`,
  ]);
  await rename(`${avatarPath}.tmp.png`, avatarPath);

  const source = await describePng(avatarPath);
  source.file = avatarRelativePath;
  const person = await describePng(personPath);
  Object.assign(person, {
    prompt: "derived from refined foreground matte",
    attempts: [],
    requestId: result.requestId,
    score: 1,
    box: [0, 0, outputSize, outputSize],
    derivedFrom: "matte.png",
  });
  const foreground = await describePng(foregroundPath);
  const matte = await describePng(mattePath);
  const metadata = {
    version: 1,
    avatarId: candidate.id,
    status: "unreviewed",
    generatedAt: new Date().toISOString(),
    provider: maskRegistry.provider,
    model: maskRegistry.model,
    reason: "Imported from the palari-marketing/Los 5 fantásticos group collection.",
    source,
    masks: { person },
    review: null,
    foregroundMatte: {
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
      framing: {
        outputSize,
        foregroundWidth,
        foregroundX,
        foregroundY,
        backgroundColor,
      },
      provenance: {
        sharedDrive: sourceManifest.sharedDrive,
        sharedDriveId: sourceManifest.sharedDriveId,
        folder: sourceManifest.folder,
        groupFile: candidate.group.file,
        groupDriveId: candidate.group.driveId,
        groupMd5: candidate.group.md5,
        position: candidate.position,
        panel: { width: panelWidth, height: groupDimensions.height, sha256: sha256(panelBuffer) },
      },
      cutout: foreground,
      matte,
      review: null,
    },
  };
  await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
  completed += 1;
  console.log(`[${completed}/${selected.length}] ${candidate.id}: saved square portrait, matte, and provenance.`);
}

try {
  let cursor = 0;
  async function worker() {
    while (cursor < selected.length) {
      const candidate = selected[cursor];
      cursor += 1;
      await processCandidate(candidate);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, selected.length) }, () => worker()));
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}

console.log(`Imported ${selected.length} Los 5 fantásticos character panels.`);
