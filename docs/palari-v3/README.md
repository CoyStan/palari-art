# Palari V3 founding avatars

Palari V3 makes the flat avatar collection the product. The ceramic V2 sources remain available as provenance and a future 3D direction, but V3 does not expose ceramic recoloring or 3D controls.

The founding set contains 12 avatars:

- Six curated V2 icons: `palari-005`, `011`, `019`, `033`, `047`, and `079`.
- Six new native 1254 × 1254 RGB PNGs under `icons/`.

The V3 character sentence is: **A little protective shelter hugging its own colorful intelligence.** New characters favor broad hoods, pods, bells, and arches; one coherent colored face; large open eyes; short rounded arms; and a stable legless base. Every generated candidate received one targeted correction pass for the background and seed signature. Remaining deviations are recorded in `collection.json` rather than hidden with pixel edits.

## Generation contract

The six new characters were produced with six separate built-in ImageGen calls across three directions: protective hood, rounded pod, and soft bell or arch. Each prompt used this shared contract plus one character-specific silhouette, color, expression, and pose:

```text
Create one original, friendly Palari V3 mascot logo. A Palari is a little protective shelter hugging its own colorful intelligence. Make a logo first and a character second.

Use one dominant rounded silhouette built from 6–10 broad shapes. Use warm ivory #E9E6DF for the outer shell and arms, one assigned characteristic color for one large continuous inner face plus the compact seed, and edge-to-edge deep navy #172333 for the background. Keep exactly two large open eyes together inside the inner face, exactly two short fingerless arms, a stable continuous legless base, and the six-part 4+2 Palari seed. Fill 80–88% of the square and remain readable at 32 × 32.

Forbid detached heads, thin necks, eye stalks, horns, sharp crowns, long slit faces, cup rims, speaker-like belly holes, machinery, clothing, hands, fingers, legs, extra openings, extra eyes, extra colors, background gradients, vignette, glow, external shadow, strong 3D, texture, scene, text, watermark, border, transparency, and App-icon masks.
```

The correction pass changed only the field to opaque navy and the seed to the intended 4+2 geometry. `palari-v3-007` and `palari-v3-012` still contain five seed apertures and remain documented exceptions.

## Interface concept

`v3-app-concept.png` is the accepted 1536 × 1024 implementation reference. It defines a quiet icon-first picker with one large companion preview, a 4 × 3 founding-set grid, three frame treatments, surprise selection, and local PNG download.

`contact-sheet.png` shows the full founding family at gallery size. `contact-sheet-32px.png` is the small-size legibility check; all 12 silhouettes and face regions remain distinct. The interface uses the self-hosted Quicksand family stored with `src/v3/fonts/` under its included OFL license.

Run `npm run palari-v3:web:generate` after a native V3 PNG changes. `npm run verify:palari-v3` validates all 12 registered sources and delivery assets.
