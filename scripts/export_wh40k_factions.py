#!/usr/bin/env python3
import argparse
import importlib.util
import json
import re
import sqlite3
from pathlib import Path


DEFAULT_SOURCE_SCRIPT = Path(
    "/Users/losikov/Documents/Codex/2026-06-23/new-chat/work/export_wh40k_csm.py"
)
DEFAULT_DB = Path.home() / (
    "Library/Containers/com.gamesworkshop.w40k/Data/Library/Application Support/db.sqlite"
)
PUBLICATION_PREFIXES = ("Codex:", "Codex Supplement:", "Index:")


def load_exporter(path):
    spec = importlib.util.spec_from_file_location("wh40k_exporter", path)
    if spec is None or spec.loader is None:
        raise SystemExit(f"Cannot import exporter: {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def slugify(value):
    value = value.lower()
    value = value.replace("’", "").replace("'", "")
    value = re.sub(r"[^a-z0-9]+", "_", value)
    return value.strip("_")


def publication_rows(conn, prefixes):
    conn.row_factory = sqlite3.Row
    query = """
        select p.id, p.name, p.productId, p.errataDate, count(d.id) as datasheets
        from publication p
        join datasheet d on d.publicationId = p.id
        group by p.id
        order by p.name
    """
    publications = [dict(row) for row in conn.execute(query)]
    return [
        publication
        for publication in publications
        if publication["name"].startswith(tuple(prefixes))
    ]


def write_json(path, payload):
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-script", default=str(DEFAULT_SOURCE_SCRIPT))
    parser.add_argument("--db", default=str(DEFAULT_DB))
    parser.add_argument("--out-dir", default="data/factions")
    parser.add_argument(
        "--prefix",
        action="append",
        dest="prefixes",
        help="Publication prefix to export. Can be passed multiple times.",
    )
    parser.add_argument(
        "--exclude",
        action="append",
        default=[],
        help="Exact publication name to skip. Can be passed multiple times.",
    )
    args = parser.parse_args()

    source_script = Path(args.source_script).expanduser()
    db_path = Path(args.db).expanduser()
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    exporter = load_exporter(source_script)
    prefixes = tuple(args.prefixes or PUBLICATION_PREFIXES)

    with sqlite3.connect(db_path) as conn:
        metadata = exporter.row(conn, "select dataVersion from metadata")
        publications = [
            publication
            for publication in publication_rows(conn, prefixes)
            if publication["name"] not in set(args.exclude)
        ]

        index = []
        for publication in publications:
            cards = exporter.get_cards(conn, publication["id"])
            filename = f"{slugify(publication['name'])}_cards.json"
            payload = {
                "source": {
                    "database": str(db_path),
                    "dataVersion": metadata["dataVersion"] if metadata else None,
                    "publication": {
                        key: publication[key]
                        for key in ("id", "name", "productId", "errataDate")
                    },
                },
                "cards": cards,
            }
            write_json(out_dir / filename, payload)
            index.append(
                {
                    "publication": publication["name"],
                    "filename": filename,
                    "cards": len(cards),
                    "productId": publication["productId"],
                    "errataDate": publication["errataDate"],
                }
            )

    write_json(out_dir / "index.json", {"publications": index})
    print(json.dumps({"publications": len(index), "outDir": str(out_dir)}, indent=2))


if __name__ == "__main__":
    main()
