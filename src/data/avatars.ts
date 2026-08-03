import maskRegistry from "./avatar-masks.json";
import type { AvatarMaskSources } from "../lib/recolor";

export type AvatarCollection = "Original set" | "Expanded set" | "Los 5 fantásticos" | "Uploads";

export type Avatar = {
  id: string;
  name: string;
  src: string;
  collection: AvatarCollection;
  masks?: AvatarMaskSources;
};

const storedMasks = new Map<string, AvatarMaskSources>(
  maskRegistry.avatars.map((avatar) => [
    avatar.id,
    {
      foreground: `/masks/${avatar.id}/foreground.png`,
      matte: `/masks/${avatar.id}/matte.png`,
      shirt: `/masks/${avatar.id}/shirt.png`,
    },
  ]),
);

const originalSet: Avatar[] = Array.from({ length: 10 }, (_, index) => {
  const number = String(index + 1).padStart(2, "0");
  const id = `original-${number}`;
  return {
    id,
    name: `Portrait ${number}`,
    src: `/avatars/standardized-1x1/avatar-${number}.png`,
    collection: "Original set",
    masks: storedMasks.get(id),
  };
});

const expandedSet: Avatar[] = Array.from({ length: 28 }, (_, index) => {
  const number = String(index + 1).padStart(2, "0");
  const id = `expanded-${number}`;
  return {
    id,
    name: `Portrait ${number}`,
    src: `/avatars/standardized-4x4/avatar-4x4-${number}-v1.png`,
    collection: "Expanded set",
    masks: storedMasks.get(id),
  };
});

const fantasticosSet: Avatar[] = Array.from({ length: 105 }, (_, index) => {
  const number = String(index + 1).padStart(3, "0");
  const id = `fantasticos-${number}`;
  return {
    id,
    name: `Fantástico ${number}`,
    src: `/avatars/los-5-fantasticos/fantastico-${number}.png`,
    collection: "Los 5 fantásticos",
    masks: storedMasks.get(id),
  };
});

export const avatars = [...originalSet, ...expandedSet, ...fantasticosSet];
