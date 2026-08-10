import { Box, Download, Pause, Play, Rotate3D } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { assetUrl } from "../lib/assets";
import modelUrl from "../../docs/palari-v2/meshy-multiview-pilot/palari-005/output/model.glb?url";
import repairUrl from "../../docs/palari-v2/meshy-multiview-pilot/palari-005/blender-repair/model-repaired.glb?url";
import {
  HybridPalariViewer,
  type CameraView,
  type HybridPalariViewerHandle,
  type ReviewMode,
} from "./HybridPalariViewer";

const views = [
  "Front", "Left", "Back", "Right",
] satisfies CameraView[];

const modes: { value: ReviewMode; label: string }[] = [
  { value: "meshy", label: "Meshy" },
  { value: "corrected", label: "Blender repair" },
  { value: "overlay", label: "Overlay" },
];

export function ViewerApp() {
  const viewerRef = useRef<HybridPalariViewerHandle | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [autoRotate, setAutoRotate] = useState(true);
  const [activeView, setActiveView] = useState<CameraView>("Free");
  const [mode, setMode] = useState<ReviewMode>("corrected");
  const handleLoadStateChange = useCallback((state: "loading" | "ready" | "error") => {
    setLoadState(state);
  }, []);

  function chooseView(label: CameraView) {
    viewerRef.current?.resetCamera(label);
    setActiveView(label);
    setAutoRotate(false);
  }

  return (
    <main className="review-shell">
      <header className="review-header">
        <a className="review-brand" href={assetUrl("v2/")} aria-label="Back to Palari V2">
          <span className="review-seed" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>
          <span>Palari <sup>V2</sup></span>
        </a>
        <p>Experimental 3D review</p>
        <a className="review-back" href={assetUrl("v2/")}>Back to editor</a>
      </header>

      <section className="review-workspace">
        <section className="review-stage" aria-label="Interactive Palari 005 model">
          <div className="review-stage-meta">
            <span>Meshy + Blender repair study</span>
            <span aria-live="polite">{loadState === "ready" ? `${activeView} view` : loadState}</span>
          </div>
          <div className="review-model-frame">
            <HybridPalariViewer
              ref={viewerRef}
              mode={mode}
              autoRotate={autoRotate}
              onLoadStateChange={handleLoadStateChange}
            />
            {loadState !== "ready" ? (
              <div className="review-status" role="status">
                {loadState === "error" ? "The GLB could not be loaded." : "Loading the 3D figure…"}
              </div>
            ) : null}
          </div>
          <p className="review-hint">Drag to rotate · scroll or pinch to zoom</p>
        </section>

        <aside className="review-panel" aria-label="3D review controls">
          <div className="review-kicker"><span>01</span><Box size={16} aria-hidden="true" /> Palari 005</div>
          <h1>Arch form</h1>
          <p className="review-summary">The original Meshy figure remains the reference. The Blender pass keeps its face, front, materials, and pose, while replacing the malformed rear arm bridge with a fitted ceramic shell.</p>

          <div className="review-details" aria-label="Model details">
            <div><span>Reference</span><strong>Meshy 6</strong></div>
            <div><span>Correction</span><strong>Blender 4.0</strong></div>
            <div><span>Source retained</span><strong>Meshy front</strong></div>
          </div>

          <fieldset className="review-modes">
            <legend>Geometry</legend>
            <div>
              {modes.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={mode === item.value}
                  onClick={() => setMode(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </fieldset>

          {mode === "overlay" ? (
            <div className="review-legend" aria-label="Overlay colors">
              <span><i className="legend-corrected" /> Blender repair</span>
              <span><i className="legend-meshy" /> Translucent Meshy reference</span>
            </div>
          ) : null}

          <fieldset className="review-views">
            <legend>Camera view</legend>
            <div>
              {views.map((view) => (
                <button
                  key={view}
                  type="button"
                  aria-pressed={activeView === view}
                  onClick={() => chooseView(view)}
                >
                  {view}
                </button>
              ))}
            </div>
          </fieldset>

          <button
            className="review-rotate"
            type="button"
            aria-pressed={autoRotate}
            onClick={() => {
              const next = !autoRotate;
              setAutoRotate(next);
              setActiveView("Free");
            }}
          >
            {autoRotate ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
            {autoRotate ? "Pause rotation" : "Auto rotate"}
          </button>

          <div className="review-downloads">
            <a className="review-download" href={repairUrl} download="palari-005-blender-repair-v1.glb">
              <Download size={17} aria-hidden="true" /> Download Blender repair
            </a>
            <a className="review-reference-download" href={modelUrl} download="palari-005-meshy-reference.glb">
              Download Meshy reference
            </a>
          </div>

          <p className="review-note"><Rotate3D size={15} aria-hidden="true" /> Blender repair v1 fixes the rear bridge and preserves the front. The side arm caps and rear material seam still need a manual sculpt pass.</p>
        </aside>
      </section>
    </main>
  );
}
