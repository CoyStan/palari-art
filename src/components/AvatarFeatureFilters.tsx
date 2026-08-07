import { SlidersHorizontal, X } from "lucide-react";
import { useRef, useState } from "react";
import {
  avatarFeatureGroups,
  avatarFeatureOptionCountKey,
  type AvatarFeatureKey,
  type AvatarFeatureSelection,
} from "../data/avatar-features";

type AvatarFeatureFiltersProps = {
  selection: AvatarFeatureSelection;
  matchCount: number;
  optionCounts: ReadonlyMap<string, number>;
  onToggle: (key: AvatarFeatureKey, value: string) => void;
  onClear: () => void;
};

function avatarFeatureOptionCount(
  counts: ReadonlyMap<string, number>,
  key: AvatarFeatureKey,
  value: string,
) {
  return counts.get(avatarFeatureOptionCountKey(key, value)) ?? 0;
}

export function AvatarFeatureFilters({
  selection,
  matchCount,
  optionCounts,
  onToggle,
  onClear,
}: AvatarFeatureFiltersProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const activeCount = Object.values(selection).reduce(
    (total, values) => total + (values?.length ?? 0),
    0,
  );

  const closeDialog = () => dialogRef.current?.close();

  return (
    <>
      <button
        aria-controls="avatar-feature-dialog"
        aria-expanded={isOpen}
        className="feature-filter-trigger"
        onClick={() => {
          dialogRef.current?.showModal();
          setIsOpen(true);
        }}
        type="button"
      >
        <SlidersHorizontal aria-hidden="true" size={15} />
        <span>Features</span>
        <span className="feature-filter-summary">
          {activeCount > 0 ? `${activeCount} selected · ${matchCount} matches` : "All portraits"}
        </span>
        {activeCount > 0 ? <span className="feature-filter-badge">{activeCount}</span> : null}
      </button>

      <dialog
        aria-labelledby="avatar-feature-title"
        className="feature-filter-dialog"
        id="avatar-feature-dialog"
        ref={dialogRef}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDialog();
        }}
        onClose={() => setIsOpen(false)}
      >
        <div className="feature-filter-sheet">
          <header className="feature-filter-header">
            <div>
              <h2 id="avatar-feature-title">Find a Palari</h2>
              <p>Choices in one group add together; different groups narrow the results.</p>
            </div>
            <button aria-label="Close feature filters" className="icon-button" onClick={closeDialog} type="button">
              <X aria-hidden="true" size={18} />
            </button>
          </header>

          <div className="feature-filter-groups">
            {avatarFeatureGroups.map((group) => (
              <fieldset className="feature-filter-group" key={group.key}>
                <legend>{group.label}</legend>
                <div className="feature-options">
                  {group.options.map(([value, label]) => {
                    const pressed = selection[group.key]?.includes(value) ?? false;
                    const count = avatarFeatureOptionCount(optionCounts, group.key, value);
                    return (
                      <button
                        aria-pressed={pressed}
                        className="feature-option"
                        disabled={!pressed && count === 0}
                        key={value}
                        onClick={() => onToggle(group.key, value)}
                        type="button"
                      >
                        <span>{label}</span>
                        <span className="feature-option-count">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>

          <footer className="feature-filter-footer">
            <button className="secondary-button" disabled={activeCount === 0} onClick={onClear} type="button">
              Clear features
            </button>
            <button className="primary-button" onClick={closeDialog} type="button">
              Show {matchCount} {matchCount === 1 ? "portrait" : "portraits"}
            </button>
          </footer>
        </div>
      </dialog>
    </>
  );
}
