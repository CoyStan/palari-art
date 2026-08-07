# Current status

Last updated: 2026-08-07

## Exact handoff checkpoint

- **Artwork is complete:** `public/avatars/los-5-fantasticos/` contains 105 contiguous clean-v3 portraits rather than the first-pass crops, and `public/avatars/coverage-expansion/` contains 12 purpose-generated gap-filling portraits plus two high-resolution remakes of user-selected art-guide characters.
- **Masking is complete:** all 157 portraits have foreground/semantic layers and checksum-linked metadata. The 154 portraits with visible hair also have reviewed `hair.png` and seven local hair-matting/refined-shirt layers; three bald/fully-covered cases are explicit exemptions.
- **Reviews are complete:** all required garment, foreground-matte, coarse-hair, and internal hair-matting records are reviewed/pass. Source and layer checksums match; `npm run verify:masks` verifies the entire registry.
- **Framing is normalized:** all 157 portraits have source-linked face-aware scale/center metadata in `src/data/avatar-framing.json`. The source and every mask layer receive one identical nondestructive transform; `npm run verify:framing` checks coverage, bounds, and source checksums.
- **Avatar 024 is retired:** `expanded-14` is excluded from the application library. Its source, masks, framing, attributes, and provenance remain archived so later IDs stay stable and the retirement can be reversed safely.
- **Web delivery is optimized:** all 157 PNG masters have checksum-linked 1024px editor WebPs and 256px gallery thumbnails under `public/avatars-web/`. The generated delivery set is 11.0 MiB instead of 308.4 MiB, a 96.4% reduction; the masters remain unchanged.
- **Runtime masks are optimized:** all 1,395 registered runtime PNG layers have checksum-linked lossless WebPs under `public/masks-web/`. Exact generation comparisons found zero differing pixels. The delivery tier is 204.4 MiB instead of 322.8 MiB, a 36.7% reduction; reviewed PNGs remain authoritative.
- **The public editor is deployed:** GitHub Pages serves the browser-only app at `https://coystan.github.io/palari-art/`. `npm run build:pages` creates its verified 220.9 MiB artifact containing 314 avatar WebPs, 1,395 mask WebPs, and 40 gallery WebPs with no PNG, PDF, or audit files.
- **The teaching-art gallery is deployed:** `/handbook/` is a text-free responsive gallery of 20 reviewed plates and 40 checksum-linked WebPs. It has no visible title, prose, controls, or PDF.
- **No API batch should run now:** rerun BiRefNet or SAM only after intentionally changing source pixels. A source replacement invalidates every pixel-aligned layer for that ID, including the local hair-matting derivatives.
- **Drive delivery:** the regenerated 105 set remains in its documented `Clean Render Full - 105` folder. The original 12-portrait coverage copy is separately delivered through `gdrive` at `Palari Standardized Avatars 1x1/Coverage Expansion - 12`; MD5 verification found 12 matches and zero differences. Avatars 156 and 157 are repository-only because no Drive upload was requested.
- **Repository integrity:** source portraits, aligned layers, metadata, application registration, attribute dataset, and documentation must remain synchronized. Do not separate any source portrait from its checksum-linked layers and metadata.

## Working now

- React/Vite avatar color studio.
- 156 active Palari portraits presented in one deterministic mixed grid from 157 bundled sources. Avatar 024 (`expanded-14`) is intentionally excluded without renumbering the remaining portraits.
- Temporary uploads for PNG, JPEG, and WebP.
- Background controls keep the six original pastel presets. Shirt controls add a darker aligned row of brick, wine, plum, navy, forest, and ochre beneath the six original colors.
- Edge-tolerance controls for temporary-upload fallback masks.
- 1024 × 1024 PNG and WebP export.
- Face-aware head-and-shoulders normalization for the gallery, Canvas preview, and export. The approved reference anchors face size/position while reviewed person bounds protect tall hair and head coverings.
- Development access over Tailscale on port 4173.
- Compact phone layout: a roughly 60% preview sits beside a two-column portrait rail, with circle-only background and shirt presets directly below; wider layouts retain the complete control set.
- Reproducible FFmpeg/libwebp generation and Node-only verification for 157 full WebP editor assets plus 157 lightweight gallery thumbnails.
- Reproducible lossless FFmpeg/libwebp generation and Node-only verification for 1,395 pixel-identical runtime-mask WebPs.
- A GitHub Pages workflow and PNG-free artifact contract for the `/palari-art/` project URL.
- A text-free responsive teaching-art gallery with two columns on desktop, one column on phones, and no PDF.
- Repeatable fal.ai SAM 3 and BiRefNet v2 batch preparation using an ignored server-side key.
- All 157 bundled portraits wired to reviewed garment masks, refined RGBA foregrounds, and 256-level alpha mattes.
- Reviewed hair-matting layers for all 154 visible-hair portraits. Offline MediaPipe semantics, a reviewed SAM search region, ViTMatte, PyMatting, and adaptive per-portrait palettes produce reusable hair alpha/foreground/underlay layers. The browser loads those layers and performs no ML.
- Runtime semantic protection uses reviewed `hair.png` as a hard no-recolor layer and reviewed `shirt.png` as the garment/neckline authority. The adaptive `shirt-refined.png` files remain reproducible audit layers but are not used to recolor production portraits.
- Reproducible import of the 21 five-character Drive source images with source IDs and checksums retained in the repository.
- 105 clean-render v3 `gpt-image-2` Los 5 fantásticos production portraits. They preserve the identity-guided v2 composition, complete shoulders, upper chest, and native 1254 × 1254 detail while removing pixelation, grain, and crosshatched microtexture.
- Automated full-library checksum, dimension, metadata, and review validation.
- A reproducible local MediaPipe framing generator plus 157-record checksum validation; no paid API is involved.
- A 157-record visual-attribute planning dataset and updated coverage report. The metadata supports future generation planning and does not reintroduce categories into the mixed library UI.

## Known limitation

Temporary uploads still derive masks from colors and connected pixels. They can select hair, skin, or accessories when those areas resemble the shirt or background. Bundled portraits do not use this fallback.

Temporary uploads do not receive the reviewed hair-matting pipeline. Their masks and fine-edge behavior remain heuristic until a protected upload-segmentation service exists.

## Approved direction

- Keep background and shirt as the only editable layers.
- Use fal.ai SAM 3 for garment semantics and BiRefNet v2 Matting for high-fidelity foreground edges.
- For difficult hair overlap, use the reviewed offline SAM + MediaPipe + ViTMatte + PyMatting layer pipeline. Keep its adaptive palette decisions inside semantic overlap zones; do not add fixed garment- or hair-color patches.
- The entire 157-avatar library passed mask and foreground review; the regenerated v3, coverage-expansion, and art-guide-remake layers passed contact-sheet, zoom, and browser recolor review of difficult long hair, curls, braids, jewelry, layered clothing, head coverings, bald hair state, and neck boundaries.
- Store approved masks and recolor locally afterward.
- Keep the provider key on the server only.

## Next implementation steps

1. Keep source and stored-mask checksums synchronized when artwork changes.
2. Regenerate and visually review framing whenever source pixels change.
3. Visually review every new or regenerated mask before registering it.
4. Decide separately whether uploads need remote segmentation and persistence.
5. If uploads become remote, add disclosure, retention, size limits, caching, and rate limiting first.

## Explicitly not done

- No interactive fal.ai API route exists; only the offline batch script is implemented.
- Temporary uploads do not receive semantic masks.
- Temporary uploads do not receive automatic face-aware framing; only source-linked bundled portraits use reviewed framing metadata.
- No automatic Google Drive synchronization exists; Drive delivery is an explicit `rclone` operation after review.
- The 2026-08-04 clean-render revision is present in the documented shared-Drive delivery folder and separately in `Clean Render Full - 105`; an `rclone` checksum audit confirmed all 105 regenerated files match the repository, with the five-image pilot folder retained.
- No backend or background service is configured; production is the static GitHub Pages deployment documented above.
- Hair recoloring is not planned.

## Hair-matting rollout record

- On 2026-08-05, the five pilot SAM hair masks were reused and 138 new `fal-ai/sam-3/image` hair-mask requests completed under the explicit `--max-new=138` cap. At the listed $0.005/request rate, the expected charge is $0.69.
- Six source/overlay sheets were reviewed before approving all 143 coarse masks.
- All 143 local MediaPipe + ViTMatte + PyMatting layer sets were generated, checksum-linked, and reviewed in six extreme-color browser sheets. Every Canvas was 1024 × 1024; the difficult pale-hair-over-turtleneck case also passed exact PNG-export inspection.
- `src/data/avatar-masks.json` now registers `hairMattingCoverage: "all"`. The eight additional hair/refined-shirt PNGs occupy approximately 107 MiB.
- An exact-pixel regression audit corrected a contact-sheet miss on dense braids. Avatar 116 went from 21,736 dark reviewed-hair pixels changing to blue to zero; a two-shirt-color differential across all 143 portraits found one changed pixel in the entire reviewed hair set. The external two-pixel garment fringe fix is blocked inside reviewed hair and cannot expand around an internal neckline.
