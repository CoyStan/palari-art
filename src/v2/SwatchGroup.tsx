import type { PaletteOption } from "./data";

type SwatchGroupProps = {
  legend: string;
  options: PaletteOption[];
  value: string;
  onChange: (option: PaletteOption) => void;
};

export function SwatchGroup({ legend, options, value, onChange }: SwatchGroupProps) {
  return (
    <fieldset className="v2-fieldset">
      <legend>{legend}</legend>
      <div className="v2-swatches">
        {options.map((option) => (
          <button
            className="v2-swatch"
            data-active={option.id === value}
            key={option.id}
            onClick={() => onChange(option)}
            type="button"
            aria-label={`${legend}: ${option.label}`}
            aria-pressed={option.id === value}
            title={option.label}
          >
            <span style={{ background: option.uiSwatch }} />
            <small>{option.label}</small>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
