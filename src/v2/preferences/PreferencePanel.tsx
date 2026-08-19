import {
  ChevronLeft,
  ChevronRight,
  FileDown,
  FileUp,
  Heart,
  Scale,
  ThumbsDown,
  ThumbsUp,
  type LucideIcon,
} from "lucide-react";
import { useRef } from "react";
import type { PalariV2Avatar } from "../data";
import {
  featureTags,
  verdictLabels,
  type AvatarPreference,
  type PreferenceTarget,
  type PreferenceVerdict,
  type TargetPreference,
} from "./model";

const verdictOptions: Array<{
  value: PreferenceVerdict;
  shortcut: string;
  Icon: LucideIcon;
}> = [
  { value: "favorite", shortcut: "1", Icon: Heart },
  { value: "keep", shortcut: "2", Icon: ThumbsUp },
  { value: "mixed", shortcut: "3", Icon: Scale },
  { value: "avoid", shortcut: "4", Icon: ThumbsDown },
];

type FeatureChoicesProps = {
  title: string;
  disposition: "likes" | "dislikes";
  target: PreferenceTarget;
  preference: TargetPreference;
  onToggle: (disposition: "likes" | "dislikes", featureId: string) => void;
};

function FeatureChoices({ title, disposition, target, preference, onToggle }: FeatureChoicesProps) {
  return (
    <fieldset className="v2-preference-features" data-disposition={disposition}>
      <legend>{title}</legend>
      <div className="v2-preference-chips">
        {featureTags[target].map((feature) => (
          <button
            type="button"
            key={feature.id}
            data-selected={preference[disposition].includes(feature.id)}
            aria-pressed={preference[disposition].includes(feature.id)}
            onClick={() => onToggle(disposition, feature.id)}
          >
            {feature.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

type PreferencePanelProps = {
  avatar: PalariV2Avatar;
  preference: AvatarPreference;
  target: PreferenceTarget;
  position: number;
  total: number;
  collectionTotal: number;
  completedCount: number;
  notice: string;
  storageAvailable: boolean;
  onTargetChange: (target: PreferenceTarget) => void;
  onVerdict: (verdict: PreferenceVerdict) => void;
  onToggleFeature: (disposition: "likes" | "dislikes", featureId: string) => void;
  onNoteChange: (note: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onExport: () => void;
  onImport: (file: File) => Promise<void>;
};

export function PreferencePanel({
  avatar,
  preference,
  target,
  position,
  total,
  collectionTotal,
  completedCount,
  notice,
  storageAvailable,
  onTargetChange,
  onVerdict,
  onToggleFeature,
  onNoteChange,
  onPrevious,
  onNext,
  onExport,
  onImport,
}: PreferencePanelProps) {
  const importRef = useRef<HTMLInputElement>(null);
  const targetPreference = preference[target];
  const targetLabel = target === "ceramic" ? "3D ceramic" : "Icon";

  async function importFile(file: File | undefined) {
    if (!file) return;
    await onImport(file);
    if (importRef.current) importRef.current.value = "";
  }

  return (
    <>
      <div className="v2-section-heading v2-preference-heading">
        <span>02</span>
        <h2>Taste</h2>
        <small>{completedCount}/{collectionTotal} complete</small>
      </div>

      <div className="v2-review-nav" aria-label="Review navigation">
        <button type="button" onClick={onPrevious} aria-label="Previous Palari"><ChevronLeft size={16} /></button>
        <span>{avatar.id.replace("palari-", "No. ")} · {position} of {total}</span>
        <button type="button" onClick={onNext} aria-label="Next Palari"><ChevronRight size={16} /></button>
      </div>

      <div className="v2-target-toggle" role="group" aria-label="Feedback target">
        <button type="button" data-active={target === "ceramic"} aria-pressed={target === "ceramic"} onClick={() => onTargetChange("ceramic")}>3D ceramic</button>
        <button type="button" data-active={target === "icon"} aria-pressed={target === "icon"} onClick={() => onTargetChange("icon")}>Icon</button>
      </div>

      <fieldset className="v2-verdicts">
        <legend>Overall {targetLabel} verdict</legend>
        <div>
          {verdictOptions.map(({ value, shortcut, Icon }) => (
            <button
              type="button"
              key={value}
              data-verdict={value}
              data-active={targetPreference.verdict === value}
              aria-pressed={targetPreference.verdict === value}
              onClick={() => onVerdict(value)}
            >
              <Icon size={15} aria-hidden="true" />
              <span>{verdictLabels[value]}</span>
              <kbd>{shortcut}</kbd>
            </button>
          ))}
        </div>
      </fieldset>

      <FeatureChoices title="Keep these features" disposition="likes" target={target} preference={targetPreference} onToggle={onToggleFeature} />
      <FeatureChoices title="Avoid these features" disposition="dislikes" target={target} preference={targetPreference} onToggle={onToggleFeature} />

      <label className="v2-preference-note">
        <span>Optional note</span>
        <textarea
          rows={3}
          maxLength={1000}
          value={targetPreference.note}
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder={`What should change in this ${target === "ceramic" ? "3D character" : "icon"}?`}
        />
      </label>

      <div className="v2-preference-files">
        <button type="button" className="v2-secondary" onClick={() => importRef.current?.click()}><FileUp size={15} /> Import</button>
        <button type="button" className="v2-primary" onClick={onExport}><FileDown size={15} /> Export JSON</button>
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          onChange={(event) => void importFile(event.target.files?.[0])}
          aria-label="Import Palari preference JSON"
        />
      </div>
      <p className="v2-preference-storage">
        {storageAvailable
          ? "Saved only in this browser. Export JSON to move or share your reviews."
          : "Browser storage is unavailable. Export JSON before leaving this page."}
      </p>
      <p className="v2-preference-notice" role="status" aria-live="polite">{notice}</p>
      <p className="v2-shortcuts">Shortcuts: 1–4 rate · ← → navigate</p>
    </>
  );
}
