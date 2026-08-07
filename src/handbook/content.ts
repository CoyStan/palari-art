export type PageLayout =
  | "cover"
  | "title"
  | "contents"
  | "manifesto"
  | "opener"
  | "essay"
  | "plate"
  | "comparison"
  | "checklist"
  | "references";

export type HandbookPage = {
  number: number;
  chapter: string;
  layout: PageLayout;
  title: string;
  deck: string;
  body?: string;
  bullets?: string[];
  plateId?: number;
  avatarIds?: string[];
  accent?: "coral" | "ochre" | "blue" | "sage";
};

export type HandbookChapter = {
  id: string;
  number: number;
  title: string;
  shortTitle: string;
  start: number;
  end: number;
};

export const chapters: HandbookChapter[] = [
  { id: "dna", number: 1, title: "Palari DNA", shortTitle: "DNA", start: 5, end: 10 },
  { id: "people", number: 2, title: "People, not presets", shortTitle: "People", start: 11, end: 20 },
  { id: "construction", number: 3, title: "Head construction", shortTitle: "Construction", start: 21, end: 28 },
  { id: "expression", number: 4, title: "Eyes and expression", shortTitle: "Expression", start: 29, end: 36 },
  { id: "features", number: 5, title: "Noses, mouths, and age", shortTitle: "Features", start: 37, end: 42 },
  { id: "hair", number: 6, title: "Hair architecture", shortTitle: "Hair", start: 43, end: 52 },
  { id: "wardrobe", number: 7, title: "Headwear and garments", shortTitle: "Wardrobe", start: 53, end: 60 },
  { id: "materials", number: 8, title: "Light, color, and materials", shortTitle: "Materials", start: 61, end: 66 },
  { id: "space", number: 9, title: "Framing, rotation, and 3D", shortTitle: "Space & 3D", start: 67, end: 72 },
  { id: "production", number: 10, title: "Production and QA", shortTitle: "Production", start: 73, end: 76 },
];

const page = (
  number: number,
  chapter: string,
  layout: PageLayout,
  title: string,
  deck: string,
  extra: Partial<HandbookPage> = {},
): HandbookPage => ({ number, chapter, layout, title, deck, ...extra });

export const pages: HandbookPage[] = [
  page(1, "front", "cover", "Palari", "The Character Design Handbook", { plateId: 1, accent: "coral" }),
  page(2, "front", "title", "A shared visual world", "Built from individual faces.", {
    body: "Palari is a warm, optimistic portrait language between animation character design and editorial portraiture. This first edition turns the visual system into a practical, inclusive guide.",
    accent: "ochre",
  }),
  page(3, "front", "contents", "Contents", "Ten chapters from first shape to final production.", {
    body: "Read in sequence, or use the chapter rail as a studio reference while designing, reviewing, modeling, or masking a portrait.",
  }),
  page(4, "front", "manifesto", "Consistency without sameness", "The Palari inclusion charter", {
    body: "Palari characters represent individuals, not regional or demographic presets. Human features overlap across populations; references guide design, assumptions do not.",
    bullets: [
      "Observe the individual instead of selecting a demographic template.",
      "Vary anatomy—not merely skin color, hair, or accessories.",
      "Never infer ethnicity, nationality, religion, or identity from appearance.",
      "Show the same emotional range across visibly different faces.",
      "Research cultural clothing and headwear with multiple precise references.",
    ],
    plateId: 18,
    accent: "sage",
  }),

  page(5, "dna", "opener", "Palari DNA", "Recognizable as one world. Memorable as one person.", { plateId: 1, accent: "coral" }),
  page(6, "dna", "essay", "Begin with the frame", "The square portrait is a designed stage.", {
    body: "Work at eye level. Keep the complete hair or head covering, full neck, both shoulders, and enough upper chest to ground the portrait. The shoulder arc stabilizes the composition.",
    bullets: ["Square 1:1 frame", "Restrained front or three-quarter view", "Complete head and shoulders", "Approachable camera height"],
    plateId: 1,
  }),
  page(7, "dna", "plate", "Skull before styling", "Construction carries identity before hair, color, or accessories arrive.", {
    body: "Build the cranium, muzzle, jaw, neck, and ears first. A Palari is simplified, not flat: broad planes remain believable beneath the polished surface.",
    plateId: 11,
  }),
  page(8, "dna", "comparison", "Shape language", "Soft geometry with a clear silhouette.", {
    bullets: ["Generous cranium", "Designed jaw rhythm", "Readable cheek volume", "Neck with believable weight", "Subtle asymmetry"],
    plateId: 6,
    avatarIds: ["original-02", "original-03", "original-09", "coverage-003"],
  }),
  page(9, "dna", "essay", "Large shapes win", "Detail should clarify, never compete.", {
    body: "Check the portrait as a thumbnail before inspecting eyelashes, knit grain, or flyaways. If the silhouette, gaze, and shoulder base do not read at small size, detail will not repair them.",
    plateId: 9,
  }),
  page(10, "dna", "checklist", "DNA checkpoint", "Approve the foundation before moving to features.", {
    bullets: ["Identity reads without color", "Eyes sit in believable sockets", "Head and shoulders are complete", "Expression is warm but not generic", "Large value groups stay separated"],
    avatarIds: ["original-01", "original-04", "coverage-001", "coverage-005"],
  }),

  page(11, "people", "opener", "People, not presets", "Observation is more specific than assumption.", { plateId: 18, accent: "sage" }),
  page(12, "people", "plate", "Six constructions", "Six faces begin with six different structural relationships.", {
    body: "Compare eyelid structure, eye spacing, brow rhythm, bridge height, tip shape, cheek volume, jaw width, and age. None of these observations defines a population.",
    plateId: 18,
  }),
  page(13, "people", "essay", "Variation overlaps", "A feature never tells the whole story.", {
    body: "Human traits are continuous and overlapping. Design a complete individual from several observed relationships rather than assembling a regional checklist.",
    bullets: ["Use multiple references", "Look for relationships, not labels", "Avoid a single default skull", "Let features vary independently"],
    avatarIds: ["coverage-002", "coverage-004", "coverage-008", "coverage-011"],
  }),
  page(14, "people", "comparison", "Beyond a recolored default", "Diversity begins in construction.", {
    body: "Changing only surface color leaves the same face underneath. Change the cranium, jaw, cheeks, feature spacing, eyelids, nose, mouth, age, and silhouette with equal care.",
    plateId: 6,
  }),
  page(15, "people", "plate", "Shared emotion", "Emotion is shared. Anatomy remains individual.", {
    body: "Across different faces, a gentle smile still coordinates lids, brows, cheeks, lips, and jaw. Preserve every person’s structure while the expression changes.",
    plateId: 19,
  }),
  page(16, "people", "essay", "Expression is not geography", "Do not assign emotional behavior to a region or ethnicity.", {
    body: "Culture may shape context, gesture, or storytelling, but this handbook never treats expression as regional anatomy. Give every face access to the same nuanced emotional range.",
    bullets: ["Start from neutral", "Track coordinated muscle changes", "Preserve identity", "Avoid caricature"],
  }),
  page(17, "people", "comparison", "Age is structural", "Age changes proportion, planes, posture, and material response.", {
    body: "Avoid reducing age to wrinkle symbols. Study eyelid weight, cheek support, mouth volume, jaw transition, hair character, and the way soft light travels across the face.",
    plateId: 6,
    avatarIds: ["coverage-001", "coverage-002", "coverage-003", "coverage-004"],
  }),
  page(18, "people", "essay", "Cultural specificity", "Respect starts with precise reference.", {
    body: "A hijab, turban, braid pattern, garment, or piece of jewelry is not generic decoration. Research construction, material, wrapping logic, and context with more than one source.",
    plateId: 15,
    avatarIds: ["original-01", "coverage-007", "coverage-012"],
  }),
  page(19, "people", "comparison", "Labels describe the artwork", "They do not define a person.", {
    body: "Internal coverage labels help find visual gaps. They are not demographic truth and must never be exposed as claims about ethnicity, nationality, religion, gender identity, or exact age.",
    avatarIds: ["coverage-005", "coverage-009", "coverage-010", "coverage-014"],
  }),
  page(20, "people", "checklist", "Inclusion checkpoint", "Reference beats assumption.", {
    bullets: ["Every face has a distinct construction", "No region is reduced to one look", "Skin tone is not the only variation", "Expressions remain available to everyone", "Cultural elements use precise references", "Captions avoid inferred identity"],
    plateId: 18,
  }),

  page(21, "construction", "opener", "Head construction", "Build the volume that styling will reveal.", { plateId: 11, accent: "blue" }),
  page(22, "construction", "plate", "Cranium, muzzle, jaw", "Three interlocking masses establish the head.", {
    body: "Block a generous cranium, a soft mouth barrel, and a designed jaw before smoothing transitions. The neck enters beneath the skull as a supporting cylinder, not a narrow peg.",
    plateId: 11,
  }),
  page(23, "construction", "essay", "Landmarks travel together", "Brows, eyes, nose, mouth, and chin wrap around one volume.", {
    bullets: ["Brow ridge", "Eye line", "Nose base", "Mouth barrel", "Chin", "Ear placement"],
    plateId: 10,
  }),
  page(24, "construction", "comparison", "Front to three-quarter", "Turn the head; do not slide the features.", {
    body: "The far eye narrows, the nose overlaps, the mouth wraps, and the jaw silhouette changes. Preserve skull width and feature spacing through the turn.",
    plateId: 10,
  }),
  page(25, "construction", "plate", "The profile test", "One silhouette reveals many construction errors.", {
    body: "Seat the eye in its socket. Design the forehead, nose, lips, chin, jaw, and neck as one coherent rhythm rather than isolated symbols.",
    plateId: 10,
  }),
  page(26, "construction", "essay", "Cheeks connect the face", "Cheek volume mediates eyes, nose, mouth, and jaw.", {
    body: "A smile lifts the cheek and changes the lower eyelid. A face at rest still carries soft volume. Avoid flat masks and pinched transitions.",
    plateId: 11,
  }),
  page(27, "construction", "comparison", "Neutral clay first", "Construction problems are easier to see without color.", {
    body: "Review a simple clay pass before hair, skin, and fabric conceal the planes. Keep the broad animation-friendly structure through the final render.",
    plateId: 17,
  }),
  page(28, "construction", "checklist", "Construction checkpoint", "The head should survive every angle.", {
    bullets: ["Cranium remains generous", "Features wrap around volume", "Profile reads as one rhythm", "Ears and neck track the turn", "Neutral clay preserves identity"],
  }),

  page(29, "expression", "opener", "Eyes and expression", "Warmth lives in coordinated change.", { plateId: 2, accent: "ochre" }),
  page(30, "expression", "plate", "Eyes sit in sockets", "Stylized scale still needs believable lids and depth.", {
    body: "Weight the upper lid more than the lower. Let the eyeball turn inside the socket, and use one controlled catchlight system across both eyes.",
    plateId: 2,
  }),
  page(31, "expression", "comparison", "Lid structure varies", "Observe folds, exposure, tilt, and spacing independently.", {
    body: "Avoid one enlarged eye shape copied onto every face. The Palari language comes from warmth and clarity, not identical anatomy.",
    plateId: 2,
    avatarIds: ["original-03", "original-07", "original-10", "fantasticos-017"],
  }),
  page(32, "expression", "essay", "Brows are rhythm", "Brows connect thought, gaze, and attitude.", {
    bullets: ["Track the brow ridge", "Vary thickness and arc", "Coordinate with lids", "Keep asymmetry subtle"],
    plateId: 2,
  }),
  page(33, "expression", "plate", "From neutral to smile", "A believable expression changes more than the mouth.", {
    body: "Watch the lower lids, cheek lift, nostril movement, lip corners, and jaw. Preserve the person at every intermediate state.",
    plateId: 12,
  }),
  page(34, "expression", "comparison", "Quiet acting", "Favor readable middle-range emotion over theatrical distortion.", {
    body: "Palari expressions are present, friendly, and naturally asymmetric. Extreme squash, perfect mirroring, and symbolic eyebrows break the portrait language.",
    plateId: 9,
  }),
  page(35, "expression", "essay", "Gaze completes the pose", "Eyes, lids, brows, and head direction share one intention.", {
    body: "A sideways glance without a head response feels disconnected. Let gaze guide small changes in brow, cheek, mouth, and shoulder rhythm.",
    plateId: 9,
  }),
  page(36, "expression", "checklist", "Expression checkpoint", "The face should feel alive without becoming a different character.", {
    bullets: ["Both eyes share one light system", "Lids follow the eyeballs", "Brows belong to the brow ridge", "Cheeks participate in smiles", "Identity survives every pose"],
    plateId: 19,
  }),

  page(37, "features", "opener", "Noses, mouths, and age", "Small relationships create a specific face.", { plateId: 3, accent: "coral" }),
  page(38, "features", "plate", "Nose architecture", "Bridge, tip, wings, and nostrils form one volume.", {
    body: "Preserve genuine variety in width, projection, angle, and nostril rhythm. Use a restrained underside shadow rather than outlining every edge.",
    plateId: 3,
  }),
  page(39, "features", "comparison", "Mouths retain volume", "Even at rest, the lips wrap around the mouth barrel.", {
    body: "A smile alters cheeks and lower lids as well as lips. If teeth appear, group them as one quiet value instead of drawing individual tiles.",
    plateId: 3,
  }),
  page(40, "features", "essay", "Facial hair follows form", "Hair should reveal the jaw and mouth beneath it.", {
    bullets: ["Respect growth direction", "Preserve the lip line", "Keep beard mass readable", "Avoid pasted-on texture"],
    plateId: 5,
    avatarIds: ["original-06", "original-09", "coverage-011", "coverage-012"],
  }),
  page(41, "features", "plate", "Age changes planes", "Proportion and support matter more than wrinkle count.", {
    body: "Study lid weight, cheek support, mouth volume, jaw transition, posture, and hair character. Keep older faces warm, dimensional, and individually designed.",
    plateId: 6,
  }),
  page(42, "features", "checklist", "Feature checkpoint", "Specific without caricature.", {
    bullets: ["Nose reads as a volume", "Mouth wraps around the muzzle", "Smile coordinates the whole face", "Facial hair preserves structure", "Age is structural, not symbolic"],
  }),

  page(43, "hair", "opener", "Hair is architecture", "Build from large to small with intention.", { plateId: 4, accent: "blue" }),
  page(44, "hair", "plate", "Silhouette first", "The outer shape defines how the hair reads at a glance.", {
    body: "Preserve the skull beneath the design. Establish crown, hairline, weight, and balance before drawing clumps or individual strands.",
    plateId: 4,
  }),
  page(45, "hair", "essay", "Primary masses", "Large forms carry most of the volume.", {
    bullets: ["Straight hair: clean ribbons", "Waves: broad S-curves", "Curls: grouped coils", "Coils: clustered volume", "Braids and locs: repeated forms with variation"],
    plateId: 4,
  }),
  page(46, "hair", "comparison", "Secondary clumps", "Mid-size groups create rhythm and overlap.", {
    body: "Break the large silhouette where the flow turns, where masses overlap, and where gravity changes direction. Do not distribute detail evenly.",
    plateId: 13,
  }),
  page(47, "hair", "plate", "Selective strands", "A few purposeful strands add life.", {
    body: "Flyaways belong primarily at the silhouette and near meaningful overlaps. Random fuzz across the whole hairstyle destroys the large design.",
    plateId: 13,
  }),
  page(48, "hair", "comparison", "Hair structures", "Different structures need different edge languages.", {
    plateId: 4,
    avatarIds: ["original-02", "original-06", "original-07", "original-10", "coverage-004", "coverage-006"],
  }),
  page(49, "hair", "essay", "Shoulder overlaps", "Long hair and garments must remain independently readable.", {
    body: "Design each overlap. Keep the neckline, neck, shoulder, and hair edge distinct enough for color changes and masking without flattening the artwork.",
    plateId: 13,
  }),
  page(50, "hair", "comparison", "Avoid the halo", "Bright edge accents must describe hair, not borrowed background color.", {
    body: "Check fine curls and flyaways against light, dark, warm, and cool backgrounds. Reject colored outlines that move when the background changes.",
    plateId: 13,
  }),
  page(51, "hair", "plate", "Review at two scales", "Silhouette first. Edge detail second.", {
    body: "At thumbnail size, judge volume and flow. At full size, judge clean antialiasing, controlled flyaways, and separation from skin, earrings, and garment.",
    plateId: 4,
  }),
  page(52, "hair", "checklist", "Hair checkpoint", "Architecture before texture.", {
    bullets: ["Skull remains believable", "Silhouette reads small", "Primary masses carry volume", "Flyaways are selective", "Neckline and shoulders stay readable", "No background-colored halo"],
  }),

  page(53, "wardrobe", "opener", "Headwear and garments", "Construction, weight, and respectful specificity.", { plateId: 15, accent: "sage" }),
  page(54, "wardrobe", "plate", "Headwear follows the skull", "Anchor points and tension create believable wrapping.", {
    body: "Define the skull first, then fabric thickness, anchor points, compression, overlap, gravity, and the direction of tension.",
    plateId: 15,
  }),
  page(55, "wardrobe", "comparison", "Fabric mechanics", "Wrapped, draped, knitted, woven, and elastic materials fold differently.", {
    body: "Use front, side, and back references so folds remain physically continuous instead of becoming decorative lines with no cause.",
    plateId: 15,
  }),
  page(56, "wardrobe", "essay", "Accessories support the face", "They should clarify personality without taking hierarchy.", {
    bullets: ["Glasses track head perspective", "Lenses preserve the eyes", "Jewelry has believable attachment", "Metal highlights stay small"],
    plateId: 5,
  }),
  page(57, "wardrobe", "plate", "The shoulder base", "The garment anchors the lower composition.", {
    body: "Keep both shoulders complete with a believable slope. Preserve enough upper chest for the portrait to feel grounded and for garment masks to remain useful.",
    plateId: 7,
  }),
  page(58, "wardrobe", "comparison", "Neckline authority", "The garment must separate cleanly from neck, hair, beard, and headwear.", {
    body: "Collars have thickness. Layers overlap. Knit follows form. A neckline should never consume skin or hair when recolored.",
    plateId: 7,
  }),
  page(59, "wardrobe", "essay", "Material before texture", "Structure identifies fabric before surface grain does.", {
    body: "Use a few structural folds, then add restrained material-specific texture. Noise cannot substitute for weight, thickness, and overlap.",
    plateId: 8,
  }),
  page(60, "wardrobe", "checklist", "Wardrobe checkpoint", "Respect construction and preserve boundaries.", {
    bullets: ["Headwear follows the skull", "Folds have physical causes", "Accessories track perspective", "Both shoulders are complete", "Neck and hair remain protected"],
  }),

  page(61, "materials", "opener", "Light, color, and materials", "Soft studio light, clear local color, restrained detail.", { plateId: 8, accent: "ochre" }),
  page(62, "materials", "plate", "One light world", "Skin, hair, fabric, glass, and metal share the same illumination.", {
    body: "Use a soft warm key, gentle fill, and controlled highlights. The face should feel dimensional without cinematic drama or hard rim lighting.",
    plateId: 8,
  }),
  page(63, "materials", "comparison", "Material response", "Texture explains the surface; it does not decorate it.", {
    bullets: ["Skin: soft response", "Hair: grouped sheen", "Knit: form-following grain", "Glass: clear lenses", "Metal: small highlights"],
    plateId: 17,
  }),
  page(64, "materials", "plate", "Five-part palette", "Skin, hair, garment, accessories, and background must remain distinct.", {
    body: "Choose colors as a value system before chasing hue. Related colors may coexist if their boundaries and value structure stay clear.",
    plateId: 14,
  }),
  page(65, "materials", "comparison", "Background harmony", "Test light, mid-value, warm, and cool families.", {
    body: "Fine hair edges must remain believable on every approved background. The background supports the face rather than becoming a colored outline.",
    plateId: 14,
  }),
  page(66, "materials", "checklist", "Material checkpoint", "Clean local color before polish.", {
    bullets: ["Light direction is coherent", "Value groups remain separate", "Texture follows form", "No sharpening halos or dirty grain", "Palette survives background changes"],
  }),

  page(67, "space", "opener", "Framing, rotation, and 3D", "One identity must survive space.", { plateId: 16, accent: "blue" }),
  page(68, "space", "plate", "Face-aware framing", "Standardize composition without pre-cropping the source.", {
    body: "Apply one reviewed scale-and-center transform to the portrait and every aligned mask layer. Never transform the source, hair, foreground, and garment independently.",
    plateId: 1,
  }),
  page(69, "space", "comparison", "Complete rotation", "Front, three-quarter, profile, and back remove guesswork.", {
    body: "Track skull, ears, feature guides, hair volume, neckline, and shoulder width through one consistent camera and scale.",
    plateId: 10,
  }),
  page(70, "space", "plate", "Orthographic approval", "Approve the turnaround before production modeling.", {
    body: "Use neutral front, three-quarter, profile, and back views. Keep head tilt, camera height, scale, and landmarks locked.",
    plateId: 16,
  }),
  page(71, "space", "essay", "From sculpt to material", "Solve the character in clay before surface polish.", {
    body: "Model head, neck, shoulders, eyes, hair, garment, and accessories as production-friendly parts. Then add restrained Palari skin, hair, fabric, glass, and metal materials.",
    plateId: 17,
  }),
  page(72, "space", "checklist", "3D checkpoint", "The model should preserve the approved portrait language.", {
    bullets: ["Turnaround is identity-consistent", "Topology supports lids, cheeks, lips, jaw, and neck", "Hair retains grouped masses", "Materials match the soft studio world", "Neutral, smile, blink, and speech shapes preserve identity"],
  }),

  page(73, "production", "opener", "Production and QA", "Only two layers change: background and upper garment.", { plateId: 20, accent: "coral" }),
  page(74, "production", "plate", "Protect the person", "Hair, face, neck, accessories, pose, texture, lighting, and identity remain unchanged.", {
    body: "Reviewed hair is a hard preservation layer. The reviewed shirt mask is garment authority. Fine matting may improve edges but must never turn protected hair or skin into garment or background.",
    plateId: 20,
  }),
  page(75, "production", "comparison", "Recolor locally", "Generate a reusable mask once; never call an AI service when a color control moves.", {
    body: "Test extreme background and garment pairs. Confirm that the background reaches fine hair edges, the full garment changes, skin remains untouched, and texture survives.",
    plateId: 20,
  }),
  page(76, "production", "checklist", "Final acceptance", "Review difficult portraits, not only the easiest one.", {
    bullets: ["Long dark hair over shoulders", "Hair and shirt with similar colors", "Warm skin with red or orange garment", "Head covering or prominent accessory", "Curly or flyaway hair", "Exact 1024 × 1024 export"],
  }),

  page(77, "appendix", "checklist", "Build a Palari", "A compact artist workflow.", {
    bullets: ["Block frame, skull, neck, and shoulders", "Establish distinct face construction", "Solve gaze and expression together", "Add hair or headwear as designed masses", "Construct garment and accessories", "Paint clean local colors", "Add soft dimensional light", "Simplify noise and test color changes"],
    plateId: 1,
  }),
  page(78, "appendix", "references", "Glossary", "A shared vocabulary keeps review precise.", {
    bullets: ["Primary mass — the largest readable form", "Secondary clump — a mid-size rhythm inside a mass", "Local color — the base color before lighting", "Matte — a grayscale coverage layer", "Authority mask — the reviewed production boundary", "Framing transform — one shared scale and center adjustment"],
  }),
  page(79, "appendix", "references", "References", "Further study in character design and publishing.", {
    bullets: [
      "Toon Boom Learn — Character Model Sheets",
      "3dtotal Publishing — Fundamentals of Character Design",
      "Character Design Quarterly — Sample Issue 2026",
      "Tom Bancroft — Creating Characters with Personality",
      "Stephen Silver — The Silver Way",
      "Chronicle Books — The Art of Pixar",
      "Adobe InDesign — Creating Book Files",
    ],
  }),
  page(80, "appendix", "title", "Made with care", "Palari Art · First edition · 2026", {
    body: "Published by Palari Art. © 2026 Palari. All rights reserved. Public access permits reading and downloading; it does not grant permission to reuse, modify, sublicense, or redistribute the artwork or handbook.",
    bullets: ["Editorial and visual system: Palari Art", "Teaching plates: OpenAI image generation with recorded provenance", "Typefaces: Newsreader and Inter, SIL Open Font License", "Web and print source: React, Vite, HTML, CSS, and SVG"],
    accent: "coral",
  }),
];

export const supportingAvatars = [
  ...Array.from({ length: 10 }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    return {
      id: `original-${number}`,
      label: `Avatar ${String(index + 1).padStart(3, "0")}`,
      src: `/avatars-web/full/standardized-1x1/avatar-${number}.webp`,
    };
  }),
  ...[1, 17, 34, 52, 70, 105].map((value, index) => {
    const number = String(value).padStart(3, "0");
    return {
      id: `fantasticos-${number}`,
      label: `Library study ${String(index + 1).padStart(2, "0")}`,
      src: `/avatars-web/full/los-5-fantasticos/fantastico-${number}.webp`,
    };
  }),
  ...Array.from({ length: 14 }, (_, index) => {
    const number = String(index + 1).padStart(3, "0");
    return {
      id: `coverage-${number}`,
      label: `Avatar ${String(index + 144).padStart(3, "0")}`,
      src: `/avatars-web/full/coverage-expansion/avatar-coverage-${number}.webp`,
    };
  }),
];

export const bibliographyLinks = [
  { label: "Toon Boom — Character Model Sheets", href: "https://learn.toonboom.com/modules/character-design/topic/character-model-sheets" },
  { label: "3dtotal — Fundamentals of Character Design", href: "https://store.3dtotal.com/products/fundamentals-of-character-design" },
  { label: "Character Design Quarterly — Sample Issue 2026", href: "https://store.3dtotal.com/products/character-design-quarterly-sample-issue-2026-download-only" },
  { label: "Tom Bancroft — Creating Characters with Personality", href: "https://www.penguinrandomhouse.com/books/8114/creating-characters-with-personality-by-tom-bancroft-introduction-by-glen-keane/" },
  { label: "Stephen Silver — The Silver Way", href: "https://www.silvertoons.com/store/character-design-handbook" },
  { label: "Chronicle Books — The Art of Pixar", href: "https://www.chroniclebooks.com/products/the-art-of-pixar-1" },
  { label: "Adobe — Creating book files", href: "https://helpx.adobe.com/au/indesign/using/creating-book-files.html" },
];
