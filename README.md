# HereticSheets

Raw SQLite snapshot for HereticSheets builder research.

## Data

- `data/heretic_db.sqlite` - source SQLite snapshot.

## Projects

- `HereticBuilder/` - local viewer and minimal roster builder.

## Deploy

The static Codex and standalone Builder builds are ready for GitHub Pages. After
creating the GitHub repository, enable Pages with GitHub Actions as the build
source; the workflow then deploys `dist/`.

For the Codex repository, the workflow builds `dist/` with:

```bash
python3 HereticBuilder/tools/builder.py build --out dist --base-path "/<repo-name>" --mount-codex-at-root
```

For the standalone Builder repository (`https://heretic-tools.github.io/builder/`),
the workflow builds `dist/` with:

```bash
python3 HereticBuilder/tools/builder.py build-builder --out dist --base-path "/builder"
```

Local defaults live in `heretic.toml`. Use the project Pages profile for the
current `heretic-tools/codex` deployment, or the Builder Pages profile for the
standalone Builder deployment:

```bash
python3 HereticBuilder/tools/builder.py build --profile project-pages
python3 HereticBuilder/tools/builder.py build-builder --profile builder-pages
```

## Verify

```bash
python3 - <<'PY'
import sqlite3

with sqlite3.connect("data/heretic_db.sqlite") as conn:
    print(conn.execute("pragma integrity_check").fetchone()[0])
    print(conn.execute("select dataVersion from metadata").fetchone()[0])
PY
```
