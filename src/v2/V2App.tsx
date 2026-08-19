import { ClipboardCheck, Images, Palette } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { assetUrl } from "../lib/assets";
import { FinishInspector } from "./FinishInspector";
import { ShapeLibrary } from "./ShapeLibrary";
import { StandardPreview, type PreviewMode } from "./StandardPreview";
import { backgrounds, characteristicColors, materials, v2Avatars, type PaletteOption, type PalariV2Avatar } from "./data";
import { PreferencePanel } from "./preferences/PreferencePanel";
import { PreferencePreview } from "./preferences/PreferencePreview";
import {
  getAvatarPreference,
  matchesPreferenceFilter,
  type PreferenceFilter,
  type PreferenceTarget,
  type PreferenceVerdict,
} from "./preferences/model";
import { usePalariPreferences } from "./preferences/usePalariPreferences";
import { useReviewKeyboard } from "./preferences/useReviewKeyboard";

const defaults = {
  material: materials[1],
  characteristic: characteristicColors[7],
  background: backgrounds[0],
};

function matchingAvatars(filter: PreferenceFilter, records: ReturnType<typeof usePalariPreferences>["records"]) {
  return v2Avatars.filter((item) => matchesPreferenceFilter(getAvatarPreference(records, item.id), filter));
}

export function V2App() {
  const [avatar, setAvatar] = useState<PalariV2Avatar>(v2Avatars[4]);
  const [material, setMaterial] = useState(defaults.material);
  const [characteristic, setCharacteristic] = useState(defaults.characteristic);
  const [background, setBackground] = useState(defaults.background);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("customized");
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<PreferenceTarget>("ceramic");
  const [reviewFilter, setReviewFilter] = useState<PreferenceFilter>("all");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const preferences = usePalariPreferences(v2Avatars);

  const renderOptions = useMemo(
    () => ({
      material: material.uiSwatch,
      characteristic: characteristic.uiSwatch,
      background: background.uiSwatch,
      mode: previewMode,
    }),
    [background.uiSwatch, characteristic.uiSwatch, material.uiSwatch, previewMode],
  );

  const filteredAvatars = useMemo(
    () => matchingAvatars(reviewFilter, preferences.records),
    [preferences.records, reviewFilter],
  );
  const reviewAvatars = useMemo(() => {
    if (!reviewMode || filteredAvatars.some((item) => item.id === avatar.id)) return filteredAvatars;
    return [avatar, ...filteredAvatars];
  }, [avatar, filteredAvatars, reviewMode]);

  const moveReview = useCallback((direction: -1 | 1) => {
    if (reviewAvatars.length === 0) return;
    setAvatar((current) => {
      const currentIndex = Math.max(0, reviewAvatars.findIndex((item) => item.id === current.id));
      const nextIndex = (currentIndex + direction + reviewAvatars.length) % reviewAvatars.length;
      return reviewAvatars[nextIndex];
    });
  }, [reviewAvatars]);
  const previousReview = useCallback(() => moveReview(-1), [moveReview]);
  const nextReview = useCallback(() => moveReview(1), [moveReview]);
  const rateActive = useCallback((verdict: PreferenceVerdict) => {
    preferences.setVerdict(avatar.id, reviewTarget, verdict);
  }, [avatar.id, preferences.setVerdict, reviewTarget]);

  useReviewKeyboard({
    enabled: reviewMode,
    onVerdict: rateActive,
    onPrevious: previousReview,
    onNext: nextReview,
  });

  function reset() {
    setMaterial(defaults.material);
    setCharacteristic(defaults.characteristic);
    setBackground(defaults.background);
    setPreviewMode("customized");
  }

  function chooseFinish(setter: (option: PaletteOption) => void, option: PaletteOption) {
    setter(option);
    setPreviewMode("customized");
  }

  function chooseReviewFilter(filter: PreferenceFilter) {
    setReviewFilter(filter);
    const nextAvatars = matchingAvatars(filter, preferences.records);
    if (nextAvatars.length > 0 && !nextAvatars.some((item) => item.id === avatar.id)) setAvatar(nextAvatars[0]);
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

  const activePreference = getAvatarPreference(preferences.records, avatar.id);
  const reviewPosition = Math.max(1, reviewAvatars.findIndex((item) => item.id === avatar.id) + 1);

  return (
    <main className="v2-shell" data-review-mode={reviewMode}>
      <header className="v2-header">
        <a className="v2-brand" href={assetUrl("v2/")} aria-label="Palari V2 home">
          <span className="v2-seed" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>
          <span>Palari <sup>V2</sup></span>
        </a>
        <p>Personal Artificial Intelligence</p>
        <div className="v2-header-actions">
          <button type="button" data-active={reviewMode} aria-pressed={reviewMode} onClick={() => setReviewMode((active) => !active)}>
            {reviewMode ? <Palette size={15} /> : <ClipboardCheck size={15} />}
            {reviewMode ? "Back to editor" : "Review taste"}
          </button>
          <a className="v2-portrait-link" href={assetUrl("")}><Images size={16} /> Portraits</a>
        </div>
      </header>

      <section className="v2-workspace">
        <ShapeLibrary
          avatars={reviewMode ? reviewAvatars : v2Avatars}
          activeAvatar={avatar}
          emoticonThumbnails={!reviewMode && previewMode === "emoticon"}
          reviewMode={reviewMode}
          records={preferences.records}
          filter={reviewFilter}
          completedCount={preferences.completedCount}
          collectionTotal={v2Avatars.length}
          onAvatarChange={setAvatar}
          onFilterChange={chooseReviewFilter}
        />

        {reviewMode ? (
          <PreferencePreview avatar={avatar} target={reviewTarget} onTargetChange={setReviewTarget} />
        ) : (
          <StandardPreview
            avatar={avatar}
            mode={previewMode}
            options={renderOptions}
            materialLabel={material.label}
            characteristicLabel={characteristic.label}
            canvasRef={canvasRef}
            onModeChange={setPreviewMode}
          />
        )}

        <aside className="v2-inspector" aria-label={reviewMode ? "Palari preference review" : "Palari appearance"}>
          {reviewMode ? (
            <PreferencePanel
              avatar={avatar}
              preference={activePreference}
              target={reviewTarget}
              position={reviewPosition}
              total={reviewAvatars.length}
              collectionTotal={v2Avatars.length}
              completedCount={preferences.completedCount}
              notice={preferences.notice}
              storageAvailable={preferences.storageAvailable}
              onTargetChange={setReviewTarget}
              onVerdict={rateActive}
              onToggleFeature={(disposition, featureId) => preferences.toggleFeature(avatar.id, reviewTarget, disposition, featureId)}
              onNoteChange={(note) => preferences.setNote(avatar.id, reviewTarget, note)}
              onPrevious={previousReview}
              onNext={nextReview}
              onExport={preferences.exportPreferences}
              onImport={preferences.importPreferences}
            />
          ) : (
            <FinishInspector
              material={material}
              characteristic={characteristic}
              background={background}
              previewMode={previewMode}
              onMaterialChange={(option) => chooseFinish(setMaterial, option)}
              onCharacteristicChange={(option) => chooseFinish(setCharacteristic, option)}
              onBackgroundChange={(option) => chooseFinish(setBackground, option)}
              onReset={reset}
              onDownload={download}
            />
          )}
        </aside>
      </section>
    </main>
  );
}
