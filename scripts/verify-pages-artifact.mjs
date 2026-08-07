import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const distRoot = path.join(repositoryRoot, "dist");
const maximumArtifactBytes = 450 * 1_048_576;
const expectedWebAvatars = 314;
const expectedWebMasks = 1_395;

async function walkFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = path.join(prefix, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkFiles(path.join(directory, entry.name), relativePath));
    } else if (entry.isFile()) {
      files.push(relativePath.split(path.sep).join("/"));
    }
  }
  return files.sort();
}

const problems = [];
let files = [];
try {
  files = await walkFiles(distRoot);
} catch (error) {
  console.error(`Pages artifact verification failed: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}

const webAvatarFiles = files.filter((fileName) => /^avatars-web\/.+\.webp$/i.test(fileName));
const webMaskFiles = files.filter((fileName) => /^masks-web\/.+\.webp$/i.test(fileName));
const pngFiles = files.filter((fileName) => fileName.toLowerCase().endsWith(".png"));

if (!files.includes("index.html")) problems.push("index.html is missing.");
if (!files.includes(".nojekyll")) problems.push(".nojekyll is missing.");
if (!files.includes("avatars-web/manifest.json")) problems.push("avatar WebP manifest is missing.");
if (!files.includes("masks-web/manifest.json")) problems.push("mask WebP manifest is missing.");
if (webAvatarFiles.length !== expectedWebAvatars) {
  problems.push(`artifact has ${webAvatarFiles.length} avatar WebPs; expected ${expectedWebAvatars}.`);
}
if (webMaskFiles.length !== expectedWebMasks) {
  problems.push(`artifact has ${webMaskFiles.length} mask WebPs; expected ${expectedWebMasks}.`);
}
if (pngFiles.length > 0) problems.push(`artifact unexpectedly contains PNG files: ${pngFiles.join(", ")}.`);
if (files.some((fileName) => fileName.startsWith("avatars/") || fileName.startsWith("masks/"))) {
  problems.push("artifact contains master avatar or mask directories.");
}

let totalBytes = 0;
for (const fileName of files) totalBytes += (await stat(path.join(distRoot, fileName))).size;
if (totalBytes > maximumArtifactBytes) {
  problems.push(`artifact is ${(totalBytes / 1_048_576).toFixed(1)} MiB; maximum is 450 MiB.`);
}

try {
  const indexHtml = await readFile(path.join(distRoot, "index.html"), "utf8");
  if (!indexHtml.includes('/palari-art/assets/')) {
    problems.push("index.html does not use the /palari-art/ GitHub Pages base path.");
  }
} catch (error) {
  problems.push(`index.html: ${error instanceof Error ? error.message : error}`);
}

if (problems.length > 0) {
  console.error("Pages artifact verification failed:\n");
  for (const problem of problems) console.error(`- ${problem}`);
  process.exitCode = 1;
} else {
  console.log(
    `Verified ${(totalBytes / 1_048_576).toFixed(1)} MiB GitHub Pages artifact with ${webAvatarFiles.length} avatar and ${webMaskFiles.length} mask WebPs and no PNGs.`,
  );
}
