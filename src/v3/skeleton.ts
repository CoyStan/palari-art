export type Point = {
  x: number;
  y: number;
};

export type PalariJointName =
  | "root"
  | "chest"
  | "head"
  | "leftShoulder"
  | "leftElbow"
  | "leftHand"
  | "rightShoulder"
  | "rightElbow"
  | "rightHand"
  | "leftEye"
  | "rightEye";

export type PalariBone = {
  from: PalariJointName;
  to: PalariJointName;
};

export type CrownStyle = "round" | "double" | "side-cap" | "bobble";

export type PalariVolumeGroup = "shell" | "leftArm" | "rightArm";

export type PalariVolume = {
  id: string;
  center: Point;
  radiusX: number;
  radiusY: number;
  group: PalariVolumeGroup;
  role: "head" | "chest" | "hat" | "arm";
};

export type SkeletonBlueprint = {
  centerX: number;
  rootY: number;
  chestY: number;
  headY: number;
  lean: number;
  headRadiusX: number;
  headRadiusY: number;
  chestRadiusX: number;
  chestRadiusY: number;
  clothPadding: number;
  shoulderWidth: number;
  shoulderDrop: number;
  elbowOut: number;
  armReach: number;
  armDrop: number;
  shoulderRadius: number;
  elbowRadius: number;
  handRadiusX: number;
  handRadiusY: number;
  armConnectorScale: number;
  faceScale: number;
  eyeSpread: number;
  eyeDrop: number;
  eyeTilt: number;
  eyeRadius: number;
  pupilRatio: number;
  gazeX: number;
  gazeY: number;
  crownStyle: CrownStyle;
  crownScale: number;
  foldDirection: -1 | 1;
};

export type PalariSkeleton = {
  seed: number;
  joints: Record<PalariJointName, Point>;
  bones: readonly PalariBone[];
  volumes: {
    shell: readonly PalariVolume[];
    leftArm: readonly [PalariVolume, PalariVolume, PalariVolume];
    rightArm: readonly [PalariVolume, PalariVolume, PalariVolume];
  };
  proportions: SkeletonBlueprint;
};

export const PALARI_BONES: readonly PalariBone[] = [
  { from: "root", to: "chest" },
  { from: "chest", to: "head" },
  { from: "chest", to: "leftShoulder" },
  { from: "leftShoulder", to: "leftElbow" },
  { from: "leftElbow", to: "leftHand" },
  { from: "chest", to: "rightShoulder" },
  { from: "rightShoulder", to: "rightElbow" },
  { from: "rightElbow", to: "rightHand" },
  { from: "head", to: "leftEye" },
  { from: "head", to: "rightEye" },
];

export const defaultSkeletonBlueprint: SkeletonBlueprint = {
  centerX: 627,
  rootY: 1160,
  chestY: 820,
  headY: 470,
  lean: 0,
  headRadiusX: 320,
  headRadiusY: 245,
  chestRadiusX: 470,
  chestRadiusY: 395,
  clothPadding: 38,
  shoulderWidth: 660,
  shoulderDrop: 44,
  elbowOut: 38,
  armReach: 150,
  armDrop: 125,
  shoulderRadius: 94,
  elbowRadius: 92,
  handRadiusX: 112,
  handRadiusY: 94,
  armConnectorScale: 0.84,
  faceScale: 0.82,
  eyeSpread: 360,
  eyeDrop: 205,
  eyeTilt: 0,
  eyeRadius: 106,
  pupilRatio: 0.55,
  gazeX: 12,
  gazeY: 8,
  crownStyle: "round",
  crownScale: 1,
  foldDirection: 1,
};

function point(x: number, y: number): Point {
  return { x: Math.round(x), y: Math.round(y) };
}

function volume(
  id: string,
  center: Point,
  radiusX: number,
  radiusY: number,
  group: PalariVolumeGroup,
  role: PalariVolume["role"],
): PalariVolume {
  return {
    id,
    center,
    radiusX: Math.round(radiusX),
    radiusY: Math.round(radiusY),
    group,
    role,
  };
}

function crownVolumes(head: Point, proportions: SkeletonBlueprint): PalariVolume[] {
  const { crownScale, crownStyle, foldDirection, headRadiusX, headRadiusY } = proportions;
  if (crownStyle === "double") {
    const radiusX = headRadiusX * 0.42 * crownScale;
    const radiusY = headRadiusY * 0.45 * crownScale;
    return [
      volume("hat-left", point(head.x - headRadiusX * 0.42, head.y - headRadiusY * 0.72), radiusX, radiusY, "shell", "hat"),
      volume("hat-right", point(head.x + headRadiusX * 0.42, head.y - headRadiusY * 0.72), radiusX, radiusY, "shell", "hat"),
    ];
  }

  if (crownStyle === "side-cap") {
    return [
      volume(
        foldDirection < 0 ? "hat-left" : "hat-right",
        point(head.x + foldDirection * headRadiusX * 0.55, head.y - headRadiusY * 0.72),
        headRadiusX * 0.56 * crownScale,
        headRadiusY * 0.38 * crownScale,
        "shell",
        "hat",
      ),
    ];
  }

  if (crownStyle === "bobble") {
    const base = volume(
      "hat-base",
      point(head.x, head.y - headRadiusY * 0.78),
      headRadiusX * 0.5 * crownScale,
      headRadiusY * 0.32 * crownScale,
      "shell",
      "hat",
    );
    const bobbleRadius = headRadiusY * 0.22 * crownScale;
    const bobble = volume(
      "hat-bobble",
      point(head.x + foldDirection * headRadiusX * 0.18, head.y - headRadiusY * 1.05),
      bobbleRadius,
      bobbleRadius,
      "shell",
      "hat",
    );
    return [base, bobble];
  }

  return [];
}

export function buildSkeleton(seed: number, overrides: Partial<SkeletonBlueprint> = {}): PalariSkeleton {
  const proportions = { ...defaultSkeletonBlueprint, ...overrides };
  const chest = point(proportions.centerX + proportions.lean, proportions.chestY);
  const head = point(proportions.centerX + proportions.lean * 0.45, proportions.headY);
  const root = point(proportions.centerX - proportions.lean * 0.18, proportions.rootY);
  const leftShoulder = point(chest.x - proportions.shoulderWidth / 2, chest.y + proportions.shoulderDrop);
  const rightShoulder = point(chest.x + proportions.shoulderWidth / 2, chest.y + proportions.shoulderDrop);
  const leftElbow = point(leftShoulder.x - proportions.elbowOut, leftShoulder.y + proportions.armDrop * 0.48);
  const rightElbow = point(rightShoulder.x + proportions.elbowOut, rightShoulder.y + proportions.armDrop * 0.48);
  const leftHand = point(leftShoulder.x + proportions.armReach, leftShoulder.y + proportions.armDrop);
  const rightHand = point(rightShoulder.x - proportions.armReach, rightShoulder.y + proportions.armDrop);
  const leftEye = point(head.x - proportions.eyeSpread / 2, head.y + proportions.eyeDrop - proportions.eyeTilt / 2);
  const rightEye = point(head.x + proportions.eyeSpread / 2, head.y + proportions.eyeDrop + proportions.eyeTilt / 2);
  const shellVolumes = [
    volume("chest", chest, proportions.chestRadiusX, proportions.chestRadiusY, "shell", "chest"),
    volume("head", head, proportions.headRadiusX, proportions.headRadiusY, "shell", "head"),
    ...crownVolumes(head, proportions),
  ];

  return {
    seed,
    proportions,
    bones: PALARI_BONES,
    volumes: {
      shell: shellVolumes,
      leftArm: [
        volume("left-shoulder", leftShoulder, proportions.shoulderRadius, proportions.shoulderRadius, "leftArm", "arm"),
        volume("left-elbow", leftElbow, proportions.elbowRadius, proportions.elbowRadius, "leftArm", "arm"),
        volume("left-hand", leftHand, proportions.handRadiusX, proportions.handRadiusY, "leftArm", "arm"),
      ],
      rightArm: [
        volume("right-shoulder", rightShoulder, proportions.shoulderRadius, proportions.shoulderRadius, "rightArm", "arm"),
        volume("right-elbow", rightElbow, proportions.elbowRadius, proportions.elbowRadius, "rightArm", "arm"),
        volume("right-hand", rightHand, proportions.handRadiusX, proportions.handRadiusY, "rightArm", "arm"),
      ],
    },
    joints: {
      root,
      chest,
      head,
      leftShoulder,
      leftElbow,
      leftHand,
      rightShoulder,
      rightElbow,
      rightHand,
      leftEye,
      rightEye,
    },
  };
}
