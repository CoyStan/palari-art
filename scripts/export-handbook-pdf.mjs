import { spawn } from "node:child_process";
import { access, copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument } from "pdf-lib";
import { chromium as playwrightChromium } from "playwright-core";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const outputPath = path.join(repositoryRoot, "public/handbook/palari-character-design-handbook.pdf");
const temporaryRoot = await mkdtemp(path.join(tmpdir(), "palari-handbook-"));
const rawPdfPath = path.join(repositoryRoot, "output/playwright/handbook-raw.pdf");
const compressedPdfPath = path.join(temporaryRoot, "compressed.pdf");
const previewPort = 4174;

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repositoryRoot,
      stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
      ...options.spawn,
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => { stdout += chunk; });
    child.stderr?.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${command} exited with ${code}: ${stderr.trim()}`));
    });
  });
}

async function findChromium() {
  const candidates = [
    process.env.PALARI_CHROMIUM_PATH,
    "/usr/bin/chromium",
    "/snap/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next explicit executable.
    }
  }
  throw new Error("Chromium was not found. Set PALARI_CHROMIUM_PATH to a Chromium executable.");
}

async function waitForPreview() {
  const url = `http://127.0.0.1:${previewPort}/handbook/?print=1`;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return url;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 125));
  }
  throw new Error("Vite preview did not become ready.");
}

let preview;
let browser;
try {
  await run("npm", ["run", "build"]);
  preview = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "preview", "--host", "127.0.0.1", "--port", String(previewPort)], {
    cwd: repositoryRoot,
    stdio: ["ignore", "ignore", "pipe"],
  });
  const printUrl = await waitForPreview();
  const chromium = await findChromium();
  await mkdir(path.dirname(rawPdfPath), { recursive: true });
  browser = await playwrightChromium.launch({ executablePath: chromium, headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
  await page.goto(printUrl, { waitUntil: "networkidle" });
  await page.emulateMedia({ media: "print" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images, (image) => {
      if (image.complete) return Promise.resolve();
      return new Promise((resolve, reject) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", reject, { once: true });
      });
    }));
  });
  await page.pdf({
    path: rawPdfPath,
    preferCSSPageSize: true,
    printBackground: true,
    displayHeaderFooter: false,
    tagged: true,
    outline: true,
  });
  await browser.close();
  browser = undefined;

  await run("gs", [
    "-sDEVICE=pdfwrite",
    "-dCompatibilityLevel=1.7",
    "-dNOPAUSE",
    "-dBATCH",
    "-dQUIET",
    "-dEmbedAllFonts=true",
    "-dSubsetFonts=true",
    "-dDetectDuplicateImages=true",
    "-dColorImageDownsampleType=/Bicubic",
    "-dColorImageResolution=220",
    "-dGrayImageDownsampleType=/Bicubic",
    "-dGrayImageResolution=220",
    `-sOutputFile=${compressedPdfPath}`,
    rawPdfPath,
  ], { capture: true });

  const pdf = await PDFDocument.load(await readFile(compressedPdfPath));
  if (pdf.getPageCount() !== 80) throw new Error(`Chromium produced ${pdf.getPageCount()} pages; expected 80.`);
  const mm = (value) => value * 72 / 25.4;
  for (const page of pdf.getPages()) {
    page.setMediaBox(0, 0, mm(216), mm(276));
    page.setBleedBox(0, 0, mm(216), mm(276));
    page.setTrimBox(mm(3), mm(3), mm(210), mm(270));
  }
  pdf.setTitle("Palari: The Character Design Handbook");
  pdf.setAuthor("Palari Art");
  pdf.setCreator("Palari Art React/CSS print source");
  pdf.setProducer("Chromium and pdf-lib");
  pdf.setSubject("An inclusive guide to Palari character design and production");
  pdf.setKeywords(["Palari", "character design", "style guide", "art handbook"]);
  pdf.setCreationDate(new Date("2026-08-07T00:00:00Z"));
  pdf.setModificationDate(new Date("2026-08-07T00:00:00Z"));

  await mkdir(path.dirname(outputPath), { recursive: true });
  const stagedPath = path.join(temporaryRoot, "palari-character-design-handbook.pdf");
  await writeFile(stagedPath, await pdf.save({ useObjectStreams: true }));
  await copyFile(stagedPath, outputPath);
  console.log(`Exported 80-page handbook PDF to ${path.relative(repositoryRoot, outputPath)}.`);
} finally {
  await browser?.close();
  if (preview && preview.exitCode === null) {
    preview.kill("SIGTERM");
    await new Promise((resolve) => {
      const timeout = setTimeout(resolve, 2_000);
      preview.once("close", () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }
  await rm(rawPdfPath, { force: true });
  await rm(temporaryRoot, { recursive: true, force: true });
}
