---
name: ip-as-logo
description: Generate highly simplified personified IP mascot logos with Flat-first geometry, rounded heavy forms, two IP colors plus one background color by default, and continuous-gradient neo-skeuomorphic micro-volume. Use when creating an animal, creature, robot, ghost, plant, object, or other character as a minimal square logo or app-icon artwork, including when the agent should infer three product-relevant directions and propose six independent candidates for approval.
---

# IP as Logo

Create a logo first and a character second. Reduce the subject to a compact symbol that remains recognizable at `32 × 32`; do not produce a character illustration.

## Workflow

1. Parse the request for an explicit IP subject and available product context. Do not ask the user to choose a color mode unless they explicitly want to control it.
2. When the user has not specified an IP subject and the current workspace is a product repository, inspect relevant read-only context before asking questions. Prefer the README, product docs, package or app metadata, landing-page copy, manifests, and design tokens. Treat context as sufficient when the product purpose, primary audience, and intended personality can be inferred with reasonable confidence.
3. When product context is insufficient, ask one consolidated round of background questions covering what the product does, who it serves, and how it should feel. Do not start a second background questionnaire. Continue with the best supported interpretation after the answer.
4. Once context is sufficient, always present three concise directions before generation and explicitly propose generating six independent logo candidates in one batch. Do not generate until the user agrees, unless the current request already explicitly authorizes six outputs or asks the agent to proceed without another confirmation.
5. Choose the three proposed directions deliberately:
   - When the user explicitly specifies an IP subject, keep that subject and propose three distinct design treatments based on composition, silhouette treatment, secondary color region, or personality emphasis.
   - When the user does not specify an IP subject, propose three genuinely different IP subjects or metaphors. Tie each one to a different product attribute or brand promise; do not return three arbitrary animals with no rationale.
6. Interpret the user's response exactly:
   - If the user accepts all three directions and the six-image proposal, generate two independent variants per direction and label them `A1`, `A2`, `B1`, `B2`, `C1`, and `C2`.
   - If the user selects one direction but accepts six images, generate six controlled variants of that direction and label them `A1` through `A6`.
   - If the user rejects the proposed quantity, directions, or distribution, follow the user's replacement instructions without arguing for the default.
7. Default every generated candidate to three semantic colors in total: two IP colors plus one background color. Do not reserve any fraction of the batch for two-color logos. If the user explicitly specifies another color count, follow it instead. Keep required product cues, identifying features, complexity limits, and any supplied palette consistent enough for useful comparison.
8. Determine the available image-generation path before promising output. In Codex, use ImageGen when it is available. In any other agent environment, use an available configured image generator; if none is available, ask the user whether they can provide or enable one. Do not fabricate generated results.
9. If the runtime supports subagents, parallelize the six independent candidates up to the available concurrency. Give every subagent the same product brief, shared constraints, and one assigned direction or variant; run remaining candidates in subsequent waves when capacity is limited. If subagents are unavailable, generate the candidates through separate image-generation calls or jobs.
10. If the user supplies a background palette, reserve every supplied color for backgrounds unless they explicitly say otherwise. Keep the two IP base colors distinct from the background. When the user explicitly requests a two-color logo, allow the background color to reappear only as negative-space facial cutouts, not as a separate painted IP region.
11. Abstract each subject using the complexity budget below. Generate every candidate as a separate full-resolution square asset; never ask an image model to compose a contact sheet, grid, or multi-logo image. Do not use existing logos or sibling candidates as image references when testing prompt-only reproducibility.
12. Inspect every output against every rejection rule. Retry with one targeted correction when practical; never hide a failed constraint with silent post-processing.
13. Preserve each model's native square output. Report every label, IP direction and rationale, saved path, prompt/color mapping, dimensions, opacity, and any remaining deviations. Ask which candidate the user wants to refine.

When proposing directions before generation, describe each in one compact line: `<IP subject> — <product connection> — <defining silhouette>`. End with a direct proposal to generate six images using the distribution above. Do not turn the discovery phase into a long branding workshop unless the user asks for one.

## Complexity budget

- Build one dominant continuous outer silhouette from roughly `6–10` basic geometric shapes.
- Use at most one species-defining feature: for example, one large pouch beak, one pair of curled horns, or one broad visor.
- Use at most two internal color regions. Keep the face to two eyes and one mouth; omit eyebrows, highlights, nostrils, texture, and decorative marks unless essential.
- Prefer a head or compact upper-body crop. Do not explain the full anatomy, costume, machinery, or story.
- Remove repeated feathers, scales, fur tufts, armor plates, buttons, screws, numbers, labels, and other illustrative detail.
- Require a readable black silhouette and recognizability at `32 × 32`.

## Shape language and composition

- Use thick, rounded, weighty contours and broad color masses.
- Forbid sharp corners, pointed ears or beaks, needle-like tails, thin antennae, thin smiles, narrow gaps, and acute flame or feather tips. Replace every necessary tip with a visibly blunt rounded end.
- Show both members of paired identifying features, such as ears, horns, wings, gills, or bells.
- Let the IP emerge from the lower-left or lower-right corner and fill about `75–85%` of the canvas. Cropping at the bottom or side is intentional, but do not crop an identifying paired feature.
- Keep the artwork upright; never rotate the logo canvas or tilt the main mark without an explicit request.

## Flat-first geometry, continuous-gradient micro-volume

- Build the logo from flat semantic shapes first. Keep every IP color region as one continuous base shape with one readable outer silhouette.
- Model depth only with one uninterrupted, low-frequency diffuse gradient inside each large IP color region. Never represent lighting as an additional shape, swatch, patch, band, or layer.
- Use one shared default light direction from the upper-left toward the lower-right. Keep the gradient axis coherent across the head, ears, body, and secondary color region; do not light each part independently.
- Make each tonal transition span at least `50%` of the dominant form's width. Keep any local highlight area broader than roughly `20%` of that form; reject small glossy hotspots.
- Keep the gradient inside the original semantic color family. Relative to the base color, limit OKLCH hue drift to about `3°`, chroma drift to `0.015`, highlight lightness to `+0.025–0.04`, and shadow lightness to `-0.03–0.05`. Keep total peak-to-peak lightness variation at or below `0.08`.
- Keep small facial marks nearly flat. Allow only the same broad global illumination already affecting their parent region; do not give eyes, mouths, noses, or tiny details separate highlights or shadows.
- Allow shallow contact darkening only as a soft continuation of the same gradient where two large regions meet. Never create a closed contact-shadow blob, a second internal contour, or an ambient-occlusion seam.
- Keep the background visually flat. Apply continuous tonal modeling only inside the IP, never as a vignette, spotlight, or directional background gradient.
- Make the micro-volume visible at full resolution but almost disappear at `32 × 32`, leaving only the flat silhouette and semantic color regions.
- Never add realistic materials, texture, specular gloss, rim light, bevels, extrusion, deep occlusion, or an external cast shadow. Reject pure flat fills with no tonal modeling, but also reject clay, inflatable, plastic, plush, toy-like, photorealistic, or strongly three-dimensional results.

## Color and canvas

- Default to exactly three semantic colors in the finished logo: two IP base colors plus one background color. Reuse one IP color for facial marks and keep the second IP color in one large continuous region. Do not mix in a default quota of two-color candidates.
- Treat the two IP base colors as color families, not mechanically uniform flat swatches. Closely related values created by the continuous-gradient micro-volume rules above do not count as additional semantic colors.
- Use more than three semantic colors only when the user explicitly requests them. Use a two-color logo only when the user explicitly requests it: exactly one IP base color plus one background color, with eyes and mouth formed as negative-space cutouts that reveal the background.
- Prefer a warm off-white such as cream or parchment over pure white, and charcoal or deep navy over pure black. Use pure black or white when the user requests it or when it provides the clearest result.
- Prefer backgrounds with a clear hue and restrained saturation: terracotta, muted coral, dusty plum, sage or forest green, glaucous or denim blue, ochre, and similar softened colors. Avoid neon, electric, candy-bright, and primary-color intensity unless explicitly requested. Also avoid reducing chroma until the color reads gray, muddy, or lifeless.
- Evaluate color in OKLCH when numeric control is available; do not use HSL saturation as the primary quality test. Use these default target bands:
  - chromatic mid-tone background: `L 0.45–0.75`, `C 0.08–0.16`;
  - dark chromatic background: `L 0.18–0.35`, `C 0.05–0.14`;
  - cream or parchment background: `L 0.92–0.98`, `C 0.01–0.06`.
- Treat `C < 0.05` on a chromatic background as likely too gray and `C > 0.20` as likely too saturated. These are defaults, not overrides for a user-supplied color.
- Maintain at least `3:1` relative-luminance contrast between the dominant IP silhouette and the background, and at least `4.5:1` between small facial marks and the surface beneath them. If the requested palette misses these targets, preserve the requested background and adjust the IP colors first.
- Build the second IP base color from a large continuous region such as a face mask, hat, shell, belly, or visor. Do not scatter it into small decorative patches.
- Do not introduce an unrelated hue under the label of shading. Do not quantize a continuous gradient into several neighboring flat swatches or count layered light and dark patches as acceptable color-family variants.
- Keep the background visually solid. Across unobstructed background areas, target no more than about `0.02` OKLCH lightness variation and `0.01` chroma variation; reject visible vignettes or directional gradients. Report model drift rather than silently flattening it in post-processing.
- Require a fully opaque, edge-to-edge background. Do not generate transparency, an extra white border, outer frame, card, container, rounded App-icon mask, or artificially rounded image corners.
- Generate a direct `1:1` square with square outer corners. Request approximately `1536 × 1536`; accept and preserve a native `1254 × 1254` result when that is the service output limit. Never resample merely to reach the requested number.

## Prompt skeleton

```text
Create one highly simplified IP mascot logo candidate, not a character illustration.
Background: fully opaque edge-to-edge solid <background>; use this color only for the background.
Subject: <subject> reduced to one rounded continuous silhouette and one defining feature.
Complexity: 6–10 basic shapes, at most two internal color regions, only two eyes and one mouth, readable at 32 × 32.
Color count: exactly three semantic colors in the complete logo: two IP base colors plus one background color. Reuse one IP color for facial marks and keep the second IP color in one continuous region.
Color behavior: softened but clearly chromatic background; warm off-white and charcoal/deep navy are preferred neutrals; silhouette/background contrast >= 3:1 and facial-detail contrast >= 4.5:1. Allow only continuous same-family tonal variation around each IP base color; do not count that variation as new semantic colors.
Composition: upright, emerging from the lower-left or lower-right, filling 75–85%; show both paired identifying features.
Style: Flat-first geometry with continuous-gradient micro-volume. Use one uninterrupted low-frequency diffuse gradient per large IP color region, sharing one upper-left-to-lower-right light direction. Make every transition span at least 50% of the dominant form. Limit total OKLCH lightness variation to 0.08, hue drift to 3 degrees, and chroma drift to 0.015. The modeling should be visible at full size but nearly disappear at 32 × 32.
Forbid: discrete highlight patches, closed highlight blobs, overlay bands, nested shadow shapes, cut-paper layers, cel-shading regions, stepped tonal swatches, hard internal shadow boundaries, small glossy hotspots, independent lighting on facial details, illustration detail, repeated anatomy, thin lines, sharp points, colors beyond the selected total count, pure flatness, strong 3D, clay, plastic, toy rendering, texture, gloss, bevel, external shadow, text, border, transparency, App mask, or rounded canvas corners.
```

## Reject the output when

- It reads as an illustration rather than a symbol, exceeds the complexity budget, or fails at small size.
- The default palette does not contain exactly two IP base colors plus one background color; the second IP color is scattered into decorative patches; shading introduces an unrelated hue; or an explicitly requested two-color logo adds a separate facial-feature color.
- A background-only color appears as a painted IP region rather than a negative-space cutout, or the background is transparent.
- A default chromatic background is neon or candy-bright, or is desaturated until it reads gray or muddy; small facial marks lack clear contrast.
- Any contour is thin, sharp, spiky, or visually fragile.
- An ear, horn, wing, gill, bell, or other paired identifier is missing or cropped.
- The IP is too small, centered like a sticker, tilted, framed, or surrounded by excessive empty space.
- A highlight or shadow has its own closed contour, abrupt edge, or readable shape instead of flowing continuously through the base color region.
- Tonal modeling divides one semantic color into stacked layers, overlay bands, cel-shaded steps, or several neighboring flat swatches.
- A gradient changes direction between adjacent parts, transitions across less than half of the dominant form, or creates a small glossy hotspot.
- At `32 × 32`, the tonal modeling still reads as an extra color region instead of nearly disappearing.
- The result is completely flat or noticeably volumetric instead of subtly modeled.
- The background visibly becomes a scene, texture, halo, vignette, or strong gradient rather than reading as a solid field.

When a generated result fails, state the exact failed rules. Do not claim compliance and do not silently repair it with code.
