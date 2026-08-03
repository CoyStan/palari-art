import { Search, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { Avatar, AvatarCollection } from "../data/avatars";

type AvatarLibraryProps = {
  avatars: Avatar[];
  selectedId: string;
  onSelect: (avatar: Avatar) => void;
  onUpload: (file: File) => void;
};

const collections: Array<"All" | AvatarCollection> = ["All", "Original set", "Expanded set", "Uploads"];

export function AvatarLibrary({ avatars, selectedId, onSelect, onUpload }: AvatarLibraryProps) {
  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState<(typeof collections)[number]>("All");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const visible = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return avatars.filter((avatar) => {
      const matchesCollection = collection === "All" || avatar.collection === collection;
      const matchesQuery = normalizedQuery.length === 0
        || avatar.name.toLowerCase().includes(normalizedQuery)
        || avatar.collection.toLowerCase().includes(normalizedQuery);
      return matchesCollection && matchesQuery;
    });
  }, [avatars, collection, query]);

  return (
    <aside className="library-panel" aria-label="Avatar library">
      <div className="panel-heading">
        <div>
          <h2>Library</h2>
          <p>{avatars.length} portraits</p>
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

      <div className="collection-tabs" aria-label="Filter by collection">
        {collections.map((option) => (
          <button
            aria-pressed={collection === option}
            className={collection === option ? "active" : ""}
            key={option}
            onClick={() => setCollection(option)}
            type="button"
          >
            {option === "Original set" ? "Original" : option === "Expanded set" ? "Expanded" : option}
          </button>
        ))}
      </div>

      <div className="avatar-grid">
        {visible.map((avatar) => (
          <button
            aria-label={`Select ${avatar.name} from ${avatar.collection}`}
            aria-pressed={selectedId === avatar.id}
            className="avatar-tile"
            key={avatar.id}
            onClick={() => onSelect(avatar)}
            type="button"
          >
            <img alt="" loading="lazy" src={avatar.src} />
            <span>{avatar.name.replace("Portrait ", "")}</span>
          </button>
        ))}
      </div>
      {visible.length === 0 ? <p className="empty-library">No portraits match this filter.</p> : null}
    </aside>
  );
}
