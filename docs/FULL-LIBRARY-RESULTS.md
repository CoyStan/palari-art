# Full-library semantic mask results

Review date: 2026-08-03

## Outcome

All 143 bundled Palari avatars passed the semantic-mask and foreground-matte reviews. The editor uses a stored refined RGBA foreground, a soft alpha matte, and a shirt mask for each portrait. The library contains 10 original portraits, 28 expanded portraits, and 105 Los 5 fantásticos portraits.

For the original 38-avatar migration, the five pilot avatars were reused without new requests. The remaining 33 avatars completed with two successful fal.ai SAM 3 requests each: `person` for the foreground silhouette and `sweater` for the editable upper garment. No prompt fallback or regeneration was required.

## Hair-edge refinement

After the original full-library review, the hard SAM person silhouettes were upgraded with one BiRefNet v2 Matting request per avatar at 2048px operating resolution. All 38 requests completed successfully. Each result stores both the refined transparent character in `foreground.png` and its 256-level alpha in `matte.png` at the original 1254 × 1254 source dimensions.

The original collection was reviewed as source/refined-cutout/matte contact sheets against a contrasting teal background. The review covered dreadlocks, dense ringlets, long curls, flyaways, buns, straight hair, short textured hair, and the hijab. No face, accessory, shoulder, or garment section was cut away. Foreground matte area ranged from 41.7% to 64.0%, consistent with the portrait framing; all mattes contained all 256 alpha levels.

## Los 5 fantásticos expansion

The 21 horizontal Drive sources contained five characters each. All 105 panels were retained because checksum and visual comparison found no exact or confidently duplicate character image. Each panel was matted with BiRefNet and recomposed at 1254 × 1254 on `#DCE8F7`, using a consistent 760px foreground width, centered at x=247 and y=-80. This preserves the source character pixels instead of regenerating faces, hair, or clothing.

The standardized portraits and cutouts were reviewed in three contact sheets. A deterministic connected-component pass removed eight small neighboring-panel fragments from six portraits (`fantasticos-022`, `034`, `035`, `045`, `102`, and `103`); a final dry run found no remaining border components. All 105 garment overlays then passed visual review. The `sweater` prompt succeeded for 102 portraits; `fantasticos-068`, `078`, and `083` required the `upper clothing` fallback.

## Review evidence

- Reviewed source, foreground, matte, and garment-mask contact sheets for all 143 avatars.
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

The expansion used 66 successful requests for the remaining 33 portraits. At the provider price recorded during the pilot on 2026-08-02, that corresponds to an estimated $0.33 for this expansion. The earlier pilot was estimated at approximately $0.09 because prompt discovery added unsuccessful calls, for an estimated project total of approximately $0.42.

Provider pricing and terms can change. Confirm the current endpoint terms before any future regeneration.

## Reproduction

`src/data/avatar-masks.json` is the complete registry. `npm run masks:generate` skips current outputs when the source checksum and model match. A generated mask remains `unreviewed` until a reviewer records approval with `npm run masks:review`; `npm run verify:masks` rejects missing or unreviewed entries. The grouped-source reproduction steps are in `FANTASTICOS-IMPORT.md`.
