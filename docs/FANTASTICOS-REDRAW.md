# Los 5 fantásticos production redraw system

## Purpose

The 21 grouped Drive images remain the immutable provenance source for 105 characters. Their narrow panels do not contain enough shoulder or upper-torso detail for the standard Palari portrait composition. Production portraits are therefore recreated as identity-guided `gpt-image-2` renders rather than enlarged crops.

The output contract is:

- exactly 105 PNG files named `fantastico-001.png` through `fantastico-105.png`;
- 1254 × 1254 sRGB;
- the same recognizable character and design details as the corresponding first-pass reference;
- polished stylized 3D Palari rendering;
- full hair or head covering, neck, both shoulders, and upper chest;
- no text, watermark, props, or hands.

## Style system

Use a contact sheet of reviewed Palari portraits as the style reference. The shared system is soft dimensional modeling, expressive warm eyes, detailed hair and fabric, pastel studio backgrounds, eye-level framing, and a centered head occupying roughly 58% of the canvas height. Identity details from the character reference take priority over the style board.

## Prompt version `fantasticos-redraw-v2`

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

## Review and application

Compare every candidate side by side with its first-pass reference. Reject altered identity, missing accessories, cropped hair, cropped shoulders, stray hands, text, or inconsistent rendering. Verify the exact inventory and dimensions before applying it:

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

After repository validation and visual review, copy the 105 finished portraits into `Los 5 fantásticos /Palari Standardized Avatars 1x1` in the `palari-marketing` shared Drive. Matching filenames may be updated in that child delivery folder. Never overwrite, rename, move, or delete the 21 grouped provenance sources.
