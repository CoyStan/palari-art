# Avatar assets

## Inventory

The repository currently includes 143 standardized square PNG portraits.

| Collection | Count | Application IDs | Files |
| --- | ---: | --- | --- |
| Original set | 10 | `original-01` through `original-10` | `public/avatars/standardized-1x1/avatar-01.png` through `avatar-10.png` |
| Expanded set | 28 | `expanded-01` through `expanded-28` | `public/avatars/standardized-4x4/avatar-4x4-01-v1.png` through `avatar-4x4-28-v1.png` |
| Los 5 fantásticos | 105 | `fantasticos-001` through `fantasticos-105` | `public/avatars/los-5-fantasticos/fantastico-001.png` through `fantastico-105.png` |

Every current source file is 1254 × 1254. The application normalizes the working Canvas and downloaded output to 1024 × 1024.

The folder name `standardized-4x4` is historical. Its assets are square portraits. The application presents all 143 portraits together in one deterministic mixed order; collection names remain internal provenance metadata only. Do not interpret the folder as a four-column sprite sheet.

The Los 5 fantásticos identity references are 21 horizontal five-character images in the `palari-marketing` shared Drive. Their Drive file IDs and MD5 checksums are recorded in `src/data/fantasticos-sources.json`. The importer creates deterministic first-pass portraits for provenance and comparison. The current production portraits are clean-render v3 `gpt-image-2` revisions of the identity-guided v2 redraws, preserving complete shoulders and native 1254 × 1254 detail while removing grain and pixel-like microtexture. See `docs/FANTASTICOS-IMPORT.md` and `docs/FANTASTICOS-REDRAW.md`.

## Source and derived artifacts

Bundled files under `public/avatars/` are reviewed production portraits for this application. Preserve them unchanged when creating color variants.

Examples of derived artifacts include:

- Background or shirt color variations.
- Segmentation masks.
- Contact sheets and previews.
- PNG or WebP files downloaded from the editor.
- The generated `dist/` directory.

Derived artifacts should not silently replace a production portrait. When artwork genuinely needs revision, record its generation provenance and regenerate every pixel-aligned mask.

## Google Drive relationship

The portrait work has also been shared through the Palari marketing Google Drive. This repository contains working copies used by the application; it has no automatic Drive synchronization.

- Editing a file here does not update Drive.
- Editing a Drive file does not update this repository.
- Uploading, moving, renaming, or deleting Drive assets is a separate operation that requires an explicit request.
- Record which side is canonical before performing a future bulk synchronization.

## Adding a portrait

1. Use a square PNG of at least 1024 × 1024.
2. Keep the character centered and leave visible upper clothing at the bottom of the frame.
3. Add the file to the appropriate collection directory using the next contiguous number.
4. Update the collection count or registry logic in `src/data/avatars.ts`.
5. Run `npm run verify:assets` and `npm run check`.
6. Open the editor and review the portrait at desktop and narrow viewport sizes.
7. For image-processing work, inspect both recolored layers at fine boundaries.

The current registry uses `Array.from` with fixed collection counts. Skipping a number or changing a filename without updating the registry creates a broken image tile.

## Replacing or versioning a portrait

Prefer a versioned filename when the artwork changes materially. A replacement should be reviewed for:

- Square crop and sufficient resolution.
- Consistent head-and-shoulders framing.
- No accidental transparency or color-profile shift.
- Face and hair fidelity.
- Garment visibility.
- Background edge quality.
- Compatibility with the stored mask, if one exists.

Any source-image change invalidates masks made from the previous pixels. Regenerate and review those masks rather than reusing them by filename alone.

## Semantic masks

Reviewed layers live at `public/masks/<avatar-id>/` and contain `foreground.png`, `matte.png`, `person.png`, `shirt.png`, and `metadata.json`. The PNGs match their source portrait dimensions. Metadata records source and output checksums, provider requests, models, prompts, scores, and separate semantic-mask and foreground-matte review outcomes.

All 143 mask IDs and their source files are defined once in `src/data/avatar-masks.json`. `src/data/avatars.ts` uses that manifest to attach masks to the matching portraits. Run `npm run verify:masks` after changing a source, mask, manifest entry, or metadata file.

## Uploaded portraits

The UI accepts PNG, JPEG, and WebP uploads. These are temporary browser objects:

- They are not persisted after a refresh.
- They are not copied into `public/avatars/`.
- They are not uploaded to Google Drive.
- They are not currently sent to an AI service.

If remote segmentation is later enabled for uploads, the UI must clearly disclose that the image leaves the browser.
