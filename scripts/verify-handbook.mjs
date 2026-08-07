import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument } from "pdf-lib";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const contentPath = path.join(repositoryRoot, "src/handbook/content.ts");
const pdfPath = path.join(repositoryRoot, "public/handbook/palari-character-design-handbook.pdf");
const content = await readFile(contentPath, "utf8");
const problems = [];

const pageNumbers = [...content.matchAll(/\bpage\((\d+),/g)].map((match) => Number(match[1]));
if (pageNumbers.length !== 80) problems.push(`content defines ${pageNumbers.length} pages; expected 80.`);
if (pageNumbers.some((number, index) => number !== index + 1)) problems.push("page numbers must be contiguous 1–80.");
if (!content.includes("© 2026 Palari. All rights reserved.")) problems.push("rights notice is missing.");
if (!content.includes("Palari characters represent individuals, not regional or demographic presets")) problems.push("inclusion charter is missing.");
if (!content.includes("bibliographyLinks")) problems.push("bibliography is missing.");
if (/\b(?:ethnicity|nationality|religion|region)\s*:/i.test(content)) {
  problems.push("content adds a prohibited demographic classification field.");
}

const pdf = await PDFDocument.load(await readFile(pdfPath));
if (pdf.getPageCount() !== 80) problems.push(`PDF has ${pdf.getPageCount()} pages; expected 80.`);
const expected = {
  mediaWidth: 216 * 72 / 25.4,
  mediaHeight: 276 * 72 / 25.4,
  trimX: 3 * 72 / 25.4,
  trimY: 3 * 72 / 25.4,
  trimWidth: 210 * 72 / 25.4,
  trimHeight: 270 * 72 / 25.4,
};
const near = (left, right) => Math.abs(left - right) < 0.15;

for (const [index, page] of pdf.getPages().entries()) {
  const media = page.getMediaBox();
  const trim = page.getTrimBox();
  const bleed = page.getBleedBox();
  if (!near(media.width, expected.mediaWidth) || !near(media.height, expected.mediaHeight)) {
    problems.push(`PDF page ${index + 1} has incorrect media dimensions.`);
    break;
  }
  if (!near(trim.x, expected.trimX) || !near(trim.y, expected.trimY)
    || !near(trim.width, expected.trimWidth) || !near(trim.height, expected.trimHeight)) {
    problems.push(`PDF page ${index + 1} has incorrect trim box.`);
    break;
  }
  if (!near(bleed.width, expected.mediaWidth) || !near(bleed.height, expected.mediaHeight)) {
    problems.push(`PDF page ${index + 1} has incorrect bleed box.`);
    break;
  }
}

const fontResult = spawnSync("pdffonts", [pdfPath], { encoding: "utf8" });
if (fontResult.status !== 0) problems.push(`pdffonts failed: ${fontResult.stderr.trim()}`);
else {
  const fontOutput = fontResult.stdout;
  if (!/Newsreader/i.test(fontOutput)) problems.push("PDF does not contain Newsreader.");
  if (!/Inter/i.test(fontOutput)) problems.push("PDF does not contain Inter.");
  const fontRows = fontOutput.split("\n").filter((line) => /^\S+\s+/.test(line) && !line.startsWith("name") && !line.startsWith("---"));
  if (fontRows.some((line) => /\sno\s+(?:yes|no)\s+\d+\s+\d+\s*$/.test(line))) problems.push("PDF contains an unembedded font.");
}

if (problems.length) {
  console.error("Handbook verification failed:\n");
  problems.forEach((problem) => console.error(`- ${problem}`));
  process.exitCode = 1;
} else {
  console.log("Verified 80 handbook pages, inclusion rules, bibliography, embedded fonts, and 210 × 270 mm trim with 3 mm bleed.");
}
