# Avatar variation coverage

Review date: 2026-08-06

## Purpose

`src/data/avatar-attributes.json` is a planning dataset for all 157 bundled portraits. It describes visible design variation so future generation batches can target real gaps instead of producing more of the dominant combinations. It is deliberately separate from the avatar picker: the application still presents one mixed, uncategorized library.

The original 143 portraits were classified with one shared taxonomy and separately audited. The 12 purpose-generated coverage portraits were then labeled from their approved visual briefs and checked against the rendered artwork. Two user-selected art-guide characters were subsequently rebuilt and labeled as Avatar 156 and Avatar 157. The current inventory contains 157 unique labels and IDs; 141 records are high confidence and 16 are medium confidence with an explanatory note.

These labels describe only the stylized artwork. `presentation`, `apparentAge`, and `skinTone` are visual design bands, not claims about a person's gender identity, exact age, ethnicity, nationality, or religion. Do not add inferred race or ethnicity to this dataset.

## Headline distribution

| Attribute | Distribution |
| --- | --- |
| Presentation | 87 feminine, 65 masculine, 5 androgynous |
| Apparent age | 10 teen, 112 young adult, 26 adult, 5 middle-aged, 4 older adult |
| Skin-tone band | 12 very light, 54 light, 23 medium, 18 tan, 38 brown, 12 dark |
| Hair texture | 35 straight, 46 wavy, 25 curly, 23 coily, 12 braids, 9 locs, 4 covered, 2 shaved, 1 bald |
| Facial hair | 114 none, 2 stubble, 7 short beard, 11 goatee, 21 full beard, 2 standalone mustache |
| Eyewear | 15 glasses, 142 none |
| Headwear | 3 hijab, 2 headband, 1 turban, 151 none |
| Ear jewelry | 18 studs, 29 hoops, 16 drops, 1 mixed, 93 none |
| Neck jewelry | 4 necklace, 2 layered, 151 none |
| Garment type | 120 crewneck, 11 v-neck, 9 turtleneck, 9 cardigan, 2 cowl neck, 2 jacket, 3 collared shirt, 1 other |
| Background | 95 blue, 21 purple, 13 pink, 10 beige, 6 orange, 6 green, 4 gray, 2 teal |
| Palette | 62 cool, 64 mixed, 25 warm, 6 neutral |

## Coverage-expansion outcome

The 12 recommended briefs were generated and registered as Avatar 144 through Avatar 155. The batch added four androgynous portraits; three older adults; two middle-aged portraits; the first bald portrait; two standalone mustaches; a turban; another hijab and headband; four more braided/loc portraits; seven glasses intersections; and 12 non-blue, non-crewneck compositions. See `docs/COVERAGE-EXPANSION.md` for generation provenance and review details.

Two additional high-resolution remakes were registered as Avatar 156 and Avatar 157 after the user selected their designs from the Palari art guide. They add two wavy-haired young-adult portraits, one masculine and one feminine, without changing the sparse age or androgynous-presentation gaps.

## Remaining high-level gaps

- Young adults still dominate the library: 112 of 157 portraits.
- Crewnecks remain dominant at 120 of 157; neither art-guide remake adds another crewneck.
- Blue remains the dominant background at 95 of 157 after the blue-gray studio background used for Avatar 156.
- Androgynous presentation increased from one to five portraits but remains sparse.
- Older-adult, middle-aged, bald, turban, and standalone-mustache examples now exist, but each is still a small visual sample.

## Completed generation briefs

1. Older-adult masculine presentation, dark skin, bald head, gray mustache, glasses, warm cardigan.
2. Older-adult feminine presentation, brown skin, short gray coily hair, no glasses, jewel-tone blouse.
3. Older-adult androgynous presentation, medium skin, short white curls, glasses, neutral jacket.
4. Middle-aged feminine presentation, tan skin, long braids, glasses, collared shirt.
5. Middle-aged androgynous presentation, brown skin, shaved hair, no eyewear, structured jacket.
6. Adult feminine presentation, dark skin, medium locs, no eyewear or headwear, v-neck garment.
7. Adult feminine presentation, medium skin, patterned hijab, glasses, layered garment.
8. Adult androgynous presentation, tan skin, long braids, no eyewear, turtleneck.
9. Young-adult androgynous presentation, dark skin, short coily hair, glasses, headband.
10. Teen feminine presentation, brown skin, long braids, glasses, colorful garment.
11. Adult masculine presentation, very-light skin, red wavy hair, mustache without beard, collared shirt.
12. Adult masculine presentation, medium skin, turban, full beard, glasses, cardigan.

All 12 briefs were completed away from blue backgrounds and crewneck garments. `hairColor: "none"` was added for the bald portrait so baldness is represented consistently across hair fields.

## Fields

Each record contains its public label, internal ID, source path, visual presentation, apparent-age band, skin-tone band, hair color/texture/length, facial hair, eyewear, headwear, ear and neck jewelry, garment type/color, background color, overall palette, notable visible features, confidence, and ambiguity notes.

Run `npm run verify:attributes` after editing the dataset. This validates the complete inventory, enum values, label-to-source mapping, and referenced files.
