# Palari V2 production pipeline

## Asset contract

The 12 production IDs are contiguous from `palari-001` through `palari-012`. Each directory under `public/palari-v2/` contains:

```text
source.png          1254 × 1254 RGBA authority
foreground.png      source alpha as grayscale
material.png        editable ceramic exterior mask
characteristic.png  editable inner-intelligence, iris, and seed-mark mask
metadata.json       recipe, source/layer checksums, and review record
```

The accepted concept image remains linked in `docs/palari-v2/collection.json`. `scripts/isolate-palari-v2.py` creates the transparent master locally with pinned `briaai/RMBG-1.4` revision `2ceba5a5efaec153162aedea169f76caf9b46cf8`; no source image is uploaded to a remote service during isolation.

## Deterministic layer separation

`scripts/generate-palari-v2-masks.py` uses the collection's expected characteristic-color swatch to find the corresponding hue family. Connected-component seed rules reject reflected color from the ceramic shell. Warm characteristic colors use a saturation-sensitive mask because ivory and stone can share nearby warm hues; darker cool colors use retained hue regions plus small morphological closing so glaze highlights do not break the inner surface. A central accent pass recovers low-saturation irises and seed apertures for blue and violet figures.

The material mask is the foreground complement of the characteristic mask. The two masks are source-aligned and receive no independent crop or transform.

## Browser renderer

`src/lib/recolor-v2.ts` loads the source and both masks once, caches their pixels, and transfers selected material and characteristic colors while retaining source-relative luminance. It composites the transparent figure over a chosen background at 1024 × 1024. No request leaves the browser when a swatch changes or an image is exported.

## Delivery and review

`npm run palari-v2:web:generate` creates one lossy transparent source WebP and two pixel-identical lossless mask WebPs per figure. `public/palari-v2-web/manifest.json` checksum-links all 36 outputs to their PNG authorities.

The transparent masters and characteristic masks were reviewed as 12-item contact sheets. Browser review covered these cross-material cases:

- Charcoal/amber Pod to porcelain/ultramarine.
- Stone/coral Crescent to charcoal/teal.
- Ivory/violet Crescent to charcoal/amber.
- Ivory/burgundy Stack to stone/teal.

Desktop review used 1280 × 800; mobile review used 390 × 844. The final WebP-backed editor had no browser console errors. `npm run verify:palari-v2` checks frozen grammar 1.0, all 12 IDs, PNG types and dimensions, layer checksums, reviewed/pass metadata, delivery WebPs, lossless mask records, and React runtime registration.
