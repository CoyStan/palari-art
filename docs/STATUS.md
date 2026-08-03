# Current status

Last updated: 2026-08-03

## Working now

- React/Vite avatar color studio.
- 143 bundled Palari portraits across three collections: 10 original, 28 expanded, and 105 Los 5 fantásticos.
- Temporary uploads for PNG, JPEG, and WebP.
- Background and shirt color controls with presets.
- Edge-tolerance controls for temporary-upload fallback masks.
- 1024 × 1024 PNG and WebP export.
- Development access over Tailscale on port 4173.
- Repeatable fal.ai SAM 3 and BiRefNet v2 batch preparation using an ignored server-side key.
- All 143 bundled portraits wired to reviewed garment masks, refined RGBA foregrounds, and 256-level alpha mattes.
- Reproducible import of the 21 five-character Drive source images with source IDs and checksums retained in the repository.
- 105 identity-guided `gpt-image-2` Los 5 fantásticos production redraws with complete shoulders, upper chest, and native 1254 × 1254 detail.
- Automated full-library checksum, dimension, metadata, and review validation.

## Known limitation

Temporary uploads still derive masks from colors and connected pixels. They can select hair, skin, or accessories when those areas resemble the shirt or background. Bundled portraits do not use this fallback.

## Approved direction

- Keep background and shirt as the only editable layers.
- Use fal.ai SAM 3 for garment semantics and BiRefNet v2 Matting for high-fidelity foreground edges.
- The entire 143-avatar collection passed mask and foreground review; difficult hair, jewelry, and head-covering cases also passed browser review.
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
- No production deployment or background service is configured here.
- Hair recoloring is not planned.
