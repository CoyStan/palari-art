import { useId } from "react";

type ColorControlProps = {
  label: string;
  value: string;
  presets: string[];
  onChange: (value: string) => void;
};

export function ColorControl({ label, value, presets, onChange }: ColorControlProps) {
  const inputId = useId();

  return (
    <fieldset className="color-fieldset">
      <legend>{label}</legend>
      <div className="color-input-row">
        <label className="native-color" htmlFor={inputId} style={{ background: value }}>
          <span className="sr-only">Choose {label.toLowerCase()}</span>
          <input
            id={inputId}
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
        </label>
        <input
          aria-label={`${label} hex value`}
          className="hex-input"
          maxLength={7}
          value={value.toUpperCase()}
          onChange={(event) => {
            const next = event.target.value;
            if (/^#[0-9a-fA-F]{6}$/.test(next)) onChange(next);
          }}
        />
      </div>
      <div className="swatches" aria-label={`${label} presets`}>
        {presets.map((preset) => (
          <button
            aria-label={`Use ${preset}`}
            aria-pressed={preset.toLowerCase() === value.toLowerCase()}
            className="swatch"
            key={preset}
            onClick={() => onChange(preset)}
            style={{ background: preset }}
            type="button"
          />
        ))}
      </div>
    </fieldset>
  );
}
