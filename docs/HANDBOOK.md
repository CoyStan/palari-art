# Palari Character Design Handbook

The handbook is an 80-page English art book and production reference published from the same React/CSS source in two forms:

- Responsive web reader at `/handbook/`.
- Downloadable PDF at `/handbook/palari-character-design-handbook.pdf`.

It is a separate Vite entry and does not change the editor's runtime, avatar data, masks, or recoloring behavior.

## Editorial contract

The handbook's inclusion principle is:

> Palari characters represent individuals, not regional or demographic presets. Human features overlap across populations; references guide design, assumptions do not.

Observable structure may be discussed: eyelid construction, feature spacing, brow rhythm, nose shape, cheek volume, jaw rhythm, age, hair structure, and material behavior. Do not infer or assign ethnicity, nationality, religion, gender identity, or exact age. Expressions are never mapped to geography or ethnicity. Cultural clothing and headwear require multiple precise references and respectful specificity.

`src/handbook/content.ts` is the source of truth for the 80 numbered pages, ten chapters, supporting examples, bibliography, rights notice, and accessibility copy.

## Illustration contract

`docs/art-guide/assets/plates.json` registers exactly 20 reviewed teaching plates. It records each source path, prompt, creation date, review state, and alt text. The first 17 plates were recovered from the completed 2026-08-05/06 guide run; plates 18–20 were generated for the handbook's inclusion, expression, and production chapters.

Lossless PNG masters live under `docs/art-guide/assets/source/` and are never deployed. Approved design concepts live under `docs/art-guide/concepts/`. The concepts are visual specifications, not production UI screenshots.

Generate checksum-linked WebPs after changing a plate master or recipe:

```bash
npm run handbook:assets:generate
npm run verify:handbook-assets
```

The generator creates 1280px full and 640px compact WebPs under `public/handbook/assets/` and records source/output checksums in its manifest.

## PDF production

The PDF is generated from the print mode of the web reader. Chromium is driven through Playwright Core so fonts and every image finish loading before print. Ghostscript deduplicates and downsamples repeated images at 220 PPI, then `pdf-lib` records metadata plus the physical page boxes.

```bash
npm run handbook:pdf
npm run verify:handbook
```

The result contains 80 pages with 210 × 270 mm trim and 3 mm bleed on each side. Newsreader and Inter are embedded and subset. Set `PALARI_CHROMIUM_PATH` when Chromium is installed outside the standard Linux locations.

`verify:handbook` checks page order, inclusion charter, bibliography, rights notice, prohibited demographic schema fields, plate provenance, WebP checksums, PDF page count, fonts, trim box, and bleed box.

## Public rights

The public reader and PDF use:

> © 2026 Palari. All rights reserved.

Public access permits reading and downloading. It does not grant permission to reuse, modify, sublicense, or redistribute the handbook or artwork. The Newsreader and Inter typefaces retain their SIL Open Font License terms.

## Future editions

1. Edit page copy or composition in `src/handbook/`.
2. Add or replace a plate only with recorded prompt, references, checksum, and visual review.
3. Regenerate handbook WebPs and the PDF.
4. Run `npm run check` and `npm run build:pages`.
5. Inspect desktop, mobile, and representative PDF pages before publishing.

Do not expose source PNGs through GitHub Pages. Do not add inferred demographic fields to the content or avatar metadata.
