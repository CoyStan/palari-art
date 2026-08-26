import { useEffect, useRef, type CSSProperties } from "react";
import type { PalariRig, RigEye } from "./procedural";

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
};

function RigEyeShape({ eye, index, rig }: { eye: RigEye; index: number; rig: PalariRig }) {
  const pupilX = eye.x + eye.pupilOffsetX;
  const pupilY = eye.y + eye.pupilOffsetY;
  const catchlightRadius = Math.max(18, Math.round(eye.pupilRadius * 0.35));

  return (
    <g
      className="v3-rig-eye"
      data-eye={index === 0 ? "left" : "right"}
      style={{ transformOrigin: `${eye.x}px ${eye.y}px` }}
    >
      <circle cx={eye.x} cy={eye.y} r={eye.whiteRadius} fill={rig.eyeWhite} />
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

export function ProceduralPalari({ rig, motionEnabled, bounceSignal }: ProceduralPalariProps) {
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
        <svg viewBox="0 0 1254 1254" width="1254" height="1254" aria-hidden="true" focusable="false">
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
          <path d={rig.shellPath} fill={`url(#${gradientId}-ivory)`} />

          <g className="v3-rig-head" style={{ transformOrigin: `${rig.facePivot[0]}px ${rig.facePivot[1]}px` }}>
            <path d={rig.facePath} fill={`url(#${gradientId}-face)`} />
            {rig.eyes.map((eye, index) => <RigEyeShape key={index} eye={eye} index={index} rig={rig} />)}
          </g>

          {rig.arms.map((arm, index) => (
            <g
              key={index}
              className="v3-rig-arm"
              data-arm={index === 0 ? "left" : "right"}
              style={{ transformOrigin: `${arm.pivotX}px ${arm.pivotY}px` }}
            >
              <ellipse
                cx={arm.x}
                cy={arm.y}
                rx={arm.radiusX}
                ry={arm.radiusY}
                transform={`rotate(${arm.rotation} ${arm.x} ${arm.y})`}
                fill={`url(#${gradientId}-ivory)`}
              />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
