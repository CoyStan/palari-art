# Palari V2 icon collection

Status: all 41 reviewed Palari V2 figures have a derived `ip-as-logo` emoticon available in the V2 dashboard.

These directories contain the native generated icons derived from reviewed Palari V2 masters. They remain the source and audit record; checksum-linked 1024px and 256px WebP delivery files under `public/palari-v2-icons-web/` power the dashboard without modifying the PNGs.

- `pilot-01`: IDs `001`, `002`, `003`, `006`, `008`, and `010`, covering all six silhouette families.
- `pilot-02`: IDs `004`, `005`, `007`, `009`, `011`, and `012`, completing icon studies for the initial frozen 12-character collection.
- `pilot-03`: IDs `013–018`.
- `pilot-04`: IDs `019–024`.
- `pilot-05`: IDs `025–030`.
- `pilot-06`: IDs `031–036`.
- `pilot-07`: IDs `037–041`.

Every icon is a native opaque ImageGen PNG. Source masters were used as identity references only. The generated pixels were not post-processed; deviations from the installed `ip-as-logo` rules are retained and reported in each pilot manifest. Dashboard registration records approval for this product use, not retroactive compliance with every strict skill rule.

Regenerate the delivery tier with `node scripts/generate-palari-v2-icon-assets.mjs`. `npm run verify:palari-v2` validates every source and delivery checksum, dimension, and runtime registration.

## Collection review

- 41 of 41 figures have native 1254 × 1254 opaque RGB icons.
- All 41 silhouettes remain recognizable in the 32 × 32 review.
- 36 icons have exactly six seed apertures. The five retained seed-count deviations are `003` and `007` with five, `023` with five, and `005` and `010` with seven.
- All 41 remain strict skill rejects because at least one rejection rule still applies. The most common drift is a subtle navy background variation or stronger-than-requested tonal modeling.
- No generated pixels were flattened, recolored, repaired, or otherwise post-processed to hide a failure.

Review the complete collection in `contact-sheet-all.png` and the actual small-size readings in `contact-sheet-all-32px.png`. `collection-manifest.json` records batch locations and contact-sheet checksums.

## Shared generation contract

Each icon was generated with a separate built-in ImageGen call. The relevant V2 master was supplied only as an identity reference for silhouette, crown, opening, eyes, pose, and feature placement.

```text
Create one cute but calm, highly simplified Palari IP mascot logo: a symbol first, not a character illustration.

Preserve the assigned silhouette family, both calm eyes, one dominant inner-intelligence opening, rounded fingerless arms, a stable legless base, and the Palari seed mark. No mouth.

Use exactly three semantic colors: warm ivory #E9E6DF for the body, the assigned deep characteristic color for the opening plus eyes and seed, and edge-to-edge deep navy #172333 for the background only.

Build one thick rounded outer silhouette from roughly 6–10 broad shapes. Use only a subtle continuous upper-left-to-lower-right tonal transition inside large character regions. Keep the background uniform and flat. Keep the figure upright, at roughly 80% scale, emerging from the assigned lower corner and cropped only through the base.

Render exactly six seed apertures: four larger corner circles and two smaller circles centered vertically.

Forbid scenes, vignettes, texture, realistic ceramic, clay, plastic, toy rendering, gloss, bevel, extrusion, rim light, cast or contact shadows, discrete shading, fragile points, thin limbs, extra colors, text, watermark, border, transparency, rounded canvas corners, and app-icon masks.
```

Each candidate received at most one targeted retry. Remaining failures are reported in the per-ID audit JSON rather than silently repaired.
