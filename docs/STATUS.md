# Current status

Last updated: 2026-08-03

## Working now

- React/Vite avatar color studio.
- 38 bundled Palari portraits across two collections.
- Temporary uploads for PNG, JPEG, and WebP.
- Background and shirt color controls with presets.
- Edge-tolerance controls for temporary-upload fallback masks.
- 1024 × 1024 PNG and WebP export.
- Development access over Tailscale on port 4173.
- Repeatable fal.ai SAM 3 batch preparation using an ignored server-side key.
- All 38 bundled portraits wired to reviewed semantic person and sweater masks.
- Automated full-library checksum, dimension, metadata, and review validation.

## Known limitation

Temporary uploads still derive masks from colors and connected pixels. They can select hair, skin, or accessories when those areas resemble the shirt or background. Bundled portraits do not use this fallback.

## Approved direction

- Keep background and shirt as the only editable layers.
- Use fal.ai SAM 3 to generate `person` and `sweater` masks.
- The entire 38-avatar collection passed mask review; difficult cases also passed browser review.
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
- No automatic Google Drive synchronization exists.
- No production deployment or background service is configured here.
- Hair recoloring is not planned.
