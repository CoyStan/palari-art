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

export type SkeletonBlueprint = {
  centerX: number;
  rootY: number;
  chestY: number;
  headY: number;
  lean: number;
  bodyWidth: number;
  headRadiusX: number;
  headRadiusY: number;
  shoulderWidth: number;
  shoulderDrop: number;
  elbowOut: number;
  armReach: number;
  armDrop: number;
  armThickness: number;
  faceWidth: number;
  faceTopOffset: number;
  faceBottomLift: number;
  eyeSpread: number;
  eyeDrop: number;
  eyeTilt: number;
  eyeRadius: number;
  pupilRatio: number;
  gazeX: number;
  gazeY: number;
  crownSplit: number;
  foldDirection: -1 | 1;
};

export type PalariSkeleton = {
  seed: number;
  joints: Record<PalariJointName, Point>;
  bones: readonly PalariBone[];
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
  rootY: 1145,
  chestY: 805,
  headY: 470,
  lean: 0,
  bodyWidth: 990,
  headRadiusX: 335,
  headRadiusY: 255,
  shoulderWidth: 680,
  shoulderDrop: 50,
  elbowOut: 42,
  armReach: 145,
  armDrop: 130,
  armThickness: 190,
  faceWidth: 850,
  faceTopOffset: 65,
  faceBottomLift: 24,
  eyeSpread: 360,
  eyeDrop: 205,
  eyeTilt: 0,
  eyeRadius: 106,
  pupilRatio: 0.55,
  gazeX: 12,
  gazeY: 8,
  crownSplit: 72,
  foldDirection: 1,
};

function point(x: number, y: number): Point {
  return { x: Math.round(x), y: Math.round(y) };
}

export function buildSkeleton(seed: number, overrides: Partial<SkeletonBlueprint> = {}): PalariSkeleton {
  const proportions = { ...defaultSkeletonBlueprint, ...overrides };
  const chest = point(proportions.centerX + proportions.lean, proportions.chestY);
  const head = point(proportions.centerX + proportions.lean * 0.45, proportions.headY);
  const root = point(proportions.centerX - proportions.lean * 0.18, proportions.rootY);
  const leftShoulder = point(
    chest.x - proportions.shoulderWidth / 2,
    chest.y + proportions.shoulderDrop,
  );
  const rightShoulder = point(
    chest.x + proportions.shoulderWidth / 2,
    chest.y + proportions.shoulderDrop,
  );
  const leftElbow = point(
    leftShoulder.x - proportions.elbowOut,
    leftShoulder.y + proportions.armDrop * 0.48,
  );
  const rightElbow = point(
    rightShoulder.x + proportions.elbowOut,
    rightShoulder.y + proportions.armDrop * 0.48,
  );

  return {
    seed,
    proportions,
    bones: PALARI_BONES,
    joints: {
      root,
      chest,
      head,
      leftShoulder,
      leftElbow,
      leftHand: point(leftShoulder.x + proportions.armReach, leftShoulder.y + proportions.armDrop),
      rightShoulder,
      rightElbow,
      rightHand: point(rightShoulder.x - proportions.armReach, rightShoulder.y + proportions.armDrop),
      leftEye: point(head.x - proportions.eyeSpread / 2, head.y + proportions.eyeDrop - proportions.eyeTilt / 2),
      rightEye: point(head.x + proportions.eyeSpread / 2, head.y + proportions.eyeDrop + proportions.eyeTilt / 2),
    },
  };
}
