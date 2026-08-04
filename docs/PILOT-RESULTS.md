# SAM 3 mask pilot results

Review date: 2026-08-03

## Outcome

The five-avatar fal.ai SAM 3 pilot passed. Stored semantic masks produced substantially cleaner layer separation than the color heuristic, and the browser renderer successfully recolored backgrounds and sweaters while protecting faces, hair, a hijab, necklaces, and skin.

These five portraits established the prompts and acceptance criteria later used for the original 38-avatar collection. The same stored-layer contract is now active across all 143 bundled portraits; see `FULL-LIBRARY-RESULTS.md` for the completed runs.

## Test set

| Avatar | Stress case | Person score | Garment score | Result |
| --- | --- | ---: | ---: | --- |
| `original-01` | Hijab across face, background, and sweater boundaries | 0.942 | 0.907 | Pass |
| `original-07` | Long wavy hair over a sweater close to the background color | 0.964 | 0.935 | Pass |
| `expanded-10` | Vivid long hair and layered necklaces over the garment | 0.951 | 0.916 | Pass |
| `expanded-26` | Dense curls and warm sweater close to skin tones | 0.953 | 0.919 | Pass |
| `expanded-28` | Red curls, magenta sweater, and pink background | 0.961 | 0.916 | Pass |

Exact request IDs, boxes, prompts, checksums, dimensions, and case-specific review notes live in `public/masks/<avatar-id>/metadata.json`.

## Prompt finding

The text prompt `shirt` returned no mask on all five portraits. The fallback prompt `sweater` succeeded on all five, so new pilot runs now try `sweater` first. The batch script records every attempted prompt so this behavior remains auditable.

## Validation performed

- Reviewed a source/person-mask/shirt-mask contact sheet for all five portraits.
- Inspected the hijab and long-hair cases in the actual Canvas renderer at desktop and mobile viewport sizes.
- Changed garment colors and confirmed protected regions remained visually unchanged.
- Confirmed all masks are valid 1254 × 1254 grayscale PNGs matching their source files.
- Confirmed source and mask SHA-256 checksums match metadata.
- Confirmed shirt masks stay inside the refined foreground during compositing. The earlier SAM person-mask boundary disagreement was below 0.2% of pixels for every pilot image.
- Confirmed Vite rendered without framework overlays, warnings, or application console errors.

## Cost note

The final path needs two successful inferences per portrait: one for `person` and one for `sweater`. Prompt discovery and initial probing added unsuccessful calls during this pilot. At the provider's price reviewed on 2026-08-02, the pilot consumed approximately $0.09; a clean five-avatar rerun should cost approximately $0.05.

Provider pricing and terms can change and must be checked before a future regeneration.

## Recommendation

The recommendation was completed: the remaining bundled avatars were processed with `person` and `sweater`, visually reviewed, and registered. Do not enable remote processing for user uploads until disclosure, retention, rate limiting, and server-route behavior are separately defined.
