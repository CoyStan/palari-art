# Palari V3 avatar collection

Palari V3 makes the flat avatar collection the product. The ceramic V2 sources remain available as provenance and a future 3D direction, but V3 does not expose ceramic recoloring or 3D controls.

The expanded set contains 24 avatars:

- Six curated V2 icons: `palari-005`, `011`, `019`, `033`, `047`, and `079`.
- Eighteen native 1254 × 1254 RGB PNGs under `icons/`. The six catchlight masters also have deterministic SVG authorities under `vectors/`.

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

Each character is mouthless and has exactly two catchlights, one per pupil, with no other dot marks, seed, emblem, or belly logo. Six separate built-in ImageGen calls tested the prompt-only directions. The generated bitmaps and their one allowed correction were rejected because the navy field still showed a vignette; the hood attempts also introduced transparency and closed fold shadows. Those failures remain recorded in `collection.json`.

The production masters are deterministic SVG logos rendered at 1254px. Each uses one solid `#172333` background rectangle, one continuous ivory shelter, one continuous face region, two eye whites, two navy pupil cutouts, and two ivory catchlights. The SVG gradients share one upper-left-to-lower-right axis. Their measured endpoint changes stay below `0.08` OKLCH lightness, `3°` hue, and `0.015` chroma. No cast shadow, cavity, contact seam, bevel, or background modeling is present.

The shared prompt contract for the catchlight batch was:

```text
Create one original, highly simplified Palari V3 mascot avatar: one continuous warm-ivory protective shelter around one large continuous colored face, exactly two open eyes, and exactly two short rounded arms. Use deep navy #172333 for the background and pupils, warm ivory #E9E6DF for the shelter, arms, eye whites, and catchlights, plus one assigned face color.

Place exactly one small, crisp, round ivory catchlight toward the upper-left inside each navy pupil. Exactly two catchlights total. The catchlights are the only small circular decorative marks. Keep the character completely mouthless, with no nose, eyebrows, freckles, seed, emblem, logo, belly mark, text, watermark, hands, fingers, legs, extra openings, extra eyes, extra colors, border, transparency, or app-icon mask.
```

All six pass the strict logo grammar and the 32px eye and silhouette check. `collection.json` links each PNG master to its SVG authority and records the rejected ImageGen attempt instead of hiding the failure.

## Procedural rig and motion

The V3 browser app reconstructs the six catchlight characters as live SVG rigs. `src/v3/procedural.ts` keeps the rest-pose paths, palette, arms, eyes, and motion parameters as data. The skeleton has one bottom root, one face group, two arm pivots, and two eye groups. It adds no mouth, emblem, cast shadow, or new semantic color.

The **Make one** action uses a numeric seed to choose one of three silhouette families, bounded geometry, a reviewed color pair, eye placement, arm placement, and motion timing. The seed stays in the URL, so reloading the same URL recreates the same character without an image-generation request. Generated and bundled rigged characters export locally as a neutral 1024px PNG.

Idle motion uses transform-only CSS animation for the root, head, arms, blinks, and gaze. The browser samples it at the display refresh rate, normally 60 frames per second on a 60Hz screen. Tapping the preview runs a 680ms squash, lift, and settle response through the Web Animations API. The **Still** control removes idle motion, and `prefers-reduced-motion` also prevents the tap animation.

The rig uses native SVG, CSS, and browser animation APIs. V3 does not ship Rive, Spine, PixiJS, Lottie, a physics engine, or runtime image generation.

## Interface reference

`v3-app-concept.png` is the original 1536 × 1024 implementation reference for the founding set. The expanded interface retains its quiet icon-first picker, large companion preview, three frame treatments, surprise selection, and local PNG download. The desktop picker now uses a 6 × 4 grid; smaller screens reflow to five or four columns.

`contact-sheet.png` shows the full 24-character family at gallery size. `contact-sheet-32px.png` is the small-size legibility check. The interface uses the self-hosted Quicksand family stored under `src/v3/fonts/` with its included OFL license.

Run `node scripts/render-palari-v3-flat-masters.mjs` after a catchlight SVG changes, then run `npm run palari-v3:web:generate`. `npm run verify:palari-v3` validates all 24 registered sources, the six strict flat-first SVG contracts, and every delivery asset.
