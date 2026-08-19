# Palari V2 production pipeline

## Asset contract

The 82 production IDs are contiguous from `palari-001` through `palari-082`. Each directory under `public/palari-v2/` contains:

```text
source.png          1254 × 1254 RGBA authority
foreground.png      source alpha as grayscale
material.png        editable ceramic exterior mask
characteristic.png  editable inner-intelligence, iris, and seed-mark mask
metadata.json       recipe, source/layer checksums, and review record
```

The accepted concept image remains linked in `docs/palari-v2/collection.json`. `scripts/isolate-palari-v2.py` creates the original transparent masters locally with pinned `briaai/RMBG-1.4` revision `2ceba5a5efaec153162aedea169f76caf9b46cf8`; no source image is uploaded to a remote service during isolation. Expansion IDs 013–082 instead use saved image-generated flat-chroma renders followed by deterministic chroma removal, which retains pale limbs that overlap the warm plaster backgrounds in their original studies. The complete generation and promotion records are in the three `docs/palari-v2/expansion-*/manifest.json` files.

Palari 005, 028, and 041 form the neutral editing-master pilot. Their source art was regenerated with a diffuse off-white ceramic exterior and a muted mid-value blue-grey characteristic layer so the browser can recolor from usable highlight and shadow detail instead of baked near-black or saturated color. Exact prompts, source checksums, chroma renders, deterministic isolation settings, and promoted-master checksums are retained in `docs/palari-v2/neutral-pilot/manifest.json`.

## Deterministic layer separation

`scripts/generate-palari-v2-masks.py` performs deterministic source-color keying. It finds the expected characteristic hue, keeps connected source pixels that meet fixed hue, saturation, and color-energy thresholds, and rejects components without a strong color seed. A separate fixed color key selects the known porcelain, ivory, stone, or charcoal source material. Amber uses a tighter threshold because ivory shell lighting can share its hue. The neutral pilot uses the explicit `--muted-characteristic` mode: a blue-over-neutral channel comparison captures low-saturation blue-grey highlights without admitting the off-white shell. The process has no learned model, semantic inference, body-position rules, or shape-specific repair passes.

Both keyed regions are solid rather than texture-weighted; source luminance preserves glaze detail during recoloring. Only their spatial boundaries receive a subpixel transition, and any boundary overlap is normalized. Pixels that do not confidently match either source palette remain unchanged, which prevents an uncertain dark characteristic shadow from being misclassified as ceramic. The masks are source-aligned and receive no independent crop or transform.

## Browser renderer

For customized renders, `src/lib/recolor-v2.ts` loads the source and both masks once, caches their pixels, and transfers selected material and characteristic colors while retaining source-relative luminance. It composites the transparent figure over a chosen background at 1024 × 1024. No request leaves the browser when a swatch changes or an image is exported.

The editor's **Original** view takes a separate source-only render path. It draws the transparent delivery source without reading either prepared mask, applying a recolor, or adding a background. The **Emoticon** view draws the selected figure's fixed-palette 1024px logo asset and swaps the shape rail to its 256px emoticon thumbnails. Selecting any finish swatch returns to the customized render. Exports use the active view: Original preserves source transparency, while Emoticon exports an opaque 1024 × 1024 PNG.

## Preference review

The V2 dashboard's **Review taste** mode presents the original ceramic character and fixed-palette icon side by side. Each representation receives an independent Favorite, Keep, Mixed, or Avoid verdict, structured feature likes and dislikes, and an optional note. Ceramic-specific tags cover texture, volume, and framing; icon-specific tags cover flatness, color balance, background, and small-size legibility. Shared tags cover the silhouette, crown, opening, proportions, eyes, arm pose, asymmetry, color placement, and seed mark. A feature cannot be liked and disliked for the same representation at the same time.

Review data remains in the browser under the versioned `palari.v2.preferences.v1` local-storage key. It is not uploaded and the static site has no preference backend. The dashboard can export a versioned `palari-v2-preferences.json` file containing stable IDs, human-readable tag labels, source silhouette names, timestamps, and both representation reviews. Import validates the schema, known Palari IDs, verdicts, and tag IDs before merging records. This export is the handoff for aggregating favored and rejected traits into future generation briefs without treating an overall dislike as a rejection of every visible feature.

## Delivery and review

`npm run palari-v2:web:generate` creates one lossy transparent source WebP and two pixel-identical lossless mask WebPs per figure. `public/palari-v2-web/manifest.json` checksum-links all 246 outputs to their PNG authorities.

`node scripts/generate-palari-v2-icon-assets.mjs` creates one 1024px export WebP and one 256px thumbnail WebP per figure. `public/palari-v2-icons-web/manifest.json` checksum-links all 164 outputs to the untouched native PNG authorities under `docs/palari-v2/ip-icons/`. `npm run verify:palari-v2` validates both delivery tiers, their dimensions and checksums, and runtime registration.

The transparent masters and characteristic masks were reviewed as contact sheets. Browser review covered these cross-material cases:

- Charcoal/amber Pod to porcelain/ultramarine.
- Stone/coral Crescent to charcoal/teal.
- Ivory/violet Crescent to charcoal/amber.
- Ivory/burgundy Stack to stone/teal.

Expansion review exercised IDs 013–082 together with deliberately different material, characteristic, and background choices to expose missing alpha or color-key coverage. The third expansion retains contact sheets for all 41 transparent sources plus both deterministic masks, including a tightened coral key for Palari 071. `npm run verify:palari-v2` checks frozen grammar 1.0, all 82 IDs, PNG types and dimensions, layer checksums, reviewed/pass metadata, delivery WebPs, lossless mask records, and React runtime registration.

The neutral editing-master pilot was additionally reviewed with deliberately distant finish transfers: Palari 005 at charcoal/amber/dusk, Palari 028 at porcelain/coral/plaster, and Palari 041 at charcoal/violet/mist. Original mode was checked at 390 × 844 and the browser reported no console errors or warnings.

Expansion 03 received final dashboard QA at 1280 × 720 and 390 × 844. Palari 082 was exercised in both customized ceramic and fixed-palette Emoticon views, the selector exposed all contiguous IDs through No. 082, and the browser reported no console errors or warnings.

Preference review QA covered 1280 × 800, 768 × 1024, 390 × 844, and 320 × 568 viewports. The tested flow rated both representations, moved a feature between dislike and like, added a note, navigated by keyboard, filtered the library, survived a reload, exported JSON, and imported that export into a fresh browser session. The 320px layout had no horizontal document overflow and the browser reported no console errors or warnings.
