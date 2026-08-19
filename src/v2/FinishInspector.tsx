import { Download, RotateCcw } from "lucide-react";
import type { PaletteOption } from "./data";
import { backgrounds, characteristicColors, materials } from "./data";
import type { PreviewMode } from "./StandardPreview";
import { SwatchGroup } from "./SwatchGroup";

type FinishInspectorProps = {
  material: PaletteOption;
  characteristic: PaletteOption;
  background: PaletteOption;
  previewMode: PreviewMode;
  onMaterialChange: (option: PaletteOption) => void;
  onCharacteristicChange: (option: PaletteOption) => void;
  onBackgroundChange: (option: PaletteOption) => void;
  onReset: () => void;
  onDownload: () => void;
};

export function FinishInspector({
  material,
  characteristic,
  background,
  previewMode,
  onMaterialChange,
  onCharacteristicChange,
  onBackgroundChange,
  onReset,
  onDownload,
}: FinishInspectorProps) {
  return (
    <>
      <div className="v2-section-heading"><span>02</span><h2>Finish</h2></div>
      <SwatchGroup legend="Ceramic material" options={materials} value={material.id} onChange={onMaterialChange} />
      <SwatchGroup legend="Characteristic color" options={characteristicColors} value={characteristic.id} onChange={onCharacteristicChange} />
      <SwatchGroup legend="Background" options={backgrounds} value={background.id} onChange={onBackgroundChange} />
      <div className="v2-actions">
        <button type="button" className="v2-secondary" onClick={onReset}><RotateCcw size={16} /> Reset</button>
        <button type="button" className="v2-primary" onClick={onDownload}><Download size={17} /> Export PNG</button>
      </div>
      <p className="v2-export-note">
        {previewMode === "original"
          ? "1024 × 1024 · original transparency preserved"
          : previewMode === "emoticon"
            ? "1024 × 1024 · fixed-palette emoticon"
            : "1024 × 1024 · processed in your browser"}
      </p>
    </>
  );
}
