import maskRegistry from "./avatar-masks.json";
import framingRegistry from "./avatar-framing.json";
import type { AvatarFraming, AvatarMaskSources } from "../lib/recolor";
import { assetUrl } from "../lib/assets";
import { avatarFeaturesById, type AvatarFeatures } from "./avatar-features";

export type AvatarCollection = "Original set" | "Expanded set" | "Los 5 fantásticos" | "Coverage expansion" | "Uploads";

export type Avatar = {
  id: string;
  name: string;
  src: string;
  webSrc?: string;
  thumbnailSrc?: string;
  collection: AvatarCollection;
  masks?: AvatarMaskSources;
  framing?: AvatarFraming;
  features?: AvatarFeatures;
};

function webAssetPath(src: string, tier: "full" | "thumbnail") {
  return src
    .replace(/^\/avatars\//, `/avatars-web/${tier}/`)
    .replace(/\.png$/i, ".webp");
}

const storedFraming = new Map<string, AvatarFraming>(
  framingRegistry.avatars.map((avatar) => [
    avatar.id,
    {
      scale: avatar.scale,
      centerX: avatar.centerX,
      centerY: avatar.centerY,
    },
  ]),
);

const storedMasks = new Map<string, AvatarMaskSources>(
  maskRegistry.avatars.map((avatar) => [
    avatar.id,
    (() => {
      const hairMattingDisabled = "hairMatting" in avatar && avatar.hairMatting === false;
      const useHairMatting = !hairMattingDisabled
        && (maskRegistry.hairMattingCoverage === "all" || avatar.hairPilot);
      return {
        foreground: assetUrl(`/masks-web/${avatar.id}/foreground.webp`),
        matte: assetUrl(`/masks-web/${avatar.id}/matte.webp`),
        shirt: assetUrl(`/masks-web/${avatar.id}/shirt.webp`),
        ...(useHairMatting
          ? {
              hairMatting: {
                coarse: assetUrl(`/masks-web/${avatar.id}/hair.webp`),
                region: assetUrl(`/masks-web/${avatar.id}/hair-region.webp`),
                matte: assetUrl(`/masks-web/${avatar.id}/hair-matte.webp`),
                foreground: assetUrl(`/masks-web/${avatar.id}/hair-foreground.webp`),
                underlay: assetUrl(`/masks-web/${avatar.id}/hair-underlay.webp`),
                underlayKind: assetUrl(`/masks-web/${avatar.id}/hair-underlay-kind.webp`),
              },
            }
          : {}),
      };
    })(),
  ]),
);

const originalSet: Avatar[] = Array.from({ length: 10 }, (_, index) => {
  const number = String(index + 1).padStart(2, "0");
  const id = `original-${number}`;
  const src = `/avatars/standardized-1x1/avatar-${number}.png`;
  return {
    id,
    name: `Avatar ${String(index + 1).padStart(3, "0")}`,
    src: assetUrl(src),
    webSrc: assetUrl(webAssetPath(src, "full")),
    thumbnailSrc: assetUrl(webAssetPath(src, "thumbnail")),
    collection: "Original set",
    masks: storedMasks.get(id),
    framing: storedFraming.get(id),
    features: avatarFeaturesById.get(id),
  };
});

const expandedSet: Avatar[] = Array.from({ length: 28 }, (_, index) => {
  const number = String(index + 1).padStart(2, "0");
  const id = `expanded-${number}`;
  const src = `/avatars/standardized-4x4/avatar-4x4-${number}-v1.png`;
  return {
    id,
    name: `Avatar ${String(index + 11).padStart(3, "0")}`,
    src: assetUrl(src),
    webSrc: assetUrl(webAssetPath(src, "full")),
    thumbnailSrc: assetUrl(webAssetPath(src, "thumbnail")),
    collection: "Expanded set",
    masks: storedMasks.get(id),
    framing: storedFraming.get(id),
    features: avatarFeaturesById.get(id),
  };
});

const fantasticosSet: Avatar[] = Array.from({ length: 105 }, (_, index) => {
  const number = String(index + 1).padStart(3, "0");
  const id = `fantasticos-${number}`;
  const src = `/avatars/los-5-fantasticos/fantastico-${number}.png`;
  return {
    id,
    name: `Avatar ${String(index + 39).padStart(3, "0")}`,
    src: assetUrl(src),
    webSrc: assetUrl(webAssetPath(src, "full")),
    thumbnailSrc: assetUrl(webAssetPath(src, "thumbnail")),
    collection: "Los 5 fantásticos",
    masks: storedMasks.get(id),
    framing: storedFraming.get(id),
    features: avatarFeaturesById.get(id),
  };
});

const coverageExpansion: Avatar[] = Array.from({ length: 14 }, (_, index) => {
  const number = String(index + 1).padStart(3, "0");
  const id = `coverage-${number}`;
  const src = `/avatars/coverage-expansion/avatar-coverage-${number}.png`;
  return {
    id,
    name: `Avatar ${String(index + 144).padStart(3, "0")}`,
    src: assetUrl(src),
    webSrc: assetUrl(webAssetPath(src, "full")),
    thumbnailSrc: assetUrl(webAssetPath(src, "thumbnail")),
    collection: "Coverage expansion",
    masks: storedMasks.get(id),
    framing: storedFraming.get(id),
    features: avatarFeaturesById.get(id),
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

const retiredAvatarIds = new Set(["expanded-14"]);

export const avatars = mixAvatars([
  ...originalSet,
  ...expandedSet,
  ...fantasticosSet,
  ...coverageExpansion,
]).filter((avatar) => !retiredAvatarIds.has(avatar.id));
