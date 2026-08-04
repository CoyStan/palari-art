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
    name: `Avatar ${String(index + 1).padStart(3, "0")}`,
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
    name: `Avatar ${String(index + 11).padStart(3, "0")}`,
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
    name: `Avatar ${String(index + 39).padStart(3, "0")}`,
    src: `/avatars/los-5-fantasticos/fantastico-${number}.png`,
    collection: "Los 5 fantásticos",
    masks: storedMasks.get(id),
  };
});

function mixAvatars(items: Avatar[]) {
  const mixed = [...items];
  let seed = 0x50414c41;
  const random = () => {
    seed = (Math.imul(seed, 1_664_525) + 1_013_904_223) >>> 0;
    return seed / 0x1_0000_0000;
  };

  for (let index = mixed.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [mixed[index], mixed[swapIndex]] = [mixed[swapIndex], mixed[index]];
  }
  return mixed;
}

export const avatars = mixAvatars([...originalSet, ...expandedSet, ...fantasticosSet]);
