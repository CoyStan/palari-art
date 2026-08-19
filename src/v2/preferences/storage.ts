import type { PalariV2Avatar } from "../data";
import {
  createEmptyAvatarPreference,
  featureTags,
  preferenceTargets,
  verdicts,
  type AvatarPreference,
  type PreferenceRecords,
  type PreferenceTarget,
  type PreferenceVerdict,
  type TargetPreference,
} from "./model";

const SCHEMA_VERSION = 1;
export const preferenceStorageKey = "palari.v2.preferences.v1";

const allowedVerdicts = new Set<string>(verdicts);
const allowedTags: Record<PreferenceTarget, Set<string>> = {
  ceramic: new Set(featureTags.ceramic.map((tag) => tag.id)),
  icon: new Set(featureTags.icon.map((tag) => tag.id)),
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function featureId(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (isRecord(value) && typeof value.id === "string") return value.id;
  return null;
}

function sanitizeFeatures(value: unknown, target: PreferenceTarget): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(featureId).filter((id): id is string => Boolean(id && allowedTags[target].has(id))))];
}

function sanitizeTarget(value: unknown, target: PreferenceTarget): TargetPreference {
  if (!isRecord(value)) return { verdict: null, likes: [], dislikes: [], note: "" };
  const verdict = typeof value.verdict === "string" && allowedVerdicts.has(value.verdict)
    ? value.verdict as PreferenceVerdict
    : null;
  const likes = sanitizeFeatures(value.likes, target);
  const likeSet = new Set(likes);
  const dislikes = sanitizeFeatures(value.dislikes, target).filter((id) => !likeSet.has(id));
  return {
    verdict,
    likes,
    dislikes,
    note: typeof value.note === "string" ? value.note.slice(0, 1000) : "",
  };
}

function sanitizeAvatarPreference(value: unknown): AvatarPreference {
  const record = isRecord(value) ? value : {};
  const fallback = createEmptyAvatarPreference();
  return {
    ceramic: sanitizeTarget(record.ceramic, "ceramic"),
    icon: sanitizeTarget(record.icon, "icon"),
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : fallback.updatedAt,
  };
}

function recordsFromUnknown(value: unknown, allowedIds: Set<string>): PreferenceRecords {
  const records: PreferenceRecords = {};
  if (Array.isArray(value)) {
    for (const entry of value) {
      if (!isRecord(entry)) continue;
      const avatarId = typeof entry.avatarId === "string" ? entry.avatarId : typeof entry.id === "string" ? entry.id : null;
      if (avatarId && allowedIds.has(avatarId)) records[avatarId] = sanitizeAvatarPreference(entry);
    }
    return records;
  }
  if (!isRecord(value)) return records;
  for (const [avatarId, preference] of Object.entries(value)) {
    if (allowedIds.has(avatarId)) records[avatarId] = sanitizeAvatarPreference(preference);
  }
  return records;
}

export function loadPreferenceRecords(avatars: PalariV2Avatar[]): PreferenceRecords {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(preferenceStorageKey);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.schemaVersion !== SCHEMA_VERSION) return {};
    return recordsFromUnknown(parsed.records, new Set(avatars.map((avatar) => avatar.id)));
  } catch {
    return {};
  }
}

export function savePreferenceRecords(records: PreferenceRecords): void {
  window.localStorage.setItem(preferenceStorageKey, JSON.stringify({ schemaVersion: SCHEMA_VERSION, records }));
}

export function parsePreferenceImport(text: string, avatars: PalariV2Avatar[]): PreferenceRecords {
  const parsed: unknown = JSON.parse(text);
  if (!isRecord(parsed) || parsed.schemaVersion !== SCHEMA_VERSION || parsed.kind !== "palari-v2-preferences") {
    throw new Error("This is not a Palari V2 preference export.");
  }
  const records = recordsFromUnknown(parsed.records, new Set(avatars.map((avatar) => avatar.id)));
  if (Object.keys(records).length === 0) throw new Error("The file contains no recognized Palari preferences.");
  return records;
}

function exportedTarget(preference: TargetPreference, target: PreferenceTarget) {
  const labels = new Map(featureTags[target].map((tag) => [tag.id, tag.label]));
  return {
    verdict: preference.verdict,
    likes: preference.likes.map((id) => ({ id, label: labels.get(id) ?? id })),
    dislikes: preference.dislikes.map((id) => ({ id, label: labels.get(id) ?? id })),
    note: preference.note,
  };
}

export function serializePreferenceExport(records: PreferenceRecords, avatars: PalariV2Avatar[]): string {
  const exportedRecords = avatars.flatMap((avatar) => {
    const preference = records[avatar.id];
    if (!preference || !avatarHasFeedback(preference)) return [];
    return [{
      avatarId: avatar.id,
      name: avatar.name,
      silhouette: avatar.silhouette,
      ceramic: exportedTarget(preference.ceramic, "ceramic"),
      icon: exportedTarget(preference.icon, "icon"),
      updatedAt: preference.updatedAt,
    }];
  });
  return `${JSON.stringify({
    schemaVersion: SCHEMA_VERSION,
    kind: "palari-v2-preferences",
    exportedAt: new Date().toISOString(),
    collection: { count: avatars.length, firstId: avatars[0]?.id, lastId: avatars.at(-1)?.id },
    records: exportedRecords,
  }, null, 2)}\n`;
}

export function targetHasFeedback(preference: TargetPreference): boolean {
  return preference.verdict !== null || preference.likes.length > 0 || preference.dislikes.length > 0 || preference.note.trim() !== "";
}

export function avatarHasFeedback(preference: AvatarPreference): boolean {
  return preferenceTargets.some((target) => targetHasFeedback(preference[target]));
}
