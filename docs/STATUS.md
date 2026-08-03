# Current status

Last updated: 2026-08-03

## Working now

- React/Vite avatar color studio.
- 38 bundled Palari portraits across two collections.
- Temporary uploads for PNG, JPEG, and WebP.
- Background and shirt color controls with presets.
- Edge-tolerance controls for the current heuristic detector.
- 1024 × 1024 PNG and WebP export.
- Development access over Tailscale on port 4173.
- Repeatable fal.ai SAM 3 batch preparation using an ignored server-side key.
- Five reviewed semantic-mask pilot portraits wired into the editor.
- Automated pilot checksum, dimension, metadata, and review validation.

## Known problem

The remaining 33 portraits still derive masks from colors and connected pixels. They can select hair, skin, or accessories when those areas resemble the shirt or background. The five pilot portraits solve this with stored semantic masks, but the full-library migration is not complete.

## Approved direction

- Keep background and shirt as the only editable layers.
- Use fal.ai SAM 3 to generate `person` and `sweater` masks.
- The five difficult stylized portraits passed mask and browser review.
- Store approved masks and recolor locally afterward.
- Keep the provider key on the server only.

## Next implementation steps

1. Review the five pilot results with the user.
2. Process the remaining 33 portraits only after pilot approval.
3. Visually review every new mask before registering it.
4. Remove the heuristic fallback only after all bundled portraits have reviewed masks.
5. Decide separately whether uploads need remote segmentation and persistence.

## Explicitly not done

- No interactive fal.ai API route exists; only the offline batch script is implemented.
- The remaining 33 portraits do not yet have semantic masks.
- No automatic Google Drive synchronization exists.
- No production deployment or background service is configured here.
- Hair recoloring is not planned.
