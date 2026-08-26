import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const distRoot = path.join(repositoryRoot, "dist");
const maximumArtifactBytes = 450 * 1_048_576;
const expectedWebAvatars = 314;
const expectedWebMasks = 1_395;
const expectedHandbookWebps = 40;
const expectedPalariV2Webps = 246;
const expectedPalariV2IconWebps = 164;
const expectedPalariV3IconWebps = 36;

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
const handbookWebpFiles = files.filter((fileName) => /^handbook\/assets\/(?:full|compact)\/.+\.webp$/i.test(fileName));
const palariV2WebpFiles = files.filter((fileName) => /^palari-v2-web\/.+\.webp$/i.test(fileName));
const palariV2IconWebpFiles = files.filter((fileName) => /^palari-v2-icons-web\/.+\.webp$/i.test(fileName));
const palariV3IconWebpFiles = files.filter((fileName) => /^palari-v3-icons-web\/.+\.webp$/i.test(fileName));
const pngFiles = files.filter((fileName) => fileName.toLowerCase().endsWith(".png"));

if (!files.includes("index.html")) problems.push("index.html is missing.");
if (!files.includes("handbook/index.html")) problems.push("handbook/index.html is missing.");
if (!files.includes("v2/index.html")) problems.push("v2/index.html is missing.");
if (!files.includes("v3/index.html")) problems.push("v3/index.html is missing.");
if (files.includes("handbook/palari-character-design-handbook.pdf")) problems.push("removed handbook PDF is still deployed.");
if (!files.includes(".nojekyll")) problems.push(".nojekyll is missing.");
if (!files.includes("avatars-web/manifest.json")) problems.push("avatar WebP manifest is missing.");
if (!files.includes("masks-web/manifest.json")) problems.push("mask WebP manifest is missing.");
if (!files.includes("handbook/assets/manifest.json")) problems.push("handbook WebP manifest is missing.");
if (!files.includes("palari-v2-web/manifest.json")) problems.push("Palari V2 WebP manifest is missing.");
if (!files.includes("palari-v2-icons-web/manifest.json")) problems.push("Palari V2 emoticon WebP manifest is missing.");
if (!files.includes("palari-v3-icons-web/manifest.json")) problems.push("Palari V3 avatar WebP manifest is missing.");
if (webAvatarFiles.length !== expectedWebAvatars) {
  problems.push(`artifact has ${webAvatarFiles.length} avatar WebPs; expected ${expectedWebAvatars}.`);
}
if (webMaskFiles.length !== expectedWebMasks) {
  problems.push(`artifact has ${webMaskFiles.length} mask WebPs; expected ${expectedWebMasks}.`);
}
if (handbookWebpFiles.length !== expectedHandbookWebps) {
  problems.push(`artifact has ${handbookWebpFiles.length} handbook WebPs; expected ${expectedHandbookWebps}.`);
}
if (palariV2WebpFiles.length !== expectedPalariV2Webps) {
  problems.push(`artifact has ${palariV2WebpFiles.length} Palari V2 WebPs; expected ${expectedPalariV2Webps}.`);
}
if (palariV2IconWebpFiles.length !== expectedPalariV2IconWebps) {
  problems.push(`artifact has ${palariV2IconWebpFiles.length} Palari V2 emoticon WebPs; expected ${expectedPalariV2IconWebps}.`);
}
if (palariV3IconWebpFiles.length !== expectedPalariV3IconWebps) {
  problems.push(`artifact has ${palariV3IconWebpFiles.length} Palari V3 avatar WebPs; expected ${expectedPalariV3IconWebps}.`);
}
if (pngFiles.length > 0) problems.push(`artifact unexpectedly contains PNG files: ${pngFiles.join(", ")}.`);
if (files.some((fileName) => fileName.startsWith("avatars/") || fileName.startsWith("masks/"))) {
  problems.push("artifact contains master avatar or mask directories.");
}
if (files.some((fileName) => fileName.startsWith("docs/art-guide/") || fileName.startsWith("handbook/assets/source/"))) {
  problems.push("artifact contains handbook source masters.");
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
  const handbookHtml = await readFile(path.join(distRoot, "handbook/index.html"), "utf8");
  if (!handbookHtml.includes('/palari-art/assets/')) {
    problems.push("handbook/index.html does not use the /palari-art/ GitHub Pages base path.");
  }
  const v2Html = await readFile(path.join(distRoot, "v2/index.html"), "utf8");
  if (!v2Html.includes('/palari-art/assets/')) {
    problems.push("v2/index.html does not use the /palari-art/ GitHub Pages base path.");
  }
  const v3Html = await readFile(path.join(distRoot, "v3/index.html"), "utf8");
  if (!v3Html.includes('/palari-art/assets/')) {
    problems.push("v3/index.html does not use the /palari-art/ GitHub Pages base path.");
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
    `Verified ${(totalBytes / 1_048_576).toFixed(1)} MiB GitHub Pages artifact with ${webAvatarFiles.length} avatar, ${webMaskFiles.length} mask, ${handbookWebpFiles.length} handbook, ${palariV2WebpFiles.length} Palari V2 ceramic, ${palariV2IconWebpFiles.length} Palari V2 emoticon, and ${palariV3IconWebpFiles.length} Palari V3 avatar WebPs and no PNGs.`,
  );
}
