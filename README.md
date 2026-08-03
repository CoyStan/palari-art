# Palari Art

Palari Art is the working repository for Palari's standardized character portraits and the browser-based tools used to prepare them for marketing and product use.

The current application is a 1:1 avatar color studio. It lets a user select one of 143 bundled portraits, change the background and shirt colors, preview the result, and export a 1024 × 1024 PNG or WebP.

## Repository status

The interface and export flow work. All 143 bundled portraits use reviewed fal.ai SAM 3 garment masks plus BiRefNet v2 foreground mattes. Background and shirt recoloring remains local and deterministic in the browser; APIs are used only by offline asset-preparation scripts.

Temporary user uploads still use the prototype color detector because there is no upload-segmentation service. That fallback estimates the background from the image corners and the shirt from colors near the bottom of the portrait, so results can vary. See [Masking strategy](docs/MASKING.md) and [full-library results](docs/FULL-LIBRARY-RESULTS.md).

## What is included

| Area | Current state |
| --- | --- |
| Bundled portraits | 143 standardized square PNGs |
| Collections | 10 original, 28 expanded, and 105 Los 5 fantásticos portraits |
| Editable layers | Background and shirt |
| Protected details | Face, hair, accessories, texture, lighting, and identity |
| Exports | 1024 × 1024 PNG and WebP |
| Uploaded images | PNG, JPEG, or WebP for the current browser session |
| Processing | Browser Canvas at runtime; fal.ai is used only by the preparation script |
| Semantic layers | All 143 portraits use reviewed garment masks, refined RGBA foregrounds, and 256-level alpha mattes |
| Known limitation | Temporary uploads still use color-estimated masks |

## Start the application

Requirements:

- Node.js 22.12 or newer
- npm 10 or newer

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

This verifies the avatar inventory, runs TypeScript checking, and creates a production build. For image-processing changes, also inspect several portraits visually; compilation cannot detect a bad mask.

To generate or resume masks for the bundled library, copy `.env.example` to `.env.local`, add `FAL_KEY`, and run:

```bash
npm run masks:generate
npm run mattes:generate
```

Existing outputs with the same model and source checksum are skipped unless `-- --force` is added. Limit either run with `-- --id=original-01`. Generated layers are not production-ready until they are visually reviewed and recorded with `npm run masks:review` or `npm run mattes:review`.

The Los 5 fantásticos collection has a separate, provenance-checked importer because its Drive sources are 21 five-character group images. See [Los 5 fantásticos import](docs/FANTASTICOS-IMPORT.md) before refreshing that collection.

## Repository map

```text
palari-art/
├── AGENTS.md                 Instructions and guardrails for coding agents
├── docs/
│   ├── ARCHITECTURE.md       Application structure and data flow
│   ├── ASSETS.md             Portrait collections and asset conventions
│   ├── FANTASTICOS-IMPORT.md Reproducible group-image import workflow
│   ├── FULL-LIBRARY-RESULTS.md Complete SAM 3 collection evaluation
│   ├── MASKING.md            Semantic mask workflow and upload fallback
│   ├── PILOT-RESULTS.md       Five-avatar SAM 3 evaluation
│   └── STATUS.md             Concise handoff and next milestones
├── public/avatars/           Bundled source portraits served unchanged
├── public/masks/             Reviewed semantic layers and generation metadata
├── scripts/generate-avatar-masks.mjs  Resumable fal.ai preparation batch
├── scripts/generate-foreground-mattes.mjs  Resumable BiRefNet matting batch
├── scripts/import-fantasticos.mjs Split, matte, and standardize the 105 new portraits
├── scripts/clean-fantasticos-foregrounds.mjs Remove verified neighboring-panel fragments
├── scripts/verify-assets.mjs Asset inventory and dimension validation
├── src/components/           React interface components
├── src/data/avatar-masks.json Semantic mask registry
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
- Read [Masking strategy](docs/MASKING.md) before working on segmentation or adding an API key.
- Read [Full-library results](docs/FULL-LIBRARY-RESULTS.md) before changing prompts or regenerating semantic masks.
- Update [Current status](docs/STATUS.md) whenever a milestone or technical boundary changes.

## Product boundaries

- Background and shirt color are the only user-editable properties currently in scope.
- Hair recoloring is intentionally out of scope.
- Recoloring should preserve the original character design; it must not regenerate facial features or clothing.
- Bundled source portraits are immutable inputs. Derived masks and exported variants are separate artifacts.
- Google Drive is used for sharing and delivery, but this repository does not currently synchronize with Drive automatically.
- No public license is currently declared; treat the code and portrait assets as private Palari material.
