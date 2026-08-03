# Los 5 fantásticos import

## Purpose

This workflow converts the 21 horizontal, five-character source images in Google Drive into 105 standardized 1:1 portraits and reusable recoloring layers. It preserves the original character identity: BiRefNet removes the source background, then deterministic ImageMagick composition places the cutout on the standard canvas. It does not generatively redraw faces, hair, clothing, or accessories.

## Source contract

- Shared Drive: `palari-marketing` (`0ABSIED45ZSJEUk9PVA`)
- Source folder: `Los 5 fantásticos ` (the Drive folder name has a trailing space)
- Source count: 21 PNG group images
- Characters per source: 5, ordered left to right
- Output count: 105 portraits

`src/data/fantasticos-sources.json` records the Drive file ID and MD5 checksum of every source. The importer rejects missing, renamed, modified, or unexpected PNGs so a silent Drive change cannot reshuffle avatar IDs.

## Download the source folder

Use a temporary directory outside the repository:

```bash
rclone copy 'gdrive:Los 5 fantásticos ' /tmp/palari-fantasticos-source \
  --drive-team-drive 0ABSIED45ZSJEUk9PVA \
  --include '*.png'
```

Do not commit the grouped source images. Their immutable provenance is kept in the manifest and each avatar's `metadata.json`.

## Import and standardize

Add `FAL_KEY` to ignored `.env.local`, then run:

```bash
npm run fantasticos:import -- \
  --source-dir=/tmp/palari-fantasticos-source \
  --concurrency=4
```

The importer:

1. Verifies the full source inventory and checksums.
2. Splits each group into five proportional horizontal panels.
3. Generates a 2048px BiRefNet v2 Matting cutout.
4. Composes it on a 1254 × 1254 `#DCE8F7` canvas at the reviewed framing.
5. Stores `foreground.png`, `matte.png`, a matte-derived `person.png`, and complete provenance metadata.

The operation is resumable. Current outputs with matching source provenance, model, and framing are skipped. Use `--id=fantasticos-001` for a single portrait or `--force` only when intentional regeneration is required.

## Clean panel boundaries and generate garment masks

```bash
npm run fantasticos:clean -- --dry-run
npm run fantasticos:clean
npm run masks:generate -- --prefix=fantasticos-
```

The cleanup removes only small disconnected alpha components that touch the original left or right panel boundary. It keeps the largest character component and does not alter connected hair, jewelry, or clothing. Always review the reported IDs before running it without `--dry-run`.

Garment generation reuses the matte-derived person mask and requests only the semantic shirt layer. It tries `sweater`, `shirt`, and `upper clothing` in that order, with bounded retry handling for transient provider errors.

## Review and validate

Review standardized sources, foregrounds, mattes, and garment overlays before recording approval:

```bash
npm run masks:review -- \
  --prefix=fantasticos- \
  --reviewer=<name> \
  --notes=<review-summary>

npm run mattes:review -- \
  --prefix=fantasticos- \
  --reviewer=<name> \
  --notes=<review-summary>

npm run fantasticos:clean -- --dry-run
npm run check
```

Acceptance requires consistent framing, no neighboring-character fragments, intact curls/braids/flyaways/head coverings/accessories, complete visible garment coverage, and no garment selection on face, hair, skin, or jewelry.

## Drive delivery

Drive is not synchronized automatically. After review, copy only the finished square portraits into a clearly named child folder; keep masks and technical metadata in the repository unless the user requests otherwise. Never overwrite or reorganize the 21 grouped sources.
