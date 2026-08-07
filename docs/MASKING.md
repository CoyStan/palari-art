# Masking strategy

## Decision summary

The color-based detector remains a prototype fallback for temporary uploads. All bundled portraits now use this production design:

1. Use an external semantic segmentation API to create masks.
2. Review and store the masks once.
3. Recolor locally with deterministic Canvas code.

This preserves server resources and avoids paying for repeated AI calls while a user experiments with colors.

## Current implementation

`src/lib/recolor.ts` loads a reviewed refined foreground, alpha matte, and garment mask for all 157 bundled portraits, plus a coarse hair mask for the 154 portraits with visible hair. Reviewed `shirt.png` is the garment and neckline authority, and reviewed `hair.png` is a hard preservation layer. When no stored layers are registered, as with temporary uploads, it estimates background and shirt masks from pixel colors and connected regions. That fallback does not identify a face, hair, clothing, or accessories semantically.

For stored masks, the renderer extends the garment by at most two pixels only where it meets the external BiRefNet foreground silhouette or canvas boundary, and refuses that extension inside reviewed hair. This covers antialiased source-garment fringes without dilating the mask around internal necklines, skin, scarves, hair, or layered clothing.

Known failure conditions include:

- Hair and clothing with similar hues.
- Orange or red clothing near warm skin tones.
- Long hair overlapping the shirt.
- Head coverings extending toward the shoulders.
- Textured garments containing several distant colors.
- Non-uniform or detailed backgrounds.

The tolerance controls are diagnostic aids. They cannot make a color-only detector reliable for all portraits.

## Batch providers

The reviewed stored garment masks were generated with fal.ai's `fal-ai/sam-3/image` endpoint. It accepts text prompts and returns segmentation masks without requiring a local GPU or installed model. The refined foregrounds and mattes were generated with `fal-ai/birefnet/v2` Matting.

Last reviewed on 2026-08-05, the provider listed the endpoint at $0.005 per request and allowed commercial use. Pricing and terms can change; verify them before a batch run.

Documentation: <https://fal.ai/models/fal-ai/sam-3/image>

The key is expected as the server-only environment variable `FAL_KEY`. It is loaded from ignored `.env.local` by `npm run masks:generate`; no key is stored in the repository or exposed to Vite.

## Stored layer set

The production library normally uses these stored layers:

| Source | Stored result | Use |
| --- | --- | --- |
| BiRefNet v2 Matting | `foreground.png` | Refined RGBA character colors at hair boundaries |
| BiRefNet v2 Matting | `matte.png` | Soft 256-level foreground alpha; invert for the background |
| SAM prompt `person` | `person.png` | Reproducible hard silhouette and audit reference |
| SAM prompt `sweater` | `shirt.png` | Recolor the visible upper garment |

### Hair-edge matting

All 154 bundled portraits with visible hair additionally carry a reviewed offline hair-matting layer set. The bald portrait and the hijab- and turban-covered portraits are explicitly exempt. Hair is still not editable and is never recolored. The layer set only separates real hair strands from background and garment colors visible through or mixed into their edges.

The pipeline in `scripts/generate-hair-matting-layers.py` combines four signals:

1. The reviewed SAM `hair.png` is a broad search region, not the final hair alpha.
2. Google's Apache-2.0 [MediaPipe HairSegmenter](https://developers.google.com/mediapipe/solutions/vision/image_segmenter) supplies an independent semantic hair region.
3. Apache-2.0 [ViTMatte](https://huggingface.co/hustvl/vitmatte-small-composition-1k) solves a three-zone trimap, and MIT-licensed [PyMatting](https://github.com/pymatting/pymatting) recovers foreground and underlay colors.
4. Per-portrait hair and garment palettes are learned from reviewed semantic seeds. The adaptive classifier is limited to the hair/garment overlap zone and extends the garment through real openings between strands. It does not contain fixed rules for pink, orange, brown, blonde, black, or any background color.

MediaPipe components must intersect a 24-pixel expansion of the reviewed SAM hair region. This prevents head coverings or nearby fabric from growing into the hair layer. When semantic confidence leaves too few clean palette samples, the generator falls back to the high-confidence interior of the reviewed SAM hair mask, restricted to the upper portrait; this handles tightly textured hair without introducing garment pixels.

Each avatar directory stores these additional derived layers:

| File | Runtime or audit purpose |
| --- | --- |
| `hair-region.png` | Runtime semantic zone in which the recovered hair composite may replace the normal composite |
| `hair-trimap.png` | Auditable ViTMatte input; not loaded by the browser |
| `hair-matte.png` | Soft internal hair alpha |
| `hair-foreground.png` | Recovered, adaptively decontaminated RGBA hair foreground |
| `hair-underlay.png` | Recovered color beneath the hair alpha |
| `hair-underlay-kind.png` | Classifies the underlay as preserve, background, or garment |
| `shirt-refined.png` | Auditable adaptive garment-opening derivative; retained for provenance, not used as the production garment authority |

At runtime `src/lib/recolor.ts` recolors a saved underlay as garment only where reviewed `shirt.png` permits it. It composites saved clean hair at fine edges, then restores every reviewed coarse-hair pixel from the original portrait. This prevents an underestimated fine alpha from cutting garment or background through opaque hair and leaves neck, face, accessories, and other foreground pixels unchanged. No model runs when a slider moves or an image exports.

The 2026-08-05 full-library review used six contact sheets of all 143 browser renders with an extreme `#F6D54A` yellow background and `#26B469` green garment. Every Canvas reported 1024 × 1024. An exact 1024 × 1024 PNG export of the difficult pale-hair-over-turtleneck case was inspected in addition to hijab, loc, braid, curl, flyaway, long-hair, and the original five pilot cases. Face, neck, accessories, head coverings, hair identity, and texture remained unchanged; visible garment openings between strands followed the target garment color.

To reproduce the offline environment on CPU:

```bash
uv venv .venv-hair
uv pip install --python .venv-hair/bin/python --index-url https://download.pytorch.org/whl/cpu torch torchvision
uv pip install --python .venv-hair/bin/python -r scripts/hair-matting-requirements.txt
npm run hair:generate -- --all --max-new=<approved-request-cap>
npm run hair:review -- --id=all --reviewer=<name> --notes=<summary>
.venv-hair/bin/python scripts/generate-hair-matting-layers.py --all
npm run hair:mattes:review -- --id=all --reviewer=<name> --notes=<summary>
npm run verify:masks
```

The generator downloads the checksum-pinned MediaPipe TFLite model into the local cache unless `--mediapipe-model=<path>` is supplied. `hair:generate` and `hair:review` remain the separate SAM search-mask provenance commands; the final matting commands are `hair:mattes:generate` and `hair:mattes:review`.

The original full rollout reused the five pilot SAM hair masks and made 138 new capped SAM requests. The first 12 coverage-expansion portraits added nine successful SAM hair masks; their bald and hijab portraits correctly returned no hair, and the turban portrait was exempted without a request. Avatars 156 and 157 added two individually capped SAM hair requests and two local refinement runs. The resulting 154 visible-hair layer sets are reviewed and registered through `hairMattingCoverage: "all"` plus three explicit exemptions in `src/data/avatar-masks.json`. Do not rerun either stage unless a source portrait changes pixels; the generators are checksum-aware and resumable, but a new paid batch still requires an explicit request cap.

At the provider's listed 2026-08-05 rate, the 138 new SAM requests correspond to an expected $0.69. MediaPipe, ViTMatte, PyMatting, and runtime recoloring ran locally and added no per-image API charge.

Hair and face do not require separate editable masks. The normal BiRefNet matte preserves their edge coverage and the shirt mask excludes them. The runtime composites the refined foreground at 1024px, avoiding the previous 512px binary-mask blur.

The original pilot found that `shirt` returned no mask for all five portraits while `sweater` succeeded. Across the original 38-avatar migration, person scores range from 0.934 to 0.972 and garment scores range from 0.863 to 0.954. That historical pipeline used two successful SAM requests per portrait.

The 105 Los 5 fantásticos portraits have reviewed BiRefNet mattes, so their hard `person.png` references are derived from those mattes instead of spending a second SAM request. Garment generation tries `sweater`, then `shirt`, then `upper clothing`. After the clean-render v3 artwork revision on 2026-08-04, all 105 portraits succeeded on the first `sweater` attempt, with garment scores from 0.850 to 0.957. This batch is complete and must not be rerun while the source checksums remain current. If the artwork changes intentionally, a clean regeneration requires 105 BiRefNet requests and 105 successful garment-mask requests, plus any unsuccessful prompt attempts.

## Evaluation and review

The pilot established five difficult acceptance cases:

1. Long dark hair covering the shoulders.
2. Hair and shirt with similar colors.
3. Warm skin with an orange or red shirt.
4. A head covering or large accessory.
5. Curly or flyaway hair against the background.

Prompt attempts, request IDs, scores, boxes, checksums, and review results are kept in each `metadata.json`. See `PILOT-RESULTS.md` for the initial evaluation and `FULL-LIBRARY-RESULTS.md` for the completed collection.

Acceptance criteria:

- No visible face, neck, hair, or accessory is included in the shirt mask.
- The complete visible garment, including shoulders and collar edges, is selected.
- The foreground matte preserves fine hair edges without background halos.
- Mask boundaries remain stable when rendered at 1024 × 1024.
- Recoloring preserves original shading and texture.
- A reviewer explicitly marks the masks approved before they become defaults.

If a mask is nearly correct, manual correction is preferable to repeated generative editing. The corrected mask remains a reusable deterministic asset.

## Integration phases

### Phase 1: Batch pilot — complete

- Add a server-side or local batch script that reads `FAL_KEY`.
- Process five representative bundled portraits.
- Save raw API results outside the source portrait folders.
- Normalize masks to the proposed stored contract.
- Produce a visual comparison for review.

### Phase 2: Bundled library — complete

- Processed and reviewed the original 38 portraits.
- Added reviewed SAM layers plus BiRefNet `foreground.png` and `matte.png` for every avatar.
- Updated the renderer registry so every built-in portrait uses stored masks.
- Retained the heuristic detector for temporary uploads.

### Phase 2b: Los 5 fantásticos import and clean redraw — complete

- Split 21 source groups into 105 identity-preserving square portraits.
- Generated and reviewed BiRefNet foregrounds and SAM garment masks.
- Removed eight disconnected neighboring-panel fragments from six portraits using a deterministic boundary cleanup.
- Re-rendered all 105 portraits with the clean v3 production prompt and regenerated and reviewed their BiRefNet and SAM layers.
- Registered all 105 portraits in the unified mixed library.

### Phase 2c: Full-library hair matting — complete

- Generated and reviewed a SAM hair search mask for every bundled portrait with visible hair.
- Generated reusable MediaPipe + ViTMatte + PyMatting layers locally for all 154 visible-hair portraits; three hair-free/covered portraits are explicitly exempt.
- Reviewed six full-library extreme-color browser sheets and an exact difficult-case export.
- Registered all eligible layer sets; `npm run verify:masks` rejects a missing, changed, or unreviewed required layer.

### Phase 2d: Coverage expansion — complete

- Generated 12 portraits from the documented variation gaps using one shared style/composition prompt and 12 distinct briefs.
- Generated and reviewed all 12 semantic and foreground sets, plus nine visible-hair layer sets.
- Removed sub-1000-pixel disconnected SAM garment islands with `npm run masks:clean`; this fixed a visible neck speck without broadening any garment boundary.
- Registered Avatar 144 through Avatar 155 in the same deterministic mixed library.

### Phase 2e: Art-guide character remakes — complete

- Rebuilt two user-selected art-guide characters as clean standalone 1254 × 1254 production portraits.
- Generated, cleaned, and reviewed their SAM person/garment masks and BiRefNet foreground/matte layers.
- Generated two capped SAM hair search masks and the complete local MediaPipe + ViTMatte + PyMatting layer sets.
- Verified Avatar 156 and Avatar 157 in the browser with an extreme yellow background and green garment; hair, neck, face, jewelry, inner clothing, garment texture, and an exact 1024 × 1024 PNG export passed review.

### Phase 3: New uploads

- Add a protected server endpoint with file-size and MIME validation.
- Generate masks once per uploaded source and cache them by content hash.
- Tell users that the portrait will be sent to the segmentation provider.
- Define retention and deletion behavior before persisting uploads.

## Security and cost guardrails

- Never expose `FAL_KEY` through Vite or browser JavaScript.
- Never commit the key, request logs containing it, or a real `.env` file.
- Rate-limit any interactive endpoint before making it public.
- Enforce an image-size limit and accepted MIME types.
- Cache by source content hash to avoid paying twice for the same image.
- Do not invoke segmentation for color changes or exports.
- Recheck provider pricing, commercial terms, and data handling before production use.
