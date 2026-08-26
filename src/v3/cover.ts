import type { PalariSkeleton, Point } from "./skeleton";

export type ProceduralPalariFamily = "pebble-nest" | "pillow-bell" | "folded-hood";

export type CoverEye = {
  anchor: Point;
  whiteRadius: number;
  pupilRadius: number;
  pupilOffsetX: number;
  pupilOffsetY: number;
  catchlightOffsetX: number;
  catchlightOffsetY: number;
};

export type CoverArm = {
  path: string;
  width: number;
  pivot: Point;
};

export type PalariCover = {
  shellPath: string;
  facePath: string;
  arms: readonly [CoverArm, CoverArm];
  eyes: readonly [CoverEye, CoverEye];
};

function n(value: number) {
  return Math.round(value);
}

function shellFromSkeleton(skeleton: PalariSkeleton, family: ProceduralPalariFamily) {
  const { joints, proportions: p } = skeleton;
  const center = joints.head.x;
  const left = joints.chest.x - p.bodyWidth / 2;
  const right = joints.chest.x + p.bodyWidth / 2;
  const top = joints.head.y - p.headRadiusY;
  const lowerShoulder = joints.chest.y - p.headRadiusY * 0.45;

  if (family === "pillow-bell") {
    const crown = p.headRadiusX * 0.56;
    return [
      `M${n(left)} 1254`,
      `C${n(left - 38)} ${n(joints.root.y - 70)} ${n(left - 16)} ${n(lowerShoulder)} ${n(left + 82)} ${n(joints.head.y + 54)}`,
      `C${n(left + 145)} ${n(joints.head.y - 75)} ${n(center - crown - 70)} ${n(top + 20)} ${n(center - crown)} ${n(top)}`,
      `C${n(center - crown * 0.52)} ${n(top - 24)} ${n(center - crown * 0.28)} ${n(top + p.crownSplit)} ${n(center)} ${n(top + p.crownSplit)}`,
      `C${n(center + crown * 0.28)} ${n(top + p.crownSplit)} ${n(center + crown * 0.52)} ${n(top - 24)} ${n(center + crown)} ${n(top)}`,
      `C${n(center + crown + 70)} ${n(top + 20)} ${n(right - 145)} ${n(joints.head.y - 75)} ${n(right - 82)} ${n(joints.head.y + 54)}`,
      `C${n(right + 16)} ${n(lowerShoulder)} ${n(right + 38)} ${n(joints.root.y - 70)} ${n(right)} 1254Z`,
    ].join("");
  }

  if (family === "folded-hood") {
    const fold = p.foldDirection;
    const plainX = center - fold * p.headRadiusX * 0.72;
    const foldX = center + fold * p.headRadiusX * 0.72;
    if (fold > 0) {
      return [
        `M${n(left)} 1254`,
        `C${n(left - 38)} ${n(joints.root.y - 70)} ${n(left - 8)} ${n(lowerShoulder)} ${n(left + 94)} ${n(joints.head.y + 58)}`,
        `C${n(left + 170)} ${n(joints.head.y - 86)} ${n(plainX - 70)} ${n(top + 8)} ${n(center)} ${n(top + 54)}`,
        `C${n(center + 115)} ${n(top + 98)} ${n(foldX - 8)} ${n(top + 76)} ${n(foldX + 54)} ${n(top + 12)}`,
        `C${n(foldX + 104)} ${n(top - 40)} ${n(right + 8)} ${n(top - 5)} ${n(right - 4)} ${n(top + 84)}`,
        `C${n(right - 10)} ${n(top + 134)} ${n(right + 18)} ${n(top + 185)} ${n(right + 52)} ${n(top + 226)}`,
        `C${n(right + 76)} ${n(lowerShoulder)} ${n(right + 40)} ${n(joints.root.y - 70)} ${n(right)} 1254Z`,
      ].join("");
    }
    return [
      `M${n(left)} 1254`,
      `C${n(left - 40)} ${n(joints.root.y - 70)} ${n(left - 76)} ${n(lowerShoulder)} ${n(left - 52)} ${n(top + 226)}`,
      `C${n(left - 18)} ${n(top + 185)} ${n(left + 10)} ${n(top + 134)} ${n(left + 4)} ${n(top + 84)}`,
      `C${n(left - 8)} ${n(top - 5)} ${n(foldX - 104)} ${n(top - 40)} ${n(foldX - 54)} ${n(top + 12)}`,
      `C${n(foldX + 8)} ${n(top + 76)} ${n(center - 115)} ${n(top + 98)} ${n(center)} ${n(top + 54)}`,
      `C${n(plainX + 70)} ${n(top + 8)} ${n(right - 170)} ${n(joints.head.y - 86)} ${n(right - 94)} ${n(joints.head.y + 58)}`,
      `C${n(right + 8)} ${n(lowerShoulder)} ${n(right + 38)} ${n(joints.root.y - 70)} ${n(right)} 1254Z`,
    ].join("");
  }

  return [
    `M${n(left)} 1254`,
    `C${n(left - 42)} ${n(joints.root.y - 72)} ${n(left - 18)} ${n(lowerShoulder)} ${n(left + 78)} ${n(joints.head.y + 66)}`,
    `C${n(left + 150)} ${n(joints.head.y - 92)} ${n(center - p.headRadiusX * 0.58)} ${n(top)} ${n(center)} ${n(top)}`,
    `C${n(center + p.headRadiusX * 0.58)} ${n(top)} ${n(right - 150)} ${n(joints.head.y - 92)} ${n(right - 78)} ${n(joints.head.y + 66)}`,
    `C${n(right + 18)} ${n(lowerShoulder)} ${n(right + 42)} ${n(joints.root.y - 72)} ${n(right)} 1254Z`,
  ].join("");
}

function faceFromSkeleton(skeleton: PalariSkeleton) {
  const { joints, proportions: p } = skeleton;
  const center = joints.head.x;
  const left = center - p.faceWidth / 2;
  const right = center + p.faceWidth / 2;
  const top = joints.head.y + p.faceTopOffset;
  const middle = joints.chest.y - 5;
  const bottom = joints.root.y - p.faceBottomLift;

  return [
    `M${n(left)} ${n(middle)}`,
    `C${n(left + 22)} ${n(top + 105)} ${n(left + p.faceWidth * 0.2)} ${n(top)} ${n(center)} ${n(top)}`,
    `C${n(right - p.faceWidth * 0.2)} ${n(top)} ${n(right - 22)} ${n(top + 105)} ${n(right)} ${n(middle)}`,
    `C${n(right + 20)} ${n(bottom - 96)} ${n(right - p.faceWidth * 0.18)} ${n(bottom)} ${n(center)} ${n(bottom)}`,
    `C${n(left + p.faceWidth * 0.18)} ${n(bottom)} ${n(left - 20)} ${n(bottom - 96)} ${n(left)} ${n(middle)}Z`,
  ].join("");
}

function armFromSkeleton(shoulder: Point, elbow: Point, hand: Point, width: number): CoverArm {
  return {
    path: `M${shoulder.x} ${shoulder.y}Q${elbow.x} ${elbow.y} ${hand.x} ${hand.y}`,
    width,
    pivot: shoulder,
  };
}

function eyeFromSkeleton(anchor: Point, skeleton: PalariSkeleton): CoverEye {
  const { proportions: p } = skeleton;
  return {
    anchor,
    whiteRadius: p.eyeRadius,
    pupilRadius: Math.round(p.eyeRadius * p.pupilRatio),
    pupilOffsetX: p.gazeX,
    pupilOffsetY: p.gazeY,
    catchlightOffsetX: Math.round(-p.eyeRadius * 0.2),
    catchlightOffsetY: Math.round(-p.eyeRadius * 0.2),
  };
}

export function coverSkeleton(skeleton: PalariSkeleton, family: ProceduralPalariFamily): PalariCover {
  const { joints, proportions } = skeleton;
  return {
    shellPath: shellFromSkeleton(skeleton, family),
    facePath: faceFromSkeleton(skeleton),
    arms: [
      armFromSkeleton(joints.leftShoulder, joints.leftElbow, joints.leftHand, proportions.armThickness),
      armFromSkeleton(joints.rightShoulder, joints.rightElbow, joints.rightHand, proportions.armThickness),
    ],
    eyes: [
      eyeFromSkeleton(joints.leftEye, skeleton),
      eyeFromSkeleton(joints.rightEye, skeleton),
    ],
  };
}
