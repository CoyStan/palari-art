import { assetUrl } from "../lib/assets";
import type { PalariV2Avatar } from "./data";
import {
  getAvatarPreference,
  preferenceFilterOptions,
  verdictLabels,
  type PreferenceFilter,
  type PreferenceRecords,
  type PreferenceVerdict,
} from "./preferences/model";

type ShapeLibraryProps = {
  avatars: PalariV2Avatar[];
  activeAvatar: PalariV2Avatar;
  emoticonThumbnails: boolean;
  reviewMode: boolean;
  records: PreferenceRecords;
  filter: PreferenceFilter;
  completedCount: number;
  collectionTotal: number;
  onAvatarChange: (avatar: PalariV2Avatar) => void;
  onFilterChange: (filter: PreferenceFilter) => void;
};

const compactVerdicts: Record<PreferenceVerdict, string> = {
  favorite: "Fav",
  keep: "Keep",
  mixed: "Mixed",
  avoid: "Avoid",
};

function verdictSummary(verdict: PreferenceVerdict | null): string {
  return verdict ? compactVerdicts[verdict] : "—";
}

export function ShapeLibrary({
  avatars,
  activeAvatar,
  emoticonThumbnails,
  reviewMode,
  records,
  filter,
  completedCount,
  collectionTotal,
  onAvatarChange,
  onFilterChange,
}: ShapeLibraryProps) {
  return (
    <aside className="v2-library" aria-label="Palari shapes">
      <div className="v2-section-heading">
        <span>01</span><h2>Shape</h2>
        {reviewMode ? <small>{completedCount}/{collectionTotal}</small> : null}
      </div>
      {reviewMode ? (
        <label className="v2-review-filter">
          <span>Review view</span>
          <select value={filter} onChange={(event) => onFilterChange(event.target.value as PreferenceFilter)}>
            {preferenceFilterOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      ) : null}
      {avatars.length > 0 ? (
        <div className="v2-shape-list">
          {avatars.map((item) => {
            const preference = getAvatarPreference(records, item.id);
            const ceramicLabel = preference.ceramic.verdict ? verdictLabels[preference.ceramic.verdict] : "Unrated";
            const iconLabel = preference.icon.verdict ? verdictLabels[preference.icon.verdict] : "Unrated";
            return (
              <button
                key={item.id}
                type="button"
                data-active={item.id === activeAvatar.id}
                onClick={() => onAvatarChange(item)}
                aria-pressed={item.id === activeAvatar.id}
              >
                <img
                  src={assetUrl(emoticonThumbnails ? item.emoticonThumbnail : item.source)}
                  alt=""
                  width="54"
                  height="54"
                  loading="lazy"
                  decoding="async"
                />
                <span className="v2-shape-copy">
                  <span>{item.silhouette}</span>
                  {reviewMode ? (
                    <small aria-label={`3D ceramic: ${ceramicLabel}; icon: ${iconLabel}`}>
                      3D {verdictSummary(preference.ceramic.verdict)} · Icon {verdictSummary(preference.icon.verdict)}
                    </small>
                  ) : null}
                </span>
                <small>{item.id.replace("palari-", "No. ")}</small>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="v2-review-empty" role="status">
          <p>No Palari match this review view.</p>
          <button type="button" onClick={() => onFilterChange("all")}>Show all</button>
        </div>
      )}
    </aside>
  );
}
