# Coverage expansion — 14 portraits

## Outcome

On 2026-08-05, 12 purpose-generated portraits were added as Avatar 144 through Avatar 155. They implement the previously documented briefs in `docs/AVATAR-COVERAGE.md`. On 2026-08-06, two user-selected characters from the Palari art guide were rebuilt as Avatar 156 and Avatar 157. All 14 are stored at `public/avatars/coverage-expansion/` as contiguous 1254 × 1254 sRGB PNGs.

The generation used Codex's built-in image-generation tool. `public/avatars/standardized-1x1/avatar-04.png` was supplied only as a finish, composition, and rendering-style reference. The first 12 subjects are new, distinct characters with prompt version `coverage-expansion-v1`. Avatars 156 and 157 use prompt version `art-guide-character-remake-v1` and preserve the identities of the top and bottom characters in `docs/art-guide/references/avatar-156-157-identity-reference.png`. Per-avatar provenance is recorded in `src/data/avatar-masks.json` under `sourceGeneration`.

## Shared prompt template

> Create one new, distinct Palari character portrait using the reference only for the polished stylized 3D illustration finish, lighting, camera distance, and square composition. Render a centered head-and-shoulders portrait with complete shoulders and visible upper chest, friendly natural expression, clean studio lighting, and a simple softly textured solid-color background. Keep the face, hair or head covering, accessories, and garment clearly separated at their boundaries so the background and upper garment can later be masked independently. No text, logos, props, frame, collage, duplicate character, cropped head, or cropped shoulders. Output a 1254 × 1254 square PNG. Subject brief: [brief].

## Subject briefs and files

| ID | Public label | Brief | Source |
| --- | --- | --- | --- |
| `coverage-001` | Avatar 144 | Older-adult masculine presentation, dark skin, bald head, gray standalone mustache, glasses, warm cardigan | `avatar-coverage-001.png` |
| `coverage-002` | Avatar 145 | Older-adult feminine presentation, brown skin, short gray coily hair, jewel-tone V-neck blouse | `avatar-coverage-002.png` |
| `coverage-003` | Avatar 146 | Older-adult androgynous presentation, medium skin, short white curls, glasses, structured jacket | `avatar-coverage-003.png` |
| `coverage-004` | Avatar 147 | Middle-aged feminine presentation, tan skin, long braids, glasses, collared shirt | `avatar-coverage-004.png` |
| `coverage-005` | Avatar 148 | Middle-aged androgynous presentation, brown skin, shaved hair, structured jacket | `avatar-coverage-005.png` |
| `coverage-006` | Avatar 149 | Adult feminine presentation, dark skin, medium locs, V-neck garment | `avatar-coverage-006.png` |
| `coverage-007` | Avatar 150 | Adult feminine presentation, medium skin, patterned hijab, glasses, layered garment | `avatar-coverage-007.png` |
| `coverage-008` | Avatar 151 | Adult androgynous presentation, tan skin, long braids, turtleneck | `avatar-coverage-008.png` |
| `coverage-009` | Avatar 152 | Young-adult androgynous presentation, dark skin, short coily hair, glasses, headband | `avatar-coverage-009.png` |
| `coverage-010` | Avatar 153 | Teen feminine presentation, brown skin, long braids, glasses, colorful cardigan | `avatar-coverage-010.png` |
| `coverage-011` | Avatar 154 | Adult masculine presentation, very-light skin, red wavy hair, standalone mustache, collared shirt | `avatar-coverage-011.png` |
| `coverage-012` | Avatar 155 | Adult masculine presentation, medium skin, turban, full beard, glasses, cardigan | `avatar-coverage-012.png` |
| `coverage-013` | Avatar 156 | Young masculine presentation, tan skin, voluminous dark wavy hair, layered blue-gray hoodie | `avatar-coverage-013.png` |
| `coverage-014` | Avatar 157 | Young feminine presentation, tan skin and freckles, long half-up dark wavy hair, gold hoops, beaded necklace, patterned terracotta blouse | `avatar-coverage-014.png` |

## Art-guide remake prompt

Each remake used the saved two-character identity reference plus `avatar-04.png` as the production finish reference. The prompt required one standalone character, identity-preserving face and hair, a centered eye-level head-and-shoulders composition, complete hair and shoulders, visible upper chest, clean material detail, a simple studio background, and boundaries suitable for independent background and garment masks. Page swatches, guide lines, borders, text, logos, collages, cropped hair, cropped shoulders, noisy grain, and garment-colored hair halos were prohibited.

## Mask preparation and review

- All 14 portraits have reviewed SAM 3 person/garment masks and BiRefNet v2 refined foreground/matte layers.
- Eleven portraits with visible hair have reviewed SAM hair search masks and local MediaPipe + ViTMatte + PyMatting layers.
- `coverage-001` is bald; `coverage-007` and `coverage-012` have fully covered hair. They are explicitly marked `hairMatting: false` instead of inventing a hair mask.
- `npm run masks:clean -- --prefix=coverage-` removes only sub-1000-pixel disconnected garment-mask islands and invalidates the semantic review for any changed mask. This corrected a visible isolated neck speck on Avatar 154 without dilating the garment boundary.
- The original browser contact sheet used a contrasting beige background and green garment. A red-versus-blue shirt differential found zero changed pixels inside all nine original reviewed hair masks. Avatars 156 and 157 were separately reviewed with an extreme `#F6D54A` background and `#26B469` garment; their hair, face, neck, inner shirt, jewelry, garment texture, and boundaries remained correct. Avatar 156 also passed an exact 1024 × 1024 PNG export check.

Do not regenerate these portraits or masks while source checksums remain current. A source-pixel change requires regeneration and visual review of every aligned layer for that ID.

## Google Drive delivery

The repository is the application source of truth. The original 12 source portraits were delivered through the configured `gdrive` rclone remote to `Palari Standardized Avatars 1x1/Coverage Expansion - 12`. The old shared-marketing path was not visible to the current remote, so this unambiguous root-level folder was used without touching the existing 105-portrait or pilot deliveries. A 2026-08-05 MD5 audit found 12 matching files and zero differences. Avatars 156 and 157 have not been uploaded to Drive because this addition requested app integration only. Masks are not part of the marketing-avatar delivery.
