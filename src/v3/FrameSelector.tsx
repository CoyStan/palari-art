import type { AvatarFrame } from "./download";

const frames: Array<{ value: AvatarFrame; label: string }> = [
  { value: "soft", label: "Soft" },
  { value: "circle", label: "Circle" },
  { value: "square", label: "Square" },
];

type FrameSelectorProps = {
  frame: AvatarFrame;
  onChange: (frame: AvatarFrame) => void;
};

export function FrameSelector({ frame, onChange }: FrameSelectorProps) {
  return (
    <fieldset className="v3-frame-control">
      <legend>Frame</legend>
      <div>
        {frames.map((option) => (
          <button
            key={option.value}
            type="button"
            data-active={frame === option.value}
            aria-pressed={frame === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
