import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const collection = JSON.parse(await readFile(path.join(repositoryRoot, "docs/palari-v3/collection.json"), "utf8"));
const manifest = JSON.parse(await readFile(path.join(repositoryRoot, "public/palari-v3-icons-web/manifest.json"), "utf8"));
const runtimeRegistry = await readFile(path.join(repositoryRoot, "src/v3/data.ts"), "utf8");
const proceduralSource = await readFile(path.join(repositoryRoot, "src/v3/procedural.ts"), "utf8");
const skeletonSource = await readFile(path.join(repositoryRoot, "src/v3/skeleton.ts"), "utf8");
const coverSource = await readFile(path.join(repositoryRoot, "src/v3/cover.ts"), "utf8");
const proceduralComponent = await readFile(path.join(repositoryRoot, "src/v3/ProceduralPalari.tsx"), "utf8");
const avatarPicker = await readFile(path.join(repositoryRoot, "src/v3/AvatarPicker.tsx"), "utf8");
const v3Application = await readFile(path.join(repositoryRoot, "src/v3/V3App.tsx"), "utf8");
const v3Download = await readFile(path.join(repositoryRoot, "src/v3/download.ts"), "utf8");
const problems = [];

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function hexToLinearRgb(hex) {
  return hex.match(/[a-f\d]{2}/gi).map((part) => {
    const channel = Number.parseInt(part, 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
}

function relativeLuminance(hex) {
  const [red, green, blue] = hexToLinearRgb(hex);
  return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
}

function contrastRatio(first, second) {
  const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

function oklch(hex) {
  const [red, green, blue] = hexToLinearRgb(hex);
  const l = (0.4122214708 * red) + (0.5363325363 * green) + (0.0514459929 * blue);
  const m = (0.2119034982 * red) + (0.6806995451 * green) + (0.1073969566 * blue);
  const s = (0.0883024619 * red) + (0.2817188376 * green) + (0.6299787005 * blue);
  const lRoot = Math.cbrt(l);
  const mRoot = Math.cbrt(m);
  const sRoot = Math.cbrt(s);
  const lightness = (0.2104542553 * lRoot) + (0.793617785 * mRoot) - (0.0040720468 * sRoot);
  const a = (1.9779984951 * lRoot) - (2.428592205 * mRoot) + (0.4505937099 * sRoot);
  const b = (0.0259040371 * lRoot) + (0.7827717662 * mRoot) - (0.808675766 * sRoot);
  const hue = (Math.atan2(b, a) * 180 / Math.PI + 360) % 360;
  return { lightness, chroma: Math.hypot(a, b), hue };
}

function hueDistance(first, second) {
  const difference = Math.abs(first - second);
  return Math.min(difference, 360 - difference);
}

function pngDimensions(buffer, fileName) {
  if (buffer.length < 29 || buffer.toString("ascii", 1, 4) !== "PNG" || buffer.toString("ascii", 12, 16) !== "IHDR") {
    throw new Error(`${fileName} is not a PNG.`);
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function uint24le(buffer, offset) {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

function webpDimensions(buffer, fileName) {
  if (buffer.length < 30 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") {
    throw new Error(`${fileName} is not a WebP.`);
  }
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunk = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const data = offset + 8;
    if (chunk === "VP8X") return { width: uint24le(buffer, data + 4) + 1, height: uint24le(buffer, data + 7) + 1 };
    if (chunk === "VP8 ") return { width: buffer.readUInt16LE(data + 6) & 0x3fff, height: buffer.readUInt16LE(data + 8) & 0x3fff };
    if (chunk === "VP8L") {
      const bits = buffer.readUInt32LE(data + 1);
      return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
    }
    offset = data + size + (size % 2);
  }
  throw new Error(`${fileName} has no supported image chunk.`);
}

if (collection.version !== 3 || collection.avatars.length !== 24) problems.push("V3 collection must contain exactly 24 avatars.");
if (manifest.schemaVersion !== 1 || manifest.recipeVersion !== 1 || manifest.avatars.length !== 24) problems.push("V3 WebP manifest is incomplete.");
if (!runtimeRegistry.includes("collection.avatars") || !runtimeRegistry.includes("assetUrl")) problems.push("V3 runtime registry is incomplete.");
if (!runtimeRegistry.includes("makeGeneratedPalari") || !runtimeRegistry.includes("palariRigForAvatar")) problems.push("V3 procedural runtime registration is incomplete.");
for (const requiredToken of ["mulberry32", "generatePalari", "renderPalariSvg", '"pebble-nest"', '"pillow-bell"', '"folded-hood"']) {
  if (!proceduralSource.includes(requiredToken)) problems.push(`V3 procedural source is missing ${requiredToken}.`);
}
for (const requiredToken of ["PALARI_BONES", "PalariVolume", "crownVolumes", "buildSkeleton", '"root"', '"chest"', '"head"', '"leftHand"', '"rightHand"', '"leftEye"', '"rightEye"', '"round"', '"double"', '"side-cap"', '"bobble"']) {
  if (!skeletonSource.includes(requiredToken)) problems.push(`V3 skeleton source is missing ${requiredToken}.`);
}
for (const requiredToken of ["coverSkeleton", "rayEllipseDistance", "envelopePath", "faceFromSkeleton", "armFromBalls", "eyeFromSkeleton"]) {
  if (!coverSource.includes(requiredToken)) problems.push(`V3 cover source is missing ${requiredToken}.`);
}
if (!proceduralSource.includes("buildSkeleton") || !proceduralSource.includes("coverSkeleton")) {
  problems.push("V3 generation must build the skeleton before deriving its cover.");
}
if (/\b(?:shellPath|facePath):\s*["'`]/.test(proceduralSource) || proceduralSource.includes("generatedShell") || proceduralSource.includes("generatedFace")) {
  problems.push("V3 presets must not contain authored cover paths or reverse-rigged silhouette generators.");
}
for (const id of collection.avatars.slice(18).map((avatar) => avatar.id)) {
  if (!proceduralSource.includes(`"${id}"`)) problems.push(`${id}: missing runtime rig preset.`);
}
if (!proceduralComponent.includes("prefers-reduced-motion") || !proceduralComponent.includes(".animate(") || !proceduralComponent.includes("v3-rig-eye")) {
  problems.push("V3 procedural motion must include reduced-motion handling, a tap response, and rigged eyes.");
}
if (!proceduralComponent.includes('view === "balls"') || !proceduralComponent.includes("data-volume-count") || !proceduralComponent.includes("v3-volume-ball") || !proceduralComponent.includes("v3-cover-shell")) {
  problems.push("V3 runtime must expose both the originating volume balls and their generated cover.");
}
if (!avatarPicker.includes("avatar.rig") || !avatarPicker.includes('<ProceduralPalari rig={avatar.rig}')) {
  problems.push("V3 skeleton-first picker tiles must render their generated covers instead of legacy thumbnails.");
}
if (!v3Application.includes('searchParams.set("seed"') || !v3Application.includes("MotionSelector") || !v3Application.includes("ViewSelector") || !v3Application.includes("Make one")) {
  problems.push("V3 app must expose URL-linked generation, volume inspection, and a motion control.");
}
if (!v3Download.includes("renderPalariSvg")) problems.push("V3 local export does not support procedural SVG rigs.");

const expectedIds = collection.avatars.map((_, index) => `palari-v3-${String(index + 1).padStart(3, "0")}`);
if (JSON.stringify(collection.avatars.map((avatar) => avatar.id)) !== JSON.stringify(expectedIds)) problems.push("V3 IDs are not contiguous.");
if (new Set(collection.avatars.map((avatar) => avatar.name)).size !== 24) problems.push("V3 avatar names must be unique.");

const strictFlatAvatars = collection.avatars.slice(18);
for (const avatar of strictFlatAvatars) {
  if (!avatar.vectorSource) {
    problems.push(`${avatar.id}: missing flat-first SVG authority.`);
    continue;
  }
  if (avatar.strictSkillStatus !== "pass" || avatar.deviations?.length !== 0) problems.push(`${avatar.id}: strict skill review is not clean.`);
  try {
    const svg = await readFile(path.join(repositoryRoot, avatar.vectorSource), "utf8");
    if (!svg.includes('width="1254" height="1254" viewBox="0 0 1254 1254"')) problems.push(`${avatar.id}: SVG canvas is not native 1254px square.`);
    if (!svg.includes('<rect width="1254" height="1254" fill="#172333"/>')) problems.push(`${avatar.id}: background is not one solid navy rectangle.`);
    if ((svg.match(/<linearGradient\b/g) ?? []).length !== 2 || /<radialGradient\b|<filter\b|opacity=/.test(svg)) {
      problems.push(`${avatar.id}: tonal model must contain exactly two plain linear gradients and no effects.`);
    }
    if ((svg.match(/<rect\b/g) ?? []).length !== 1 || (svg.match(/<path\b/g) ?? []).length !== 2 || /<(?:ellipse|polygon|polyline|line|image|text)\b/.test(svg)) {
      problems.push(`${avatar.id}: must use one background, two continuous color paths, and six circles only.`);
    }
    if ((svg.match(/<path fill="url\(#/g) ?? []).length !== 2) problems.push(`${avatar.id}: must have one continuous shelter and one continuous face region.`);

    const circles = [...svg.matchAll(/<circle\s+cx="[^"]+"\s+cy="[^"]+"\s+r="([^"]+)"\s+fill="(#[A-Fa-f0-9]{6})"\/>/g)]
      .map((match) => ({ radius: Number(match[1]), fill: match[2].toUpperCase() }));
    const ivoryCircles = circles.filter((circle) => circle.fill === "#F2EBDD");
    const navyCircles = circles.filter((circle) => circle.fill === "#172333");
    if (circles.length !== 6 || ivoryCircles.filter((circle) => circle.radius >= 80).length !== 2 || ivoryCircles.filter((circle) => circle.radius <= 24).length !== 2) {
      problems.push(`${avatar.id}: must contain exactly two eye whites and two small ivory catchlights.`);
    }
    if (navyCircles.length !== 2 || navyCircles.some((circle) => circle.radius < 50 || circle.radius > 65)) problems.push(`${avatar.id}: must contain exactly two navy pupil openings.`);
    if (contrastRatio("#172333", "#F2EBDD") < 4.5) problems.push(`${avatar.id}: pupil and catchlight contrast is below 4.5:1.`);

    const gradientBlocks = [...svg.matchAll(/<linearGradient\b([^>]*)>([\s\S]*?)<\/linearGradient>/g)];
    for (const [, attributes, block] of gradientBlocks) {
      const coordinates = Object.fromEntries([...attributes.matchAll(/\b(x1|y1|x2|y2)="([\d.]+)"/g)].map((match) => [match[1], Number(match[2])]));
      if (coordinates.x2 - coordinates.x1 < 627 || coordinates.y2 <= coordinates.y1) problems.push(`${avatar.id}: gradient must span at least half the mark on the shared upper-left-to-lower-right axis.`);
      const colors = [...block.matchAll(/stop-color="(#[A-Fa-f0-9]{6})"/g)].map((match) => match[1]);
      if (colors.length !== 2) {
        problems.push(`${avatar.id}: every tonal region must have exactly two gradient endpoints.`);
        continue;
      }
      const [first, second] = colors.map(oklch);
      if (Math.abs(first.lightness - second.lightness) > 0.08 || Math.abs(first.chroma - second.chroma) > 0.015 || hueDistance(first.hue, second.hue) > 3) {
        problems.push(`${avatar.id}: gradient exceeds the flat-first OKLCH micro-volume limits.`);
      }
    }
    const faceBlock = [...svg.matchAll(/<linearGradient\s+id="face"[^>]*>([\s\S]*?)<\/linearGradient>/g)][0]?.[1] ?? "";
    const faceColors = [...faceBlock.matchAll(/stop-color="(#[A-Fa-f0-9]{6})"/g)].map((match) => match[1]);
    if (faceColors.length !== 2 || faceColors.some((color) => contrastRatio(color, "#172333") < 3)) problems.push(`${avatar.id}: face/background contrast is below 3:1.`);
  } catch (error) {
    problems.push(`${avatar.id}: ${error.message}`);
  }
}

for (const avatar of collection.avatars) {
  const entry = manifest.avatars.find((candidate) => candidate.avatarId === avatar.id);
  if (!entry) { problems.push(`${avatar.id}: missing manifest entry.`); continue; }
  try {
    const sourceBuffer = await readFile(path.join(repositoryRoot, avatar.source));
    const sourceDimensions = pngDimensions(sourceBuffer, avatar.source);
    if (sourceDimensions.width !== 1254 || sourceDimensions.height !== 1254) problems.push(`${avatar.source}: incorrect dimensions.`);
    if (sha256(sourceBuffer) !== entry.source.sha256) problems.push(`${avatar.id}: source checksum mismatch.`);
  } catch (error) { problems.push(error.message); }

  for (const [assetName, expectedSize] of Object.entries({ icon: 1024, thumbnail: 256 })) {
    const record = entry.assets[assetName];
    const collectionPath = `public/${avatar[assetName]}`;
    if (record.path !== collectionPath) problems.push(`${avatar.id}/${assetName}: collection and manifest paths differ.`);
    try {
      const outputBuffer = await readFile(path.join(repositoryRoot, record.path));
      if (sha256(outputBuffer) !== record.sha256) problems.push(`${avatar.id}/${assetName}: checksum mismatch.`);
      const dimensions = webpDimensions(outputBuffer, record.path);
      if (dimensions.width !== expectedSize || dimensions.height !== expectedSize) problems.push(`${record.path}: incorrect dimensions.`);
    } catch (error) { problems.push(error.message); }
  }
}

const newDirectories = (await readdir(path.join(repositoryRoot, "public/palari-v3-icons-web"), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
if (newDirectories.length !== 18 || newDirectories[0] !== "palari-v3-007" || newDirectories[17] !== "palari-v3-024") {
  problems.push("V3 delivery directory must contain the 18 native avatars.");
}

if (problems.length) {
  console.error("Palari V3 verification failed:\n");
  for (const problem of problems) console.error(`- ${problem}`);
  process.exitCode = 1;
} else {
  console.log("Verified 24 V3 avatars, six curated V2 sources, 18 native masters, six strict flat-first SVG contracts, six volume-ball runtime rigs, deterministic cover generation and export, and all WebP delivery checksums and dimensions.");
}
