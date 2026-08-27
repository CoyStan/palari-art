import { useState } from "react";
import type { AvatarFrame } from "./download";
import type { PalariV3Selection } from "./data";
import { ProceduralPalari } from "./ProceduralPalari";
import type { PalariViewMode } from "./ViewSelector";

type AvatarPreviewProps = {
  avatar: PalariV3Selection;
  frame: AvatarFrame;
  motionEnabled: boolean;
  view: PalariViewMode;
};

export function AvatarPreview({ avatar, frame, motionEnabled, view }: AvatarPreviewProps) {
  const [bounceSignal, setBounceSignal] = useState(0);
  const volumeCount = avatar.rig
    ? avatar.rig.skeleton.volumes.shell.length + avatar.rig.skeleton.volumes.leftArm.length + avatar.rig.skeleton.volumes.rightArm.length
    : 0;
  const description = avatar.rig
    ? view === "balls"
      ? `${volumeCount} volume balls · 11 joints · ${motionEnabled ? "tap to hop" : "motion paused"}`
      : `${avatar.kind === "generated" ? `Made from seed ${avatar.rig.seed}` : `Covered from ${volumeCount} balls`} · ${motionEnabled ? "tap to hop" : "motion paused"}`
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
            <ProceduralPalari rig={avatar.rig} motionEnabled={motionEnabled} bounceSignal={bounceSignal} view={view} />
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
