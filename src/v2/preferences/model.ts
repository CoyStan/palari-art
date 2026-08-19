export const preferenceTargets = ["ceramic", "icon"] as const;
export type PreferenceTarget = (typeof preferenceTargets)[number];

export const verdicts = ["favorite", "keep", "mixed", "avoid"] as const;
export type PreferenceVerdict = (typeof verdicts)[number];

export type FeatureTag = {
  id: string;
  label: string;
};

export type TargetPreference = {
  verdict: PreferenceVerdict | null;
  likes: string[];
  dislikes: string[];
  note: string;
};

export type AvatarPreference = {
  ceramic: TargetPreference;
  icon: TargetPreference;
  updatedAt: string;
};

export type PreferenceRecords = Record<string, AvatarPreference>;

export type PreferenceFilter = "all" | "unreviewed" | PreferenceVerdict;

const sharedTags: FeatureTag[] = [
  { id: "silhouette", label: "Silhouette" },
  { id: "crown", label: "Crown" },
  { id: "opening", label: "Opening" },
  { id: "proportions", label: "Proportions" },
  { id: "eyes", label: "Eyes" },
  { id: "arm-pose", label: "Arm pose" },
  { id: "asymmetry", label: "Asymmetry" },
  { id: "color-placement", label: "Color placement" },
  { id: "seed-mark", label: "Seed mark" },
];

export const featureTags: Record<PreferenceTarget, FeatureTag[]> = {
  ceramic: [
    ...sharedTags,
    { id: "ceramic-texture", label: "Ceramic texture" },
    { id: "surface-volume", label: "Surface volume" },
    { id: "framing", label: "Framing" },
  ],
  icon: [
    ...sharedTags,
    { id: "flatness", label: "Flatness" },
    { id: "color-balance", label: "Color balance" },
    { id: "background", label: "Background" },
    { id: "small-size", label: "Small-size read" },
  ],
};

export const preferenceFilterOptions: Array<{ value: PreferenceFilter; label: string }> = [
  { value: "all", label: "All Palari" },
  { value: "unreviewed", label: "Needs review" },
  { value: "favorite", label: "Favorites" },
  { value: "keep", label: "Keep" },
  { value: "mixed", label: "Mixed" },
  { value: "avoid", label: "Avoid" },
];

export const verdictLabels: Record<PreferenceVerdict, string> = {
  favorite: "Favorite",
  keep: "Keep",
  mixed: "Mixed",
  avoid: "Avoid",
};

export function createEmptyTargetPreference(): TargetPreference {
  return { verdict: null, likes: [], dislikes: [], note: "" };
}

export function createEmptyAvatarPreference(): AvatarPreference {
  return {
    ceramic: createEmptyTargetPreference(),
    icon: createEmptyTargetPreference(),
    updatedAt: new Date(0).toISOString(),
  };
}

export function getAvatarPreference(records: PreferenceRecords, avatarId: string): AvatarPreference {
  return records[avatarId] ?? createEmptyAvatarPreference();
}

export function isPreferenceComplete(preference: AvatarPreference): boolean {
  return preference.ceramic.verdict !== null && preference.icon.verdict !== null;
}

export function matchesPreferenceFilter(preference: AvatarPreference, filter: PreferenceFilter): boolean {
  if (filter === "all") return true;
  if (filter === "unreviewed") return !isPreferenceComplete(preference);
  return preference.ceramic.verdict === filter || preference.icon.verdict === filter;
}
