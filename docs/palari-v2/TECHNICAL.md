# Palari V2 production pipeline

## Asset contract

The 41 production IDs are contiguous from `palari-001` through `palari-041`. Each directory under `public/palari-v2/` contains:

```text
source.png          1254 × 1254 RGBA authority
foreground.png      source alpha as grayscale
material.png        editable ceramic exterior mask
characteristic.png  editable inner-intelligence, iris, and seed-mark mask
metadata.json       recipe, source/layer checksums, and review record
```

The accepted concept image remains linked in `docs/palari-v2/collection.json`. `scripts/isolate-palari-v2.py` creates the original transparent masters locally with pinned `briaai/RMBG-1.4` revision `2ceba5a5efaec153162aedea169f76caf9b46cf8`; no source image is uploaded to a remote service during isolation. Expansion IDs 013–041 instead use saved image-generated flat-chroma renders followed by deterministic chroma removal, which retains pale limbs that overlap the warm plaster backgrounds in their original studies. The complete generation records are in `docs/palari-v2/expansion-01/manifest.json` and `docs/palari-v2/expansion-02/manifest.json`.

## Deterministic layer separation

`scripts/generate-palari-v2-masks.py` performs deterministic source-color keying. It finds the expected characteristic hue, keeps connected source pixels that meet fixed hue, saturation, and color-energy thresholds, and rejects components without a strong color seed. A separate fixed color key selects the known porcelain, ivory, stone, or charcoal source material. Amber uses a tighter threshold because ivory shell lighting can share its hue. The process has no learned model, semantic inference, body-position rules, or shape-specific repair passes.

Both keyed regions are solid rather than texture-weighted; source luminance preserves glaze detail during recoloring. Only their spatial boundaries receive a subpixel transition, and any boundary overlap is normalized. Pixels that do not confidently match either source palette remain unchanged, which prevents an uncertain dark characteristic shadow from being misclassified as ceramic. The masks are source-aligned and receive no independent crop or transform.

## Browser renderer

For customized renders, `src/lib/recolor-v2.ts` loads the source and both masks once, caches their pixels, and transfers selected material and characteristic colors while retaining source-relative luminance. It composites the transparent figure over a chosen background at 1024 × 1024. No request leaves the browser when a swatch changes or an image is exported.

The editor's **Original** toggle takes a separate source-only render path. It draws the transparent delivery source without reading either prepared mask, applying a recolor, or adding a background. Selecting any finish swatch returns to the customized render; exporting while Original is active preserves the source transparency.

## Delivery and review

`npm run palari-v2:web:generate` creates one lossy transparent source WebP and two pixel-identical lossless mask WebPs per figure. `public/palari-v2-web/manifest.json` checksum-links all 123 outputs to their PNG authorities.

The transparent masters and characteristic masks were reviewed as contact sheets. Browser review covered these cross-material cases:

- Charcoal/amber Pod to porcelain/ultramarine.
- Stone/coral Crescent to charcoal/teal.
- Ivory/violet Crescent to charcoal/amber.
- Ivory/burgundy Stack to stone/teal.

Expansion review exercised IDs 013–041 together with porcelain exterior, coral characteristic color, and dusk background to expose missing alpha or characteristic coverage. The 24-cell review caught and corrected chroma spill on Palari 031 before approval. Desktop review used 1280 × 800; mobile review used 390 × 844. The final WebP-backed editor had no browser console errors. `npm run verify:palari-v2` checks frozen grammar 1.0, all 41 IDs, PNG types and dimensions, layer checksums, reviewed/pass metadata, delivery WebPs, lossless mask records, and React runtime registration.
