import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

const repositoryRoot = path.resolve(import.meta.dirname, "..");
const publicRoot = path.join(repositoryRoot, "public");
const framingPath = path.join(repositoryRoot, "src/data/avatar-framing.json");
const maskRegistryPath = path.join(repositoryRoot, "src/data/avatar-masks.json");

const [framing, masks] = await Promise.all([
  readFile(framingPath, "utf8").then(JSON.parse),
  readFile(maskRegistryPath, "utf8").then(JSON.parse),
]);

if (framing.version !== 1 || !Array.isArray(framing.avatars)) {
  throw new Error("avatar-framing.json has an unsupported structure.");
}

const registered = new Map(masks.avatars.map((avatar) => [avatar.id, avatar]));
const seen = new Set();
for (const record of framing.avatars) {
  const avatar = registered.get(record.id);
  if (!avatar) throw new Error(`${record.id}: framing record is not registered.`);
  if (seen.has(record.id)) throw new Error(`${record.id}: duplicate framing record.`);
  seen.add(record.id);

  for (const key of ["scale", "centerX", "centerY"]) {
    if (!Number.isFinite(record[key])) throw new Error(`${record.id}: ${key} must be finite.`);
  }
  if (record.scale < 1 || record.scale > framing.target.maximumScale) {
    throw new Error(`${record.id}: scale is outside the approved range.`);
  }
  const halfCrop = 0.5 / record.scale;
  if (
    record.centerX - halfCrop < -1e-5
    || record.centerX + halfCrop > 1 + 1e-5
    || record.centerY - halfCrop < -1e-5
    || record.centerY + halfCrop > 1 + 1e-5
  ) {
    throw new Error(`${record.id}: crop extends beyond the source portrait.`);
  }

  const source = await readFile(path.join(publicRoot, avatar.source));
  const sourceHash = createHash("sha256").update(source).digest("hex");
  if (sourceHash !== record.sourceSha256) {
    throw new Error(`${record.id}: source checksum changed; regenerate and review framing.`);
  }
}

if (seen.size !== registered.size) {
  const missing = [...registered.keys()].filter((id) => !seen.has(id));
  throw new Error(`Missing framing records: ${missing.join(", ")}`);
}

console.log(`Verified ${seen.size} source-linked avatar framing records.`);
