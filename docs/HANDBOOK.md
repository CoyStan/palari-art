# Palari Art gallery

The separate Vite entry at `/handbook/` is a deliberately text-free public gallery of the 20 reviewed Palari teaching plates. It contains no visible title, copy, captions, navigation, controls, or PDF download. The editor remains a separate entry and is not changed by gallery work.

## Public presentation contract

- Render all 20 plates in their reviewed manifest order.
- Use a quiet two-column art wall on desktop and one column on phones.
- Keep spacing, borders, and shadows restrained so the images remain the only visible content.
- Retain descriptive `alt` text for accessibility without displaying it as captions.
- Do not add headings, page numbers, chapter labels, explanatory prose, or download controls.
- Do not publish or regenerate a handbook PDF.

## Illustration contract

`docs/art-guide/assets/plates.json` registers the 20 reviewed teaching plates and records each source path, prompt, creation date, review state, and accessibility description.

Lossless PNG masters live under `docs/art-guide/assets/source/` and are never deployed. Approved historical design concepts remain under `docs/art-guide/concepts/`. GitHub Pages receives only checksum-linked WebPs:

```bash
npm run handbook:assets:generate
npm run verify:handbook
```

The generator creates 1280px full and 640px compact WebPs under `public/handbook/assets/` and records source/output checksums in its manifest.

## Inclusion and rights

The artwork remains individual-first: never turn regional or demographic assumptions into face presets, map expressions to geography or ethnicity, or infer identity from appearance. Cultural clothing and headwear require precise references and respectful specificity.

The artwork remains © 2026 Palari. All rights reserved. Public display does not grant permission to reuse, modify, sublicense, or redistribute it.

## Updating the gallery

1. Add or replace a plate only with recorded prompt, references, checksum, and visual review.
2. Regenerate the full and compact WebP tiers.
3. Run `npm run check` and `npm run build:pages`.
4. Inspect the gallery at desktop, tablet, and 320px phone widths.

Do not expose source PNGs or a PDF through GitHub Pages.
