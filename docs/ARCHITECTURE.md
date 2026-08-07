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
  - apply registered framing transform
  - prepare source
  - load stored matte/cutout/mask or estimate fallbacks
  - recolor pixels
          |
          v
  Canvas preview/export
```

There is no application server, database, authentication layer, or persistent upload service. The browser makes no remote image-processing calls. `scripts/generate-avatar-masks.mjs`, `scripts/generate-foreground-mattes.mjs`, and `scripts/generate-hair-masks.mjs` are offline fal.ai preparation tools. `scripts/generate-hair-matting-layers.py` performs the remaining semantic parsing, matting, and foreground recovery locally.

## Runtime flow

1. `src/main.tsx` mounts the application.
2. `src/App.tsx` owns the selected portrait, editable colors, mask tolerances, upload list, and export state.
3. `src/data/avatars.ts` constructs the 157 source-linked portrait records, attaches `src/data/avatar-framing.json` metadata and generated WebP paths, and excludes the explicitly retired Avatar 024 (`expanded-14`) from the 156-item active library after deterministic mixing.
4. The library requests 256px WebP thumbnails; `AvatarCanvas` requests the selected portrait's 1024px WebP and invokes `renderRecoloredAvatar` whenever the source, framing, or settings change.
5. `src/lib/recolor.ts` applies the same framing transform to the source and every registered lossless WebP layer, otherwise estimates fallback masks, then writes recolored pixels to the Canvas.
6. The same Canvas is encoded as PNG or WebP for download.

Object URLs created from uploaded files exist only for the browser session. Uploads are not written to the server or added to the built-in library.

## Web asset delivery

`scripts/generate-web-avatar-assets.mjs` creates full editor WebPs and gallery thumbnails from every PNG master without modifying the masters. `public/avatars-web/manifest.json` checksum-links each tier to its source. `scripts/verify-web-avatar-assets.mjs` validates coverage, paths, hashes, dimensions, quality records, and size ceilings without requiring FFmpeg at verification time.

The full WebP tier is 1024 × 1024 because that is the renderer and export resolution. The gallery tier is 256 × 256 because tiles are displayed much smaller. Both retain the source's normalized coordinate system, so `avatar-framing.json` applies identically.

`scripts/generate-web-mask-assets.mjs` creates pixel-identical lossless WebPs for the registered runtime mask subset and records every PNG/output checksum plus an ImageMagick absolute-error result of zero in `public/masks-web/manifest.json`. `scripts/verify-web-mask-assets.mjs` validates all 1,395 expected outputs without requiring FFmpeg or ImageMagick. The PNGs under `public/masks/` remain the review and provenance authority; only their derived WebPs are loaded by the browser.

The GitHub Pages build uses Vite's `/palari-art/` base path with `publicDir` disabled. `scripts/prepare-pages-artifact.mjs` then copies only `public/avatars-web/` and `public/masks-web/` into `dist/`. Verification rejects master/audit PNGs, missing manifests, incomplete WebP coverage, or an unexpectedly large artifact.

The current Pages artifact is 216.7 MiB and contains 314 avatar WebPs plus 1,395 runtime-mask WebPs. It contains no PNGs.

## Face-aware framing

Bundled portraits are not rewritten or destructively cropped. `src/data/avatar-framing.json` stores a normalized `scale`, `centerX`, and `centerY` for every source-linked avatar. `scripts/generate-avatar-framing.py` derives the baseline from the checksum-pinned MediaPipe BlazeFace short-range detector and reviewed person/shirt masks. Its target was measured from the approved reference portrait: eyes near 40% of the square, face center near 46.5%, and face height near 36.6%. Head-bound safety limits protect tall hair and head coverings.

At runtime, `src/lib/recolor.ts` applies one source-rectangle transform to the original portrait, foreground, alpha matte, garment mask, coarse hair mask, and all hair-matting/underlay layers. This is the alignment invariant: never frame the source independently from its masks. Gallery thumbnails use the same metadata. Temporary uploads remain unframed because they have no reviewed, source-linked record.

Run `npm run verify:framing` after any source or framing change. A source checksum mismatch deliberately fails validation and requires regenerating and visually reviewing that portrait's framing.

## Current masking pipelines

### Stored semantic masks

All 157 bundled portraits have reviewed `foreground.png`, `matte.png`, `person.png`, and `shirt.png` files under `public/masks/<avatar-id>/`. `foreground.png` is BiRefNet's refined transparent character; `matte.png` is its 256-level alpha edge; the SAM masks remain reproducible semantic references. Browser delivery uses checksum-linked lossless WebP copies of the runtime subset without changing decoded pixels.

The 154 portraits with visible hair also have a reviewed SAM `hair.png` search mask and seven local hair-matting/refined-shirt layers. The bald portrait and two fully covered-hair portraits are explicit exceptions. At runtime, `hair.png` is a hard preservation layer: fine alpha and recovered underlay may improve strand edges outside it but cannot reinterpret reviewed hair as garment or background. The reviewed `shirt.png` is the garment and neckline authority; `shirt-refined.png` remains a reproducible audit derivative rather than the production recolor mask. A 24-pixel reviewed-SAM neighborhood constrains MediaPipe components, protecting scarves and head coverings from semantic expansion.

The renderer processes stored foregrounds, mattes, and garment masks at the full 1024 × 1024 Canvas resolution. It recolors only the reviewed garment inside the refined foreground, then composites that foreground over the new background using the soft matte. A two-pixel, external-silhouette-only garment extension covers source-color fringes at antialiased shoulders, is blocked by the reviewed hair mask, and cannot change internal neckline boundaries.

The source masks remain at the source portrait's 1254 × 1254 resolution. Keeping masks source-aligned makes checksums, replacements, and later higher-resolution exports unambiguous.

### Heuristic fallback

The renderer maintains a 1024 × 1024 source image and estimates masks at 512 × 512 for speed.

### Background

The background reference color is sampled from the top corners. A flood fill begins at the image edges and includes connected pixels within the configured color-distance tolerance. The result is softened before recoloring.

### Shirt

The shirt reference color is sampled from a bottom-center patch. Connected pixels within a guarded lower-body region are selected using hue, saturation, and lightness. Morphological passes remove narrow false connections or close small gaps.

### Recoloring

Target hue and saturation come from the user's color. Lightness differences from the original pixels are retained so that texture, shading, and fabric detail survive. The source alpha channel is preserved.

Prepared results are cached by source URL, framing transform, and tolerance values for the current browser session.

## Why the current masks fail

The upload fallback understands color and connectivity, not anatomy. A stylized portrait can legitimately contain the same hue in hair, skin, a scarf, and a shirt. No tolerance value can reliably separate those regions in every image. Slider tuning may improve one edge while damaging another.

This is a limitation of the technique, not only a matter of finding better constants. See `MASKING.md` for the replacement design.

## Semantic mask architecture

Semantic segmentation should be an asset-preparation step:

```text
Source portrait
  |-- SAM prompt: person ------> person mask (audit/reference)
  |-- SAM prompt: sweater -----> shirt mask
  |-- SAM prompt: hair --------> reviewed hair search region
  |-- BiRefNet Matting --------> refined foreground + alpha matte
  |-- MediaPipe + ViTMatte ----> internal hair matte
  |-- PyMatting ---------------> hair foreground + classified underlay
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
├── hair.png
├── hair-region.png
├── hair-trimap.png
├── hair-matte.png
├── hair-foreground.png
├── hair-underlay.png
├── hair-underlay-kind.png
├── shirt-refined.png
└── metadata.json
```

- `foreground.png` is an RGBA PNG; recovered foreground/underlay files are RGB; selection and alpha layers are grayscale. Every file exactly matches its source portrait dimensions.
- White means selected, black means protected, and gray is reserved for softened boundaries.
- `matte.png` is inverted by the renderer to obtain the editable background.
- `metadata.json` records the source asset, both provider/model pipelines, prompts, request IDs, checksums, creation times, and independent review states.

The foreground and garment contract is active for all 157 reviewed bundled portraits; the hair contract is active for all 154 portraits with visible hair. `hairMattingCoverage: "all"` and explicit per-avatar exemptions in `src/data/avatar-masks.json` are the runtime registration checkpoint. Temporary uploads use the heuristic fallback because no upload API route exists.

## Introducing an external API safely

The browser must never receive the provider key. A future implementation needs one of these server-side boundaries:

1. The existing batch preparation script for bundled portraits.
2. A small server endpoint for new user uploads.

The server reads `FAL_KEY` from its environment, validates file type and size, submits the image, normalizes the returned mask, and returns only the result. Do not use a `VITE_`-prefixed secret because Vite exposes such variables to browser bundles.

Before adding a backend framework, keep the batch and interactive use cases separate. The bundled library can ship with static masks even if upload segmentation is postponed.

## Build output

`npm run build` writes the static application to `dist/`. The directory is generated and ignored by Git. It is not a source of truth and may be deleted and rebuilt safely.
