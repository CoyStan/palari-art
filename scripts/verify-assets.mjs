import { readFile, readdir } from "node:fs/promises";

const avatarRoot = new URL("../public/avatars/", import.meta.url);
const minimumDimension = 1024;

const collections = [
  {
    directory: "standardized-1x1",
    expectedNames: Array.from(
      { length: 10 },
      (_, index) => `avatar-${String(index + 1).padStart(2, "0")}.png`,
    ),
  },
  {
    directory: "standardized-4x4",
    expectedNames: Array.from(
      { length: 28 },
      (_, index) => `avatar-4x4-${String(index + 1).padStart(2, "0")}-v1.png`,
    ),
  },
  {
    directory: "los-5-fantasticos",
    expectedNames: Array.from(
      { length: 105 },
      (_, index) => `fantastico-${String(index + 1).padStart(3, "0")}.png`,
    ),
  },
];

function pngDimensions(buffer, fileName) {
  const signature = "89504e470d0a1a0a";
  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== signature) {
    throw new Error(`${fileName} is not a valid PNG file.`);
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

const problems = [];
let verified = 0;

for (const collection of collections) {
  const directoryUrl = new URL(`${collection.directory}/`, avatarRoot);
  const entries = await readdir(directoryUrl, { withFileTypes: true });
  const actualNames = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();
  const expectedNames = [...collection.expectedNames].sort();

  const missing = expectedNames.filter((name) => !actualNames.includes(name));
  const unexpected = actualNames.filter((name) => !expectedNames.includes(name));
  if (missing.length > 0) problems.push(`${collection.directory}: missing ${missing.join(", ")}`);
  if (unexpected.length > 0) {
    problems.push(`${collection.directory}: unexpected files ${unexpected.join(", ")}`);
  }

  for (const name of expectedNames.filter((fileName) => actualNames.includes(fileName))) {
    const relativeName = `${collection.directory}/${name}`;
    const buffer = await readFile(new URL(name, directoryUrl));
    try {
      const { width, height } = pngDimensions(buffer, relativeName);
      if (width !== height) problems.push(`${relativeName} is ${width}x${height}; expected a square image.`);
      if (width < minimumDimension || height < minimumDimension) {
        problems.push(
          `${relativeName} is ${width}x${height}; expected at least ${minimumDimension}x${minimumDimension}.`,
        );
      }
      verified += 1;
    } catch (error) {
      problems.push(error instanceof Error ? error.message : String(error));
    }
  }
}

if (problems.length > 0) {
  console.error("Avatar verification failed:\n");
  for (const problem of problems) console.error(`- ${problem}`);
  process.exitCode = 1;
} else {
  console.log(`Verified ${verified} square PNG avatar assets.`);
}
