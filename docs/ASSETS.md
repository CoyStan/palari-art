# Avatar assets

## Inventory

The repository currently includes 157 standardized square PNG portraits.

| Collection | Count | Application IDs | Files |
| --- | ---: | --- | --- |
| Original set | 10 | `original-01` through `original-10` | `public/avatars/standardized-1x1/avatar-01.png` through `avatar-10.png` |
| Expanded set | 28 | `expanded-01` through `expanded-28` | `public/avatars/standardized-4x4/avatar-4x4-01-v1.png` through `avatar-4x4-28-v1.png` |
| Los 5 fantásticos | 105 | `fantasticos-001` through `fantasticos-105` | `public/avatars/los-5-fantasticos/fantastico-001.png` through `fantastico-105.png` |
| Coverage expansion | 14 | `coverage-001` through `coverage-014` | `public/avatars/coverage-expansion/avatar-coverage-001.png` through `avatar-coverage-014.png` |

Every current source file is 1254 × 1254. The application normalizes the working Canvas and downloaded output to 1024 × 1024.

## Web delivery derivatives

The PNG files under `public/avatars/` remain the checksum-locked production masters. The browser loads derived assets under `public/avatars-web/`:

- `full/`: 157 square 1024px WebP portraits at quality 82 for the editor source.
- `thumbnail/`: 157 square 256px WebP portraits at quality 72 for the library grid.
- `manifest.json`: source and output paths, byte counts, dimensions, encoding settings, and SHA-256 checksums.

Run `npm run avatars:web:generate` after a source portrait changes, then run `npm run verify:web-assets`. The generator uses installed FFmpeg/libwebp with Lanczos resizing, compression level 6, and four workers by default. It skips checksum-identical outputs and accepts `--force` or `--concurrency=<n>`. The current web derivatives total 11.0 MiB versus 308.4 MiB for the PNG masters, a 96.4% reduction.

Do not replace the PNG masters, mask sources, or source-checksum metadata with these lossy delivery files. Framing remains normalized, so the same scale/center record applies to the master, editor WebP, thumbnail, and every mask layer.

Reviewed mask PNGs have a separate browser-delivery tier under `public/masks-web/`. It contains lossless WebP copies only for the nine possible runtime layers: `foreground`, `matte`, `shirt`, and the six registered hair layers. `manifest.json` links every output to its reviewed PNG by path, dimensions, byte count, and SHA-256 checksum, and records the zero-pixel-difference comparison performed during generation. Audit-only layers such as `person.png`, `hair-trimap.png`, and `shirt-refined.png` are deliberately excluded.

Run `npm run masks:web:generate` after any reviewed runtime PNG changes, then run `npm run verify:web-masks`. Do not edit `public/masks-web/` directly and never use the derived WebPs as segmentation, matting, review, or provenance inputs.

The current 1,395-file runtime mask tier is 204.4 MiB versus 322.8 MiB for the corresponding PNGs, a 36.7% reduction with zero differing decoded pixels.

The application also normalizes composition without changing these source files. `src/data/avatar-framing.json` contains source-checksum-linked scale and center values for all 157 portraits. The same transform is applied to the portrait and every mask layer, preserving exact alignment.

The folder name `standardized-4x4` is historical. Its assets are square portraits. The application presents 156 active portraits together in one deterministic mixed order; collection names remain internal provenance metadata only. Avatar 024 (`expanded-14`) is intentionally retired from the UI, but its source and every aligned/reviewed artifact remain archived to preserve provenance and stable IDs. Do not interpret the folder as a four-column sprite sheet.

The Los 5 fantásticos identity references are 21 horizontal five-character images in the `palari-marketing` shared Drive. Their Drive file IDs and MD5 checksums are recorded in `src/data/fantasticos-sources.json`. The importer creates deterministic first-pass portraits for provenance and comparison. The current production portraits are clean-render v3 `gpt-image-2` revisions of the identity-guided v2 redraws, preserving complete shoulders and native 1254 × 1254 detail while removing grain and pixel-like microtexture. See `docs/FANTASTICOS-IMPORT.md` and `docs/FANTASTICOS-REDRAW.md`.

The first 12 coverage-expansion portraits were purpose-generated from reviewed variation gaps. Avatars 156 and 157 are high-resolution production remakes of two user-selected characters from the Palari art guide. Their prompts, references, and review records are in `docs/COVERAGE-EXPANSION.md`; per-avatar provenance is also attached in `src/data/avatar-masks.json`.

## Source and derived artifacts

Bundled files under `public/avatars/` are reviewed production portraits for this application. Preserve them unchanged when creating color variants.

Examples of derived artifacts include:

- Background or shirt color variations.
- Generated WebP editor files and thumbnails under `public/avatars-web/`.
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
6. Generate or add its source-linked framing record, then run `npm run verify:framing`.
7. Open the editor and review the portrait at desktop and narrow viewport sizes.
8. For image-processing work, inspect both recolored layers at fine boundaries.

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

It also invalidates that avatar's framing checksum. Regenerate framing with `npm run framing:generate` after installing `scripts/framing-requirements.txt`, inspect the result in the application and an all-library contact sheet, and rerun `npm run verify:framing`. Framing metadata is a nondestructive presentation layer, not permission to overwrite or pre-crop a production portrait.

## Semantic masks

Reviewed layers live at `public/masks/<avatar-id>/`. Every directory contains the base `foreground.png`, `matte.png`, `person.png`, `shirt.png`, and `metadata.json`. The 154 portraits with visible hair also contain reviewed `hair.png`, `hair-region.png`, `hair-trimap.png`, `hair-matte.png`, `hair-foreground.png`, `hair-underlay.png`, `hair-underlay-kind.png`, and `shirt-refined.png`. The bald portrait and two fully covered-hair portraits are explicitly exempt. The PNGs match their source portrait dimensions. Metadata records source and output checksums, provider requests, pinned local models, prompts, scores, parameters, cleanup provenance, and separate review outcomes.

All 157 mask IDs and their source files are defined once in `src/data/avatar-masks.json`; `hairMattingCoverage: "all"` registers the reviewed hair layer contract, with explicit `hairMatting: false` exemptions where hair is absent or fully covered. `src/data/avatars.ts` uses that manifest to attach masks to the matching portraits. Run `npm run verify:masks` after changing a source, mask, manifest entry, or metadata file.

The browser resolves those registered PNG layer names to lossless `public/masks-web/` delivery URLs. The source and delivery dimensions remain identical, so framing applies without any independent transform.

## Uploaded portraits

The UI accepts PNG, JPEG, and WebP uploads. These are temporary browser objects:

- They are not persisted after a refresh.
- They are not copied into `public/avatars/`.
- They are not uploaded to Google Drive.
- They are not currently sent to an AI service.

If remote segmentation is later enabled for uploads, the UI must clearly disclose that the image leaves the browser.
