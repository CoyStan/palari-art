# Palari V2 controlled-random prompt grammar

Status: provisional exploration grammar. It generates design candidates, not production-approved assets.

The source vocabulary is `shape-grammar.json`. A randomizer must choose compatible values from that file and retain the selected values, prompt, reference image, model, creation date, and output checksum with every candidate.

## Generation algorithm

1. Choose one `silhouette` record.
2. Choose one compatible crown, opening, and pose from that silhouette's lists.
3. Choose one expression, material, and characteristic color.
4. Expand each identifier through its prompt text.
5. Insert the expanded values into the prompt template below.
6. Append the full invariant and forbidden blocks without shortening them.
7. Generate one character per image. Do not request several random characters in one panel when judging consistency.
8. Reject rather than repair candidates that violate color count, fingerless arms, legless base, opening count, or eye construction.

The compatibility lists are important. Unrestricted mixing is what makes a random generator drift into cups, costumes, or generic robots.

## Prompt template

```text
Use case: stylized-concept
Asset type: individual Palari V2 character study

Primary request: Create one original Palari. Palari means Personal Artificial Intelligence. A Palari is a small crafted ceramic vessel whose single colored interior reveals its unique intelligence. This character belongs to a coherent species, not a human, conventional robot, toy wearing clothes, or household vessel.

Selected design:
- silhouette: {{silhouette.prompt}}
- crown: {{crown.prompt}}
- opening: {{opening.prompt}}
- pose: {{pose.prompt}}
- expression: {{expression}}
- exterior material: {{material.prompt}}
- characteristic color: {{characteristicColor.prompt}}

Family invariants:
- one complete isolated figure with a stable continuous ceramic base
- tactile fine stoneware exterior with matte-to-satin glaze and subtle handmade microtexture
- exactly one characteristic hue, limited to the recessed inner intelligence, iris accents, and Palari seed mark
- one dominant architecturally intentional opening and at most one small supporting reveal
- calm half-lidded inset eyes with ceramic eyelids, dark pupils, characteristic-color iris accents, and tiny catchlights
- curved tubular ceramic arms ending in perfectly smooth seamless rounded tips with no hand anatomy
- no conventional legs, knees, feet, toes, shoes, or visible human anatomy
- four larger circular seed-mark apertures at the corners of a compact rectangle with two smaller apertures centered vertically
- clean intact ceramic with smooth deliberately finished edges

Scene: {{presentation.environment}}.
Composition: {{presentation.camera}}; {{presentation.framing}}.
Lighting: {{presentation.lighting}}. Preserve readable ceramic form and inner depth without neon glow.

Avoid: {{forbidden, joined as a comma-separated list}}.
```

## Randomization rules

- Use a recorded seed so a candidate can be reproduced.
- Do not weight every option equally forever. Begin uniformly, then adjust weights only after a reviewed batch identifies repetition or weak families.
- Do not generate a demographic persona, gender, ethnicity, nationality, religion, disability, or exact age from geometric choices.
- Do not map colors to personality, morality, emotion, geography, or human identity.
- Expressions describe the current pose only. They are not permanent psychological categories.
- Keep material and characteristic choices independent. A charcoal exterior must accept every characteristic color that remains legible.
- When two candidates choose the same silhouette, require a different crown or opening before calling them distinct.
- Require at least two structural values—silhouette, crown, opening, or pose—to differ from every retained reference. A color change alone does not create a new Palari.
- Keep overall body height at least 2.4 times visible face height. Pod does not mean chibi, baby-like, or toy-like.
- A crescent must use a closed exterior sweep. Never allow an upward-facing cavity, even when its edge is smooth.
- A stack must visibly contain two offset interlocking exterior masses and one clear overlap seam. Reject a normal hooded figure returned for a stack prompt.
- Limit a review batch to eight candidates so visual comparison remains deliberate.

## Automatic rejection rules

Reject a generated candidate if any answer is yes:

1. Does it contain fingers, realistic hands, separated legs, or feet?
2. Does it use more than one perceived characteristic hue?
3. Does the crown primarily read as a cup, bowl, broken vessel, or wearable hat?
4. Are there multiple unrelated holes or decorative cutouts?
5. Do the eyes depart from the shared inset half-lidded construction?
6. Does the interior read as clothing, hair, skin, machinery, or a screen?
7. Does the silhouette resemble a generic humanoid robot more than a crafted ceramic being?
8. Is the seed mark missing, grille-like, or inconsistent with the six-aperture geometry?
9. Does the figure lose its silhouette or eye expression at avatar size?
10. Would material and characteristic regions be difficult to separate into deterministic recolor masks?
11. Does the output visibly honor the selected silhouette rather than merely belonging to the Palari family?
12. Is it structurally distinct from retained references, rather than a recolored duplicate?

## Review batch record

For every generated candidate, retain:

```json
{
  "seed": "recorded random seed",
  "silhouette": "arch",
  "crown": "broad_overhang",
  "opening": "narrow_channel",
  "pose": "arms_folded",
  "expression": "attentive",
  "material": "charcoal",
  "characteristicColor": "ultramarine",
  "referenceImages": [],
  "prompt": "complete expanded prompt",
  "model": "record exact generation model",
  "createdAt": "ISO-8601 timestamp",
  "output": "repository-relative path after selection",
  "sha256": "output checksum",
  "review": "unreviewed"
}
```

Generated candidates remain disposable until reviewed. Only selected studies should be copied into the repository and checksum-recorded.
