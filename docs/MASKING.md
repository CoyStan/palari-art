# Masking strategy

## Decision summary

The current color-based detector is suitable as a prototype fallback but not as the production mask source. The five-avatar pilot has validated this production design:

1. Use an external semantic segmentation API to create masks.
2. Review and store the masks once.
3. Recolor locally with deterministic Canvas code.

This preserves server resources and avoids paying for repeated AI calls while a user experiments with colors.

## Current implementation

`src/lib/recolor.ts` estimates background and shirt masks from pixel colors and connected regions. It does not identify a face, hair, clothing, or accessories semantically.

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

The key is expected as the server-only environment variable `FAL_KEY`. It is loaded from ignored `.env.local` by `npm run masks:pilot`; no key is stored in the repository or exposed to Vite.

## Minimum mask set

Only two masks are needed for the current product:

| Prompt | Stored result | Use |
| --- | --- | --- |
| `person` | `person.png` | Invert to isolate the background |
| `sweater` | `shirt.png` | Recolor the visible upper garment |

Hair and face do not require separate editable masks because they remain inside the protected person region and outside the shirt selection. Optional `hair` and `face` masks may be generated during evaluation to diagnose overlaps, but they are not required at runtime.

The pilot found that `shirt` returned no mask for all five portraits while `sweater` succeeded with scores from 0.907 to 0.935. New runs therefore try `sweater` first and retain a fallback prompt ladder. At two successful requests per portrait, the 38 bundled avatars require 76 requests. At the last reviewed price, the one-time inference cost would be approximately $0.38 before retries.

## Evaluation before integration

The completed pilot covers five difficult portraits:

1. Long dark hair covering the shoulders.
2. Hair and shirt with similar colors.
3. Warm skin with an orange or red shirt.
4. A head covering or large accessory.
5. Curly or flyaway hair against the background.

Prompt attempts, request IDs, scores, boxes, checksums, and review results are kept in each `metadata.json`. See `PILOT-RESULTS.md` for the consolidated result.

Acceptance criteria:

- No visible face, neck, hair, or accessory is included in the shirt mask.
- The complete visible garment, including shoulders and collar edges, is selected.
- The person mask preserves fine hair edges without background halos.
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

### Phase 2: Bundled library — pending approval

- Process and review all 38 portraits.
- Add `public/masks/<avatar-id>/person.png`, `shirt.png`, and `metadata.json`.
- Update the renderer to prefer stored masks.
- Retain the heuristic detector temporarily as an explicit fallback.

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
