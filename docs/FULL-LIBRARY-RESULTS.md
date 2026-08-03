# Full-library semantic mask results

Review date: 2026-08-03

## Outcome

All 38 bundled Palari avatars passed the semantic-mask review and now use stored `person` and `shirt` masks in the editor. The completed collection contains 10 original portraits and 28 expanded portraits.

The five pilot avatars were reused without new requests. The remaining 33 avatars completed with two successful fal.ai SAM 3 requests each: `person` for the foreground silhouette and `sweater` for the editable upper garment. No prompt fallback or regeneration was required.

## Review evidence

- Reviewed source, person mask, and garment mask contact sheets for all 38 avatars.
- Inspected hair, face, skin, hijab, beard, glasses, earrings, necklaces, collars, and overlapping shoulder hair.
- Inspected the two lowest garment-confidence cases, `expanded-09` and `expanded-13`, at higher resolution; both passed.
- Confirmed all mask PNGs are 1254 × 1254 and match their source dimensions.
- Confirmed every source and mask checksum matches its `metadata.json`.
- Confirmed all garment masks use the `sweater` prompt.
- Confirmed raw garment/person boundary disagreement is at most 0.31% of pixels at 256 × 256 audit resolution. The renderer also clips the garment to the person silhouette.

## Quantitative range

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

`src/data/avatar-masks.json` is the complete registry. `npm run masks:generate` skips current outputs when the source checksum and model match. A generated mask remains `unreviewed` until a reviewer records approval with `npm run masks:review`; `npm run verify:masks` rejects missing or unreviewed entries.
