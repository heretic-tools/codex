# HereticSheets

Raw SQLite snapshot for HereticSheets builder research.

## Data

- `data/heretic_db.sqlite` - source SQLite snapshot.

## Projects

- `HereticBuilder/` - local viewer and minimal roster builder.

## Deploy

The static Codex build is ready for GitHub Pages. After creating the GitHub
repository, push this project; the workflow enables Pages and deploys from
GitHub Actions.

The workflow builds `dist/` with:

```bash
python3 HereticBuilder/tools/build_static_site.py --out dist --base-path "/<repo-name>"
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
