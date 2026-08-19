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
  avatar("palari-042", "Twin-petal lantern"),
  avatar("palari-043", "Leaning shelter"),
  avatar("palari-044", "Forward curl"),
  avatar("palari-045", "Pebble pod"),
  avatar("palari-046", "Double shell"),
  avatar("palari-047", "Cairn"),
  avatar("palari-048", "Obelisk"),
  avatar("palari-049", "Deep hood"),
  avatar("palari-050", "Ribbon"),
  avatar("palari-051", "Seed pod"),
  avatar("palari-052", "Petal bell"),
  avatar("palari-053", "Two-lobe stack"),
  avatar("palari-054", "Hook hood"),
  avatar("palari-055", "Twin wall"),
  avatar("palari-056", "Backward crescent"),
  avatar("palari-057", "Egg pod"),
  avatar("palari-058", "Asymmetric bell"),
  avatar("palari-059", "Petal stack"),
  avatar("palari-060", "Fluted column"),
  avatar("palari-061", "Cantilever"),
  avatar("palari-062", "Sickle"),
  avatar("palari-063", "Capsule"),
  avatar("palari-064", "Nested bell"),
  avatar("palari-065", "Top-heavy stack"),
  avatar("palari-066", "Leaning column"),
  avatar("palari-067", "Ringed arch"),
  avatar("palari-068", "Wingback"),
  avatar("palari-069", "Faceted pod"),
  avatar("palari-070", "Twin-petal bell"),
  avatar("palari-071", "Offset stack"),
  avatar("palari-072", "Torsion"),
  avatar("palari-073", "Cantilever arch"),
  avatar("palari-074", "Closed wing"),
  avatar("palari-075", "Pear pod"),
  avatar("palari-076", "Cloak bell"),
  avatar("palari-077", "Twin stack"),
  avatar("palari-078", "Fork crown"),
  avatar("palari-079", "Vault"),
  avatar("palari-080", "High crest"),
  avatar("palari-081", "Bean pod"),
  avatar("palari-082", "Wide skirt"),
];
