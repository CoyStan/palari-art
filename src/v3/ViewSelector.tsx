export type PalariViewMode = "cover" | "bones";

type ViewSelectorProps = {
  view: PalariViewMode;
  enabled: boolean;
  onChange: (view: PalariViewMode) => void;
};

export function ViewSelector({ view, enabled, onChange }: ViewSelectorProps) {
  return (
    <fieldset className="v3-view-control" disabled={!enabled}>
      <legend>Build</legend>
      <div>
        <button type="button" data-active={view === "cover"} aria-pressed={view === "cover"} onClick={() => onChange("cover")}>
          Cover
        </button>
        <button type="button" data-active={view === "bones"} aria-pressed={view === "bones"} onClick={() => onChange("bones")}>
          Bones
        </button>
      </div>
    </fieldset>
  );
}
