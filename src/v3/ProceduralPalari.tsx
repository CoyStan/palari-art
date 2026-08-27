import { useEffect, useRef, type CSSProperties } from "react";
import type { CoverEye } from "./cover";
import type { PalariRig } from "./procedural";
import type { PalariJointName, PalariVolume, Point } from "./skeleton";
import type { PalariViewMode } from "./ViewSelector";

type MotionStyle = CSSProperties & {
  "--v3-cycle": string;
  "--v3-gaze-cycle": string;
  "--v3-blink": string;
  "--v3-phase": string;
  "--v3-phase-right": string;
  "--v3-bounce": string;
  "--v3-bounce-soft": string;
  "--v3-bounce-settle": string;
  "--v3-head-lag": string;
  "--v3-head-settle": string;
  "--v3-sway": string;
  "--v3-sway-neg": string;
  "--v3-sway-soft": string;
  "--v3-sway-neg-soft": string;
  "--v3-head-sway": string;
  "--v3-head-sway-neg": string;
  "--v3-arm": string;
  "--v3-arm-neg": string;
  "--v3-arm-soft": string;
  "--v3-arm-neg-soft": string;
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
      {chestBall ? <VolumeBall volume={chestBall} /> : null}
      <Bone from={joints.root} to={joints.chest} />
      <Bone from={joints.chest} to={joints.head} />
      <Bone from={joints.chest} to={joints.leftShoulder} />
      <Bone from={joints.chest} to={joints.rightShoulder} />
      <Joint name="root" point={joints.root} fill={rig.background} radius={24} />
      <Joint name="chest" point={joints.chest} fill={rig.background} radius={24} />

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
      <path className="v3-cover-shell" d={cover.shellPath} fill={`url(#${gradientId}-ivory)`} />
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
  const hopRef = useRef<HTMLDivElement>(null);
  const activeHop = useRef<Animation | null>(null);
  const gradientId = `v3-rig-${rig.seed}`;
  const { motion } = rig;
  const motionStyle: MotionStyle = {
    "--v3-cycle": `${motion.cycleSeconds}s`,
    "--v3-gaze-cycle": `${motion.cycleSeconds * 1.8}s`,
    "--v3-blink": `${motion.blinkSeconds}s`,
    "--v3-phase": `${motion.phaseSeconds}s`,
    "--v3-phase-right": `${motion.phaseSeconds + 0.036}s`,
    "--v3-bounce": `${-motion.bounce}px`,
    "--v3-bounce-soft": `${-motion.bounce * 0.35}px`,
    "--v3-bounce-settle": `${-motion.bounce * 0.24}px`,
    "--v3-head-lag": `${-motion.bounce * 0.22}px`,
    "--v3-head-settle": `${motion.bounce * 0.08}px`,
    "--v3-sway": `${motion.swayDegrees}deg`,
    "--v3-sway-neg": `${-motion.swayDegrees * 0.28}deg`,
    "--v3-sway-soft": `${motion.swayDegrees * 0.32}deg`,
    "--v3-sway-neg-soft": `${-motion.swayDegrees * 0.4}deg`,
    "--v3-head-sway": `${motion.swayDegrees * 0.4}deg`,
    "--v3-head-sway-neg": `${-motion.swayDegrees * 0.5}deg`,
    "--v3-arm": `${motion.armDegrees}deg`,
    "--v3-arm-neg": `${-motion.armDegrees}deg`,
    "--v3-arm-soft": `${motion.armDegrees * 0.55}deg`,
    "--v3-arm-neg-soft": `${-motion.armDegrees * 0.55}deg`,
    "--v3-gaze": `${motion.gaze}px`,
    "--v3-gaze-left": `${-motion.gaze * 0.7}px`,
    "--v3-gaze-up": `${-motion.gaze * 0.35}px`,
    "--v3-gaze-low": `${motion.gaze * 0.28}px`,
  };

  useEffect(() => {
    if (bounceSignal === 0 || !motionEnabled || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    activeHop.current?.cancel();
    activeHop.current = hopRef.current?.animate(
      [
        { transform: "translate3d(0, 0, 0) scale(1, 1)", offset: 0 },
        { transform: "translate3d(0, 2%, 0) scale(1.035, .965)", offset: 0.16 },
        { transform: "translate3d(0, -8%, 0) scale(.975, 1.035)", offset: 0.43 },
        { transform: "translate3d(0, 0, 0) scale(1.018, .982)", offset: 0.72 },
        { transform: "translate3d(0, -1%, 0) scale(.995, 1.005)", offset: 0.87 },
        { transform: "translate3d(0, 0, 0) scale(1, 1)", offset: 1 },
      ],
      { duration: 680, easing: "cubic-bezier(.22, .9, .28, 1)" },
    ) ?? null;

    return () => activeHop.current?.cancel();
  }, [bounceSignal, motionEnabled]);

  return (
    <div className="v3-rig-hop" ref={hopRef}>
      <div className="v3-rig-idle" data-motion={motionEnabled} style={motionStyle}>
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
