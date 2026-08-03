# Palari Art

Palari Art is the working repository for Palari's standardized character portraits and the browser-based tools used to prepare them for marketing and product use.

The current application is a 1:1 avatar color studio. It lets a user select one of 38 bundled portraits, change the background and shirt colors, preview the result, and export a 1024 × 1024 PNG or WebP.

## Repository status

The interface and export flow work. Five difficult portraits now use reviewed fal.ai SAM 3 semantic masks; the other 33 portraits still use the prototype color detector. The prototype estimates the background from the image corners and the shirt from colors near the bottom of the portrait, so it remains unreliable when a shirt resembles skin, hair, or a head covering.

The approved direction is to generate `person` and `sweater` masks through the fal.ai SAM 3 API once, save those masks with each bundled avatar, and continue doing all interactive recoloring locally. The five-avatar pilot validates this architecture. See [Masking strategy](docs/MASKING.md) and [Pilot results](docs/PILOT-RESULTS.md).

## What is included

| Area | Current state |
| --- | --- |
| Bundled portraits | 38 standardized square PNGs |
| Collections | 10 original portraits and 28 expanded portraits |
| Editable layers | Background and shirt |
| Protected details | Face, hair, accessories, texture, lighting, and identity |
| Exports | 1024 × 1024 PNG and WebP |
| Uploaded images | PNG, JPEG, or WebP for the current browser session |
| Processing | Browser Canvas at runtime; fal.ai is used only by the preparation script |
| Semantic pilot | 5 reviewed portraits use stored person and sweater masks |
| Known limitation | The remaining 33 color-based masks are not consistently accurate |

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

To generate or resume the five-avatar semantic-mask pilot, copy `.env.example` to `.env.local`, add `FAL_KEY`, and run:

```bash
npm run masks:pilot
```

Existing masks with the same model and source checksum are skipped unless `-- --force` is added.

## Repository map

```text
palari-art/
├── AGENTS.md                 Instructions and guardrails for coding agents
├── docs/
│   ├── ARCHITECTURE.md       Application structure and data flow
│   ├── ASSETS.md             Portrait collections and asset conventions
│   ├── MASKING.md            Current limitation and planned API masks
│   ├── PILOT-RESULTS.md       Five-avatar SAM 3 evaluation
│   └── STATUS.md             Concise handoff and next milestones
├── public/avatars/           Bundled source portraits served unchanged
├── scripts/verify-assets.mjs Asset inventory and dimension validation
├── src/components/           React interface components
├── src/data/avatars.ts       Portrait registry
├── src/lib/color.ts          Color conversion and blending helpers
├── src/lib/recolor.ts        Current mask estimation and Canvas renderer
└── src/App.tsx               Application state and screen composition
```

## Documentation

- Read [AGENTS.md](AGENTS.md) before making an automated change.
- Read [Architecture](docs/ARCHITECTURE.md) before changing the renderer or introducing a server.
- Read [Avatar assets](docs/ASSETS.md) before adding, renaming, replacing, or synchronizing portraits.
- Read [Masking strategy](docs/MASKING.md) before working on segmentation or adding an API key.
- Read [Pilot results](docs/PILOT-RESULTS.md) before changing prompts or expanding semantic masks.
- Update [Current status](docs/STATUS.md) whenever a milestone or technical boundary changes.

## Product boundaries

- Background and shirt color are the only user-editable properties currently in scope.
- Hair recoloring is intentionally out of scope.
- Recoloring should preserve the original character design; it must not regenerate facial features or clothing.
- Bundled source portraits are immutable inputs. Derived masks and exported variants are separate artifacts.
- Google Drive is used for sharing and delivery, but this repository does not currently synchronize with Drive automatically.
- No public license is currently declared; treat the code and portrait assets as private Palari material.
