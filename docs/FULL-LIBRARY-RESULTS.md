# Full-library semantic mask results

Review date: 2026-08-04

## Outcome

All 143 bundled Palari avatars passed the semantic-mask and foreground-matte reviews. The editor uses a stored refined RGBA foreground, a soft alpha matte, and a shirt mask for each portrait. The library contains 10 original portraits, 28 expanded portraits, and 105 Los 5 fantásticos portraits.

For the original 38-avatar migration, the five pilot avatars were reused without new requests. The remaining 33 avatars completed with two successful fal.ai SAM 3 requests each: `person` for the foreground silhouette and `sweater` for the editable upper garment. No prompt fallback or regeneration was required.

## Hair-edge refinement

After the original full-library review, the hard SAM person silhouettes were upgraded with one BiRefNet v2 Matting request per avatar at 2048px operating resolution. All 38 requests completed successfully. Each result stores both the refined transparent character in `foreground.png` and its 256-level alpha in `matte.png` at the original 1254 × 1254 source dimensions.

The original collection was reviewed as source/refined-cutout/matte contact sheets against a contrasting teal background. The review covered dreadlocks, dense ringlets, long curls, flyaways, buns, straight hair, short textured hair, and the hijab. No face, accessory, shoulder, or garment section was cut away. Foreground matte area ranged from 41.7% to 64.0%, consistent with the portrait framing; all mattes contained all 256 alpha levels.

## Los 5 fantásticos expansion and v2 redraw

The 21 horizontal Drive sources contained five characters each. All 105 panels were retained because checksum and visual comparison found no exact or confidently duplicate character image. The initial BiRefNet/ImageMagick pass established stable IDs and identity references, but its narrow source panels produced cropped shoulders and insufficient detail.

The production v2 set was therefore recreated with `gpt-image-2` as 105 identity-guided 1254 × 1254 portraits. Every result was compared side by side with its first-pass reference. The accepted set retains the character-defining face, age, skin tone, hair or head covering, facial hair, glasses, accessories, and clothing color while showing complete hair, neck, both shoulders, and upper chest in the Palari portrait style.

The v2 portraits were reviewed in five old/new comparison sheets before application. Their replacement invalidated the first-pass pixel-aligned masks, so BiRefNet foreground mattes and SAM 3 garment masks were regenerated and reviewed against the new source checksums.

## Los 5 fantásticos clean-render v3

The v2 set retained visible pixelation, grain, and crosshatched microtexture because the generation workflow combined narrow identity panels or composite references with a texture-heavy prompt. The v3 pass used each accepted v2 portrait as the exact identity, design, color, and composition target, plus one full-resolution original Palari portrait as a finish-only reference. The prompt explicitly prohibited identity transfer from that finish reference and prohibited pixelation, grain, speckling, dithering, noisy pores, dirty gradients, and sharpening artifacts.

Five representative pilots (`fantasticos-001`, `fantasticos-002`, `fantasticos-034`, `fantasticos-068`, and `fantasticos-083`) established the clean finish. The same workflow was then applied to all 105 portraits. Seven old/clean comparison sheets and full-resolution checks of difficult long-hair, curl, braid, bead, head-covering, and flyaway cases passed. The accepted v3 inventory is 105 contiguous 1254 × 1254 sRGB PNG files.

Because every portrait changed pixels, all 105 BiRefNet foregrounds and SAM garment masks were regenerated. All garment masks succeeded on the first `sweater` prompt, with scores from 0.850 to 0.957. Seven five-layer audit sheets compared each source with its refined cutout, alpha matte, shirt mask, and tinted overlay. Additional zoom review covered the lowest-confidence and most structurally difficult portraits. All 105 foreground and semantic layers passed, and strict checksum verification again passes for all 143 bundled portraits.

## Review evidence

- Reviewed source, foreground, matte, and garment-mask contact sheets for all 143 avatars.
- Reviewed the v3 source/cutout/matte/shirt/overlay audit pages for all 105 changed portraits before recording approval.
- Inspected hair, face, skin, hijab, beard, glasses, earrings, necklaces, collars, and overlapping shoulder hair.
- Inspected the two lowest garment-confidence cases, `expanded-09` and `expanded-13`, at higher resolution; both passed.
- Confirmed all mask PNGs are 1254 × 1254 and match their source dimensions.
- Confirmed every source and mask checksum matches its `metadata.json`.
- Confirmed all garment masks use the `sweater` prompt.
- Confirmed raw garment/person boundary disagreement is at most 0.31% of pixels at 256 × 256 audit resolution. The renderer composites the recolored garment inside the reviewed foreground matte.

## Original 38-avatar quantitative range

| Measurement | Minimum | Maximum |
| --- | ---: | ---: |
| Person confidence | 0.934 | 0.972 |
| Garment confidence | 0.863 | 0.954 |
| Person mask area | 41.4% | 64.7% |
| Garment mask area | 9.3% | 20.6% |
| Garment outside person | 0.10% | 0.31% |

These ranges are review aids, not automatic acceptance thresholds. Visual correctness remains authoritative.

## Cost note

The original 38-avatar mask migration used 66 successful SAM 3 requests after the five-avatar pilot. At the provider price recorded during that pilot on 2026-08-02, those calls corresponded to an estimated $0.33; the pilot was estimated at approximately $0.09 because prompt discovery added unsuccessful calls.

The Los 5 fantásticos v2 and clean-render v3 artwork were generated separately with OpenAI `gpt-image-2`. Each artwork replacement required 105 BiRefNet v2 requests and 105 successful SAM 3 garment requests to rebuild the editable layers. Exact image-generation and mask costs are intentionally not estimated here because provider prices and account terms may differ.

Provider pricing and terms can change. Confirm the current endpoint terms before any future regeneration.

## Reproduction

`src/data/avatar-masks.json` is the complete registry. `npm run masks:generate` skips current outputs when the source checksum and model match. A generated mask remains `unreviewed` until a reviewer records approval with `npm run masks:review`; `npm run verify:masks` rejects missing or unreviewed entries. The grouped-source provenance steps are in `FANTASTICOS-IMPORT.md`; the production artwork workflow and exact prompt are in `FANTASTICOS-REDRAW.md`.
