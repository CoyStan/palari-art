# Palari V2 IP-as-logo pilot 01

Status: six native ImageGen review candidates; not registered as production or runtime assets.

This pilot translates one representative of each frozen Palari V2 silhouette family into the simplified `ip-as-logo` language. Each source master was used only as an identity reference. The generated files do not replace or modify any reviewed V2 source, mask, or delivery asset.

## Output set

| ID | Family | Characteristic color | 32px identity | Strict skill status |
| --- | --- | --- | --- | --- |
| `palari-001` | Column | Teal | Pass | Reject: background variation and excess internal modeling |
| `palari-002` | Arch | Amber | Pass | Reject: background variation, excess overlap depth, and weak corner placement |
| `palari-003` | Bell | Forest | Pass | Reject: background variation and five rather than six seed apertures |
| `palari-006` | Crescent | Violet | Pass | Reject: background variation, arm contact seam, and pointed terminals |
| `palari-008` | Pod | Teal | Pass | Reject: background variation, arm contact seams, and weak corner placement |
| `palari-010` | Stack | Burgundy | Pass | Reject: background variation and seven rather than six seed apertures |

All six files are native 1254 × 1254 opaque RGB PNGs. No generated candidate was post-processed. The contact sheets are deterministic review composites and are not icon deliverables.

## Shared prompt contract

Every generation used this common specification, with the per-avatar identity block below:

```text
Use case: logo-brand
Asset type: Palari V2 square mascot-logo pilot
Input image: identity reference only for silhouette, proportions, pose, opening, eyes, and feature placement; generate a new simplified mark rather than editing or reproducing the source render.

Create one highly simplified Palari IP mascot logo, a symbol first and not a character illustration. Preserve the assigned silhouette family, both calm eyes, one dominant inner-intelligence opening, rounded fingerless arms, stable legless base, and the compact six-aperture Palari seed mark as an essential brand exception. No mouth.

Use exactly three semantic colors: warm ivory #E9E6DF for the body, the assigned deep characteristic color for the continuous inner opening plus eyes and seed mark, and solid edge-to-edge deep navy #172333 for the background only. Add no other semantic color.

Build one thick, rounded, continuous outer silhouette from roughly 6–10 broad shapes. Use flat-first vector-friendly geometry with only one extremely subtle, uninterrupted, low-frequency upper-left-to-lower-right tonal transition inside each large IP color region. The modeling should nearly disappear at 32 × 32.

Keep the figure upright, emerging from its assigned lower corner, filling about 80% of the square. Crop only through the stable base; preserve the full crown and both arms.

Forbid scenes, floor planes, texture, ceramic realism, clay, plastic, toy rendering, gloss, bevel, extrusion, rim light, cast or contact shadows, discrete highlight shapes, stepped shading, sharp points, thin limbs, fragile gaps, extra colors, text, watermark, border, transparency, rounded canvas corners, and app-icon masks.
```

## Per-avatar identity blocks

- `palari-001`: tall Column; blunt split twin-petal crown; narrow teal channel; one greeting arm and one resting arm; lower-left.
- `palari-002`: protective Arch; large amber opening; two crossed embracing arms; lower-right; source charcoal translated to the common ivory body.
- `palari-003`: rounded Bell with integrated hood; forest vertical channel; both arms meeting in a soft U; lower-left; source charcoal translated to ivory.
- `palari-006`: closed asymmetric Crescent; blunt upward sweep; narrow violet side reveal; one diagonal resting arm; lower-right; never an open bowl.
- `palari-008`: adult-proportioned closed Pod; low circular teal aperture; one thoughtful cheek-touch arm and one resting arm; lower-left; never chibi.
- `palari-010`: two offset interlocking Stack masses; clear overlap seam; restrained split crown; burgundy leaf opening; two framing arms; lower-right.

Each candidate received one initial ImageGen call and at most one targeted retry, following the installed skill. A remaining failure is disclosed here and in `manifest.json` rather than hidden with image post-processing.

## Review files

- `contact-sheet.png`: full-size visual comparison in ID order `001`, `002`, `003`, `006`, `008`, `010`.
- `contact-sheet-32px.png`: nearest-neighbor enlargement of the actual 32 × 32 readings in the same order.
- `manifest.json`: source links, palette mapping, checksums, dimensions, and rejection details.
