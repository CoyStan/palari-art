import attributeRecords from "./avatar-attributes.json";

export const avatarFeatureGroups = [
  {
    key: "apparentAge",
    label: "Apparent age",
    options: [
      ["teen", "Teen"],
      ["young_adult", "Young adult"],
      ["adult", "Adult"],
      ["middle_aged", "Middle-aged"],
      ["older_adult", "Older adult"],
    ],
  },
  {
    key: "skinTone",
    label: "Skin-tone band",
    options: [
      ["very_light", "Very light"],
      ["light", "Light"],
      ["medium", "Medium"],
      ["tan", "Tan"],
      ["brown", "Brown"],
      ["dark", "Dark"],
    ],
  },
  {
    key: "hairTexture",
    label: "Hair texture or style",
    options: [
      ["straight", "Straight"],
      ["wavy", "Wavy"],
      ["curly", "Curly"],
      ["coily", "Coily"],
      ["braids", "Braids"],
      ["locs", "Locs"],
      ["shaved", "Shaved"],
      ["bald", "Bald"],
      ["covered", "Covered"],
    ],
  },
  {
    key: "hairLength",
    label: "Hair length",
    options: [
      ["very_short", "Very short"],
      ["short", "Short"],
      ["medium", "Medium"],
      ["long", "Long"],
      ["bald", "Bald"],
      ["covered", "Covered"],
    ],
  },
  {
    key: "hairColor",
    label: "Hair color",
    options: [
      ["black", "Black"],
      ["dark_brown", "Dark brown"],
      ["brown", "Brown"],
      ["light_brown", "Light brown"],
      ["blonde", "Blonde"],
      ["red", "Red"],
      ["gray", "Gray"],
      ["white", "White"],
      ["multicolor", "Multicolor"],
      ["pink", "Pink"],
      ["covered", "Covered"],
      ["none", "No visible hair"],
    ],
  },
  {
    key: "facialHair",
    label: "Facial hair",
    options: [
      ["none", "None"],
      ["stubble", "Stubble"],
      ["mustache", "Mustache"],
      ["short_beard", "Short beard"],
      ["goatee", "Goatee"],
      ["full_beard", "Full beard"],
    ],
  },
  {
    key: "eyewear",
    label: "Eyewear",
    options: [
      ["glasses", "Glasses"],
      ["none", "No glasses"],
    ],
  },
  {
    key: "headwear",
    label: "Headwear",
    options: [
      ["none", "None"],
      ["headband", "Headband"],
      ["hijab", "Hijab"],
      ["turban", "Turban"],
    ],
  },
  {
    key: "earJewelry",
    label: "Ear jewelry",
    options: [
      ["none", "None"],
      ["studs", "Studs"],
      ["hoops", "Hoops"],
      ["drops", "Drops"],
      ["mixed", "Mixed"],
    ],
  },
  {
    key: "neckJewelry",
    label: "Neck jewelry",
    options: [
      ["none", "None"],
      ["necklace", "Necklace"],
      ["layered", "Layered"],
    ],
  },
  {
    key: "garmentType",
    label: "Garment style",
    options: [
      ["crewneck", "Crewneck"],
      ["v_neck", "V-neck"],
      ["turtleneck", "Turtleneck"],
      ["cardigan", "Cardigan"],
      ["cowl_neck", "Cowl neck"],
      ["jacket", "Jacket"],
      ["collared_shirt", "Collared shirt"],
      ["other", "Other"],
    ],
  },
] as const;

export type AvatarFeatureKey = (typeof avatarFeatureGroups)[number]["key"];

export type AvatarFeatures = Record<AvatarFeatureKey, string>;

export type AvatarFeatureSelection = Partial<Record<AvatarFeatureKey, readonly string[]>>;

export function avatarFeatureOptionCountKey(key: AvatarFeatureKey, value: string) {
  return `${key}:${value}`;
}

type AttributeRecord = AvatarFeatures & { avatarId: string };

export const avatarFeaturesById = new Map<string, AvatarFeatures>(
  (attributeRecords as AttributeRecord[]).map((record) => [
    record.avatarId,
    {
      apparentAge: record.apparentAge,
      skinTone: record.skinTone,
      hairColor: record.hairColor,
      hairTexture: record.hairTexture,
      hairLength: record.hairLength,
      facialHair: record.facialHair,
      eyewear: record.eyewear,
      headwear: record.headwear,
      earJewelry: record.earJewelry,
      neckJewelry: record.neckJewelry,
      garmentType: record.garmentType,
    },
  ]),
);

export function matchesAvatarFeatures(
  features: AvatarFeatures | undefined,
  selection: AvatarFeatureSelection,
  omittedKey?: AvatarFeatureKey,
) {
  for (const group of avatarFeatureGroups) {
    if (group.key === omittedKey) continue;
    const selectedValues = selection[group.key];
    if (!selectedValues || selectedValues.length === 0) continue;
    if (!features || !selectedValues.includes(features[group.key])) return false;
  }
  return true;
}
