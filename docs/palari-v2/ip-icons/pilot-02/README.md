# Palari V2 IP-as-logo pilot 02

Status: six native ImageGen review candidates; not registered as production or runtime assets.

This second batch continues the approved warm-ivory, characteristic-color, and deep-navy icon direction for the six remaining figures in the initial frozen 12-character V2 collection. Each master was used only as an identity reference. No reviewed V2 source, mask, or delivery asset was changed.

## Output set

| ID | Family | Characteristic color | 32px identity | Strict skill status |
| --- | --- | --- | --- | --- |
| `palari-004` | Column | Ultramarine | Pass | Reject: background variation, centered placement, and excess contact modeling |
| `palari-005` | Arch | Ultramarine | Pass | Reject: seven seed apertures, background variation, broad pointed reveal, and excess depth |
| `palari-007` | Crescent | Coral | Pass | Reject: five seed apertures, background variation, and a weakening negative gap |
| `palari-009` | Pod | Amber | Pass | Reject: background variation, arm seams, excess modeling, and palette drift |
| `palari-011` | Stack | Forest | Pass | Reject: background variation, navy internal contours, excess modeling, and palette drift |
| `palari-012` | Bell | Ultramarine | Pass | Reject: pointed inner sweep and centered placement |

All six files are native 1254 × 1254 opaque RGB PNGs. No candidate was post-processed. The two contact sheets are deterministic review composites rather than icon deliverables.

## Shared prompt contract

```text
Use case: logo-brand
Asset type: Palari V2 square mascot-logo series
Input image: identity reference only for silhouette, proportions, crown, opening, eyes, pose, and feature placement; generate a new simplified mark rather than editing or reproducing the source render.

Create one cute but calm, highly simplified Palari IP mascot logo, a symbol first rather than a character illustration. Preserve the assigned silhouette family, both calm eyes, one continuous inner-intelligence opening, rounded fingerless arms, a stable legless base, and the compact six-aperture Palari seed mark as an essential brand exception. No mouth.

Use exactly three semantic colors: warm ivory #E9E6DF for the body, the assigned deep characteristic color for the opening plus eyes and seed mark, and edge-to-edge deep navy #172333 for the background only. Add no other semantic color.

Build one thick, rounded, continuous outer silhouette from roughly 6–10 broad shapes. Use flat-first vector-friendly geometry with only one extremely subtle, uninterrupted, low-frequency upper-left-to-lower-right tonal transition inside each large IP color region. Keep the background perfectly uniform and flat. The modeling should nearly disappear at 32 × 32.

Keep the figure upright, emerging from its assigned lower corner, filling about 80% of the square. Crop only through the stable base; preserve the complete crown and both arms.

Render exactly six characteristic-color seed apertures: four larger circles at the corners plus two smaller circles centered vertically. Forbid scenes, floor planes, texture, ceramic realism, clay, plastic, toy rendering, gloss, bevel, extrusion, rim light, cast or contact shadows, discrete highlight shapes, stepped shading, sharp points, thin limbs, fragile gaps, extra colors, text, watermark, border, transparency, rounded canvas corners, and app-icon masks.
```

## Per-avatar identity blocks

- `palari-004`: tall Column; soft integrated hood; long ultramarine droplet channel; both arms resting straight; lower-left.
- `palari-005`: protective asymmetric Arch; narrow ultramarine reveal; two embracing arms; lower-right.
- `palari-007`: closed Crescent with a long blunt upper-right sweep; coral leaf reveal; one side arm and one diagonal thoughtful arm; lower-left; never an open bowl.
- `palari-009`: adult closed Pod; long amber oval opening; two short symmetric side arms; lower-right; source charcoal translated to ivory.
- `palari-011`: two offset interlocking Stack masses; broad diagonal overlap; forest channel; one greeting and one resting arm; lower-left; source stone translated to ivory.
- `palari-012`: gently flared Bell; blunt split-petal crown; ultramarine diagonal reveal and broad wrapping sweep; one greeting and one resting arm; lower-right.

Each asset received one independent built-in ImageGen call and at most one targeted retry. Remaining failures are disclosed rather than hidden with pixel post-processing.

## Review files

- `contact-sheet.png`: full-size comparison in ID order `004`, `005`, `007`, `009`, `011`, `012`.
- `contact-sheet-32px.png`: nearest-neighbor enlargement of the actual 32 × 32 readings in the same order.
- `manifest.json`: sources, palette mapping, checksums, selected attempts, and rejection details.
