# HereticSheets

Local viewer for exported Warhammer 40,000 datasheets across faction publications.

## Run

```bash
npm run dev
```

Then open:

```text
http://127.0.0.1:4173
```

The app is static and reads `data/factions/index.json`, then loads the selected publication JSON from `data/factions`.

## Data Export

```bash
python3 scripts/export_wh40k_factions.py
```

The exporter reuses the local Warhammer app SQLite database and writes faction-level JSON files into `data/factions`.
