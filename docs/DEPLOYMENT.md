# GitHub Pages deployment

Palari Art is deployed as a static Vite application at:

<https://coystan.github.io/palari-art/>

The application has no backend. Portrait selection, recoloring, temporary uploads, preview, and export continue to run in the visitor's browser.

## Artifact contract

The normal `npm run build` keeps Vite's complete `public/` copy for local production testing. The Pages-specific build is intentionally smaller:

```bash
npm run build:pages
```

That command:

1. Builds Vite with the `/palari-art/` base path and without automatically copying `public/`.
2. Copies only `public/avatars-web/` and `public/masks-web/` into `dist/`.
3. Adds `.nojekyll`.
4. Verifies complete portrait and mask WebP coverage, both manifests, the absence of PNG files, the base path, and a 450 MiB artifact ceiling.

The checksum-locked portrait PNG masters, reviewed mask PNG masters, metadata, and audit-only layers remain in the repository but are never included in the Pages artifact.

## Automatic deployment

`.github/workflows/deploy-pages.yml` runs on pushes to `main` and can also be started manually. It validates the repository, builds the slim artifact, uploads it through GitHub's Pages artifact action, and deploys it to the `github-pages` environment.

GitHub Pages must use **GitHub Actions** as its publishing source. The workflow requires these repository-token permissions:

- `contents: read`
- `pages: write`
- `id-token: write`

The workflow does not receive `FAL_KEY` or any other application secret. All provider-backed image preparation remains offline and separate from deployment.

## Regenerating delivery assets

After a source portrait changes:

```bash
npm run avatars:web:generate
npm run verify:web-assets
```

After a reviewed runtime mask PNG changes:

```bash
npm run masks:web:generate
npm run verify:web-masks
```

The mask generator requires FFmpeg with `libwebp` plus ImageMagick's `compare` command. Generation uses lossless WebP and rejects any output with a nonzero absolute pixel difference.

## Local Pages check

```bash
npm run build:pages
pages_preview_root="$(mktemp -d)"
ln -s "$PWD/dist" "$pages_preview_root/palari-art"
python3 -m http.server 4173 --directory "$pages_preview_root"
```

Open `http://localhost:4173/palari-art/`. Mounting `dist/` beneath the project-name path reproduces the URL shape used by GitHub Pages. Stop the server and remove the temporary directory when finished.

## Custom domains

The current Vite base is correct for the project URL under `coystan.github.io/palari-art/`. A future custom domain would use `/` instead and must be configured in both `vite.config.ts` and the repository's Pages settings.
