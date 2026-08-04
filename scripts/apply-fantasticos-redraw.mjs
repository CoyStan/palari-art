import { copyFile, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDirectoryArgument = process.argv
  .find((argument) => argument.startsWith("--source-dir="))
  ?.slice("--source-dir=".length);

if (!sourceDirectoryArgument) {
  throw new Error("Provide --source-dir=<directory containing fantastico-001.png through fantastico-105.png>.");
}

const sourceDirectory = path.resolve(sourceDirectoryArgument);
const targetDirectory = path.join(repositoryRoot, "public", "avatars", "los-5-fantasticos");
const generatedAt = new Date().toISOString();
const expectedNames = Array.from(
  { length: 105 },
  (_, index) => `fantastico-${String(index + 1).padStart(3, "0")}.png`,
);
const finishReferenceNumbers = [
  2, 9, 7, 8, 9, 2, 6, 7, 7, 9, 2, 9, 10, 3, 7,
  2, 9, 10, 3, 2, 2, 9, 7, 9, 8, 3, 2, 7, 4, 10,
  9, 7, 3, 7, 2, 10, 9, 8, 4, 10, 10, 9, 10, 4, 10,
  9, 10, 4, 2, 8, 2, 9, 4, 7, 10, 5, 10, 10, 9, 7,
  4, 10, 2, 9, 7, 4, 2, 1, 3, 7, 4, 3, 9, 6, 9,
  3, 7, 2, 9, 10, 10, 9, 2, 9, 10, 10, 10, 9, 3, 7,
  5, 8, 9, 7, 5, 10, 7, 2, 5, 10, 4, 10, 2, 9, 7,
];

if (finishReferenceNumbers.length !== expectedNames.length) {
  throw new Error("Every Fantástico redraw must have one recorded finish reference.");
}

function assertPng(buffer, label) {
  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    throw new Error(`${label} is not a valid PNG.`);
  }
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (width !== 1254 || height !== 1254) {
    throw new Error(`${label} is ${width}x${height}; expected 1254x1254.`);
  }
}

const availablePngs = (await readdir(sourceDirectory))
  .filter((name) => name.toLowerCase().endsWith(".png"))
  .sort();
if (availablePngs.join("\n") !== expectedNames.join("\n")) {
  const expected = new Set(expectedNames);
  const available = new Set(availablePngs);
  const missing = expectedNames.filter((name) => !available.has(name));
  const unexpected = availablePngs.filter((name) => !expected.has(name));
  throw new Error(`Redraw inventory mismatch. Missing: ${missing.join(", ") || "none"}. Unexpected: ${unexpected.join(", ") || "none"}.`);
}

for (const [index, name] of expectedNames.entries()) {
  const stagedPath = path.join(sourceDirectory, name);
  const buffer = await readFile(stagedPath);
  assertPng(buffer, name);
  await copyFile(stagedPath, path.join(targetDirectory, name));

  const number = String(index + 1).padStart(3, "0");
  const metadataPath = path.join(repositoryRoot, "public", "masks", `fantasticos-${number}`, "metadata.json");
  const metadata = JSON.parse(await readFile(metadataPath, "utf8"));
  metadata.sourceGeneration = {
    provider: "OpenAI",
    model: "gpt-image-2",
    mode: "built-in image generation",
    promptVersion: "fantasticos-clean-v3",
    generatedAt,
    identityReference: `Previous production fantastico-${number} portrait, used as the exact identity, design, color, and composition target.`,
    finishReference: `/avatars/standardized-1x1/avatar-${String(finishReferenceNumbers[index]).padStart(2, "0")}.png`,
    finishReferenceRole: "Full-resolution Palari rendering-quality reference only; its person, clothing, hairstyle, colors, and facial features were excluded from transfer.",
    intent: "Clean-render production revision that removes pixelation, grain, dithering, and noisy microtexture while preserving identity and composition.",
  };
  await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
  console.log(`[${index + 1}/105] Applied ${name}.`);
}

console.log("Applied all 105 Los 5 fantásticos clean-render revisions. Regenerate and review mattes and masks next.");
