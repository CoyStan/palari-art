import { Eye, Palette, Smile } from "lucide-react";
import type { RefObject } from "react";
import type { V2RenderOptions } from "../lib/recolor-v2";
import type { PalariV2Avatar } from "./data";
import { V2Canvas } from "./V2Canvas";

export type PreviewMode = "customized" | "emoticon" | "original";

type StandardPreviewProps = {
  avatar: PalariV2Avatar;
  mode: PreviewMode;
  options: V2RenderOptions;
  materialLabel: string;
  characteristicLabel: string;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  onModeChange: (mode: PreviewMode) => void;
};

export function StandardPreview({
  avatar,
  mode,
  options,
  materialLabel,
  characteristicLabel,
  canvasRef,
  onModeChange,
}: StandardPreviewProps) {
  return (
    <section className="v2-preview" aria-label="Palari preview">
      <div className="v2-preview-meta">
        <span>{avatar.silhouette} form</span>
        <span aria-live="polite">
          {mode === "original"
            ? "Original source · masks off"
            : mode === "emoticon"
              ? "Emoticon · fixed palette"
              : `${materialLabel} · ${characteristicLabel}`}
        </span>
        <div className="v2-view-toggle" role="group" aria-label="Preview version">
          <button type="button" data-active={mode === "customized"} aria-pressed={mode === "customized"} onClick={() => onModeChange("customized")}>
            <Palette size={13} aria-hidden="true" /> Custom
          </button>
          <button type="button" data-active={mode === "emoticon"} aria-pressed={mode === "emoticon"} onClick={() => onModeChange("emoticon")}>
            <Smile size={13} aria-hidden="true" /> Emoticon
          </button>
          <button type="button" data-active={mode === "original"} aria-pressed={mode === "original"} onClick={() => onModeChange("original")}>
            <Eye size={13} aria-hidden="true" /> Original
          </button>
        </div>
      </div>
      <V2Canvas avatar={avatar} options={options} canvasRef={canvasRef} />
      <p className="v2-preview-note">
        {mode === "original"
          ? "Original source. No masks or recoloring applied."
          : mode === "emoticon"
            ? "A compact, character-matched symbol made for small-size use."
            : "One vessel. One characteristic color. Entirely yours."}
      </p>
    </section>
  );
}
