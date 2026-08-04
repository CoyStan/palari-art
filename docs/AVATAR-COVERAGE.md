# Avatar variation coverage

Review date: 2026-08-04

## Purpose

`src/data/avatar-attributes.json` is a planning dataset for all 143 bundled portraits. It describes visible design variation so future generation batches can target real gaps instead of producing more of the dominant combinations. It is deliberately separate from the avatar picker: the application still presents one mixed, uncategorized library.

Three visual-review agents classified the portraits in batches of ten with one shared taxonomy. A separate schema audit and a visual recheck of every headwear, older-age, and medium-confidence record followed. The final inventory contains 143 unique labels and IDs; 127 records are high confidence and 16 are medium confidence with an explanatory note.

These labels describe only the stylized artwork. `presentation`, `apparentAge`, and `skinTone` are visual design bands, not claims about a person's gender identity, exact age, ethnicity, nationality, or religion. Do not add inferred race or ethnicity to this dataset.

## Headline distribution

| Attribute | Distribution |
| --- | --- |
| Presentation | 81 feminine, 61 masculine, 1 androgynous |
| Apparent age | 9 teen, 109 young adult, 21 adult, 3 middle-aged, 1 older adult |
| Skin-tone band | 11 very light, 54 light, 20 medium, 14 tan, 35 brown, 9 dark |
| Hair texture | 35 straight, 43 wavy, 24 curly, 21 coily, 9 braids, 8 locs, 2 covered, 1 shaved, 0 bald |
| Facial hair | 103 none, 2 stubble, 7 short beard, 11 goatee, 20 full beard, 0 standalone mustache |
| Eyewear | 8 glasses, 135 none |
| Headwear | 2 hijab, 1 headband, 140 none |
| Ear jewelry | 17 studs, 27 hoops, 16 drops, 1 mixed, 82 none |
| Neck jewelry | 3 necklace, 2 layered, 138 none |
| Garment type | 120 crewneck, 8 v-neck, 8 turtleneck, 5 cardigan, 2 cowl neck |
| Background | 94 blue, 20 purple, 12 pink, 7 beige, 5 orange, 2 gray, 2 green, 1 teal |
| Palette | 61 cool, 56 mixed, 21 warm, 5 neutral |

## Important gaps

- The library is dominated by young adults: 109 of 143 portraits.
- All 21 `adult` and all three `middle_aged` portraits have masculine presentation.
- The sole `older_adult` portrait has feminine presentation, very-light skin, wavy hair, and glasses.
- The sole androgynous portrait is a light-skinned young adult with wavy blonde hair.
- Dark skin has no teen, middle-aged, older-adult, androgynous, glasses, or headwear examples.
- Braids occur only with feminine presentation.
- Coily hair skews masculine, 17 to 4; locs skew masculine, 5 to 3.
- There are no bald portraits and only one shaved style.
- Glasses never intersect with androgynous presentation, headwear, facial hair, middle age, or dark skin.
- Headwear appears only three times and only with feminine presentation. There are no turbans, hats, or masculine/androgynous headwear examples.
- Garment silhouettes are highly repetitive: 120 of 143 are crewnecks.
- Backgrounds are highly repetitive: 94 of 143 are blue.

## Recommended next generation briefs

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

Vary these briefs away from blue backgrounds and crewneck garments. Before adding a bald portrait, extend `hairColor` with a `none` value so baldness is represented consistently across hair fields.

## Fields

Each record contains its public label, internal ID, source path, visual presentation, apparent-age band, skin-tone band, hair color/texture/length, facial hair, eyewear, headwear, ear and neck jewelry, garment type/color, background color, overall palette, notable visible features, confidence, and ambiguity notes.

Run `npm run verify:attributes` after editing the dataset. This validates the complete inventory, enum values, label-to-source mapping, and referenced files.
