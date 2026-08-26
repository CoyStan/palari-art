import collection from "../../docs/palari-v3/collection.json";
import { assetUrl } from "../lib/assets";
import { generatePalari, palariRigForAvatar, type PalariRig } from "./procedural";

export type PalariV3Avatar = {
  kind: "bundled";
  id: string;
  name: string;
  family: string;
  icon: string;
  thumbnail: string;
  rig?: PalariRig;
};

export type GeneratedPalariV3Avatar = {
  kind: "generated";
  id: string;
  name: string;
  family: string;
  rig: PalariRig;
};

export type PalariV3Selection = PalariV3Avatar | GeneratedPalariV3Avatar;

type CollectionRecord = {
  id: string;
  name: string;
  family: string;
  icon: string;
  thumbnail: string;
};

export const v3Avatars: PalariV3Avatar[] = (collection.avatars as CollectionRecord[]).map((avatar) => ({
  kind: "bundled",
  id: avatar.id,
  name: avatar.name,
  family: avatar.family,
  icon: assetUrl(avatar.icon),
  thumbnail: assetUrl(avatar.thumbnail),
  rig: palariRigForAvatar(avatar.id),
}));

export function makeGeneratedPalari(seed: number): GeneratedPalariV3Avatar {
  const rig = generatePalari(seed);
  return {
    kind: "generated",
    id: `generated-${rig.seed}`,
    name: rig.name,
    family: rig.family,
    rig,
  };
}
