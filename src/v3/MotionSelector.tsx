type MotionSelectorProps = {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
};

export function MotionSelector({ enabled, onChange }: MotionSelectorProps) {
  return (
    <fieldset className="v3-motion-control">
      <legend>Motion</legend>
      <div>
        <button type="button" data-active={enabled} aria-pressed={enabled} onClick={() => onChange(true)}>
          Alive
        </button>
        <button type="button" data-active={!enabled} aria-pressed={!enabled} onClick={() => onChange(false)}>
          Still
        </button>
      </div>
    </fieldset>
  );
}
