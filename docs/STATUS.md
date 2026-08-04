# Current status

Last updated: 2026-08-04

## Exact handoff checkpoint

- **Artwork is complete:** `public/avatars/los-5-fantasticos/` contains 105 contiguous `fantasticos-clean-v3` `gpt-image-2` portraits, not the first-pass crops.
- **Masking is complete:** every one of those 105 current portraits has `foreground.png`, `matte.png`, `person.png`, `shirt.png`, and `metadata.json` under its matching `public/masks/fantasticos-NNN/` directory.
- **Reviews are complete:** all 105 garment-mask records and all 105 foreground-matte records are marked reviewed/pass. Source and layer checksums match; `npm run verify:masks` verifies the entire 143-avatar registry.
- **No API batch should run now:** rerun BiRefNet or SAM only after intentionally changing source pixels. A source replacement invalidates all four pixel-aligned layers for that ID.
- **Drive delivery is complete:** the regenerated set is in `Los 5 fantásticos /Palari Standardized Avatars 1x1/Clean Render Full - 105`, separate from the first-pass delivery and `Clean Render Pilot - 5`. An `rclone` audit found 105 matches and zero differences.
- **Git integrity:** the v3 portraits, regenerated layers, metadata, application updates, attribute dataset, and documentation form one reviewed batch. Do not partially revert or separate the 105 source portraits from their checksum-linked layers and metadata.

## Working now

- React/Vite avatar color studio.
- 143 bundled Palari portraits presented in one deterministic mixed grid: 10 original, 28 expanded, and 105 regenerated Los 5 fantásticos clean-v3 production portraits.
- Temporary uploads for PNG, JPEG, and WebP.
- Background and shirt color controls with presets.
- Edge-tolerance controls for temporary-upload fallback masks.
- 1024 × 1024 PNG and WebP export.
- Development access over Tailscale on port 4173.
- Repeatable fal.ai SAM 3 and BiRefNet v2 batch preparation using an ignored server-side key.
- All 143 bundled portraits wired to reviewed garment masks, refined RGBA foregrounds, and 256-level alpha mattes.
- Reproducible import of the 21 five-character Drive source images with source IDs and checksums retained in the repository.
- 105 clean-render v3 `gpt-image-2` Los 5 fantásticos production portraits. They preserve the identity-guided v2 composition, complete shoulders, upper chest, and native 1254 × 1254 detail while removing pixelation, grain, and crosshatched microtexture.
- Automated full-library checksum, dimension, metadata, and review validation.
- A 143-record visual-attribute planning dataset and coverage-gap report. The metadata supports future generation planning and does not reintroduce categories into the mixed library UI.

## Known limitation

Temporary uploads still derive masks from colors and connected pixels. They can select hair, skin, or accessories when those areas resemble the shirt or background. Bundled portraits do not use this fallback.

## Approved direction

- Keep background and shirt as the only editable layers.
- Use fal.ai SAM 3 for garment semantics and BiRefNet v2 Matting for high-fidelity foreground edges.
- The entire 143-avatar library passed mask and foreground review; the regenerated v3 layers passed whole-library contact-sheet review and zoom review of difficult long hair, curls, braids, jewelry, layered clothing, cowl neck, and head-covering cases.
- Store approved masks and recolor locally afterward.
- Keep the provider key on the server only.

## Next implementation steps

1. Keep source and stored-mask checksums synchronized when artwork changes.
2. Visually review every new or regenerated mask before registering it.
3. Decide separately whether uploads need remote segmentation and persistence.
4. If uploads become remote, add disclosure, retention, size limits, caching, and rate limiting first.

## Explicitly not done

- No interactive fal.ai API route exists; only the offline batch script is implemented.
- Temporary uploads do not receive semantic masks.
- No automatic Google Drive synchronization exists; Drive delivery is an explicit `rclone` operation after review.
- The 2026-08-04 clean-render revision is present in the documented shared-Drive delivery folder and separately in `Clean Render Full - 105`; an `rclone` checksum audit confirmed all 105 regenerated files match the repository, with the five-image pilot folder retained.
- No production deployment or background service is configured here.
- Hair recoloring is not planned.
