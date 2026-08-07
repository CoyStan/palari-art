import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const registry = JSON.parse(await readFile(path.join(repositoryRoot, "docs/art-guide/assets/plates.json"), "utf8"));
const manifest = JSON.parse(await readFile(path.join(repositoryRoot, "public/handbook/assets/manifest.json"), "utf8"));
const problems = [];

async function sha256(filePath) {
  return createHash("sha256").update(await readFile(filePath)).digest("hex");
}

if (registry.plates.length !== 20) problems.push(`plate registry has ${registry.plates.length}; expected 20.`);
if (manifest.plates.length !== 20) problems.push(`asset manifest has ${manifest.plates.length}; expected 20.`);
const ids = registry.plates.map((plate) => plate.id);
if (new Set(ids).size !== ids.length) problems.push("plate IDs are not unique.");
if (ids.some((id, index) => id !== index + 1)) problems.push("plate IDs must be contiguous 1–20.");

for (const plate of registry.plates) {
  if (!plate.alt?.trim()) problems.push(`plate ${plate.id} is missing alt text.`);
  if (!plate.prompt?.trim()) problems.push(`plate ${plate.id} is missing generation prompt provenance.`);
  if (!plate.review?.includes("reviewed")) problems.push(`plate ${plate.id} is not reviewed.`);
  const recorded = manifest.plates.find((entry) => entry.id === plate.id);
  if (!recorded) {
    problems.push(`plate ${plate.id} is missing from the asset manifest.`);
    continue;
  }
  const sourcePath = path.join(repositoryRoot, plate.source);
  if (await sha256(sourcePath) !== recorded.source.sha256) problems.push(`plate ${plate.id} source checksum differs.`);
  for (const tierName of ["full", "compact"]) {
    const output = recorded.outputs[tierName];
    if (!output) {
      problems.push(`plate ${plate.id} is missing ${tierName} output.`);
      continue;
    }
    const outputPath = path.join(repositoryRoot, output.path);
    if (await sha256(outputPath) !== output.sha256) problems.push(`plate ${plate.id} ${tierName} checksum differs.`);
    if ((await stat(outputPath)).size !== output.bytes) problems.push(`plate ${plate.id} ${tierName} size differs.`);
    if (!output.path.endsWith(".webp")) problems.push(`plate ${plate.id} ${tierName} is not WebP.`);
  }
}

if (problems.length) {
  console.error("Handbook asset verification failed:\n");
  problems.forEach((problem) => console.error(`- ${problem}`));
  process.exitCode = 1;
} else {
  console.log("Verified 20 source-linked handbook plates and 40 WebP delivery assets.");
}
