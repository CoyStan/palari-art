# Palari V3 avatar collection

Palari V3 makes the flat avatar collection the product. The ceramic V2 sources remain available as provenance and a future 3D direction, but V3 does not expose ceramic recoloring or 3D controls.

The expanded set contains 24 avatars:

- Six curated V2 icons: `palari-005`, `011`, `019`, `033`, `047`, and `079`.
- Eighteen native 1254 × 1254 RGB PNGs under `icons/`.

The V3 character sentence is: **A little protective shelter hugging its own colorful intelligence.** Characters favor broad hoods, pods, bells, and arches; one coherent colored face; large open eyes; short rounded arms; and a stable legless base.

## Mouthless expansion

The second native batch follows a stricter cute-avatar direction based on Moss, Poppy, and Sunny:

- Moss (`palari-v3-009`), Poppy (`palari-v3-007`), and Sunny (`palari-v3-011`) were revised to remove their dot emblems. Their silhouettes, eyes, arms, colors, and mouthless expressions were preserved.
- Pebble and Briar explore squat rounded pods.
- Dune and Bluebell explore twin-crown bells.
- Mallow and Fig explore protective round hoods.

All six new characters are deliberately mouthless and have no dot emblem, belly mark, nose, text, or logo. They were generated independently with six built-in ImageGen calls so each candidate could develop its own silhouette. Briar received one targeted correction to make its cap blunt and rounded instead of pointed. The slight tonal variation in the navy fields and the stronger-than-minimal arm volume remain recorded in `collection.json` rather than hidden with pixel edits.

The shared prompt contract for this batch was:

```text
Create one original, friendly Palari V3 mascot avatar. Make a logo first and a character second. Show one continuous warm-ivory protective shelter around one large continuous colored face, exactly two large open eyes, and exactly two short rounded fingerless arms. Use only deep navy #172333, warm ivory #E9E6DF, and one assigned face color. Center the character at 80–88% of the square and keep it recognizable at 32 × 32.

The character must be completely mouthless. Do not add a mouth, smile, nose, eyebrows, freckles, dots, seed, emblem, logo, belly mark, text, or watermark. Also forbid thin necks, eye stalks, horns, sharp points, hands, fingers, legs, extra openings, extra eyes, extra colors, texture, scene, border, transparency, and app-icon masks.
```

## Catchlight expansion

The third native batch treats the small ivory catchlight inside each navy pupil as an intentional eye signature:

- Tuck and Mochi are pebble nests.
- Biscuit and Tavi are pillow bells.
- Drift and Olive are folded hoods.

Each character is mouthless and has exactly two catchlights, one per pupil, with no other dot marks, seed, emblem, or belly logo. Six separate built-in ImageGen calls produced the native 1254px candidates. The first outputs had transparent canvases, so each received one targeted ImageGen correction that replaced only the transparency and outside halo with an opaque navy field while preserving the character and its catchlights.

The shared prompt contract for the catchlight batch was:

```text
Create one original, highly simplified Palari V3 mascot avatar: one continuous warm-ivory protective shelter around one large continuous colored face, exactly two open eyes, and exactly two short rounded arms. Use deep navy #172333 for the background and pupils, warm ivory #E9E6DF for the shelter, arms, eye whites, and catchlights, plus one assigned face color.

Place exactly one small, crisp, round ivory catchlight toward the upper-left inside each navy pupil. Exactly two catchlights total. The catchlights are the only small circular decorative marks. Keep the character completely mouthless, with no nose, eyebrows, freckles, seed, emblem, logo, belly mark, text, watermark, hands, fingers, legs, extra openings, extra eyes, extra colors, border, transparency, or app-icon mask.
```

All six pass the 32px eye and silhouette check. They remain strict logo-grammar rejects because the navy fields retain a visible vignette and the character modeling is more dimensional than the micro-volume limit. Those deviations are recorded per avatar in `collection.json`.

## Interface reference

`v3-app-concept.png` is the original 1536 × 1024 implementation reference for the founding set. The expanded interface retains its quiet icon-first picker, large companion preview, three frame treatments, surprise selection, and local PNG download. The desktop picker now uses a 6 × 4 grid; smaller screens reflow to five or four columns.

`contact-sheet.png` shows the full 24-character family at gallery size. `contact-sheet-32px.png` is the small-size legibility check. The interface uses the self-hosted Quicksand family stored under `src/v3/fonts/` with its included OFL license.

Run `npm run palari-v3:web:generate` after a native V3 PNG changes. `npm run verify:palari-v3` validates all 24 registered sources and delivery assets.
