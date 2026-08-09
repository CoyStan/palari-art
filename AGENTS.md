# Palari Art agent guide

This file is the operating contract for agents working in this repository. Read it before changing code or assets.

## Purpose

Palari Art owns the standardized Palari character portrait library and the tools used to create safe color variants. The active product is a React/Vite avatar editor that changes only two layers:

1. The background.
2. The shirt or upper garment.

The character's face, hair, accessories, pose, texture, lighting, and identity must remain unchanged.

## Current truth

- There are 157 bundled source portraits under `public/avatars/`: 10 original, 28 expanded, 105 Los 5 fantásticos, and 14 coverage-expansion portraits.
- All bundled sources are square 1254 × 1254 PNG files.
- Every PNG master has a checksum-linked derived 1024px editor WebP and 256px gallery WebP under `public/avatars-web/`. The browser uses those delivery files; the PNG masters remain the source of truth. Run `npm run avatars:web:generate` after source changes and `npm run verify:web-assets` to validate all 314 outputs and their manifest.
- Every reviewed runtime mask layer has a checksum-linked lossless WebP derivative under `public/masks-web/`. The browser uses those 1,395 pixel-identical delivery files; reviewed PNG masks under `public/masks/` remain the source of truth. Run `npm run masks:web:generate` after a reviewed mask changes and `npm run verify:web-masks` to validate coverage, lossless bitstreams, dimensions, checksums, and zero-difference generation records.
- `npm run build:pages` creates a verified 223.0 MiB artifact at the `/palari-art/` base path containing 314 avatar WebPs, 1,395 runtime-mask WebPs, 40 gallery WebPs, and 51 Palari V2 WebPs with no PNG, PDF, or audit files.
- A separate ceramic-character editor is published at `/v2/`. It uses 17 reviewed transparent masters and deterministic material/characteristic masks under `public/palari-v2/`, with 51 checksum-linked browser WebPs under `public/palari-v2-web/`. It does not replace or share masking logic with the V1 portrait editor.
- The editor renders and exports at 1024 × 1024.
- All 157 bundled portraits have source-linked face-aware framing records in `src/data/avatar-framing.json`. The renderer applies one nondestructive scale/center transform to the portrait and every mask layer; do not pre-crop sources or transform layers independently.
- The project is a browser-only static Vite site with an editor entry and a handbook entry. It has no backend.
- The repository also publishes a separate static Vite entry at `/handbook/`: a text-free responsive gallery of 20 reviewed teaching plates. It has no visible title, copy, captions, navigation, controls, or PDF. `docs/HANDBOOK.md` is its presentation contract.
- Handbook inclusion is individual-first: never add regional or demographic face presets, never map expressions to geography or ethnicity, and never infer ethnicity, nationality, religion, gender identity, or exact age from artwork. Cultural clothing and headwear require multiple precise references.
- All 157 bundled portraits use reviewed SAM 3 garment masks and BiRefNet v2 refined foreground mattes under `public/masks/`.
- The 154 portraits with visible hair use reviewed SAM hair search masks and reviewed offline MediaPipe + ViTMatte + PyMatting hair foreground/alpha/underlay layers. Three portraits are explicitly exempt because they are bald or their hair is fully covered. `hairMattingCoverage: "all"` plus per-avatar `hairMatting: false` exemptions in `src/data/avatar-masks.json` is the registration checkpoint.
- At runtime, reviewed `hair.png` is a hard preservation layer and reviewed `shirt.png` is the garment/neck authority. Fine hair matting may improve pixels outside the coarse hair mask, but it must never turn reviewed hair into garment/background; `shirt-refined.png` is retained as a generated audit layer and is not the production garment authority.
- `src/data/avatar-masks.json` is the source of truth that attaches those masks to built-in portraits.
- `src/lib/recolor.ts` falls back to color/connectivity heuristics only for temporary uploads or a missing mask registration.
- `scripts/generate-avatar-masks.mjs` creates the SAM 3 person and garment masks.
- `scripts/generate-foreground-mattes.mjs` creates the 2048px BiRefNet Matting foreground and 256-level alpha matte used for hair edges.
- `scripts/generate-hair-masks.mjs` creates the paid SAM hair search masks with an optional `--max-new` request cap; `scripts/generate-hair-matting-layers.py` creates the remaining layers locally.
- `scripts/generate-avatar-framing.py` creates free local MediaPipe framing metadata; `npm run verify:framing` checks complete coverage, safe crop bounds, and source checksums.
- The 105 Los 5 fantásticos production portraits are clean-render v3 `gpt-image-2` revisions of the identity-guided v2 redraws. The checksum-locked grouped Drive sources, first-pass crops, and v2 identity/composition targets remain the provenance chain; see `docs/FANTASTICOS-REDRAW.md`.
- Masking for those 105 clean-render v3 portraits is already complete. Every current source checksum matches its reviewed `foreground.png`, `matte.png`, `person.png`, and `shirt.png` metadata. Do not rerun matting or segmentation unless a source portrait's pixels change; use `npm run verify:masks` to confirm this checkpoint.
- Full-library hair matting is also complete and reviewed. Do not rerun SAM hair segmentation or local hair refinement unless source pixels change; any regenerated layer must be visually reviewed before registration.
- The 105 regenerated portraits are delivered separately from the crops in the `palari-marketing` shared Drive at `Los 5 fantásticos /Palari Standardized Avatars 1x1/Clean Render Full - 105`. Drive is a delivery copy, not the repository source of truth.
- The application presents 156 active portraits from 157 bundled sources in one deterministic mixed grid. Avatar 024 (`expanded-14`) is explicitly retired in `src/data/avatars.ts`; keep its source and aligned artifacts archived so later IDs remain stable. Collection labels remain internal provenance metadata and are not user-facing categories.
- `src/data/avatar-attributes.json` records visual planning labels for all 157 portraits, and `docs/AVATAR-COVERAGE.md` summarizes the current distribution. The picker exposes only additive filters for observable features such as hair, accessories, apparent-age band, skin-tone band, and garment style. `presentation` remains internal and must never appear as a feminine/masculine filter; no label may be treated as demographic ground truth.
- Hair recoloring is not part of the requested product scope.

See `docs/STATUS.md` for the short handoff and `docs/MASKING.md` for the approved direction.

## Before making a change

1. Run `git status --short` and preserve unrelated or user-owned changes.
2. Read the documentation related to the area being changed.
3. Run `npm ci` only when dependencies are missing or the lockfile changed. Prefer the lockfile over floating package versions.
4. Establish a baseline with `npm run check` when practical.

## Commands

```bash
npm run dev            # Vite on 0.0.0.0:4173
npm run verify:assets  # Check filenames, counts, PNG format, and dimensions
npm run verify:web-assets # Check all full WebPs, thumbnails, checksums, dimensions, and size records
npm run verify:web-masks # Check all 1,395 lossless runtime-mask WebPs and their manifest
npm run verify:masks   # Check all sources, masks, checksums, metadata, and review state
npm run verify:framing # Check 157 source-linked scale/center records and crop bounds
npm run verify:attributes # Check the 157-record visual variation dataset
npm run handbook:assets:generate # Regenerate full/compact WebPs for 20 source plates
npm run verify:handbook  # Check provenance, WebPs, text-free gallery markup, and no PDF
npm run fantasticos:import -- --source-dir=<downloaded-drive-folder>
npm run fantasticos:clean # Remove only verified disconnected panel-neighbor fragments
npm run fantasticos:redraw:apply -- --source-dir=<reviewed-redraw-folder>
npm run masks:generate # Generate/resume fal.ai masks using .env.local
npm run masks:review -- --id=<id> --reviewer=<name> --notes=<summary>
npm run mattes:generate # Generate/resume refined BiRefNet foregrounds
npm run mattes:review -- --id=<id> --reviewer=<name> --notes=<summary>
npm run hair:generate -- --all --max-new=<approved-cap>
npm run hair:review -- --id=all --reviewer=<name> --notes=<summary>
npm run hair:mattes:generate -- --all
npm run hair:mattes:review -- --id=all --reviewer=<name> --notes=<summary>
npm run framing:generate # Regenerate all framing records locally after installing its Python requirements
npm run avatars:web:generate # Regenerate/resume 1024px and thumbnail WebP delivery assets
npm run masks:web:generate # Regenerate/resume pixel-identical lossless mask WebPs
npm run palari-v2:web:generate # Regenerate 17 V2 sources and 34 lossless mask WebPs
npm run verify:palari-v2 # Check grammar, collection, masks, reviews, delivery files, and registry
npm run build:pages    # Build and verify the slim /palari-art/ GitHub Pages artifact
npm run typecheck      # TypeScript only
npm run build          # TypeScript plus production build
npm run check          # Canonical repository validation
```

For remote browser access, use `http://<tailscale-ip>:4173`. Obtain the current address with `tailscale ip -4`.

## Code ownership map

| Change | Primary location |
| --- | --- |
| Screen composition and app state | `src/App.tsx` |
| Canvas lifecycle | `src/components/AvatarCanvas.tsx` |
| Portrait selection and uploads | `src/components/AvatarLibrary.tsx` |
| Color controls | `src/components/ColorControl.tsx` |
| Built-in portrait registry | `src/data/avatars.ts` |
| Face-aware framing metadata | `src/data/avatar-framing.json` |
| Framing generation and verification | `scripts/generate-avatar-framing.py`, `scripts/verify-avatar-framing.mjs` |
| Web asset generation and verification | `scripts/generate-web-avatar-assets.mjs`, `scripts/verify-web-avatar-assets.mjs` |
| Runtime mask delivery | `scripts/generate-web-mask-assets.mjs`, `scripts/verify-web-mask-assets.mjs` |
| GitHub Pages packaging | `scripts/prepare-pages-artifact.mjs`, `scripts/verify-pages-artifact.mjs` |
| Color math | `src/lib/color.ts` |
| Detection, masking, recoloring, export | `src/lib/recolor.ts` |
| Visual styling | `src/styles.css` |
| Teaching-art gallery | `src/handbook/`, `docs/HANDBOOK.md` |
| Handbook teaching masters and provenance | `docs/art-guide/assets/` |
| Bundled portrait files | `public/avatars/` |

Keep image-processing logic out of React components. Components should pass inputs to a library boundary and render state; they should not own per-pixel algorithms.

## Asset rules

- Never overwrite a bundled source portrait merely to create a color variation.
- Never crop a bundled source to standardize composition. Store a reviewed framing transform and apply it identically to the source and every aligned layer.
- A deliberate artwork revision may replace a bundled portrait only with explicit user direction, recorded generation provenance, and a complete mask regeneration/review.
- Treat exported recolors, generated masks, and previews as derived files.
- Treat `public/avatars-web/` as reproducible delivery output. Never use its lossy WebPs as mask-generation or provenance sources.
- Treat `public/masks-web/` as reproducible lossless delivery output. Never edit it directly or use it instead of reviewed PNG masks for provenance, review, or future mask generation.
- Keep collection filenames contiguous because `src/data/avatars.ts` currently builds paths from numeric ranges.
- Do not rename or move a portrait without updating the registry and documentation.
- Run `npm run verify:assets` after any asset change.
- Follow `docs/FANTASTICOS-IMPORT.md` for the grouped Drive sources; do not split or frame them by eye.
- Follow `docs/FANTASTICOS-REDRAW.md` before changing a Los 5 fantásticos production portrait or its generation prompt.
- Do not upload to, delete from, or reorganize Google Drive unless the user explicitly asks. Local changes do not automatically update Drive.

The full naming and review procedure is in `docs/ASSETS.md`.

## Masking and API rules

- Do not call an AI API when a color slider moves. Generate a reusable mask once and recolor locally.
- Bundled avatars should use the precomputed refined foreground, alpha matte, and garment mask in production.
- A future upload flow may request masks once per new source image and cache them; it is not implemented.
- If uploads begin leaving the browser, update the “Runs locally” and “Processing never leaves this browser” interface copy in `src/App.tsx`; those claims must remain literally true.
- Keep `FAL_KEY` server-side. Never create `VITE_FAL_KEY`, embed a key in JavaScript, commit a `.env` file, or send the secret to the browser.
- Adding fal.ai requires a server-side route or separate batch script; the current Vite SPA cannot safely hold the key.
- API-generated masks must be reviewed before they are registered in the app. The full collection review is recorded in `docs/FULL-LIBRARY-RESULTS.md`.
- Store masks separately from originals and retain enough metadata to reproduce them.

The proposed mask file contract and acceptance cases are in `docs/MASKING.md`.

## Visual acceptance cases

Any change to detection or recoloring must be checked on more than the easiest portrait. Include examples with:

- Long dark hair over the shoulders.
- Hair and shirt with similar colors.
- Warm skin and an orange or red shirt.
- A head covering or prominent accessory.
- Curly or flyaway hair against the background.

Confirm that the background reaches fine hair edges, the entire visible shirt changes, skin is untouched, foreground texture remains visible, and the export is exactly 1024 × 1024.

## Definition of done

- The requested behavior works in the browser.
- `npm run check` passes.
- Relevant difficult portraits were visually inspected for image-processing changes.
- No secret, generated build output, or unrelated user file was added.
- Documentation and `docs/STATUS.md` reflect any changed architecture, commands, asset counts, or next step.

No repository license has been declared. Treat the code and portrait assets as private Palari material; do not publish, sublicense, or copy them into another project without explicit authorization.
