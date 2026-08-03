import maskPilot from "./mask-pilot.json";
import type { AvatarMaskSources } from "../lib/recolor";

export type AvatarCollection = "Original set" | "Expanded set" | "Uploads";

export type Avatar = {
  id: string;
  name: string;
  src: string;
  collection: AvatarCollection;
  masks?: AvatarMaskSources;
};

const pilotMasks = new Map<string, AvatarMaskSources>(
  maskPilot.avatars.map((avatar) => [
    avatar.id,
    {
      person: `/masks/${avatar.id}/person.png`,
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
    masks: pilotMasks.get(id),
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
    masks: pilotMasks.get(id),
  };
});

export const avatars = [...originalSet, ...expandedSet];
