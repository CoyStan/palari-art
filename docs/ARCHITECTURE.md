# Architecture

## System shape

Palari Art is currently a single-page React application built by Vite. All interactive image processing happens inside the browser through Canvas APIs. Separate Node preparation scripts call fal.ai to create reusable masks and foreground mattes.

```text
Bundled or uploaded image
          |
          v
     AvatarCanvas
          |
          v
 src/lib/recolor.ts
  - prepare source
  - load stored matte/cutout/mask or estimate fallbacks
  - recolor pixels
          |
          v
  Canvas preview/export
```

There is no application server, database, authentication layer, or persistent upload service. The browser makes no remote image-processing calls. `scripts/generate-avatar-masks.mjs` and `scripts/generate-foreground-mattes.mjs` are offline preparation tools and are the only fal.ai integrations.

## Runtime flow

1. `src/main.tsx` mounts the application.
2. `src/App.tsx` owns the selected portrait, editable colors, mask tolerances, upload list, and export state.
3. `src/data/avatars.ts` constructs the 143 built-in portrait records.
4. `AvatarCanvas` invokes `renderRecoloredAvatar` whenever the source or settings change.
5. `src/lib/recolor.ts` loads stored semantic masks when registered, otherwise estimates fallback masks, then writes recolored pixels to the Canvas.
6. The same Canvas is encoded as PNG or WebP for download.

Object URLs created from uploaded files exist only for the browser session. Uploads are not written to the server or added to the built-in library.

## Current masking pipelines

### Stored semantic masks

All 143 bundled portraits have reviewed `foreground.png`, `matte.png`, `person.png`, and `shirt.png` files under `public/masks/<avatar-id>/`. `foreground.png` is BiRefNet's refined transparent character; `matte.png` is its 256-level alpha edge; the SAM masks remain reproducible semantic references.

The renderer processes stored foregrounds, mattes, and garment masks at the full 1024 × 1024 Canvas resolution. It recolors the garment inside the refined foreground, then composites that foreground over the new background using the soft matte. This preserves narrow curls and flyaways without a blanket edge blur.

The source masks remain at the source portrait's 1254 × 1254 resolution. Keeping masks source-aligned makes checksums, replacements, and later higher-resolution exports unambiguous.

### Heuristic fallback

The renderer maintains a 1024 × 1024 source image and estimates masks at 512 × 512 for speed.

### Background

The background reference color is sampled from the top corners. A flood fill begins at the image edges and includes connected pixels within the configured color-distance tolerance. The result is softened before recoloring.

### Shirt

The shirt reference color is sampled from a bottom-center patch. Connected pixels within a guarded lower-body region are selected using hue, saturation, and lightness. Morphological passes remove narrow false connections or close small gaps.

### Recoloring

Target hue and saturation come from the user's color. Lightness differences from the original pixels are retained so that texture, shading, and fabric detail survive. The source alpha channel is preserved.

Prepared results are cached by source URL and tolerance values for the current browser session.

## Why the current masks fail

The upload fallback understands color and connectivity, not anatomy. A stylized portrait can legitimately contain the same hue in hair, skin, a scarf, and a shirt. No tolerance value can reliably separate those regions in every image. Slider tuning may improve one edge while damaging another.

This is a limitation of the technique, not only a matter of finding better constants. See `MASKING.md` for the replacement design.

## Semantic mask architecture

Semantic segmentation should be an asset-preparation step:

```text
Source portrait
  |-- SAM prompt: person ------> person mask (audit/reference)
  |-- SAM prompt: sweater -----> shirt mask
  |-- BiRefNet Matting --------> refined foreground + alpha matte
  |
  `-- masks reviewed and stored with metadata

Source + stored masks + chosen colors
  `-- browser-only deterministic recoloring
```

For bundled avatars, API inference happens once during preparation, not when an end user adjusts colors. For a newly uploaded portrait, a server route may generate and cache masks once.

The stored contract is:

```text
public/masks/<avatar-id>/
├── foreground.png
├── matte.png
├── person.png
├── shirt.png
└── metadata.json
```

- `foreground.png` is an RGBA PNG; the other layers are grayscale PNGs. Every file exactly matches its source portrait dimensions.
- White means selected, black means protected, and gray is reserved for softened boundaries.
- `matte.png` is inverted by the renderer to obtain the editable background.
- `metadata.json` records the source asset, both provider/model pipelines, prompts, request IDs, checksums, creation times, and independent review states.

This contract is active for all 143 reviewed bundled portraits. Temporary uploads use the heuristic fallback because no upload API route exists.

## Introducing an external API safely

The browser must never receive the provider key. A future implementation needs one of these server-side boundaries:

1. The existing batch preparation script for bundled portraits.
2. A small server endpoint for new user uploads.

The server reads `FAL_KEY` from its environment, validates file type and size, submits the image, normalizes the returned mask, and returns only the result. Do not use a `VITE_`-prefixed secret because Vite exposes such variables to browser bundles.

Before adding a backend framework, keep the batch and interactive use cases separate. The bundled library can ship with static masks even if upload segmentation is postponed.

## Build output

`npm run build` writes the static application to `dist/`. The directory is generated and ignored by Git. It is not a source of truth and may be deleted and rebuilt safely.
