import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const attributesPath = path.join(repositoryRoot, "src", "data", "avatar-attributes.json");
const attributes = JSON.parse(await readFile(attributesPath, "utf8"));
const problems = [];

const allowed = {
  presentation: ["masculine", "feminine", "androgynous"],
  apparentAge: ["teen", "young_adult", "adult", "middle_aged", "older_adult"],
  skinTone: ["very_light", "light", "medium", "tan", "brown", "dark"],
  hairColor: ["black", "dark_brown", "brown", "light_brown", "blonde", "red", "gray", "white", "pink", "multicolor", "covered"],
  hairTexture: ["straight", "wavy", "curly", "coily", "locs", "braids", "shaved", "bald", "covered"],
  hairLength: ["bald", "very_short", "short", "medium", "long", "covered"],
  facialHair: ["none", "stubble", "mustache", "goatee", "short_beard", "full_beard"],
  eyewear: ["none", "glasses"],
  headwear: ["none", "hijab", "headscarf", "headband", "turban", "hat", "other"],
  earJewelry: ["none", "studs", "hoops", "drops", "gauges", "mixed"],
  neckJewelry: ["none", "necklace", "chain", "choker", "layered"],
  garmentType: ["crewneck", "v_neck", "turtleneck", "cowl_neck", "cardigan", "jacket", "blouse", "collared_shirt", "other"],
  garmentColor: ["black", "gray", "white", "beige", "brown", "red", "orange", "yellow", "green", "teal", "blue", "purple", "pink", "multicolor"],
  backgroundColor: ["black", "gray", "white", "beige", "brown", "red", "orange", "yellow", "green", "teal", "blue", "purple", "pink", "multicolor"],
  palette: ["warm", "cool", "neutral", "mixed"],
  confidence: ["high", "medium", "low"],
};

function expectedRecord(index) {
  const labelNumber = index + 1;
  if (labelNumber <= 10) {
    const number = String(labelNumber).padStart(2, "0");
    return { avatarId: `original-${number}`, source: `/avatars/standardized-1x1/avatar-${number}.png` };
  }
  if (labelNumber <= 38) {
    const number = String(labelNumber - 10).padStart(2, "0");
    return { avatarId: `expanded-${number}`, source: `/avatars/standardized-4x4/avatar-4x4-${number}-v1.png` };
  }
  const number = String(labelNumber - 38).padStart(3, "0");
  return { avatarId: `fantasticos-${number}`, source: `/avatars/los-5-fantasticos/fantastico-${number}.png` };
}

if (!Array.isArray(attributes) || attributes.length !== 143) {
  problems.push(`Expected 143 attribute records, found ${Array.isArray(attributes) ? attributes.length : "non-array data"}.`);
}

const labels = new Set();
const ids = new Set();
for (const [index, record] of attributes.entries()) {
  const expectedLabel = `Avatar ${String(index + 1).padStart(3, "0")}`;
  const expected = expectedRecord(index);
  if (record.label !== expectedLabel) problems.push(`${expectedLabel}: label or ordering mismatch.`);
  if (record.avatarId !== expected.avatarId) problems.push(`${expectedLabel}: avatarId should be ${expected.avatarId}.`);
  if (record.source !== expected.source) problems.push(`${expectedLabel}: source should be ${expected.source}.`);
  if (labels.has(record.label)) problems.push(`${record.label}: duplicate label.`);
  if (ids.has(record.avatarId)) problems.push(`${record.avatarId}: duplicate avatarId.`);
  labels.add(record.label);
  ids.add(record.avatarId);

  for (const [field, values] of Object.entries(allowed)) {
    if (!values.includes(record[field])) problems.push(`${expectedLabel}: invalid ${field} value ${JSON.stringify(record[field])}.`);
  }
  if (!Array.isArray(record.notableFeatures) || record.notableFeatures.some((value) => typeof value !== "string")) {
    problems.push(`${expectedLabel}: notableFeatures must be an array of strings.`);
  }
  if (typeof record.notes !== "string") problems.push(`${expectedLabel}: notes must be a string.`);

  try {
    await access(path.join(repositoryRoot, "public", record.source.slice(1)));
  } catch {
    problems.push(`${expectedLabel}: source file is missing.`);
  }
}

if (problems.length > 0) {
  console.error("Avatar attribute verification failed:\n");
  for (const problem of problems) console.error(`- ${problem}`);
  process.exitCode = 1;
} else {
  console.log(`Verified ${attributes.length} avatar attribute records.`);
}
