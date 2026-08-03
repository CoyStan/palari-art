import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import maskRegistry from "../src/data/avatar-masks.json" with { type: "json" };

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(repositoryRoot, "public");
const reviewAll = process.argv.includes("--all");
const requestedId = process.argv.find((argument) => argument.startsWith("--id="))?.slice(5);
const reviewer = process.argv.find((argument) => argument.startsWith("--reviewer="))?.slice(11);
const notes = process.argv.find((argument) => argument.startsWith("--notes="))?.slice(8);

if ((!reviewAll && !requestedId) || (reviewAll && requestedId)) {
  throw new Error("Choose exactly one review scope: --all or --id=<avatar-id>.");
}
if (!reviewer || !notes) {
  throw new Error("A review requires --reviewer=<name> and --notes=<summary>.");
}

const selectedAvatars = requestedId
  ? maskRegistry.avatars.filter((avatar) => avatar.id === requestedId)
  : maskRegistry.avatars;

if (selectedAvatars.length === 0) throw new Error(`Unknown avatar id: ${requestedId}`);

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

const reviewedAt = new Date().toISOString();

for (const avatar of selectedAvatars) {
  const metadataPath = path.join(publicRoot, "masks", avatar.id, "metadata.json");
  const sourceBuffer = await readFile(path.join(publicRoot, avatar.source));
  const metadata = JSON.parse(await readFile(metadataPath, "utf8"));

  if (metadata.avatarId !== avatar.id || metadata.model !== maskRegistry.model) {
    throw new Error(`${avatar.id}: generated metadata does not match the registry.`);
  }
  if (metadata.source?.file !== avatar.source || metadata.source?.sha256 !== sha256(sourceBuffer)) {
    throw new Error(`${avatar.id}: source asset changed after mask generation.`);
  }

  metadata.status = "reviewed";
  if (!metadata.review || metadata.review.outcome !== "pass") {
    metadata.review = { reviewedAt, reviewer, outcome: "pass", notes };
  }
  await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
  console.log(`${avatar.id}: review recorded.`);
}

console.log(`Recorded passing review for ${selectedAvatars.length} avatar mask sets.`);
