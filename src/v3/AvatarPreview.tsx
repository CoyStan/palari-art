import type { AvatarFrame } from "./download";
import type { PalariV3Avatar } from "./data";

type AvatarPreviewProps = {
  avatar: PalariV3Avatar;
  frame: AvatarFrame;
};

export function AvatarPreview({ avatar, frame }: AvatarPreviewProps) {
  return (
    <section className="v3-preview-card" aria-label={`${avatar.name} avatar preview`}>
      <div className="v3-preview-art" data-frame={frame}>
        <img key={avatar.id} src={avatar.icon} alt={`${avatar.name}, a friendly Palari avatar`} />
      </div>
      <h2>{avatar.name}</h2>
    </section>
  );
}
