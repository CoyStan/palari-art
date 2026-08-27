import { coverSkeleton, type PalariCover, type ProceduralPalariFamily } from "./cover";
import { buildSkeleton, type CrownStyle, type PalariSkeleton, type SkeletonBlueprint } from "./skeleton";

export const PALARI_VIEWBOX = 1254;

export type { ProceduralPalariFamily } from "./cover";

export type PalariMotion = {
  cycleSeconds: number;
  blinkSeconds: number;
  phaseSeconds: number;
  bounce: number;
  swayDegrees: number;
  armDegrees: number;
  gaze: number;
};

export type PalariRig = {
  seed: number;
  name: string;
  family: ProceduralPalariFamily;
  background: string;
  ivory: readonly [string, string];
  face: readonly [string, string];
  eyeWhite: string;
  skeleton: PalariSkeleton;
  cover: PalariCover;
  motion: PalariMotion;
};

type PalariRecipe = {
  seed: number;
  name: string;
  family: ProceduralPalariFamily;
  face: readonly [string, string];
  blueprint: Partial<SkeletonBlueprint>;
  motionIndex: number;
};

const background = "#172333";
const ivory = ["#F5EFE4", "#EEE6D9"] as const;
const eyeWhite = "#F2EBDD";

const facePalettes = [
  ["#548B87", "#4C807D"],
  ["#8E6A8A", "#85617F"],
  ["#BC8339", "#B2762D"],
  ["#BE6758", "#B55B4D"],
  ["#5A81A1", "#507694"],
  ["#6C825F", "#627756"],
  ["#B76475", "#AA596B"],
  ["#657B9B", "#5B708F"],
] as const;

const nameStarts = ["Mim", "No", "Tavi", "Peb", "Lumi", "Oli", "Moch", "Bri"];
const nameEnds = ["i", "o", "u", "a", "et", "lo", "by", "ka"];

function makeMotion(seed: number, index: number): PalariMotion {
  return {
    cycleSeconds: 3.8 + ((seed + index * 7) % 11) / 10,
    blinkSeconds: 5.4 + ((seed + index * 13) % 15) / 10,
    phaseSeconds: -((seed * 17 + index * 19) % 30) / 10,
    bounce: 12 + ((seed + index * 5) % 8),
    swayDegrees: 1.1 + ((seed + index * 3) % 8) / 10,
    armDegrees: 3.5 + ((seed + index * 11) % 18) / 10,
    gaze: 8 + ((seed + index * 5) % 7),
  };
}

function makeRig(recipe: PalariRecipe): PalariRig {
  const skeleton = buildSkeleton(recipe.seed, recipe.blueprint);
  return {
    seed: recipe.seed,
    name: recipe.name,
    family: recipe.family,
    background,
    ivory,
    face: recipe.face,
    eyeWhite,
    skeleton,
    cover: coverSkeleton(skeleton),
    motion: makeMotion(recipe.seed, recipe.motionIndex),
  };
}

const presetRecipes: Record<string, PalariRecipe> = {
  "palari-v3-019": {
    seed: 19,
    name: "Tuck",
    family: "pebble-nest",
    face: facePalettes[0],
    motionIndex: 0,
    blueprint: {
      headY: 490,
      headRadiusX: 305,
      headRadiusY: 230,
      chestRadiusX: 480,
      chestRadiusY: 390,
      faceScale: 0.8,
      shoulderWidth: 690,
      armReach: 150,
      handRadiusX: 118,
      handRadiusY: 96,
      eyeSpread: 390,
      eyeTilt: 20,
      eyeRadius: 108,
      crownStyle: "round",
    },
  },
  "palari-v3-020": {
    seed: 20,
    name: "Mochi",
    family: "pebble-nest",
    face: facePalettes[1],
    motionIndex: 1,
    blueprint: {
      lean: 42,
      headY: 455,
      headRadiusX: 360,
      headRadiusY: 245,
      chestRadiusX: 450,
      chestRadiusY: 405,
      shoulderWidth: 650,
      armDrop: 115,
      shoulderRadius: 88,
      elbowRadius: 98,
      handRadiusX: 108,
      eyeSpread: 340,
      eyeTilt: -24,
      gazeX: 18,
      crownStyle: "bobble",
      crownScale: 0.92,
    },
  },
  "palari-v3-021": {
    seed: 21,
    name: "Biscuit",
    family: "pillow-bell",
    face: facePalettes[2],
    motionIndex: 2,
    blueprint: {
      headY: 452,
      headRadiusX: 330,
      headRadiusY: 270,
      chestRadiusX: 490,
      chestRadiusY: 405,
      faceScale: 0.84,
      shoulderWidth: 690,
      shoulderRadius: 102,
      elbowRadius: 94,
      handRadiusX: 120,
      eyeSpread: 410,
      eyeRadius: 110,
      crownStyle: "double",
      crownScale: 1.04,
    },
  },
  "palari-v3-022": {
    seed: 22,
    name: "Tavi",
    family: "pillow-bell",
    face: facePalettes[3],
    motionIndex: 3,
    blueprint: {
      lean: 34,
      headY: 440,
      headRadiusX: 320,
      headRadiusY: 235,
      chestRadiusX: 455,
      chestRadiusY: 415,
      shoulderWidth: 640,
      armReach: 135,
      handRadiusX: 104,
      handRadiusY: 88,
      eyeSpread: 330,
      eyeTilt: -36,
      eyeRadius: 100,
      crownStyle: "double",
      crownScale: 0.84,
    },
  },
  "palari-v3-023": {
    seed: 23,
    name: "Drift",
    family: "folded-hood",
    face: facePalettes[4],
    motionIndex: 4,
    blueprint: {
      lean: 18,
      headY: 468,
      headRadiusX: 340,
      headRadiusY: 245,
      chestRadiusX: 475,
      chestRadiusY: 400,
      foldDirection: -1,
      shoulderWidth: 670,
      armDrop: 120,
      shoulderRadius: 92,
      elbowRadius: 86,
      handRadiusX: 122,
      handRadiusY: 98,
      eyeSpread: 365,
      eyeTilt: 18,
      gazeX: 17,
      crownStyle: "side-cap",
      crownScale: 1.05,
    },
  },
  "palari-v3-024": {
    seed: 24,
    name: "Olive",
    family: "folded-hood",
    face: facePalettes[5],
    motionIndex: 5,
    blueprint: {
      lean: -28,
      headY: 460,
      headRadiusX: 350,
      headRadiusY: 250,
      chestRadiusX: 465,
      chestRadiusY: 405,
      foldDirection: 1,
      shoulderWidth: 665,
      armReach: 155,
      shoulderRadius: 98,
      elbowRadius: 90,
      handRadiusX: 116,
      handRadiusY: 100,
      eyeSpread: 370,
      eyeTilt: -28,
      gazeY: -9,
      crownStyle: "side-cap",
      crownScale: 0.96,
    },
  },
};

const presetRigs = Object.fromEntries(
  Object.entries(presetRecipes).map(([id, recipe]) => [id, makeRig(recipe)]),
) as Record<string, PalariRig>;

function mulberry32(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function between(random: () => number, minimum: number, maximum: number) {
  return Math.round(minimum + random() * (maximum - minimum));
}

export function normalizePalariSeed(seed: number) {
  const normalized = Math.abs(Math.trunc(seed)) >>> 0;
  return normalized || 1;
}

export function generatePalari(seed: number): PalariRig {
  const normalizedSeed = normalizePalariSeed(seed);
  const random = mulberry32(normalizedSeed);
  const families: ProceduralPalariFamily[] = ["pebble-nest", "pillow-bell", "folded-hood"];
  const family = families[Math.floor(random() * families.length)];
  const crownStyles: Record<ProceduralPalariFamily, readonly CrownStyle[]> = {
    "pebble-nest": ["round", "bobble"],
    "pillow-bell": ["double"],
    "folded-hood": ["side-cap"],
  };
  const crownStyle = crownStyles[family][Math.floor(random() * crownStyles[family].length)];
  const face = facePalettes[Math.floor(random() * facePalettes.length)];
  const name = `${nameStarts[normalizedSeed % nameStarts.length]}${nameEnds[Math.floor(random() * nameEnds.length)]}`;
  const blueprint: Partial<SkeletonBlueprint> = {
    lean: between(random, -42, 42),
    rootY: between(random, 1128, 1160),
    chestY: between(random, 780, 830),
    headY: between(random, 435, 500),
    headRadiusX: between(random, 315, 365),
    headRadiusY: between(random, 235, 275),
    chestRadiusX: between(random, 445, 500),
    chestRadiusY: between(random, 380, 425),
    clothPadding: between(random, 30, 48),
    shoulderWidth: between(random, 625, 700),
    shoulderDrop: between(random, 38, 64),
    elbowOut: between(random, 28, 58),
    armReach: between(random, 128, 165),
    armDrop: between(random, 108, 145),
    shoulderRadius: between(random, 84, 104),
    elbowRadius: between(random, 82, 102),
    handRadiusX: between(random, 102, 124),
    handRadiusY: between(random, 86, 104),
    armConnectorScale: between(random, 76, 90) / 100,
    faceScale: between(random, 78, 86) / 100,
    eyeSpread: between(random, 330, 410),
    eyeDrop: between(random, 185, 225),
    eyeTilt: between(random, -38, 38),
    eyeRadius: between(random, 96, 113),
    pupilRatio: between(random, 51, 58) / 100,
    gazeX: between(random, -12, 18),
    gazeY: between(random, -10, 12),
    crownStyle,
    crownScale: between(random, 84, 108) / 100,
    foldDirection: random() > 0.5 ? 1 : -1,
  };

  return makeRig({
    seed: normalizedSeed,
    name,
    family,
    face,
    blueprint,
    motionIndex: normalizedSeed % 6,
  });
}

export function palariRigForAvatar(id: string) {
  return presetRigs[id];
}

function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export function renderPalariSvg(rig: PalariRig) {
  const identifier = `palari-${rig.seed}`;
  const arms = rig.cover.arms
    .map((arm) => `<path d="${arm.path}" fill="url(#${identifier}-ivory)"/>`)
    .join("");
  const eyes = rig.cover.eyes.map((eye) => {
    const pupilX = eye.anchor.x + eye.pupilOffsetX;
    const pupilY = eye.anchor.y + eye.pupilOffsetY;
    const catchlightRadius = Math.max(18, Math.round(eye.pupilRadius * 0.35));
    return `<circle cx="${eye.anchor.x}" cy="${eye.anchor.y}" r="${eye.whiteRadius}" fill="${rig.eyeWhite}"/><circle cx="${pupilX}" cy="${pupilY}" r="${eye.pupilRadius}" fill="${rig.background}"/><circle cx="${pupilX + eye.catchlightOffsetX}" cy="${pupilY + eye.catchlightOffsetY}" r="${catchlightRadius}" fill="${rig.eyeWhite}"/>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PALARI_VIEWBOX}" height="${PALARI_VIEWBOX}" viewBox="0 0 ${PALARI_VIEWBOX} ${PALARI_VIEWBOX}"><title>${escapeXml(rig.name)}</title><desc>A mouthless Palari covered over head, chest, hat, and arm volume balls.</desc><defs><linearGradient id="${identifier}-ivory" gradientUnits="userSpaceOnUse" x1="100" y1="120" x2="1120" y2="1160"><stop offset="0" stop-color="${rig.ivory[0]}"/><stop offset="1" stop-color="${rig.ivory[1]}"/></linearGradient><linearGradient id="${identifier}-face" gradientUnits="userSpaceOnUse" x1="190" y1="420" x2="1060" y2="1110"><stop offset="0" stop-color="${rig.face[0]}"/><stop offset="1" stop-color="${rig.face[1]}"/></linearGradient></defs><rect width="${PALARI_VIEWBOX}" height="${PALARI_VIEWBOX}" fill="${rig.background}"/><path d="${rig.cover.shellPath}" fill="url(#${identifier}-ivory)"/><path d="${rig.cover.facePath}" fill="url(#${identifier}-face)"/>${arms}${eyes}</svg>`;
}
