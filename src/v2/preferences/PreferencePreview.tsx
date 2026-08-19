import { useRef } from "react";
import type { V2RenderOptions } from "../../lib/recolor-v2";
import type { PalariV2Avatar } from "../data";
import { V2Canvas } from "../V2Canvas";
import type { PreferenceTarget } from "./model";

const ceramicOptions: V2RenderOptions = {
  material: "#E9E6DF",
  characteristic: "#174D38",
  background: "#EEE8DC",
  mode: "original",
};

const iconOptions: V2RenderOptions = {
  material: "#E9E6DF",
  characteristic: "#174D38",
  background: "#172333",
  mode: "emoticon",
};

type PreferencePreviewProps = {
  avatar: PalariV2Avatar;
  target: PreferenceTarget;
  onTargetChange: (target: PreferenceTarget) => void;
};

export function PreferencePreview({ avatar, target, onTargetChange }: PreferencePreviewProps) {
  const ceramicRef = useRef<HTMLCanvasElement>(null);
  const iconRef = useRef<HTMLCanvasElement>(null);
  return (
    <section className="v2-preview v2-review-preview" aria-label="Palari preference comparison">
      <div className="v2-review-meta">
        <span>{avatar.silhouette} form</span>
        <span>{avatar.id.replace("palari-", "No. ")} · compare both versions</span>
      </div>
      <div className="v2-review-comparison">
        <article data-active={target === "ceramic"}>
          <button type="button" aria-pressed={target === "ceramic"} onClick={() => onTargetChange("ceramic")}>
            <span>3D ceramic</span><small>Review this version</small>
          </button>
          <V2Canvas avatar={avatar} options={ceramicOptions} canvasRef={ceramicRef} />
        </article>
        <article data-active={target === "icon"}>
          <button type="button" aria-pressed={target === "icon"} onClick={() => onTargetChange("icon")}>
            <span>Icon</span><small>Review this version</small>
          </button>
          <V2Canvas avatar={avatar} options={iconOptions} canvasRef={iconRef} />
        </article>
      </div>
      <p className="v2-preview-note">Choose a version, rate it, then mark exactly what should stay or change.</p>
    </section>
  );
}
