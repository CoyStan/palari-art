import type { PalariV3Avatar, PalariV3Selection } from "./data";
import { ProceduralPalari } from "./ProceduralPalari";

type AvatarPickerProps = {
  avatars: PalariV3Avatar[];
  activeAvatar: PalariV3Selection;
  onSelect: (avatar: PalariV3Avatar) => void;
};

export function AvatarPicker({ avatars, activeAvatar, onSelect }: AvatarPickerProps) {
  return (
    <div className="v3-avatar-grid" aria-label="Palari avatars">
      {avatars.map((avatar) => (
        <button
          key={avatar.id}
          type="button"
          className="v3-avatar-tile"
          data-active={avatar.id === activeAvatar.id}
          aria-pressed={avatar.id === activeAvatar.id}
          aria-label={`Choose ${avatar.name}`}
          title={avatar.name}
          onClick={() => onSelect(avatar)}
        >
          {avatar.rig ? (
            <ProceduralPalari rig={avatar.rig} motionEnabled={false} bounceSignal={0} view="cover" />
          ) : (
            <img src={avatar.thumbnail} alt="" width="256" height="256" loading="eager" decoding="async" />
          )}
        </button>
      ))}
    </div>
  );
}
