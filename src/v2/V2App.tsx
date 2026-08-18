import { Download, Eye, Images, Palette, RotateCcw, Smile } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { assetUrl } from "../lib/assets";
import { backgrounds, characteristicColors, materials, v2Avatars } from "./data";
import { SwatchGroup } from "./SwatchGroup";
import { V2Canvas } from "./V2Canvas";

const defaults = {
  material: materials[1],
  characteristic: characteristicColors[7],
  background: backgrounds[0],
};

type PreviewMode = "customized" | "emoticon" | "original";

export function V2App() {
  const [avatar, setAvatar] = useState(v2Avatars[4]);
  const [material, setMaterial] = useState(defaults.material);
  const [characteristic, setCharacteristic] = useState(defaults.characteristic);
  const [background, setBackground] = useState(defaults.background);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("customized");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderOptions = useMemo(
    () => ({
      material: material.uiSwatch,
      characteristic: characteristic.uiSwatch,
      background: background.uiSwatch,
      mode: previewMode,
    }),
    [background.uiSwatch, characteristic.uiSwatch, material.uiSwatch, previewMode],
  );

  function reset() {
    setMaterial(defaults.material);
    setCharacteristic(defaults.characteristic);
    setBackground(defaults.background);
    setPreviewMode("customized");
  }

  function chooseMaterial(option: typeof material) {
    setMaterial(option);
    setPreviewMode("customized");
  }

  function chooseCharacteristic(option: typeof characteristic) {
    setCharacteristic(option);
    setPreviewMode("customized");
  }

  function chooseBackground(option: typeof background) {
    setBackground(option);
    setPreviewMode("customized");
  }

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const anchor = document.createElement("a");
    anchor.download = previewMode === "original"
      ? `${avatar.id}-original.png`
      : previewMode === "emoticon"
        ? `${avatar.id}-emoticon.png`
        : `${avatar.id}-${material.id}-${characteristic.id}.png`;
    anchor.href = canvas.toDataURL("image/png");
    anchor.click();
  }

  return (
    <main className="v2-shell">
      <header className="v2-header">
        <a className="v2-brand" href={assetUrl("v2/")} aria-label="Palari V2 home">
          <span className="v2-seed" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>
          <span>Palari <sup>V2</sup></span>
        </a>
        <p>Personal Artificial Intelligence</p>
        <a className="v2-portrait-link" href={assetUrl("")}><Images size={16} /> Portraits</a>
      </header>

      <section className="v2-workspace">
        <aside className="v2-library" aria-label="Palari shapes">
          <div className="v2-section-heading"><span>01</span><h2>Shape</h2></div>
          <div className="v2-shape-list">
            {v2Avatars.map((item) => (
              <button
                key={item.id}
                type="button"
                data-active={item.id === avatar.id}
                onClick={() => setAvatar(item)}
                aria-pressed={item.id === avatar.id}
              >
                <img
                  src={assetUrl(previewMode === "emoticon" ? item.emoticonThumbnail : item.source)}
                  alt=""
                  width="54"
                  height="54"
                  loading="lazy"
                  decoding="async"
                />
                <span>{item.silhouette}</span>
                <small>{item.id.replace("palari-", "No. ")}</small>
              </button>
            ))}
          </div>
        </aside>

        <section className="v2-preview" aria-label="Palari preview">
          <div className="v2-preview-meta">
            <span>{avatar.silhouette} form</span>
            <span aria-live="polite">
              {previewMode === "original"
                ? "Original source · masks off"
                : previewMode === "emoticon"
                  ? "Emoticon · fixed palette"
                  : `${material.label} · ${characteristic.label}`}
            </span>
            <div className="v2-view-toggle" role="group" aria-label="Preview version">
              <button
                type="button"
                data-active={previewMode === "customized"}
                aria-pressed={previewMode === "customized"}
                onClick={() => setPreviewMode("customized")}
              >
                <Palette size={13} aria-hidden="true" /> Custom
              </button>
              <button
                type="button"
                data-active={previewMode === "emoticon"}
                aria-pressed={previewMode === "emoticon"}
                onClick={() => setPreviewMode("emoticon")}
              >
                <Smile size={13} aria-hidden="true" /> Emoticon
              </button>
              <button
                type="button"
                data-active={previewMode === "original"}
                aria-pressed={previewMode === "original"}
                onClick={() => setPreviewMode("original")}
              >
                <Eye size={13} aria-hidden="true" /> Original
              </button>
            </div>
          </div>
          <V2Canvas avatar={avatar} options={renderOptions} canvasRef={canvasRef} />
          <p className="v2-preview-note">
            {previewMode === "original"
              ? "Original source. No masks or recoloring applied."
              : previewMode === "emoticon"
                ? "A compact, character-matched symbol made for small-size use."
                : "One vessel. One characteristic color. Entirely yours."}
          </p>
        </section>

        <aside className="v2-inspector" aria-label="Palari appearance">
          <div className="v2-section-heading"><span>02</span><h2>Finish</h2></div>
          <SwatchGroup legend="Ceramic material" options={materials} value={material.id} onChange={chooseMaterial} />
          <SwatchGroup legend="Characteristic color" options={characteristicColors} value={characteristic.id} onChange={chooseCharacteristic} />
          <SwatchGroup legend="Background" options={backgrounds} value={background.id} onChange={chooseBackground} />
          <div className="v2-actions">
            <button type="button" className="v2-secondary" onClick={reset}><RotateCcw size={16} /> Reset</button>
            <button type="button" className="v2-primary" onClick={download}><Download size={17} /> Export PNG</button>
          </div>
          <p className="v2-export-note">
            {previewMode === "original"
              ? "1024 × 1024 · original transparency preserved"
              : previewMode === "emoticon"
                ? "1024 × 1024 · fixed-palette emoticon"
                : "1024 × 1024 · processed in your browser"}
          </p>
        </aside>
      </section>
    </main>
  );
}
