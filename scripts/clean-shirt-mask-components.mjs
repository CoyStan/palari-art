import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import maskRegistry from "../src/data/avatar-masks.json" with { type: "json" };

const execFileAsync = promisify(execFile);
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(repositoryRoot, "public");
const reviewAll = process.argv.includes("--all");
const requestedId = process.argv.find((argument) => argument.startsWith("--id="))?.slice(5);
const requestedPrefix = process.argv.find((argument) => argument.startsWith("--prefix="))?.slice(9);
const minimumArea = Number(
  process.argv.find((argument) => argument.startsWith("--minimum-area="))?.slice(15) ?? 1000,
);

if ([reviewAll, Boolean(requestedId), Boolean(requestedPrefix)].filter(Boolean).length !== 1) {
  throw new Error("Choose exactly one scope: --all, --id=<avatar-id>, or --prefix=<id-prefix>.");
}
if (!Number.isInteger(minimumArea) || minimumArea < 1) {
  throw new Error("--minimum-area must be a positive integer.");
}

const selectedAvatars = requestedId
  ? maskRegistry.avatars.filter((avatar) => avatar.id === requestedId)
  : requestedPrefix
    ? maskRegistry.avatars.filter((avatar) => avatar.id.startsWith(requestedPrefix))
    : maskRegistry.avatars;

if (selectedAvatars.length === 0) throw new Error(`No avatars matched ${requestedId ?? requestedPrefix}.`);

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function disconnectedForegroundComponents(maskPath) {
  const { stdout, stderr } = await execFileAsync("convert", [
    maskPath,
    "-threshold", "10%",
    "-define", "connected-components:verbose=true",
    "-connected-components", "8",
    "null:",
  ], { maxBuffer: 8 * 1024 * 1024 });

  return `${stdout}\n${stderr}`
    .split("\n")
    .map((line) => line.match(/^\s+(\d+):\s+\S+\s+\S+\s+(\d+)\s+gray\(255\)$/))
    .filter(Boolean)
    .map((match) => ({ id: Number(match[1]), area: Number(match[2]) }))
    .filter((component) => component.area < minimumArea);
}

for (const avatar of selectedAvatars) {
  const maskDirectory = path.join(publicRoot, "masks", avatar.id);
  const maskPath = path.join(maskDirectory, "shirt.png");
  const metadataPath = path.join(maskDirectory, "metadata.json");
  const temporaryPath = path.join(maskDirectory, "shirt.cleaned.tmp.png");
  const components = await disconnectedForegroundComponents(maskPath);

  if (components.length === 0) {
    console.log(`${avatar.id}: no disconnected shirt components below ${minimumArea}px.`);
    continue;
  }

  try {
    await execFileAsync("convert", [
      maskPath,
      "-threshold", "10%",
      "-define", "connected-components:mean-color=true",
      "-define", `connected-components:remove=${components.map(({ id }) => id).join(",")}`,
      "-connected-components", "8",
      temporaryPath,
    ]);
    await rename(temporaryPath, maskPath);
  } finally {
    await rm(temporaryPath, { force: true });
  }

  const maskBuffer = await readFile(maskPath);
  const maskStats = await stat(maskPath);
  const metadata = JSON.parse(await readFile(metadataPath, "utf8"));
  metadata.masks.shirt.bytes = maskStats.size;
  metadata.masks.shirt.sha256 = sha256(maskBuffer);
  metadata.masks.shirt.cleanup = {
    method: "remove-small-disconnected-components",
    connectivity: 8,
    minimumArea,
    removed: components,
    cleanedAt: new Date().toISOString(),
  };
  metadata.status = "unreviewed";
  metadata.review = null;
  await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
  console.log(`${avatar.id}: removed ${components.length} disconnected shirt component(s).`);
}

console.log("Shirt-mask component cleanup complete. Review every changed mask before registration.");
