import { Download, Eye, Images, RotateCcw } from "lucide-react";
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

export function V2App() {
  const [avatar, setAvatar] = useState(v2Avatars[4]);
  const [material, setMaterial] = useState(defaults.material);
  const [characteristic, setCharacteristic] = useState(defaults.characteristic);
  const [background, setBackground] = useState(defaults.background);
  const [showOriginal, setShowOriginal] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderOptions = useMemo(
    () => ({
      material: material.uiSwatch,
      characteristic: characteristic.uiSwatch,
      background: background.uiSwatch,
      mode: showOriginal ? "original" as const : "customized" as const,
    }),
    [background.uiSwatch, characteristic.uiSwatch, material.uiSwatch, showOriginal],
  );

  function reset() {
    setMaterial(defaults.material);
    setCharacteristic(defaults.characteristic);
    setBackground(defaults.background);
    setShowOriginal(false);
  }

  function chooseMaterial(option: typeof material) {
    setMaterial(option);
    setShowOriginal(false);
  }

  function chooseCharacteristic(option: typeof characteristic) {
    setCharacteristic(option);
    setShowOriginal(false);
  }

  function chooseBackground(option: typeof background) {
    setBackground(option);
    setShowOriginal(false);
  }

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const anchor = document.createElement("a");
    anchor.download = showOriginal
      ? `${avatar.id}-original.png`
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
                <img src={assetUrl(item.source)} alt="" />
                <span>{item.silhouette}</span>
                <small>{item.id.replace("palari-", "No. ")}</small>
              </button>
            ))}
          </div>
        </aside>

        <section className="v2-preview" aria-label="Palari preview">
          <div className="v2-preview-meta">
            <span>{avatar.silhouette} form</span>
            <span>{showOriginal ? "Original source · masks off" : `${material.label} · ${characteristic.label}`}</span>
            <button
              type="button"
              className="v2-original-toggle"
              data-active={showOriginal}
              aria-pressed={showOriginal}
              aria-label={showOriginal ? "Show customized version" : "Show original source without masks"}
              onClick={() => setShowOriginal((current) => !current)}
            >
              <Eye size={13} aria-hidden="true" /> Original
            </button>
          </div>
          <V2Canvas avatar={avatar} options={renderOptions} canvasRef={canvasRef} />
          <p className="v2-preview-note">
            {showOriginal ? "Original source. No masks or recoloring applied." : "One vessel. One characteristic color. Entirely yours."}
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
            {showOriginal ? "1024 × 1024 · original transparency preserved" : "1024 × 1024 · processed in your browser"}
          </p>
        </aside>
      </section>
    </main>
  );
}
