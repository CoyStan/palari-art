import { useEffect, useRef } from "react";
import type { PalariMotion } from "./procedural";

type SoftBodyState = {
  chestPosition: number;
  chestVelocity: number;
  headPosition: number;
  headVelocity: number;
};

type SoftBodyMotionOptions = {
  enabled: boolean;
  bounceSignal: number;
  seed: number;
  motion: PalariMotion;
  view: "cover" | "balls";
};

const restingState = (): SoftBodyState => ({
  chestPosition: 0,
  chestVelocity: 0,
  headPosition: 0,
  headVelocity: 0,
});

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function setTransform(elements: readonly SVGGraphicsElement[], transform: string) {
  for (const element of elements) element.style.transform = transform;
}

function clearTransforms(root: HTMLDivElement) {
  root.style.transform = "";
  for (const element of root.querySelectorAll<SVGGraphicsElement>(".v3-rig-chest, .v3-rig-head, .v3-rig-arm")) {
    element.style.transform = "";
  }
}

export function useSoftBodyMotion({ enabled, bounceSignal, seed, motion, view }: SoftBodyMotionOptions) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<SoftBodyState>(restingState());
  const lastBounceSignal = useRef(bounceSignal);

  useEffect(() => {
    const rootElement = rootRef.current;
    if (!rootElement) return;
    const mountedRoot: HTMLDivElement = rootElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const chestElements = [...mountedRoot.querySelectorAll<SVGGraphicsElement>(".v3-rig-chest")];
    const headElements = [...mountedRoot.querySelectorAll<SVGGraphicsElement>(".v3-rig-head")];
    const leftArms = [...mountedRoot.querySelectorAll<SVGGraphicsElement>('.v3-rig-arm[data-arm="left"]')];
    const rightArms = [...mountedRoot.querySelectorAll<SVGGraphicsElement>('.v3-rig-arm[data-arm="right"]')];
    const state = restingState();
    stateRef.current = state;
    let animationFrame = 0;
    let running = false;
    let startedAt = performance.now();
    let previousTime = startedAt;

    function render(time: number) {
      const delta = Math.min(0.032, Math.max(0.001, (time - previousTime) / 1000));
      const elapsed = (time - startedAt) / 1000;
      previousTime = time;
      const phase = ((seed % 997) / 997) * Math.PI * 2 + motion.phaseSeconds;
      const wave = elapsed * ((Math.PI * 2) / motion.cycleSeconds) + phase;
      const idleTarget = Math.sin(wave) * 2.4;

      const anchorForce = (idleTarget - state.chestPosition) * 17 - state.chestVelocity * 5.8;
      const couplingForce = (state.headPosition - state.chestPosition) * 7
        + (state.headVelocity - state.chestVelocity) * 1.15;
      const headForce = (state.chestPosition - state.headPosition) * 25
        + (state.chestVelocity - state.headVelocity) * 4.8;

      state.chestVelocity += (anchorForce + couplingForce) * delta;
      state.headVelocity += headForce * delta;
      state.chestPosition += state.chestVelocity * delta;
      state.headPosition += state.headVelocity * delta;

      const relativePosition = clamp((state.headPosition - state.chestPosition) / 24, -1, 1);
      const chestWide = clamp(state.chestVelocity / 5200 - relativePosition * 0.018, -0.045, 0.05);
      const headWide = clamp(state.headVelocity / 4600 + relativePosition * 0.024, -0.04, 0.045);
      const sway = Math.sin(wave * 0.72) * motion.swayDegrees * 0.72;
      const armFollow = clamp(
        state.chestVelocity / 52 + relativePosition * 2.2,
        -motion.armDegrees,
        motion.armDegrees,
      );
      const driftX = Math.sin(wave * 0.72) * 1.4;

      mountedRoot.style.transform = `translate3d(${driftX.toFixed(3)}px, 0, 0)`;
      setTransform(
        chestElements,
        `translate3d(0, ${state.chestPosition.toFixed(3)}px, 0) rotate(${sway.toFixed(3)}deg) scale(${(1 + chestWide).toFixed(4)}, ${(1 - chestWide * 0.86).toFixed(4)})`,
      );
      setTransform(
        headElements,
        `translate3d(0, ${state.headPosition.toFixed(3)}px, 0) rotate(${(-sway * 1.18).toFixed(3)}deg) scale(${(1 + headWide).toFixed(4)}, ${(1 - headWide * 0.9).toFixed(4)})`,
      );
      setTransform(
        leftArms,
        `translate3d(0, ${(state.chestPosition * 0.82).toFixed(3)}px, 0) rotate(${(armFollow + sway * 0.5).toFixed(3)}deg)`,
      );
      setTransform(
        rightArms,
        `translate3d(0, ${(state.chestPosition * 0.82).toFixed(3)}px, 0) rotate(${(-armFollow + sway * 0.5).toFixed(3)}deg)`,
      );

      animationFrame = requestAnimationFrame(render);
    }

    function start() {
      if (running || !enabled || reducedMotion.matches) return;
      running = true;
      startedAt = performance.now();
      previousTime = startedAt;
      animationFrame = requestAnimationFrame(render);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(animationFrame);
      stateRef.current = restingState();
      clearTransforms(mountedRoot);
    }

    function handleMotionPreference() {
      if (reducedMotion.matches) stop();
      else start();
    }

    reducedMotion.addEventListener("change", handleMotionPreference);
    start();
    if (!enabled || reducedMotion.matches) clearTransforms(mountedRoot);

    return () => {
      reducedMotion.removeEventListener("change", handleMotionPreference);
      stop();
    };
  }, [enabled, motion.armDegrees, motion.cycleSeconds, motion.phaseSeconds, motion.swayDegrees, seed, view]);

  useEffect(() => {
    if (bounceSignal === lastBounceSignal.current) return;
    lastBounceSignal.current = bounceSignal;
    if (!enabled || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const impulse = 205 + motion.bounce * 4.2;
    stateRef.current.chestVelocity = clamp(stateRef.current.chestVelocity - impulse, -360, 220);
    stateRef.current.headVelocity = clamp(stateRef.current.headVelocity - impulse * 0.24, -190, 160);
  }, [bounceSignal, enabled, motion.bounce]);

  return rootRef;
}
