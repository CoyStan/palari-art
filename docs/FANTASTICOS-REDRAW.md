# Los 5 fantásticos production redraw system

## Purpose

The 21 grouped Drive images remain the immutable provenance source for 105 characters. Their narrow panels do not contain enough shoulder or upper-torso detail for the standard Palari portrait composition. Production portraits are therefore recreated as identity-guided `gpt-image-2` renders rather than enlarged crops.

The original v2 redraw established the missing high-resolution composition. The production v3 pass uses each accepted v2 portrait as its identity and composition target and changes only render cleanliness. This avoids returning to the narrow grouped panels while removing the pixelation, crosshatching, and grain introduced by the earlier low-resolution references and texture-heavy prompt.

The output contract is:

- exactly 105 PNG files named `fantastico-001.png` through `fantastico-105.png`;
- 1254 × 1254 sRGB;
- the same recognizable character and design details as the corresponding first-pass reference;
- polished stylized 3D Palari rendering;
- full hair or head covering, neck, both shoulders, and upper chest;
- no text, watermark, props, or hands.

## Style system

Use one full-resolution reviewed Palari portrait as a rendering-quality reference. It controls finish only: identity, clothing, hairstyle, accessories, colors, and composition always come from the Fantástico edit target. The shared system is soft dimensional modeling, expressive warm eyes, coherent hair and fabric detail, smooth pastel studio backgrounds, clean anti-aliased edges, and eye-level framing.

## Historical prompt version `fantasticos-redraw-v2`

Use one image-generation request for each distinct portrait. Image 1 is the character reference and Image 2 is the Palari style board.

```text
Use case: identity-preserve
Asset type: standardized Palari 1:1 avatar portrait
Input images: Image 1 is the exact character identity and design reference. Image 2 is the Palari portrait style and framing system reference.
Primary request: Recreate the exact character from Image 1 as a genuinely high-resolution polished portrait, completing the missing torso and shoulders naturally instead of enlarging or cropping the source.
Subject: Preserve the same person, age, gender presentation, ethnicity, skin tone, facial proportions, expression, eye color, hairstyle or head covering, hair color, facial hair, glasses, accessories, clothing design, neckline, and clothing color shown in Image 1.
Style/medium: Match Image 2 exactly: polished stylized 3D character portrait, soft dimensional modeling, detailed hair or fabric edges, warm expressive eyes, realistic knit/fabric texture, refined studio-render finish. Do not become photorealistic or flat/cartoon line art.
Composition/framing: Square 1:1, straight-on eye-level head-and-shoulders portrait. Center the character. Show the complete top and sides of the hair or head covering with generous breathing room, the full neck, both shoulders from edge to edge, and the upper chest down to about mid-sternum. Head should occupy roughly 58% of canvas height. Do not crop hair, shoulders, or neckline.
Scene/backdrop: clean softly textured pastel background, visually consistent with Image 2, with clear subject separation.
Lighting/mood: soft warm studio light, optimistic and approachable.
Constraints: Identity fidelity is the highest priority. Keep all character-specific colors and design details from Image 1. Add only the naturally missing shoulder and upper-torso continuation. No text, logos, watermark, extra jewelry, props, hands, harsh rim light, or dramatic pose.
Avoid: low resolution, blurry hair, cropped shoulders, giant close-up head, narrow neck, altered ethnicity, altered age, altered head covering, altered facial hair, altered clothing, generic face, painterly brushwork, plastic toy look.
```

## Production prompt version `fantasticos-clean-v3`

Use one image-generation request for each portrait. Image 1 is the accepted v2 production portrait and exact edit target. Image 2 is one full-resolution portrait from `public/avatars/standardized-1x1/`, selected as a compatible finish reference. Do not use a contact sheet or another low-resolution composite.

```text
Use case: identity-preserve
Asset type: Palari standardized 1:1 avatar, clean-render production revision for Fantástico {{ID}}
Input images: Image 1 is the edit target and exact character identity/composition reference. Image 2 is a full-resolution Palari finish reference only; do not copy Image 2's person, clothing, hairstyle, colors, or facial features.
Primary request: Re-render Image 1 as the same character with the same composition and design, but with a visibly cleaner, smoother, higher-quality finish that does not look pixelated or grainy.
Subject invariants: Preserve Image 1's exact perceived identity, age, gender presentation, ethnicity, skin tone, facial proportions, expression, eye color, hairstyle or head covering, hair color, facial hair, glasses, earrings and accessories, clothing design, neckline, clothing color, shoulder placement, and crop. Do not redesign or beautify the person.
Style/medium: Match the polished stylized 3D Palari portrait finish of Image 2. Smooth animation-quality modeling, clean coherent hair shapes and strands, soft controlled skin shading, clean anti-aliased edges, warm expressive eyes. Stylized, not photorealistic and not flat line art.
Scene/backdrop: Preserve the overall background hue from Image 1, but render it as a clean smooth low-frequency pastel studio backdrop with subtle depth only.
Composition/framing: Square 1:1, straight-on eye-level head-and-shoulders portrait. Keep the complete hair or head covering, full neck, both shoulders, and upper chest visible exactly as in Image 1.
Lighting/mood: soft warm studio lighting, approachable and optimistic, controlled highlights.
Materials/textures: Retain recognizable knit, hair, beard, fabric, and head-covering structure, but simplify microtexture into clean broad detail. Texture must read clearly without speckles or noisy high-frequency patterns.
Constraints: Change only render cleanliness and polish. Preserve all character-specific details and colors from Image 1. No text, logos, watermark, props, hands, extra jewelry, or dramatic pose.
Avoid: pixelation, visible pixels, blockiness, compression artifacts, JPEG artifacts, film grain, paper grain, canvas texture, speckling, dithering, chromatic noise, sharpening halos, oversharpening, noisy pores, dirty gradients, fuzzy edges, plastic toy look, photorealism, altered identity, altered clothing, altered accessories, cropped hair, cropped shoulders.
```

The apply script records the exact full-resolution finish-reference file for every ID in `sourceGeneration.finishReference`.

## 2026-08-04 production run

The clean-render pilot used IDs 001, 002, 034, 068, and 083. After approval, the same prompt and finish-reference method were applied to all 105 portraits. Seven side-by-side v2/v3 review sheets and full-resolution difficult-case checks passed before application. After application, all 105 BiRefNet foregrounds and SAM garment masks were regenerated; seven source/cutout/matte/shirt/overlay audit sheets plus low-confidence zoom checks passed before review metadata was recorded. That 143-avatar checkpoint passed strict verification, and the current 157-avatar verifier retains the same checksum contract.

## Review and application

Compare every v3 candidate side by side with its v2 edit target. Reject altered identity, missing accessories, changed clothing or background hue, cropped hair, cropped shoulders, stray hands, text, reference-person leakage, or inconsistent rendering. Verify the exact inventory and dimensions before applying it:

```bash
npm run fantasticos:redraw:apply -- --source-dir=<reviewed-redraw-folder>
```

The apply command records `sourceGeneration` provenance in every avatar's mask metadata. A redraw changes source pixels and invalidates all existing masks. Refresh them immediately:

```bash
npm run mattes:generate -- --prefix=fantasticos- --derive-person
npm run masks:generate -- --prefix=fantasticos-
npm run mattes:review -- --prefix=fantasticos- --reviewer=<name> --notes=<summary>
npm run masks:review -- --prefix=fantasticos- --reviewer=<name> --notes=<summary>
npm run check
```

`--derive-person` copies the reviewed soft BiRefNet matte into the reusable person mask, so SAM 3 only needs to generate the garment layer.

## Google Drive delivery

After repository validation and visual review, the 105 finished portraits may be copied into `Los 5 fantásticos /Palari Standardized Avatars 1x1` in the `palari-marketing` shared Drive only when explicitly requested. Matching filenames may be updated in that child delivery folder. Never overwrite, rename, move, or delete the 21 grouped provenance sources. On 2026-08-04, the 105 v3 repository portraits were also delivered as a clearly separated full generation run in `Palari Standardized Avatars 1x1/Clean Render Full - 105`; an `rclone` checksum audit confirmed all 105 files match, and the separate `Clean Render Pilot - 5` folder remains intact.
