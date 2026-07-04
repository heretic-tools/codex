# HereticBuilder

Static build tools for the HereticTools Codex and standalone Builder exports.

The database stays in the parent project at `../data/heretic_db.sqlite`.

## Static Build

Build a serverless Codex export for static hosts such as GitHub Pages:

```bash
python3 tools/builder.py build
```

For a GitHub Pages project site, pass the repository path:

```bash
python3 tools/builder.py build --base-path /codex --mount-codex-at-root
```

The generated site is written to `../dist/`.

The CLI reads `../heretic.toml` by default. Named profiles are available for
the current project Pages and organization Pages shapes:

```bash
python3 tools/builder.py build --profile project-pages
python3 tools/builder.py build --profile org-pages
```

## Builder Data Export

Export catalog-only JSON for the standalone GitHub Pages Builder client:

```bash
python3 tools/builder.py export-builder-data
```

The generated data pack is written to `../dist/builder-data/` by default. It
contains immutable catalog/rule tables plus `manifest.json`, `bootstrap.json`,
`precomputed-loadouts.json`, and `audit.json`; local user tables such as
`roster*` are intentionally not exported.

## Static Builder App

Build the standalone Builder shell plus its catalog data pack:

```bash
python3 tools/builder.py build-builder
```

For the `https://heretic-tools.github.io/builder/` project Pages deployment:

```bash
python3 tools/builder.py build-builder --profile builder-pages
```

## Unit Image Pixelizer

Create low-resolution, limited-palette 90s-style PNGs from the unit image links
stored in `datasheet.bannerImage` and `datasheet.rowImage`:

```bash
python3 tools/unit_image_pixelizer.py --colors 16 --max-side 96 --scale 4
```

Useful discovery modes:

```bash
python3 tools/unit_image_pixelizer.py --print-urls
python3 tools/unit_image_pixelizer.py --dry-run --kind row --limit 10
```

The app serves the checked-in production image pack from
`assets/unit-images/` and `assets/faction-images/`. The pixelizer writes
intermediate generated files under `../generated/unit_images_90s/`; copy the
selected PNGs and `manifest.csv` into `assets/unit-images/` when refreshing the
production pack.
It requires Pillow for image processing:

```bash
python3 -m pip install Pillow
```

On macOS it can also fall back to the built-in `sips` command:

```bash
python3 tools/unit_image_pixelizer.py --engine sips --name Abaddon
```
