export const PALARI_VIEWBOX = 1254;

export type ProceduralPalariFamily = "pebble-nest" | "pillow-bell" | "folded-hood";

export type RigEye = {
  x: number;
  y: number;
  whiteRadius: number;
  pupilRadius: number;
  pupilOffsetX: number;
  pupilOffsetY: number;
  catchlightOffsetX: number;
  catchlightOffsetY: number;
};

export type RigArm = {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  rotation: number;
  pivotX: number;
  pivotY: number;
};

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
  shellPath: string;
  facePath: string;
  facePivot: readonly [number, number];
  arms: readonly [RigArm, RigArm];
  eyes: readonly [RigEye, RigEye];
  motion: PalariMotion;
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

const presetRigs: Record<string, PalariRig> = {
  "palari-v3-019": {
    seed: 19,
    name: "Tuck",
    family: "pebble-nest",
    background,
    ivory,
    face: facePalettes[0],
    eyeWhite,
    shellPath: "M0 1254V1055C26 790 119 530 305 382C473 249 779 230 972 367C1155 496 1227 759 1254 1027V1254Z",
    facePath: "M150 838C177 617 340 494 600 492C867 490 1052 630 1102 862C1001 835 901 903 868 1015C816 1078 728 1111 623 1111C509 1111 418 1074 370 1007C338 904 249 839 150 838Z",
    facePivot: [627, 850],
    arms: [
      { x: 318, y: 914, radiusX: 152, radiusY: 103, rotation: 22, pivotX: 221, pivotY: 825 },
      { x: 937, y: 934, radiusX: 148, radiusY: 101, rotation: -22, pivotX: 1032, pivotY: 842 },
    ],
    eyes: [
      { x: 405, y: 744, whiteRadius: 112, pupilRadius: 61, pupilOffsetX: 16, pupilOffsetY: 11, catchlightOffsetX: -22, catchlightOffsetY: -22 },
      { x: 808, y: 781, whiteRadius: 105, pupilRadius: 58, pupilOffsetX: 17, pupilOffsetY: 9, catchlightOffsetX: -21, catchlightOffsetY: -21 },
    ],
    motion: makeMotion(19, 0),
  },
  "palari-v3-020": {
    seed: 20,
    name: "Mochi",
    family: "pebble-nest",
    background,
    ivory,
    face: facePalettes[1],
    eyeWhite,
    shellPath: "M126 1254C92 1078 106 824 181 606C254 392 398 257 562 244C635 238 675 279 730 279C789 279 832 235 908 238C1080 245 1200 388 1254 586V1254Z",
    facePath: "M275 781C306 556 482 430 719 414C956 398 1115 503 1160 690C1176 756 1154 814 1090 852C991 911 901 981 865 1080C815 1118 748 1138 665 1134C544 1128 449 1084 399 1008C375 905 333 831 275 781Z",
    facePivot: [720, 800],
    arms: [
      { x: 424, y: 909, radiusX: 147, radiusY: 98, rotation: 29, pivotX: 328, pivotY: 813 },
      { x: 1021, y: 889, radiusX: 144, radiusY: 96, rotation: -31, pivotX: 1110, pivotY: 788 },
    ],
    eyes: [
      { x: 578, y: 721, whiteRadius: 109, pupilRadius: 60, pupilOffsetX: 22, pupilOffsetY: 10, catchlightOffsetX: -21, catchlightOffsetY: -23 },
      { x: 900, y: 668, whiteRadius: 101, pupilRadius: 56, pupilOffsetX: 23, pupilOffsetY: 8, catchlightOffsetX: -21, catchlightOffsetY: -21 },
    ],
    motion: makeMotion(20, 1),
  },
  "palari-v3-021": {
    seed: 21,
    name: "Biscuit",
    family: "pillow-bell",
    background,
    ivory,
    face: facePalettes[2],
    eyeWhite,
    shellPath: "M0 1254V913C42 731 105 518 216 340C304 199 432 185 535 292C582 341 600 365 627 365C655 365 673 341 720 292C824 184 951 199 1039 340C1150 518 1213 731 1254 913V1254Z",
    facePath: "M134 783C174 564 357 468 518 493C578 503 596 529 627 529C659 529 678 503 738 493C901 467 1080 566 1120 785C1146 930 1080 1036 964 1097C865 1149 741 1168 627 1168C510 1168 388 1149 291 1097C176 1036 108 931 134 783Z",
    facePivot: [627, 825],
    arms: [
      { x: 330, y: 958, radiusX: 156, radiusY: 102, rotation: 26, pivotX: 235, pivotY: 858 },
      { x: 924, y: 958, radiusX: 156, radiusY: 102, rotation: -26, pivotX: 1019, pivotY: 858 },
    ],
    eyes: [
      { x: 401, y: 765, whiteRadius: 112, pupilRadius: 61, pupilOffsetX: 0, pupilOffsetY: 11, catchlightOffsetX: -23, catchlightOffsetY: -23 },
      { x: 853, y: 765, whiteRadius: 112, pupilRadius: 61, pupilOffsetX: 0, pupilOffsetY: 11, catchlightOffsetX: -23, catchlightOffsetY: -23 },
    ],
    motion: makeMotion(21, 2),
  },
  "palari-v3-022": {
    seed: 22,
    name: "Tavi",
    family: "pillow-bell",
    background,
    ivory,
    face: facePalettes[3],
    eyeWhite,
    shellPath: "M131 1254C88 1075 95 806 180 583C240 426 333 336 427 324C476 317 506 336 534 310C564 281 561 240 588 200C631 137 710 137 755 190C786 227 786 272 812 299C839 327 877 304 926 309C1057 323 1181 459 1254 661V1254Z",
    facePath: "M267 765C299 548 471 437 699 428C929 420 1101 526 1142 723C1166 839 1115 928 1034 982C968 1027 921 1081 899 1140C836 1170 755 1185 662 1181C547 1176 455 1147 396 1092C371 1003 333 902 267 765Z",
    facePivot: [700, 805],
    arms: [
      { x: 424, y: 944, radiusX: 147, radiusY: 98, rotation: 28, pivotX: 330, pivotY: 844 },
      { x: 1010, y: 879, radiusX: 142, radiusY: 95, rotation: -32, pivotX: 1101, pivotY: 781 },
    ],
    eyes: [
      { x: 563, y: 746, whiteRadius: 108, pupilRadius: 60, pupilOffsetX: 16, pupilOffsetY: 12, catchlightOffsetX: -22, catchlightOffsetY: -23 },
      { x: 875, y: 665, whiteRadius: 101, pupilRadius: 56, pupilOffsetX: 16, pupilOffsetY: 11, catchlightOffsetX: -21, catchlightOffsetY: -22 },
    ],
    motion: makeMotion(22, 3),
  },
  "palari-v3-023": {
    seed: 23,
    name: "Drift",
    family: "folded-hood",
    background,
    ivory,
    face: facePalettes[4],
    eyeWhite,
    shellPath: "M0 1254V930C59 766 157 621 310 501C265 463 247 410 266 354C291 278 371 234 451 253C517 269 562 322 625 337C701 356 764 312 846 323C1005 345 1142 492 1207 674C1238 762 1254 861 1254 961V1254Z",
    facePath: "M198 789C240 594 412 477 652 457C880 438 1056 528 1105 705C1141 834 1089 939 995 1008C922 1062 829 1092 720 1098C598 1105 494 1075 414 1015C352 969 304 902 198 789Z",
    facePivot: [672, 780],
    arms: [
      { x: 366, y: 907, radiusX: 150, radiusY: 100, rotation: 29, pivotX: 272, pivotY: 811 },
      { x: 976, y: 891, radiusX: 146, radiusY: 98, rotation: -29, pivotX: 1067, pivotY: 794 },
    ],
    eyes: [
      { x: 499, y: 711, whiteRadius: 111, pupilRadius: 61, pupilOffsetX: 21, pupilOffsetY: 9, catchlightOffsetX: -22, catchlightOffsetY: -23 },
      { x: 852, y: 741, whiteRadius: 101, pupilRadius: 56, pupilOffsetX: 22, pupilOffsetY: 9, catchlightOffsetX: -21, catchlightOffsetY: -22 },
    ],
    motion: makeMotion(23, 4),
  },
  "palari-v3-024": {
    seed: 24,
    name: "Olive",
    family: "folded-hood",
    background,
    ivory,
    face: facePalettes[5],
    eyeWhite,
    shellPath: "M0 1254V1000C44 760 185 549 402 410C559 309 746 307 886 386C945 420 985 398 1001 335C1019 267 1085 226 1152 247C1226 270 1260 354 1229 427C1214 464 1223 500 1254 534V1254Z",
    facePath: "M177 824C206 609 378 478 616 455C854 431 1044 525 1103 710C1144 837 1095 944 1001 1016C916 1082 805 1112 681 1112C552 1112 443 1080 364 1015C306 967 271 884 177 824Z",
    facePivot: [656, 795],
    arms: [
      { x: 354, y: 941, radiusX: 151, radiusY: 101, rotation: 27, pivotX: 260, pivotY: 843 },
      { x: 971, y: 915, radiusX: 148, radiusY: 99, rotation: -30, pivotX: 1063, pivotY: 815 },
    ],
    eyes: [
      { x: 476, y: 722, whiteRadius: 111, pupilRadius: 61, pupilOffsetX: 16, pupilOffsetY: -12, catchlightOffsetX: -22, catchlightOffsetY: -23 },
      { x: 839, y: 670, whiteRadius: 105, pupilRadius: 58, pupilOffsetX: 16, pupilOffsetY: -12, catchlightOffsetX: -21, catchlightOffsetY: -22 },
    ],
    motion: makeMotion(24, 5),
  },
};

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

function generatedShell(family: ProceduralPalariFamily, random: () => number) {
  const left = between(random, 90, 170);
  const right = between(random, 1080, 1190);
  const top = between(random, 205, 330);

  if (family === "pillow-bell") {
    const cleft = between(random, 34, 68);
    return `M${left} 1254C${left - 45} 1030 ${left - 25} 725 ${left + 70} 500C${left + 132} 352 315 ${top} 432 ${top + 36}C535 ${top + 67} 560 ${top + 155} 627 ${top + 155}C695 ${top + 155} 724 ${top + 65} ${830 + cleft} ${top + 32}C${right - 82} ${top - 5} ${right + 22} 408 ${right} 590V1254Z`;
  }

  if (family === "folded-hood") {
    const foldSide = random() > 0.5 ? 1 : -1;
    if (foldSide > 0) {
      return `M${left} 1254C${left - 40} 1038 ${left + 4} 730 ${left + 130} 526C${left + 218} 384 450 ${top} 618 ${top + 52}C738 ${top + 89} 821 ${top + 126} 906 ${top + 78}C976 ${top + 38} 1013 ${top - 24} 1084 ${top - 8}C1162 ${top + 9} 1193 ${top + 103} 1153 ${top + 166}C1134 ${top + 197} 1150 ${top + 241} ${right} ${top + 290}V1254Z`;
    }
    return `M${left} 1254V${top + 292}C${left + 36} ${top + 237} ${left + 51} ${top + 198} ${left + 31} ${top + 163}C${left - 5} ${top + 98} ${left + 27} ${top + 10} ${left + 105} ${top - 7}C${left + 177} ${top - 23} ${left + 217} ${top + 38} ${left + 287} ${top + 77}C${left + 373} ${top + 125} 514 ${top + 88} 635 ${top + 51}C809 ${top - 2} ${right - 93} ${top + 83} ${right} ${top + 226}C${right + 75} ${top + 341} ${right + 91} 837 ${right + 48} 1032L${right + 34} 1254Z`;
  }

  return `M${left} 1254C${left - 42} 1040 ${left - 12} 743 ${left + 92} 512C${left + 185} 306 405 ${top} 576 ${top + 21}C650 ${top + 31} 689 ${top + 64} 746 ${top + 48}C922 ${top - 1} ${right - 10} 406 ${right + 35} 650C${right + 71} 848 ${right + 58} 1066 ${right + 30} 1254Z`;
}

function generatedFace(family: ProceduralPalariFamily, random: () => number) {
  const left = between(random, 190, 285);
  const right = between(random, 1030, 1135);
  const top = between(random, 430, 535);
  const lower = between(random, 1090, 1170);
  const cleft = family === "pillow-bell" ? between(random, 32, 62) : 0;
  return `M${left} 790C${left + 38} ${top + 60} ${left + 183} ${top} 522 ${top + cleft}C582 ${top + cleft + 8} 601 ${top + cleft + 31} 627 ${top + cleft + 31}C655 ${top + cleft + 31} 676 ${top + cleft + 7} 738 ${top + cleft}C923 ${top - 13} ${right - 36} ${top + 73} ${right} 770C${right + 23} 925 ${right - 47} 1035 ${right - 164} ${lower - 20}C${right - 267} ${lower + 23} 742 ${lower + 30} 627 ${lower + 30}C497 ${lower + 30} 388 ${lower + 1} 306 ${lower - 56}C229 ${lower - 109} ${left - 22} 917 ${left} 790Z`;
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
  const face = facePalettes[Math.floor(random() * facePalettes.length)];
  const eyeY = between(random, 675, 785);
  const eyeSpread = between(random, 168, 220);
  const eyeSizeLeft = between(random, 94, 116);
  const eyeSizeRight = between(random, 92, 114);
  const gazeX = between(random, -14, 17);
  const gazeY = between(random, -12, 14);
  const name = `${nameStarts[normalizedSeed % nameStarts.length]}${nameEnds[Math.floor(random() * nameEnds.length)]}`;

  return {
    seed: normalizedSeed,
    name,
    family,
    background,
    ivory,
    face,
    eyeWhite,
    shellPath: generatedShell(family, random),
    facePath: generatedFace(family, random),
    facePivot: [627, 810],
    arms: [
      { x: between(random, 328, 410), y: between(random, 900, 984), radiusX: between(random, 138, 158), radiusY: between(random, 92, 106), rotation: between(random, 20, 31), pivotX: 270, pivotY: 824 },
      { x: between(random, 848, 932), y: between(random, 900, 984), radiusX: between(random, 138, 158), radiusY: between(random, 92, 106), rotation: between(random, -31, -20), pivotX: 984, pivotY: 824 },
    ],
    eyes: [
      { x: 627 - eyeSpread, y: eyeY + between(random, -30, 30), whiteRadius: eyeSizeLeft, pupilRadius: Math.round(eyeSizeLeft * 0.55), pupilOffsetX: gazeX, pupilOffsetY: gazeY, catchlightOffsetX: -22, catchlightOffsetY: -22 },
      { x: 627 + eyeSpread, y: eyeY + between(random, -30, 30), whiteRadius: eyeSizeRight, pupilRadius: Math.round(eyeSizeRight * 0.55), pupilOffsetX: gazeX, pupilOffsetY: gazeY, catchlightOffsetX: -21, catchlightOffsetY: -21 },
    ],
    motion: makeMotion(normalizedSeed, normalizedSeed % 6),
  };
}

export function palariRigForAvatar(id: string) {
  return presetRigs[id];
}

function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export function renderPalariSvg(rig: PalariRig) {
  const identifier = `palari-${rig.seed}`;
  const arms = rig.arms.map((arm) => `<ellipse cx="${arm.x}" cy="${arm.y}" rx="${arm.radiusX}" ry="${arm.radiusY}" transform="rotate(${arm.rotation} ${arm.x} ${arm.y})" fill="url(#${identifier}-ivory)"/>`).join("");
  const eyes = rig.eyes.map((eye) => {
    const pupilX = eye.x + eye.pupilOffsetX;
    const pupilY = eye.y + eye.pupilOffsetY;
    return `<circle cx="${eye.x}" cy="${eye.y}" r="${eye.whiteRadius}" fill="${rig.eyeWhite}"/><circle cx="${pupilX}" cy="${pupilY}" r="${eye.pupilRadius}" fill="${rig.background}"/><circle cx="${pupilX + eye.catchlightOffsetX}" cy="${pupilY + eye.catchlightOffsetY}" r="${Math.max(18, Math.round(eye.pupilRadius * 0.35))}" fill="${rig.eyeWhite}"/>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PALARI_VIEWBOX}" height="${PALARI_VIEWBOX}" viewBox="0 0 ${PALARI_VIEWBOX} ${PALARI_VIEWBOX}"><title>${escapeXml(rig.name)}</title><desc>A mouthless programmatic Palari with two arms and two catchlit eyes.</desc><defs><linearGradient id="${identifier}-ivory" gradientUnits="userSpaceOnUse" x1="100" y1="120" x2="1120" y2="1160"><stop offset="0" stop-color="${rig.ivory[0]}"/><stop offset="1" stop-color="${rig.ivory[1]}"/></linearGradient><linearGradient id="${identifier}-face" gradientUnits="userSpaceOnUse" x1="190" y1="420" x2="1060" y2="1110"><stop offset="0" stop-color="${rig.face[0]}"/><stop offset="1" stop-color="${rig.face[1]}"/></linearGradient></defs><rect width="${PALARI_VIEWBOX}" height="${PALARI_VIEWBOX}" fill="${rig.background}"/><path d="${rig.shellPath}" fill="url(#${identifier}-ivory)"/><path d="${rig.facePath}" fill="url(#${identifier}-face)"/>${arms}${eyes}</svg>`;
}
