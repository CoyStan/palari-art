# Avatar assets

## Inventory

The repository currently includes 38 standardized square PNG portraits.

| Collection | Count | Application IDs | Files |
| --- | ---: | --- | --- |
| Original set | 10 | `original-01` through `original-10` | `public/avatars/standardized-1x1/avatar-01.png` through `avatar-10.png` |
| Expanded set | 28 | `expanded-01` through `expanded-28` | `public/avatars/standardized-4x4/avatar-4x4-01-v1.png` through `avatar-4x4-28-v1.png` |

Every current source file is 1254 × 1254. The application normalizes the working Canvas and downloaded output to 1024 × 1024.

The folder name `standardized-4x4` is historical. Its assets are square portraits and appear in the app as the “Expanded set.” Do not interpret it as a four-column sprite sheet.

## Source and derived artifacts

Bundled files under `public/avatars/` are source portraits for this application. Preserve them unchanged when creating variants.

Examples of derived artifacts include:

- Background or shirt color variations.
- Segmentation masks.
- Contact sheets and previews.
- PNG or WebP files downloaded from the editor.
- The generated `dist/` directory.

Derived artifacts should not silently replace a source portrait. When a source genuinely needs revision, add a new version and make the registry change explicit.

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

Reviewed masks live at `public/masks/<avatar-id>/` and contain `person.png`, `shirt.png`, and `metadata.json`. The PNGs match their source portrait dimensions, and metadata records source and mask checksums, provider requests, prompts, scores, and review outcome.

The active pilot IDs are defined once in `src/data/mask-pilot.json`. `src/data/avatars.ts` uses that manifest to attach masks to the matching portraits. Run `npm run verify:masks` after changing a source, mask, manifest entry, or metadata file.

## Uploaded portraits

The UI accepts PNG, JPEG, and WebP uploads. These are temporary browser objects:

- They are not persisted after a refresh.
- They are not copied into `public/avatars/`.
- They are not uploaded to Google Drive.
- They are not currently sent to an AI service.

If remote segmentation is later enabled for uploads, the UI must clearly disclose that the image leaves the browser.
