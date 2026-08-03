import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { access, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import maskRegistry from "../src/data/avatar-masks.json" with { type: "json" };

const runFile = promisify(execFile);
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(repositoryRoot, "public");
const dryRun = process.argv.includes("--dry-run");
const requestedId = process.argv.find((argument) => argument.startsWith("--id="))?.slice(5);
const candidates = maskRegistry.avatars.filter((avatar) =>
  avatar.id.startsWith("fantasticos-") && (!requestedId || avatar.id === requestedId),
);
if (candidates.length === 0) throw new Error(`Unknown Los 5 fantásticos avatar: ${requestedId}`);

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
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

async function describePng(filePath) {
  const buffer = await readFile(filePath);
  return { file: path.basename(filePath), ...assertPng(buffer, filePath), bytes: buffer.length, sha256: sha256(buffer) };
}

async function components(foregroundPath) {
  let output = "";
  try {
    const result = await runFile("convert", [
      foregroundPath,
      "-alpha", "extract",
      "-threshold", "5%",
      "-define", "connected-components:verbose=true",
      "-connected-components", "8",
      "null:",
    ]);
    output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  } catch (error) {
    output = error.stderr ?? "";
  }
  const parsed = [];
  const pattern = /^\s+(\d+):\s+(\d+)x(\d+)\+(\d+)\+(\d+)\s+([\d.]+),([\d.]+)\s+(\d+)\s+gray\((\d+)\)$/gm;
  for (const match of output.matchAll(pattern)) {
    parsed.push({
      id: Number(match[1]),
      width: Number(match[2]),
      height: Number(match[3]),
      x: Number(match[4]),
      y: Number(match[5]),
      centroidX: Number(match[6]),
      centroidY: Number(match[7]),
      area: Number(match[8]),
      color: Number(match[9]),
    });
  }
  return parsed;
}

let changed = 0;
let removedTotal = 0;
for (const avatar of candidates) {
  const maskDirectory = path.join(publicRoot, "masks", avatar.id);
  const metadataPath = path.join(maskDirectory, "metadata.json");
  const foregroundPath = path.join(maskDirectory, "foreground.png");
  const mattePath = path.join(maskDirectory, "matte.png");
  const personPath = path.join(maskDirectory, "person.png");
  const avatarPath = path.join(publicRoot, avatar.source);
  if (!await exists(metadataPath) || !await exists(foregroundPath)) continue;
  const metadata = JSON.parse(await readFile(metadataPath, "utf8"));
  const framing = metadata.foregroundMatte?.framing;
  if (!framing) throw new Error(`${avatar.id}: framing metadata is missing.`);
  const allComponents = await components(foregroundPath);
  const foregroundComponents = allComponents.filter((component) => component.color === 255);
  const main = foregroundComponents.toSorted((first, second) => second.area - first.area)[0];
  if (!main) throw new Error(`${avatar.id}: no foreground component was detected.`);
  const leftBoundary = framing.foregroundX + 3;
  const rightBoundary = framing.foregroundX + framing.foregroundWidth - 3;
  const suspicious = foregroundComponents.filter((component) =>
    component.id !== main.id
    && component.area < main.area * 0.05
    && (component.x <= leftBoundary || component.x + component.width >= rightBoundary),
  );
  if (suspicious.length === 0) continue;

  removedTotal += suspicious.length;
  console.log(`${avatar.id}: ${suspicious.map((component) => `component ${component.id} (${component.area}px)`).join(", ")}`);
  if (dryRun) continue;

  const alphaPath = path.join(maskDirectory, ".alpha.tmp.png");
  const binaryPath = path.join(maskDirectory, ".binary.tmp.png");
  const cleanedAlphaPath = path.join(maskDirectory, ".clean-alpha.tmp.png");
  const cleanedForegroundPath = path.join(maskDirectory, ".foreground.tmp.png");
  try {
    await runFile("convert", [foregroundPath, "-alpha", "extract", alphaPath]);
    const draw = suspicious
      .map((component) => `color ${Math.round(component.centroidX)},${Math.round(component.centroidY)} floodfill`)
      .join(" ");
    await runFile("convert", [alphaPath, "-threshold", "5%", "-fill", "black", "-draw", draw, binaryPath]);
    await runFile("convert", [alphaPath, binaryPath, "-compose", "Multiply", "-composite", cleanedAlphaPath]);
    await runFile("convert", [foregroundPath, cleanedAlphaPath, "-alpha", "off", "-compose", "CopyOpacity", "-composite", cleanedForegroundPath]);
    await rename(cleanedForegroundPath, foregroundPath);
    await runFile("convert", [foregroundPath, "-alpha", "extract", "-colorspace", "Gray", "-depth", "8", `${mattePath}.tmp.png`]);
    await rename(`${mattePath}.tmp.png`, mattePath);
    await writeFile(personPath, await readFile(mattePath));
    await runFile("convert", [
      "-size", `${framing.outputSize}x${framing.outputSize}`,
      `xc:${framing.backgroundColor}`,
      foregroundPath,
      "-composite",
      "-colorspace", "sRGB",
      "-depth", "8",
      `${avatarPath}.tmp.png`,
    ]);
    await rename(`${avatarPath}.tmp.png`, avatarPath);

    const source = await describePng(avatarPath);
    source.file = avatar.source;
    const foreground = await describePng(foregroundPath);
    const matte = await describePng(mattePath);
    const person = await describePng(personPath);
    metadata.source = source;
    metadata.masks.person = { ...metadata.masks.person, ...person };
    metadata.foregroundMatte.cutout = foreground;
    metadata.foregroundMatte.matte = matte;
    metadata.foregroundMatte.postprocessing = {
      method: "remove-disconnected-border-components",
      removed: suspicious.map(({ id, x, y, width, height, area }) => ({ id, x, y, width, height, area })),
    };
    await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
    changed += 1;
  } finally {
    await Promise.all([alphaPath, binaryPath, cleanedAlphaPath, cleanedForegroundPath].map((filePath) => rm(filePath, { force: true })));
  }
}

console.log(`${dryRun ? "Detected" : "Removed"} ${removedTotal} border components across ${dryRun ? "the collection" : `${changed} avatars`}.`);
