import { Download, ImageDown, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { AvatarCanvas } from "./components/AvatarCanvas";
import { AvatarLibrary } from "./components/AvatarLibrary";
import { ColorControl } from "./components/ColorControl";
import { avatars as builtInAvatars, type Avatar } from "./data/avatars";
import { canvasToBlob, type RecolorSettings } from "./lib/recolor";

const DEFAULTS: RecolorSettings = {
  backgroundColor: "#DCE8F7",
  shirtColor: "#2F6EE5",
  backgroundTolerance: 88,
  shirtTolerance: 64,
};

const backgroundPresets = ["#F3E2D2", "#F4D9DE", "#DCCFF0", "#DCE8F7", "#DDEBDD", "#F2E1B8"];
const shirtPresets = ["#2F6EE5", "#E65B49", "#F1AF24", "#2E8B61", "#9B56C7", "#EC6D8D"];

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function App() {
  const [uploadedAvatars, setUploadedAvatars] = useState<Avatar[]>([]);
  const [selected, setSelected] = useState<Avatar>(builtInAvatars[0]);
  const [settings, setSettings] = useState<RecolorSettings>(DEFAULTS);
  const [canvasReady, setCanvasReady] = useState(false);
  const [exporting, setExporting] = useState<"png" | "webp" | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const allAvatars = useMemo(() => [...uploadedAvatars, ...builtInAvatars], [uploadedAvatars]);
  const handleReadyChange = useCallback((ready: boolean) => setCanvasReady(ready), []);

  const updateSetting = <Key extends keyof RecolorSettings>(key: Key, value: RecolorSettings[Key]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const handleUpload = (file: File) => {
    const avatar: Avatar = {
      id: `upload-${crypto.randomUUID()}`,
      name: file.name.replace(/\.[^.]+$/, ""),
      src: URL.createObjectURL(file),
      collection: "Uploads",
    };
    setUploadedAvatars((current) => [avatar, ...current]);
    setSelected(avatar);
  };

  const handleExport = async (format: "png" | "webp") => {
    const canvas = canvasRef.current;
    if (!canvas || !canvasReady) return;
    setExporting(format);
    try {
      const blob = await canvasToBlob(canvas, format);
      const safeName = selected.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      downloadBlob(blob, `palari-${safeName || "avatar"}.${format}`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="/" aria-label="Palari Art home">
          <span className="mark" aria-hidden="true"><i /><i /><i /></span>
          <span>Palari Art</span>
        </a>
        <p>Color studio for character portraits</p>
        <div className="local-note"><span aria-hidden="true" /> Runs locally</div>
      </header>

      <main className="workspace">
        <AvatarLibrary
          avatars={allAvatars}
          selectedId={selected.id}
          onSelect={setSelected}
          onUpload={handleUpload}
        />

        <section className="stage" aria-label="Avatar preview">
          <div className="stage-toolbar">
            <div>
              <strong>{selected.name}</strong>
              <span>Palari portrait</span>
            </div>
            <button className="secondary-button" onClick={() => setSettings(DEFAULTS)} type="button">
              <RotateCcw aria-hidden="true" size={15} /> Reset
            </button>
          </div>
          <div className="stage-center">
            <AvatarCanvas
              ref={canvasRef}
              src={selected.src}
              settings={settings}
              masks={selected.masks}
              onReadyChange={handleReadyChange}
            />
          </div>
          <div className="stage-caption">
            <span>1024 × 1024</span>
            <span>{selected.masks ? "Reviewed semantic masks" : "Color-estimated masks"}</span>
          </div>
        </section>

        <aside className="inspector" aria-label="Color controls">
          <div className="panel-heading inspector-heading">
            <div>
              <h2>Color</h2>
              <p>Two editable layers</p>
            </div>
            <SlidersHorizontal aria-hidden="true" size={18} />
          </div>

          <ColorControl
            label="Background"
            value={settings.backgroundColor}
            presets={backgroundPresets}
            onChange={(value) => updateSetting("backgroundColor", value)}
          />
          <ColorControl
            label="Shirt"
            value={settings.shirtColor}
            presets={shirtPresets}
            onChange={(value) => updateSetting("shirtColor", value)}
          />

          <details className="edge-controls">
            <summary>Edge tuning</summary>
            <label>
              <span>Background selection <output>{settings.backgroundTolerance}</output></span>
              <input
                disabled={Boolean(selected.masks)}
                min="56"
                max="130"
                type="range"
                value={settings.backgroundTolerance}
                onChange={(event) => updateSetting("backgroundTolerance", Number(event.target.value))}
              />
            </label>
            <label>
              <span>Shirt selection <output>{settings.shirtTolerance}</output></span>
              <input
                disabled={Boolean(selected.masks)}
                min="32"
                max="100"
                type="range"
                value={settings.shirtTolerance}
                onChange={(event) => updateSetting("shirtTolerance", Number(event.target.value))}
              />
            </label>
            <p>
              {selected.masks
                ? "This portrait uses stored semantic masks; edge tuning is not required."
                : "Adjust only when an edge needs a little more or less coverage."}
            </p>
          </details>

          <div className="export-block">
            <div>
              <h3>Export portrait</h3>
              <p>Processing never leaves this browser.</p>
            </div>
            <button
              className="primary-button"
              disabled={!canvasReady || exporting !== null}
              onClick={() => handleExport("png")}
              type="button"
            >
              <Download aria-hidden="true" size={17} />
              {exporting === "png" ? "Exporting…" : "Download PNG"}
            </button>
            <button
              className="secondary-button wide"
              disabled={!canvasReady || exporting !== null}
              onClick={() => handleExport("webp")}
              type="button"
            >
              <ImageDown aria-hidden="true" size={16} />
              {exporting === "webp" ? "Exporting…" : "Download WebP"}
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}
