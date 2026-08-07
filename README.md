# Palari Art

Palari Art is the working repository for Palari's standardized character portraits and the browser-based tools used to prepare them for marketing and product use.

The current application is a 1:1 avatar color studio. It presents 156 active portraits from 157 bundled sources in one stable mixed library, lets a user change the background and shirt colors, previews the result, and exports a 1024 × 1024 PNG or WebP. Avatar 024 (`expanded-14`) is intentionally retired from the UI while its source and reviewed layers remain archived in the repository. The browser uses generated WebP files for the editor source and gallery thumbnails while the checksum-locked PNG masters remain unchanged.

On classic phone widths, the editor condenses into a single-screen composition: the preview occupies roughly 60% of the width, a two-column portrait rail occupies the right side, and only the background and shirt preset circles remain below. Full search, tuning, custom color, and export controls remain available on wider layouts.

## Repository status

The interface and export flow work. All 157 bundled portraits use reviewed fal.ai SAM 3 garment masks plus BiRefNet v2 foreground mattes and source-linked face-aware framing metadata. A reproducible FFmpeg/libwebp pipeline creates a 1024px editor WebP and 256px thumbnail for each master, reducing the browser portrait set from 308.4 MiB to 11.0 MiB. The 105 Los 5 fantásticos portraits use the clean-render v3 artwork revision, 12 purpose-generated portraits fill documented variation gaps, and two user-selected art-guide characters have high-resolution production remakes. Background and shirt recoloring remains local and deterministic in the browser; APIs are used only by offline asset-preparation scripts.

Temporary user uploads still use the prototype color detector because there is no upload-segmentation service. That fallback estimates the background from the image corners and the shirt from colors near the bottom of the portrait, so results can vary. See [Masking strategy](docs/MASKING.md) and [full-library results](docs/FULL-LIBRARY-RESULTS.md).

## What is included

| Area | Current state |
| --- | --- |
| Bundled portraits | 157 standardized square PNGs |
| Web delivery | 157 full 1024px WebP files plus 157 256px WebP thumbnails; 96.4% fewer bytes than the PNG masters |
| Library | One mixed grid containing 156 active portraits; Avatar 024 (`expanded-14`) is retired without renumbering later portraits |
| Editable layers | Background and shirt |
| Protected details | Face, hair, accessories, texture, lighting, and identity |
| Exports | 1024 × 1024 PNG and WebP |
| Uploaded images | PNG, JPEG, or WebP for the current browser session |
| Processing | Browser Canvas at runtime; fal.ai is used only by the preparation script |
| Semantic layers | All 157 portraits use reviewed garment masks, refined RGBA foregrounds, and 256-level alpha mattes; 154 have visible-hair layers and 3 are explicitly hair-free/covered |
| Framing | All 157 portraits use source-linked face-aware scale/center metadata; originals and masks remain unchanged |
| Variation planning | 157 visual-attribute records plus a documented coverage report |
| Known limitation | Temporary uploads still use color-estimated masks |

## Start the application

Requirements:

- Node.js 22.12 or newer
- npm 10 or newer
- FFmpeg with the `libwebp` encoder when regenerating web delivery assets (not required just to run the app)

Install the locked dependencies and start Vite:

```bash
npm ci
npm run dev
```

The development server binds to all interfaces on port `4173`.

- On the server: `http://localhost:4173`
- Over the current Tailnet: `http://100.113.33.46:4173`

The Tailnet address is an environment detail, not an application configuration. Confirm it with `tailscale ip -4` if the link stops working.

## Validate a change

```bash
npm run check
```

This verifies the avatar inventory, masks, face-aware framing metadata, attributes, TypeScript, and production build. For image-processing changes, also inspect several portraits visually; compilation cannot detect a bad mask or crop.

Regenerate the derived WebP delivery files after changing any source portrait:

```bash
npm run avatars:web:generate
npm run verify:web-assets
```

To generate or resume masks for the bundled library, copy `.env.example` to `.env.local`, add `FAL_KEY`, and run:

```bash
npm run masks:generate
npm run mattes:generate
```

Existing outputs with the same model and source checksum are skipped unless `-- --force` is added. Limit either run with `-- --id=original-01`. Generated layers are not production-ready until they are visually reviewed and recorded with `npm run masks:review` or `npm run mattes:review`.

The Los 5 fantásticos collection has a provenance-checked importer for its 21 five-character Drive sources and a separate identity-guided redraw workflow for the production portraits. See [Los 5 fantásticos import](docs/FANTASTICOS-IMPORT.md) and [redraw system](docs/FANTASTICOS-REDRAW.md) before refreshing that collection.

## Repository map

```text
palari-art/
├── AGENTS.md                 Instructions and guardrails for coding agents
├── docs/
│   ├── ARCHITECTURE.md       Application structure and data flow
│   ├── ASSETS.md             Portrait collections and asset conventions
│   ├── AVATAR-COVERAGE.md    Visual-attribute distributions and generation gaps
│   ├── COVERAGE-EXPANSION.md Generation provenance for the 12 gap-filling portraits
│   ├── FANTASTICOS-IMPORT.md Reproducible group-image import workflow
│   ├── FANTASTICOS-REDRAW.md Identity-guided production redraw system
│   ├── FULL-LIBRARY-RESULTS.md Complete SAM 3 collection evaluation
│   ├── MASKING.md            Semantic mask workflow and upload fallback
│   ├── PILOT-RESULTS.md       Five-avatar SAM 3 evaluation
│   └── STATUS.md             Concise handoff and next milestones
├── public/avatars/           Checksum-locked 1254px PNG portrait masters
├── public/avatars-web/       Generated 1024px WebP portraits and 256px thumbnails
├── public/masks/             Reviewed semantic layers and generation metadata
├── scripts/generate-avatar-masks.mjs  Resumable fal.ai preparation batch
├── scripts/clean-shirt-mask-components.mjs Remove tiny disconnected SAM garment islands
├── scripts/generate-foreground-mattes.mjs  Resumable BiRefNet matting batch
├── scripts/generate-avatar-framing.py Local face-aware framing metadata generator
├── scripts/generate-web-avatar-assets.mjs Reproducible FFmpeg/libwebp delivery pipeline
├── scripts/import-fantasticos.mjs Split, matte, and standardize the 105 new portraits
├── scripts/apply-fantasticos-redraw.mjs Validate and apply 105 reviewed redraws
├── scripts/clean-fantasticos-foregrounds.mjs Remove verified neighboring-panel fragments
├── scripts/verify-assets.mjs Asset inventory and dimension validation
├── src/components/           React interface components
├── src/data/avatar-masks.json Semantic mask registry
├── src/data/avatar-framing.json Source-linked scale and center metadata
├── src/data/avatar-attributes.json Visual variation planning metadata
├── src/data/avatars.ts       Portrait registry
├── src/lib/color.ts          Color conversion and blending helpers
├── src/lib/recolor.ts        Current mask estimation and Canvas renderer
└── src/App.tsx               Application state and screen composition
```

## Documentation

- Read [AGENTS.md](AGENTS.md) before making an automated change.
- Read [Architecture](docs/ARCHITECTURE.md) before changing the renderer or introducing a server.
- Read [Avatar assets](docs/ASSETS.md) before adding, renaming, replacing, or synchronizing portraits.
- Read [Los 5 fantásticos import](docs/FANTASTICOS-IMPORT.md) before regenerating that collection from Drive.
- Read [Los 5 fantásticos redraw system](docs/FANTASTICOS-REDRAW.md) before regenerating its production artwork.
- Read [Masking strategy](docs/MASKING.md) before working on segmentation or adding an API key.
- Read [Full-library results](docs/FULL-LIBRARY-RESULTS.md) before changing prompts or regenerating semantic masks.
- Read [Avatar variation coverage](docs/AVATAR-COVERAGE.md) before planning a new portrait generation batch.
- Update [Current status](docs/STATUS.md) whenever a milestone or technical boundary changes.

## Product boundaries

- Background and shirt color are the only user-editable properties currently in scope.
- Hair recoloring is intentionally out of scope.
- Recoloring should preserve the original character design; it must not regenerate facial features or clothing.
- Bundled production portraits are stable inputs to the recoloring runtime. Deliberate artwork revisions require explicit provenance plus regenerated and reviewed masks; ordinary color variants must never overwrite them.
- Google Drive is used for sharing and delivery, but this repository does not currently synchronize with Drive automatically.
- No public license is currently declared; treat the code and portrait assets as private Palari material.
