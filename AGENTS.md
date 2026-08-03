# Palari Art agent guide

This file is the operating contract for agents working in this repository. Read it before changing code or assets.

## Purpose

Palari Art owns the standardized Palari character portrait library and the tools used to create safe color variants. The active product is a React/Vite avatar editor that changes only two layers:

1. The background.
2. The shirt or upper garment.

The character's face, hair, accessories, pose, texture, lighting, and identity must remain unchanged.

## Current truth

- There are 143 bundled source portraits under `public/avatars/`: 10 original, 28 expanded, and 105 Los 5 fantásticos portraits.
- All bundled sources are square 1254 × 1254 PNG files.
- The editor renders and exports at 1024 × 1024.
- The app is currently a browser-only Vite SPA. It has no backend.
- All 143 bundled portraits use reviewed SAM 3 garment masks and BiRefNet v2 refined foreground mattes under `public/masks/`.
- `src/data/avatar-masks.json` is the source of truth that attaches those masks to built-in portraits.
- `src/lib/recolor.ts` falls back to color/connectivity heuristics only for temporary uploads or a missing mask registration.
- `scripts/generate-avatar-masks.mjs` creates the SAM 3 person and garment masks.
- `scripts/generate-foreground-mattes.mjs` creates the 2048px BiRefNet Matting foreground and 256-level alpha matte used for hair edges.
- The 105 Los 5 fantásticos production portraits are identity-guided `gpt-image-2` redraws. The checksum-locked grouped Drive sources and first-pass crops remain the provenance reference; see `docs/FANTASTICOS-REDRAW.md`.
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
npm run verify:masks   # Check all sources, masks, checksums, metadata, and review state
npm run fantasticos:import -- --source-dir=<downloaded-drive-folder>
npm run fantasticos:clean # Remove only verified disconnected panel-neighbor fragments
npm run fantasticos:redraw:apply -- --source-dir=<reviewed-redraw-folder>
npm run masks:generate # Generate/resume fal.ai masks using .env.local
npm run masks:review -- --id=<id> --reviewer=<name> --notes=<summary>
npm run mattes:generate # Generate/resume refined BiRefNet foregrounds
npm run mattes:review -- --id=<id> --reviewer=<name> --notes=<summary>
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
| Color math | `src/lib/color.ts` |
| Detection, masking, recoloring, export | `src/lib/recolor.ts` |
| Visual styling | `src/styles.css` |
| Bundled portrait files | `public/avatars/` |

Keep image-processing logic out of React components. Components should pass inputs to a library boundary and render state; they should not own per-pixel algorithms.

## Asset rules

- Never overwrite a bundled source portrait merely to create a color variation.
- A deliberate artwork revision may replace a bundled portrait only with explicit user direction, recorded generation provenance, and a complete mask regeneration/review.
- Treat exported recolors, generated masks, and previews as derived files.
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
