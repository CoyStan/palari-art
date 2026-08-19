import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const planPath = path.join(repositoryRoot, "docs/palari-v2/expansion-03/plan.json");
const sourceRoot = path.join(repositoryRoot, "docs/palari-v2/expansion-03/generated");
const iconRoot = path.join(repositoryRoot, "docs/palari-v2/ip-icons/expansion-03");
const manifestPath = path.join(repositoryRoot, "docs/palari-v2/expansion-03/manifest.json");

function run(command, arguments_) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, arguments_, {
      cwd: repositoryRoot,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${command} exited with code ${code}: ${stderr.trim()}`));
    });
  });
}

function relative(filePath) {
  return path.relative(repositoryRoot, filePath).split(path.sep).join("/");
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function pngDimensions(buffer, filePath) {
  if (
    buffer.length < 29
    || buffer.toString("ascii", 1, 4) !== "PNG"
    || buffer.toString("ascii", 12, 16) !== "IHDR"
  ) {
    throw new Error(`${relative(filePath)} is not a PNG.`);
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

async function imageMetadata(filePath) {
  const [buffer, stats, identify] = await Promise.all([
    readFile(filePath),
    stat(filePath),
    run("identify", ["-format", "%[colorspace]|%[channels]|%[opaque]", filePath]),
  ]);
  const dimensions = pngDimensions(buffer, filePath);
  const [colorSpace, channels, opaqueText] = identify.stdout.trim().split("|");
  if (dimensions.width !== 1254 || dimensions.height !== 1254) {
    throw new Error(`${relative(filePath)} must be 1254 x 1254; found ${dimensions.width} x ${dimensions.height}.`);
  }
  if (opaqueText !== "true") throw new Error(`${relative(filePath)} must be fully opaque.`);
  return {
    path: relative(filePath),
    bytes: stats.size,
    sha256: sha256(buffer),
    ...dimensions,
    colorSpace,
    channels,
    opaque: true,
  };
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function firstObject(...values) {
  return values.find((value) => value && typeof value === "object" && !Array.isArray(value));
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function normalizeNotes(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value) return [value];
  return [];
}

function normalizePassStatus(value) {
  if (typeof value !== "string") return "unreviewed";
  return value.toLowerCase().startsWith("pass") ? "pass" : "reject";
}

function normalizeSmallSizeStatus(value, readableAt32px) {
  if (typeof value === "string") {
    return value.toLowerCase().startsWith("pass") ? "pass" : "fail";
  }
  if (typeof readableAt32px === "boolean") return readableAt32px ? "pass" : "fail";
  return "unreviewed";
}

function normalizeSkillStatus(value) {
  if (typeof value !== "string") return "unreviewed";
  return value.toLowerCase() === "pass" ? "pass" : "reject";
}

async function buildContactSheet({ inputs, output, thumbnail, pointSize, spacing }) {
  await run("montage", [
    "-background", "#E9E6DF",
    "-fill", "#172333",
    "-font", "DejaVu-Sans",
    "-pointsize", String(pointSize),
    "-set", "label", "%t",
    "-thumbnail", thumbnail,
    "-tile", "7x6",
    "-geometry", spacing,
    ...inputs,
    output,
  ]);
}

const plan = JSON.parse(await readFile(planPath, "utf8"));
if (!Array.isArray(plan.characters) || plan.characters.length !== 41) {
  throw new Error("Expansion plan must contain exactly 41 characters.");
}

const expectedIds = Array.from({ length: 41 }, (_, index) => `palari-${String(index + 42).padStart(3, "0")}`);
const plannedIds = plan.characters.map((character) => character.id);
if (expectedIds.some((id, index) => plannedIds[index] !== id)) {
  throw new Error("Expansion plan IDs must be consecutive from palari-042 through palari-082.");
}

const candidates = [];
for (const design of plan.characters) {
  const sourcePath = path.join(sourceRoot, `${design.id}.png`);
  const iconPath = path.join(iconRoot, `${design.id}.png`);
  const auditPath = path.join(iconRoot, `${design.id}.audit.json`);
  const sourceAuditPath = path.join(sourceRoot, `${design.id}.audit.json`);
  const [source, icon, auditBuffer, separateSourceAudit] = await Promise.all([
    imageMetadata(sourcePath),
    imageMetadata(iconPath),
    readFile(auditPath),
    readJsonIfExists(sourceAuditPath),
  ]);
  const audit = JSON.parse(auditBuffer.toString("utf8"));
  if (audit.id !== design.id) throw new Error(`${relative(auditPath)} has ID ${audit.id}; expected ${design.id}.`);

  const sourceAudit = firstObject(
    separateSourceAudit?.source,
    separateSourceAudit?.sourceGeneration,
    separateSourceAudit,
    audit.source,
    audit.sourceGeneration,
    audit.sourceAsset,
    {},
  );
  const iconAudit = firstObject(audit.icon, audit.iconGeneration, audit.iconAsset, audit, {});
  const recordedSourceHash = firstDefined(
    sourceAudit.sha256,
    sourceAudit.asset?.sha256,
    sourceAudit.output?.sha256,
    audit.sourceSha256,
  );
  const recordedIconHash = firstDefined(
    iconAudit.sha256,
    iconAudit.asset?.sha256,
    iconAudit.output?.sha256,
    audit.iconSha256,
  );
  if (recordedSourceHash && recordedSourceHash !== source.sha256) {
    throw new Error(`${relative(auditPath)} records the wrong source SHA-256.`);
  }
  if (recordedIconHash && recordedIconHash !== icon.sha256) {
    throw new Error(`${relative(auditPath)} records the wrong icon SHA-256.`);
  }

  const sourceGrammarStatus = firstDefined(
    sourceAudit.grammarStatus,
    sourceAudit.grammarReview?.status,
    sourceAudit.review?.status,
    sourceAudit.status,
    audit.sourceGrammarStatus,
  );
  const iconSmallSizeStatus = firstDefined(
    iconAudit.smallSizeStatus,
    iconAudit.smallSizeReview?.status,
    audit.smallSizeStatus,
  );
  const readableAt32px = firstDefined(iconAudit.review?.readableAt32px, iconAudit.readableAt32px);
  const iconSkillStatus = firstDefined(
    iconAudit.skillStatus,
    iconAudit.strictStatus,
    iconAudit.skillReview?.status,
    iconAudit.review?.skillStatus,
    iconAudit.review?.strictIpAsLogoStatus,
    audit.skillStatus,
  );

  candidates.push({
    id: design.id,
    design,
    source: {
      ...source,
      grammarStatus: normalizePassStatus(sourceGrammarStatus),
      recordedGrammarStatus: firstDefined(sourceGrammarStatus, "unreviewed"),
      notes: normalizeNotes(firstDefined(
        sourceAudit.reviewNotes,
        sourceAudit.grammarReview?.notes,
        sourceAudit.notes,
        audit.sourceReviewNotes,
      )),
    },
    icon: {
      ...icon,
      seedApertureCount: firstDefined(
        iconAudit.seedApertureCount,
        iconAudit.review?.seedCount,
        iconAudit.review?.seedApertureCount,
        audit.seedApertureCount,
      ),
      smallSizeStatus: normalizeSmallSizeStatus(iconSmallSizeStatus, readableAt32px),
      skillStatus: normalizeSkillStatus(iconSkillStatus),
      recordedSkillStatus: firstDefined(iconSkillStatus, "unreviewed"),
      deviations: normalizeNotes(firstDefined(
        iconAudit.deviations,
        iconAudit.review?.deviations,
        audit.deviations,
      )),
    },
    audits: {
      icon: relative(auditPath),
      source: separateSourceAudit ? relative(sourceAuditPath) : null,
    },
  });
}

await mkdir(sourceRoot, { recursive: true });
await mkdir(iconRoot, { recursive: true });
const contactSheets = [
  {
    path: path.join(sourceRoot, "contact-sheet.png"),
    inputs: plan.characters.map(({ id }) => path.join(sourceRoot, `${id}.png`)),
    thumbnail: "220x220",
    pointSize: 15,
    spacing: "+12+28",
  },
  {
    path: path.join(iconRoot, "contact-sheet.png"),
    inputs: plan.characters.map(({ id }) => path.join(iconRoot, `${id}.png`)),
    thumbnail: "160x160",
    pointSize: 14,
    spacing: "+12+26",
  },
  {
    path: path.join(iconRoot, "contact-sheet-32px.png"),
    inputs: plan.characters.map(({ id }) => path.join(iconRoot, `${id}.png`)),
    thumbnail: "32x32",
    pointSize: 11,
    spacing: "+18+22",
  },
];

for (const contactSheet of contactSheets) {
  await buildContactSheet({
    inputs: contactSheet.inputs,
    output: contactSheet.path,
    thumbnail: contactSheet.thumbnail,
    pointSize: contactSheet.pointSize,
    spacing: contactSheet.spacing,
  });
}

const reviewComposites = [];
for (const contactSheet of contactSheets) {
  const buffer = await readFile(contactSheet.path);
  const dimensions = pngDimensions(buffer, contactSheet.path);
  reviewComposites.push({
    path: relative(contactSheet.path),
    sha256: sha256(buffer),
    ...dimensions,
  });
}

const manifest = {
  version: 1,
  createdAt: "2026-08-19",
  status: "review-candidates",
  productionRegistered: false,
  plan: relative(planPath),
  idRange: plan.idRange,
  counts: {
    candidates: candidates.length,
    sourceImages: candidates.length,
    icons: candidates.length,
    auditFiles: candidates.length,
    sourceGrammarPass: candidates.filter(({ source }) => source.grammarStatus === "pass").length,
    iconSmallSizePass: candidates.filter(({ icon }) => icon.smallSizeStatus === "pass").length,
    iconStrictSkillPass: candidates.filter(({ icon }) => icon.skillStatus === "pass").length,
    exactSixIconSeedApertures: candidates.filter(({ icon }) => icon.seedApertureCount === 6).length,
  },
  candidates,
  reviewComposites,
};
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`Validated ${candidates.length} paired candidates and wrote ${relative(manifestPath)}.`);
