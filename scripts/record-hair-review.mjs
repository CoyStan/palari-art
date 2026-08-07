import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import maskRegistry from "../src/data/avatar-masks.json" with { type: "json" };

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(repositoryRoot, "public");
const requestedId = process.argv.find((argument) => argument.startsWith("--id="))?.slice(5);
const requestedPrefix = process.argv.find((argument) => argument.startsWith("--prefix="))?.slice(9);
const reviewer = process.argv.find((argument) => argument.startsWith("--reviewer="))?.slice(11);
const notes = process.argv.find((argument) => argument.startsWith("--notes="))?.slice(8);

if ((!requestedId && !requestedPrefix) || !reviewer || !notes) {
  throw new Error("Usage: npm run hair:review -- --id=<id|pilot|all> or --prefix=<prefix> --reviewer=<name> --notes=<summary>");
}

const selectedAvatars = (requestedPrefix
  ? maskRegistry.avatars.filter((avatar) => avatar.id.startsWith(requestedPrefix))
  : requestedId === "all"
  ? maskRegistry.avatars
  : requestedId === "pilot"
    ? maskRegistry.avatars.filter((avatar) => avatar.hairPilot)
    : maskRegistry.avatars.filter((avatar) => avatar.id === requestedId))
  .filter((avatar) => avatar.hairMatting !== false);
if (selectedAvatars.length === 0) throw new Error(`No hair masks matched ${requestedId ?? requestedPrefix}.`);

const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");

for (const avatar of selectedAvatars) {
  const metadataPath = path.join(publicRoot, "masks", avatar.id, "metadata.json");
  const hairPath = path.join(publicRoot, "masks", avatar.id, "hair.png");
  const metadata = JSON.parse(await readFile(metadataPath, "utf8"));
  const hairBuffer = await readFile(hairPath);
  const sourceBuffer = await readFile(path.join(publicRoot, avatar.source));
  if (metadata.source?.sha256 !== sha256(sourceBuffer)) {
    throw new Error(`${avatar.id}: source changed after hair-mask generation.`);
  }
  if (metadata.hairLayer?.mask?.sha256 !== sha256(hairBuffer)) {
    throw new Error(`${avatar.id}: hair-mask checksum does not match metadata.`);
  }
  metadata.hairLayer.status = "reviewed";
  metadata.hairLayer.review = {
    reviewedAt: new Date().toISOString(),
    reviewer,
    outcome: "pass",
    notes,
  };
  await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
  console.log(`${avatar.id}: recorded passing hair-layer review.`);
}
