import { Search, Upload } from "lucide-react";
import { useMemo, useRef, useState, type CSSProperties } from "react";
import type { Avatar } from "../data/avatars";
import {
  avatarFeatureGroups,
  avatarFeatureOptionCountKey,
  matchesAvatarFeatures,
  type AvatarFeatureKey,
  type AvatarFeatureSelection,
} from "../data/avatar-features";
import { AvatarFeatureFilters } from "./AvatarFeatureFilters";

type AvatarLibraryProps = {
  avatars: Avatar[];
  selectedId: string;
  onSelect: (avatar: Avatar) => void;
  onUpload: (file: File) => void;
};

function framingStyle(avatar: Avatar): CSSProperties | undefined {
  if (!avatar.framing) return undefined;
  const { scale, centerX, centerY } = avatar.framing;
  return {
    width: `${scale * 100}%`,
    height: `${scale * 100}%`,
    left: `${(0.5 - centerX * scale) * 100}%`,
    top: `${(0.5 - centerY * scale) * 100}%`,
  };
}

function matchesAvatarQuery(avatar: Avatar, normalizedQuery: string) {
  return normalizedQuery.length === 0 || avatar.name.toLowerCase().includes(normalizedQuery);
}

export function AvatarLibrary({ avatars, selectedId, onSelect, onUpload }: AvatarLibraryProps) {
  const [query, setQuery] = useState("");
  const [featureSelection, setFeatureSelection] = useState<AvatarFeatureSelection>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = query.trim().toLowerCase();
  const visible = useMemo(() => {
    return avatars.filter(
      (avatar) => matchesAvatarQuery(avatar, normalizedQuery)
        && matchesAvatarFeatures(avatar.features, featureSelection),
    );
  }, [avatars, featureSelection, normalizedQuery]);
  const optionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const group of avatarFeatureGroups) {
      for (const [value] of group.options) {
        let count = 0;
        for (const avatar of avatars) {
          if (
            matchesAvatarQuery(avatar, normalizedQuery)
            && matchesAvatarFeatures(avatar.features, featureSelection, group.key)
            && avatar.features?.[group.key] === value
          ) {
            count += 1;
          }
        }
        counts.set(avatarFeatureOptionCountKey(group.key, value), count);
      }
    }
    return counts;
  }, [avatars, featureSelection, normalizedQuery]);
  const hasDiscoveryFilters = normalizedQuery.length > 0
    || Object.values(featureSelection).some((values) => values && values.length > 0);

  const toggleFeature = (key: AvatarFeatureKey, value: string) => {
    setFeatureSelection((current) => {
      const values = current[key] ?? [];
      const nextValues = values.includes(value)
        ? values.filter((selectedValue) => selectedValue !== value)
        : [...values, value];
      const next = { ...current };
      if (nextValues.length === 0) {
        delete next[key];
      } else {
        next[key] = nextValues;
      }
      return next;
    });
  };

  const clearDiscoveryFilters = () => {
    setQuery("");
    setFeatureSelection({});
  };

  return (
    <aside className="library-panel" aria-label="Avatar library">
      <div className="panel-heading">
        <div>
          <h2>Library</h2>
          <p aria-live="polite">{hasDiscoveryFilters ? `${visible.length} of ${avatars.length} portraits` : `${avatars.length} portraits`}</p>
        </div>
        <button
          className="icon-button"
          onClick={() => fileInputRef.current?.click()}
          title="Upload a portrait"
          type="button"
        >
          <Upload aria-hidden="true" size={18} />
          <span className="sr-only">Upload a portrait</span>
        </button>
        <input
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          ref={fileInputRef}
          type="file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onUpload(file);
            event.target.value = "";
          }}
        />
      </div>

      <label className="search-field">
        <Search aria-hidden="true" size={15} />
        <span className="sr-only">Search portraits</span>
        <input
          placeholder="Find a portrait"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      <AvatarFeatureFilters
        selection={featureSelection}
        matchCount={visible.length}
        optionCounts={optionCounts}
        onToggle={toggleFeature}
        onClear={() => setFeatureSelection({})}
      />

      <div className="avatar-grid">
        {visible.map((avatar) => (
          <button
            aria-label={`Select ${avatar.name}`}
            aria-pressed={selectedId === avatar.id}
            className="avatar-tile"
            key={avatar.id}
            onClick={() => onSelect(avatar)}
            type="button"
          >
            <img
              alt=""
              decoding="async"
              loading="lazy"
              src={avatar.thumbnailSrc ?? avatar.webSrc ?? avatar.src}
              style={framingStyle(avatar)}
            />
            <span>{avatar.name.replace("Avatar ", "")}</span>
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <div className="empty-library" role="status">
          <p>No portraits match those features.</p>
          <button className="secondary-button" onClick={clearDiscoveryFilters} type="button">Clear filters</button>
        </div>
      ) : null}
    </aside>
  );
}
