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
  emoticon: string;
  emoticonThumbnail: string;
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
  const emoticonRoot = `palari-v2-icons-web/${id}`;
  return {
    id,
    name: `Palari ${id.slice(-3)}`,
    silhouette,
    source: `${assetRoot}/source.webp`,
    materialMask: `${assetRoot}/material.webp`,
    characteristicMask: `${assetRoot}/characteristic.webp`,
    emoticon: `${emoticonRoot}/icon.webp`,
    emoticonThumbnail: `${emoticonRoot}/thumbnail.webp`,
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
  avatar("palari-013", "Canopy"),
  avatar("palari-014", "Fin"),
  avatar("palari-015", "Ring"),
  avatar("palari-016", "Crest"),
  avatar("palari-017", "Cup"),
  avatar("palari-018", "Broad canopy"),
  avatar("palari-019", "Hush pod"),
  avatar("palari-020", "Doorway"),
  avatar("palari-021", "Tier"),
  avatar("palari-022", "Fin"),
  avatar("palari-023", "Horn"),
  avatar("palari-024", "Sash"),
  avatar("palari-025", "Funnel"),
  avatar("palari-026", "Tilt"),
  avatar("palari-027", "Profile"),
  avatar("palari-028", "Disc"),
  avatar("palari-029", "Sweep"),
  avatar("palari-030", "Cloak"),
  avatar("palari-031", "Hood"),
  avatar("palari-032", "Chalice"),
  avatar("palari-033", "Cocoon"),
  avatar("palari-034", "Bowl"),
  avatar("palari-035", "Crown"),
  avatar("palari-036", "Side bowl"),
  avatar("palari-037", "Aperture"),
  avatar("palari-038", "Thought"),
  avatar("palari-039", "Herald"),
  avatar("palari-040", "Sash pod"),
  avatar("palari-041", "Teardrop"),
];
