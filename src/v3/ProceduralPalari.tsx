import type { CSSProperties } from "react";
import type { CoverEye } from "./cover";
import type { PalariRig } from "./procedural";
import type { PalariJointName, PalariVolume, Point } from "./skeleton";
import { useSoftBodyMotion } from "./useSoftBodyMotion";
import type { PalariViewMode } from "./ViewSelector";

type MotionStyle = CSSProperties & {
  "--v3-gaze-cycle": string;
  "--v3-blink": string;
  "--v3-phase": string;
  "--v3-phase-right": string;
  "--v3-gaze": string;
  "--v3-gaze-left": string;
  "--v3-gaze-up": string;
  "--v3-gaze-low": string;
};

type ProceduralPalariProps = {
  rig: PalariRig;
  motionEnabled: boolean;
  bounceSignal: number;
  view: PalariViewMode;
};

function RigEyeShape({ eye, index, rig }: { eye: CoverEye; index: number; rig: PalariRig }) {
  const pupilX = eye.anchor.x + eye.pupilOffsetX;
  const pupilY = eye.anchor.y + eye.pupilOffsetY;
  const catchlightRadius = Math.max(18, Math.round(eye.pupilRadius * 0.35));

  return (
    <g
      className="v3-rig-eye"
      data-eye={index === 0 ? "left" : "right"}
      style={{ transformOrigin: `${eye.anchor.x}px ${eye.anchor.y}px` }}
    >
      <circle cx={eye.anchor.x} cy={eye.anchor.y} r={eye.whiteRadius} fill={rig.eyeWhite} />
      <g className="v3-rig-gaze">
        <circle cx={pupilX} cy={pupilY} r={eye.pupilRadius} fill={rig.background} />
        <circle
          cx={pupilX + eye.catchlightOffsetX}
          cy={pupilY + eye.catchlightOffsetY}
          r={catchlightRadius}
          fill={rig.eyeWhite}
        />
      </g>
    </g>
  );
}

function Bone({ from, to, className }: { from: Point; to: Point; className?: string }) {
  return <line className={className} x1={from.x} y1={from.y} x2={to.x} y2={to.y} />;
}

function Joint({ name, point, fill, radius = 18 }: { name: PalariJointName; point: Point; fill: string; radius?: number }) {
  return <circle className="v3-volume-joint" data-joint={name} cx={point.x} cy={point.y} r={radius} fill={fill} />;
}

function VolumeBall({ volume }: { volume: PalariVolume }) {
  return (
    <ellipse
      className="v3-volume-ball"
      data-volume={volume.id}
      data-volume-role={volume.role}
      cx={volume.center.x}
      cy={volume.center.y}
      rx={volume.radiusX}
      ry={volume.radiusY}
    />
  );
}

function BallModelView({ rig }: { rig: PalariRig }) {
  const { joints, volumes } = rig.skeleton;
  const headOrigin = `${joints.head.x}px ${joints.head.y}px`;
  const chestBall = volumes.shell.find((volume) => volume.role === "chest");
  const headBalls = volumes.shell.filter((volume) => volume.role !== "chest");
  const volumeCount = volumes.shell.length + volumes.leftArm.length + volumes.rightArm.length;

  return (
    <g
      className="v3-volume-model"
      data-joint-count={Object.keys(joints).length}
      data-volume-count={volumeCount}
      stroke={rig.eyeWhite}
      fill={rig.face[0]}
    >
      <g className="v3-rig-chest" style={{ transformOrigin: `${joints.chest.x}px ${joints.chest.y}px` }}>
        {chestBall ? <VolumeBall volume={chestBall} /> : null}
        <Bone from={joints.root} to={joints.chest} />
        <Bone from={joints.chest} to={joints.head} />
        <Bone from={joints.chest} to={joints.leftShoulder} />
        <Bone from={joints.chest} to={joints.rightShoulder} />
        <Joint name="root" point={joints.root} fill={rig.background} radius={24} />
        <Joint name="chest" point={joints.chest} fill={rig.background} radius={24} />
      </g>

      <g className="v3-rig-head" style={{ transformOrigin: headOrigin }}>
        {headBalls.map((ball) => <VolumeBall key={ball.id} volume={ball} />)}
        <Bone from={joints.head} to={joints.leftEye} className="v3-skeleton-eye-bone" />
        <Bone from={joints.head} to={joints.rightEye} className="v3-skeleton-eye-bone" />
        <Joint name="head" point={joints.head} fill={rig.background} radius={24} />
        <Joint name="leftEye" point={joints.leftEye} fill={rig.background} radius={30} />
        <Joint name="rightEye" point={joints.rightEye} fill={rig.background} radius={30} />
      </g>

      <g className="v3-rig-arm" data-arm="left" style={{ transformOrigin: `${joints.leftShoulder.x}px ${joints.leftShoulder.y}px` }}>
        {volumes.leftArm.map((ball) => <VolumeBall key={ball.id} volume={ball} />)}
        <Bone from={joints.leftShoulder} to={joints.leftElbow} />
        <Bone from={joints.leftElbow} to={joints.leftHand} />
        <Joint name="leftShoulder" point={joints.leftShoulder} fill={rig.background} />
        <Joint name="leftElbow" point={joints.leftElbow} fill={rig.background} />
        <Joint name="leftHand" point={joints.leftHand} fill={rig.background} radius={22} />
      </g>

      <g className="v3-rig-arm" data-arm="right" style={{ transformOrigin: `${joints.rightShoulder.x}px ${joints.rightShoulder.y}px` }}>
        {volumes.rightArm.map((ball) => <VolumeBall key={ball.id} volume={ball} />)}
        <Bone from={joints.rightShoulder} to={joints.rightElbow} />
        <Bone from={joints.rightElbow} to={joints.rightHand} />
        <Joint name="rightShoulder" point={joints.rightShoulder} fill={rig.background} />
        <Joint name="rightElbow" point={joints.rightElbow} fill={rig.background} />
        <Joint name="rightHand" point={joints.rightHand} fill={rig.background} radius={22} />
      </g>
    </g>
  );
}

function CoverView({ rig, gradientId }: { rig: PalariRig; gradientId: string }) {
  const { cover, skeleton } = rig;
  return (
    <>
      <g
        className="v3-rig-chest"
        style={{ transformOrigin: `${skeleton.joints.chest.x}px ${skeleton.joints.chest.y}px` }}
      >
        <path className="v3-cover-shell" d={cover.shellPath} fill={`url(#${gradientId}-ivory)`} />
      </g>
      <g
        className="v3-rig-head"
        style={{ transformOrigin: `${skeleton.joints.head.x}px ${skeleton.joints.head.y}px` }}
      >
        <path className="v3-cover-face" d={cover.facePath} fill={`url(#${gradientId}-face)`} />
        {cover.eyes.map((eye, index) => <RigEyeShape key={index} eye={eye} index={index} rig={rig} />)}
      </g>

      {cover.arms.map((arm, index) => (
        <g
          key={index}
          className="v3-rig-arm"
          data-arm={index === 0 ? "left" : "right"}
          style={{ transformOrigin: `${arm.pivot.x}px ${arm.pivot.y}px` }}
        >
          <path
            className="v3-cover-arm"
            d={arm.path}
            fill={`url(#${gradientId}-ivory)`}
          />
        </g>
      ))}
    </>
  );
}

export function ProceduralPalari({ rig, motionEnabled, bounceSignal, view }: ProceduralPalariProps) {
  const gradientId = `v3-rig-${rig.seed}`;
  const { motion } = rig;
  const softBodyRef = useSoftBodyMotion({
    enabled: motionEnabled,
    bounceSignal,
    seed: rig.seed,
    motion,
    view,
  });
  const motionStyle: MotionStyle = {
    "--v3-gaze-cycle": `${motion.cycleSeconds * 1.8}s`,
    "--v3-blink": `${motion.blinkSeconds}s`,
    "--v3-phase": `${motion.phaseSeconds}s`,
    "--v3-phase-right": `${motion.phaseSeconds + 0.036}s`,
    "--v3-gaze": `${motion.gaze}px`,
    "--v3-gaze-left": `${-motion.gaze * 0.7}px`,
    "--v3-gaze-up": `${-motion.gaze * 0.35}px`,
    "--v3-gaze-low": `${motion.gaze * 0.28}px`,
  };

  return (
    <div className="v3-rig-hop">
      <div
        className="v3-rig-idle"
        data-motion={motionEnabled}
        data-physics="coupled-water-balloons"
        ref={softBodyRef}
        style={motionStyle}
      >
        <svg viewBox="0 0 1254 1254" width="1254" height="1254" data-view={view} aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id={`${gradientId}-ivory`} gradientUnits="userSpaceOnUse" x1="100" y1="120" x2="1120" y2="1160">
              <stop offset="0" stopColor={rig.ivory[0]} />
              <stop offset="1" stopColor={rig.ivory[1]} />
            </linearGradient>
            <linearGradient id={`${gradientId}-face`} gradientUnits="userSpaceOnUse" x1="190" y1="420" x2="1060" y2="1110">
              <stop offset="0" stopColor={rig.face[0]} />
              <stop offset="1" stopColor={rig.face[1]} />
            </linearGradient>
          </defs>

          <rect width="1254" height="1254" fill={rig.background} />
          {view === "balls" ? <BallModelView rig={rig} /> : <CoverView rig={rig} gradientId={gradientId} />}
        </svg>
      </div>
    </div>
  );
}
