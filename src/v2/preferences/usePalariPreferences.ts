import { useCallback, useEffect, useMemo, useState } from "react";
import type { PalariV2Avatar } from "../data";
import {
  createEmptyAvatarPreference,
  isPreferenceComplete,
  type PreferenceRecords,
  type PreferenceTarget,
  type PreferenceVerdict,
} from "./model";
import {
  avatarHasFeedback,
  loadPreferenceRecords,
  parsePreferenceImport,
  savePreferenceRecords,
  serializePreferenceExport,
} from "./storage";

type FeatureDisposition = "likes" | "dislikes";

function downloadTextFile(fileName: string, contents: string): void {
  const url = URL.createObjectURL(new Blob([contents], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function usePalariPreferences(avatars: PalariV2Avatar[]) {
  const [records, setRecords] = useState<PreferenceRecords>(() => loadPreferenceRecords(avatars));
  const [notice, setNotice] = useState("");
  const [storageAvailable, setStorageAvailable] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        savePreferenceRecords(records);
        setStorageAvailable(true);
      } catch {
        setStorageAvailable(false);
      }
    }, 150);
    return () => window.clearTimeout(timeout);
  }, [records]);

  const updateTarget = useCallback((
    avatarId: string,
    target: PreferenceTarget,
    update: (current: ReturnType<typeof createEmptyAvatarPreference>[PreferenceTarget]) => ReturnType<typeof createEmptyAvatarPreference>[PreferenceTarget],
  ) => {
    setRecords((current) => {
      const existing = current[avatarId] ?? createEmptyAvatarPreference();
      return {
        ...current,
        [avatarId]: {
          ...existing,
          [target]: update(existing[target]),
          updatedAt: new Date().toISOString(),
        },
      };
    });
  }, []);

  const setVerdict = useCallback((avatarId: string, target: PreferenceTarget, verdict: PreferenceVerdict) => {
    updateTarget(avatarId, target, (current) => ({
      ...current,
      verdict: current.verdict === verdict ? null : verdict,
    }));
  }, [updateTarget]);

  const toggleFeature = useCallback((
    avatarId: string,
    target: PreferenceTarget,
    disposition: FeatureDisposition,
    featureId: string,
  ) => {
    updateTarget(avatarId, target, (current) => {
      const opposite: FeatureDisposition = disposition === "likes" ? "dislikes" : "likes";
      const active = current[disposition].includes(featureId);
      return {
        ...current,
        [disposition]: active
          ? current[disposition].filter((id) => id !== featureId)
          : [...current[disposition], featureId],
        [opposite]: current[opposite].filter((id) => id !== featureId),
      };
    });
  }, [updateTarget]);

  const setNote = useCallback((avatarId: string, target: PreferenceTarget, note: string) => {
    updateTarget(avatarId, target, (current) => ({ ...current, note: note.slice(0, 1000) }));
  }, [updateTarget]);

  const exportPreferences = useCallback(() => {
    downloadTextFile("palari-v2-preferences.json", serializePreferenceExport(records, avatars));
    const count = Object.values(records).filter(avatarHasFeedback).length;
    setNotice(`Exported ${count} Palari preference ${count === 1 ? "record" : "records"}.`);
  }, [avatars, records]);

  const importPreferences = useCallback(async (file: File) => {
    try {
      const imported = parsePreferenceImport(await file.text(), avatars);
      setRecords((current) => ({ ...current, ...imported }));
      const count = Object.keys(imported).length;
      setNotice(`Imported ${count} Palari preference ${count === 1 ? "record" : "records"}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not import that preference file.");
    }
  }, [avatars]);

  const completedCount = useMemo(
    () => avatars.reduce((count, avatar) => count + Number(isPreferenceComplete(records[avatar.id] ?? createEmptyAvatarPreference())), 0),
    [avatars, records],
  );

  return {
    records,
    completedCount,
    notice,
    storageAvailable,
    setVerdict,
    toggleFeature,
    setNote,
    exportPreferences,
    importPreferences,
  };
}
