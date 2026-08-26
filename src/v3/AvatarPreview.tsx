import { useState } from "react";
import type { AvatarFrame } from "./download";
import type { PalariV3Selection } from "./data";
import { ProceduralPalari } from "./ProceduralPalari";

type AvatarPreviewProps = {
  avatar: PalariV3Selection;
  frame: AvatarFrame;
  motionEnabled: boolean;
};

export function AvatarPreview({ avatar, frame, motionEnabled }: AvatarPreviewProps) {
  const [bounceSignal, setBounceSignal] = useState(0);
  const description = avatar.rig
    ? `${avatar.kind === "generated" ? `Made from seed ${avatar.rig.seed}` : "Live SVG rig"} · ${motionEnabled ? "tap to hop" : "motion paused"}`
    : "Static artwork";

  return (
    <section className="v3-preview-card" aria-label={`${avatar.name} avatar preview`}>
      <div className="v3-preview-art" data-frame={frame} data-motion={motionEnabled}>
        {avatar.rig ? (
          <button
            type="button"
            className="v3-rig-trigger"
            aria-label={`Make ${avatar.name} hop`}
            onClick={() => setBounceSignal((value) => value + 1)}
          >
            <ProceduralPalari rig={avatar.rig} motionEnabled={motionEnabled} bounceSignal={bounceSignal} />
          </button>
        ) : avatar.kind === "bundled" ? (
          <div key={avatar.id} className="v3-static-avatar">
            <img src={avatar.icon} alt={`${avatar.name}, a friendly Palari avatar`} />
          </div>
        ) : null}
      </div>
      <div className="v3-preview-caption">
        <h2>{avatar.name}</h2>
        <p>{description}</p>
      </div>
    </section>
  );
}
