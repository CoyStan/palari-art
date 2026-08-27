import type { PalariSkeleton, PalariVolume, Point } from "./skeleton";

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

function paddedVolume(volume: PalariVolume, padding: number): PalariVolume {
  return {
    ...volume,
    radiusX: volume.radiusX + padding,
    radiusY: volume.radiusY + padding,
  };
}

function smoothClosedPath(points: readonly Point[]) {
  if (points.length < 4) throw new Error("A Palari cover needs at least four envelope points.");
  const commands = [`M${n(points[0].x)} ${n(points[0].y)}`];

  for (let index = 0; index < points.length; index += 1) {
    const previous = points[(index - 1 + points.length) % points.length];
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const after = points[(index + 2) % points.length];
    const controlOne = point(
      current.x + (next.x - previous.x) / 8,
      current.y + (next.y - previous.y) / 8,
    );
    const controlTwo = point(
      next.x - (after.x - current.x) / 8,
      next.y - (after.y - current.y) / 8,
    );
    commands.push(`C${n(controlOne.x)} ${n(controlOne.y)} ${n(controlTwo.x)} ${n(controlTwo.y)} ${n(next.x)} ${n(next.y)}`);
  }

  return `${commands.join("")}Z`;
}

function point(x: number, y: number): Point {
  return { x, y };
}

function rayEllipseDistance(origin: Point, direction: Point, volume: PalariVolume) {
  const offsetX = origin.x - volume.center.x;
  const offsetY = origin.y - volume.center.y;
  const radiusXSquared = volume.radiusX * volume.radiusX;
  const radiusYSquared = volume.radiusY * volume.radiusY;
  const a = (direction.x * direction.x) / radiusXSquared + (direction.y * direction.y) / radiusYSquared;
  const b = (2 * offsetX * direction.x) / radiusXSquared + (2 * offsetY * direction.y) / radiusYSquared;
  const c = (offsetX * offsetX) / radiusXSquared + (offsetY * offsetY) / radiusYSquared - 1;
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return undefined;
  const farther = (-b + Math.sqrt(discriminant)) / (2 * a);
  return farther > 0 ? farther : undefined;
}

function envelopePath(sourceVolumes: readonly PalariVolume[], padding = 0, samples = 80) {
  const volumes = sourceVolumes.map((volume) => paddedVolume(volume, padding));
  const anchorVolume = volumes.reduce((current, candidate) => (
    candidate.radiusX * candidate.radiusY > current.radiusX * current.radiusY ? candidate : current
  ));
  const origin = anchorVolume.center;
  const contour: Point[] = [];

  for (let index = 0; index < samples; index += 1) {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / samples;
    const direction = point(Math.cos(angle), Math.sin(angle));
    let distance = 0;
    for (const volume of volumes) {
      distance = Math.max(distance, rayEllipseDistance(origin, direction, volume) ?? 0);
    }
    contour.push(point(origin.x + direction.x * distance, origin.y + direction.y * distance));
  }

  return smoothClosedPath(contour);
}

function interpolate(start: number, end: number, amount: number) {
  return start + (end - start) * amount;
}

function quadraticPoint(start: Point, control: Point, end: Point, amount: number) {
  const inverse = 1 - amount;
  return point(
    inverse * inverse * start.x + 2 * inverse * amount * control.x + amount * amount * end.x,
    inverse * inverse * start.y + 2 * inverse * amount * control.y + amount * amount * end.y,
  );
}

function quadraticTangent(start: Point, control: Point, end: Point, amount: number) {
  return point(
    2 * (1 - amount) * (control.x - start.x) + 2 * amount * (end.x - control.x),
    2 * (1 - amount) * (control.y - start.y) + 2 * amount * (end.y - control.y),
  );
}

function armRadiiAt(
  balls: readonly [PalariVolume, PalariVolume, PalariVolume],
  amount: number,
  sleeveScale: number,
) {
  const [shoulder, elbow, hand] = balls;
  const firstHalf = amount <= 0.5;
  const localAmount = firstHalf ? amount * 2 : (amount - 0.5) * 2;
  const from = firstHalf ? shoulder : elbow;
  const to = firstHalf ? elbow : hand;
  const handEase = 1 + Math.max(0, amount - 0.72) * 0.16;
  return {
    radiusX: interpolate(from.radiusX, to.radiusX, localAmount) * sleeveScale * handEase,
    radiusY: interpolate(from.radiusY, to.radiusY, localAmount) * sleeveScale * handEase,
  };
}

function ellipseOffset(angle: number, radiusX: number, radiusY: number) {
  return point(Math.cos(angle) * radiusX, Math.sin(angle) * radiusY);
}

function armSleeveFromBalls(
  balls: readonly [PalariVolume, PalariVolume, PalariVolume],
  connectorScale: number,
) {
  const [shoulder, elbow, hand] = balls;
  const control = point(
    elbow.center.x * 2 - (shoulder.center.x + hand.center.x) / 2,
    elbow.center.y * 2 - (shoulder.center.y + hand.center.y) / 2,
  );
  const sleeveScale = Math.min(0.98, connectorScale + 0.08);
  const left: Point[] = [];
  const right: Point[] = [];
  const samples = 22;

  for (let index = 0; index <= samples; index += 1) {
    const amount = index / samples;
    const center = quadraticPoint(shoulder.center, control, hand.center, amount);
    const tangent = quadraticTangent(shoulder.center, control, hand.center, amount);
    const normalAngle = Math.atan2(tangent.y, tangent.x) + Math.PI / 2;
    const radii = armRadiiAt(balls, amount, sleeveScale);
    const offset = ellipseOffset(normalAngle, radii.radiusX, radii.radiusY);
    left.push(point(center.x + offset.x, center.y + offset.y));
    right.push(point(center.x - offset.x, center.y - offset.y));
  }

  const startTangent = quadraticTangent(shoulder.center, control, hand.center, 0);
  const endTangent = quadraticTangent(shoulder.center, control, hand.center, 1);
  const startNormal = Math.atan2(startTangent.y, startTangent.x) + Math.PI / 2;
  const endNormal = Math.atan2(endTangent.y, endTangent.x) + Math.PI / 2;
  const startRadii = armRadiiAt(balls, 0, sleeveScale);
  const endRadii = armRadiiAt(balls, 1, sleeveScale);
  const endCap: Point[] = [];
  const startCap: Point[] = [];
  const capSamples = 10;

  for (let index = 1; index < capSamples; index += 1) {
    const progress = index / capSamples;
    const endAngle = endNormal - Math.PI * progress;
    const endOffset = ellipseOffset(endAngle, endRadii.radiusX, endRadii.radiusY);
    endCap.push(point(hand.center.x + endOffset.x, hand.center.y + endOffset.y));

    const startAngle = startNormal + Math.PI - Math.PI * progress;
    const startOffset = ellipseOffset(startAngle, startRadii.radiusX, startRadii.radiusY);
    startCap.push(point(shoulder.center.x + startOffset.x, shoulder.center.y + startOffset.y));
  }

  return smoothClosedPath([...left, ...endCap, ...right.reverse(), ...startCap]);
}

function faceFromSkeleton(skeleton: PalariSkeleton) {
  const { proportions: p } = skeleton;
  const head = skeleton.volumes.shell.find((volume) => volume.role === "head");
  const chest = skeleton.volumes.shell.find((volume) => volume.role === "chest");
  if (!head || !chest) throw new Error("A Palari needs head and chest balls before it can receive a face cover.");

  const faceVolumes: PalariVolume[] = [
    {
      ...head,
      id: "face-head",
      center: point(head.center.x, head.center.y + head.radiusY * 0.56),
      radiusX: head.radiusX * Math.min(0.92, p.faceScale + 0.05),
      radiusY: head.radiusY * 0.68,
    },
    {
      ...chest,
      id: "face-chest",
      center: point(chest.center.x, chest.center.y + chest.radiusY * 0.05),
      radiusX: chest.radiusX * p.faceScale,
      radiusY: chest.radiusY * 0.74,
    },
  ];

  return envelopePath(faceVolumes, 0, 20);
}

function armFromBalls(balls: readonly [PalariVolume, PalariVolume, PalariVolume], connectorScale: number): CoverArm {
  const [shoulder] = balls;
  return {
    path: armSleeveFromBalls(balls, connectorScale),
    pivot: shoulder.center,
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

export function coverSkeleton(skeleton: PalariSkeleton): PalariCover {
  const { joints, proportions, volumes } = skeleton;
  return {
    shellPath: envelopePath(volumes.shell, proportions.clothPadding),
    facePath: faceFromSkeleton(skeleton),
    arms: [
      armFromBalls(volumes.leftArm, proportions.armConnectorScale),
      armFromBalls(volumes.rightArm, proportions.armConnectorScale),
    ],
    eyes: [eyeFromSkeleton(joints.leftEye, skeleton), eyeFromSkeleton(joints.rightEye, skeleton)],
  };
}
