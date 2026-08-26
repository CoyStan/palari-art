import collection from "../../docs/palari-v3/collection.json";
import { assetUrl } from "../lib/assets";

export type PalariV3Avatar = {
  id: string;
  name: string;
  family: string;
  icon: string;
  thumbnail: string;
};

type CollectionRecord = {
  id: string;
  name: string;
  family: string;
  icon: string;
  thumbnail: string;
};

export const v3Avatars: PalariV3Avatar[] = (collection.avatars as CollectionRecord[]).map((avatar) => ({
  id: avatar.id,
  name: avatar.name,
  family: avatar.family,
  icon: assetUrl(avatar.icon),
  thumbnail: assetUrl(avatar.thumbnail),
}));
