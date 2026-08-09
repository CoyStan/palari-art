import grammar from "../../docs/palari-v2/shape-grammar.json";

export type PaletteOption = {
  id: string;
  label: string;
  uiSwatch: string;
};

export type PalariV2Avatar = {
  id: string;
  name: string;
  silhouette: string;
  source: string;
  materialMask: string;
  characteristicMask: string;
};

export const materials: PaletteOption[] = grammar.materials;
export const characteristicColors: PaletteOption[] = grammar.characteristicColors;

export const backgrounds: PaletteOption[] = [
  { id: "plaster", label: "Plaster", uiSwatch: "#EEE8DC" },
  { id: "mist", label: "Mist", uiSwatch: "#DCE3E1" },
  { id: "dusk", label: "Dusk", uiSwatch: "#2E3034" },
  { id: "clay", label: "Clay", uiSwatch: "#C8A58B" },
];

function avatar(id: string, silhouette: string): PalariV2Avatar {
  const assetRoot = `palari-v2-web/${id}`;
  return {
    id,
    name: `Palari ${id.slice(-3)}`,
    silhouette,
    source: `${assetRoot}/source.webp`,
    materialMask: `${assetRoot}/material.webp`,
    characteristicMask: `${assetRoot}/characteristic.webp`,
  };
}

export const v2Avatars: PalariV2Avatar[] = [
  avatar("palari-001", "Column"),
  avatar("palari-002", "Arch"),
  avatar("palari-003", "Bell"),
  avatar("palari-004", "Column"),
  avatar("palari-005", "Arch"),
  avatar("palari-006", "Crescent"),
  avatar("palari-007", "Crescent"),
  avatar("palari-008", "Pod"),
  avatar("palari-009", "Pod"),
  avatar("palari-010", "Stack"),
  avatar("palari-011", "Stack"),
  avatar("palari-012", "Bell"),
];
