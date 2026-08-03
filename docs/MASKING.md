# Masking strategy

## Decision summary

The color-based detector remains a prototype fallback for temporary uploads. All bundled portraits now use this production design:

1. Use an external semantic segmentation API to create masks.
2. Review and store the masks once.
3. Recolor locally with deterministic Canvas code.

This preserves server resources and avoids paying for repeated AI calls while a user experiments with colors.

## Current implementation

`src/lib/recolor.ts` loads a reviewed refined foreground, alpha matte, and garment mask for the 143 bundled portraits. When no stored layers are registered, as with temporary uploads, it estimates background and shirt masks from pixel colors and connected regions. That fallback does not identify a face, hair, clothing, or accessories semantically.

Known failure conditions include:

- Hair and clothing with similar hues.
- Orange or red clothing near warm skin tones.
- Long hair overlapping the shirt.
- Head coverings extending toward the shoulders.
- Textured garments containing several distant colors.
- Non-uniform or detailed backgrounds.

The tolerance controls are diagnostic aids. They cannot make a color-only detector reliable for all portraits.

## Proposed provider

The current candidate is fal.ai's `fal-ai/sam-3/image` endpoint. It accepts text prompts and returns segmentation masks without requiring a local GPU or installed model.

Last reviewed on 2026-08-02, the provider listed the endpoint at $0.005 per request and allowed commercial use. Pricing and terms can change; verify them before a batch run.

Documentation: <https://fal.ai/models/fal-ai/sam-3/image>

The key is expected as the server-only environment variable `FAL_KEY`. It is loaded from ignored `.env.local` by `npm run masks:generate`; no key is stored in the repository or exposed to Vite.

## Stored layer set

Only two masks are needed for the current product:

| Source | Stored result | Use |
| --- | --- | --- |
| BiRefNet v2 Matting | `foreground.png` | Refined RGBA character colors at hair boundaries |
| BiRefNet v2 Matting | `matte.png` | Soft 256-level foreground alpha; invert for the background |
| SAM prompt `person` | `person.png` | Reproducible hard silhouette and audit reference |
| SAM prompt `sweater` | `shirt.png` | Recolor the visible upper garment |

Hair and face do not require separate editable masks. The BiRefNet matte preserves their edge coverage and the shirt mask excludes them. The runtime composites the refined foreground at 1024px, avoiding the previous 512px binary-mask blur.

The original pilot found that `shirt` returned no mask for all five portraits while `sweater` succeeded. Across the original 38-avatar migration, person scores range from 0.934 to 0.972 and garment scores range from 0.863 to 0.954. That historical pipeline used two successful SAM requests per portrait.

The 105 Los 5 fantásticos portraits already have a BiRefNet matte from their standardization step, so their hard `person.png` reference is derived from that reviewed matte instead of spending a second SAM request. Garment generation tries `sweater`, then `shirt`, then `upper clothing`; 102 portraits succeeded with `sweater`, while `fantasticos-068`, `fantasticos-078`, and `fantasticos-083` used the final fallback. A clean regeneration needs 105 BiRefNet requests and 105 successful garment-mask requests, plus any unsuccessful prompt attempts.

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

### Phase 2b: Los 5 fantásticos import — complete

- Split 21 source groups into 105 identity-preserving square portraits.
- Generated and reviewed BiRefNet foregrounds and SAM garment masks.
- Removed eight disconnected neighboring-panel fragments from six portraits using a deterministic boundary cleanup.
- Registered all 105 portraits as a third collection.

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
