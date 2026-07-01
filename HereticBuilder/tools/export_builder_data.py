#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from roster_builder_assets import DEFAULT_DB, PROJECT_ROOT


EXPORT_SCHEMA_VERSION = 1

CATALOG_TABLES = (
    "all_model_wargear_choice",
    "all_model_wargear_choice_set",
    "all_model_wargear_choice_wargear_item",
    "allegiance_ability",
    "allegiance_ability_group",
    "allied_faction",
    "allied_faction_allegiance_ability",
    "allied_faction_allowed_warlord_miniature",
    "allied_faction_datasheet",
    "allied_faction_keyword",
    "allied_faction_keyword_slotless_keyword_group",
    "allied_faction_keyword_slotless_keyword_group_donor_keyword",
    "allied_faction_keyword_slotless_keyword_group_receiver_keyword",
    "allied_faction_parent_faction_keyword",
    "allied_faction_points_limit",
    "allied_faction_required_detachment",
    "army_rule",
    "army_rule_behaviour_type",
    "army_rule_excluded_from_command_bunker_faction_keyword",
    "army_rule_faction_keyword",
    "base_miniature_loadout",
    "base_miniature_loadout_wargear_option",
    "battle_size",
    "behaviour_type",
    "bullet_point",
    "conditional_keyword",
    "datasheet",
    "datasheet_ability",
    "datasheet_bodyguard_group",
    "datasheet_bodyguard_group_datasheet",
    "datasheet_bodyguard_group_keyword",
    "datasheet_damage",
    "datasheet_datasheet_ability",
    "datasheet_faction_keyword",
    "datasheet_points_step",
    "datasheet_rule",
    "datasheet_sub_ability",
    "detachment",
    "detachment_detail",
    "detachment_detail_bullet_point",
    "detachment_excluded_datasheet",
    "detachment_faction_detachment_points_cost",
    "detachment_faction_keyword",
    "detachment_force_disposition",
    "detachment_granted_warlord_miniature",
    "detachment_linked_datasheet",
    "detachment_mandatory_warlord_miniature",
    "detachment_required_datasheet",
    "detachment_rule",
    "detachment_unique_keyword",
    "enhancement",
    "enhancement_bodyguard_group",
    "enhancement_bodyguard_group_datasheet",
    "enhancement_bodyguard_group_keyword",
    "enhancement_datasheet_ability",
    "enhancement_excluded_keyword",
    "enhancement_keyword_points_cost",
    "enhancement_required_keyword_group",
    "enhancement_required_keyword_group_faction_keyword",
    "enhancement_required_keyword_group_keyword",
    "enhancement_required_wargear_item",
    "enhancement_wargear_item_profile",
    "faction_keyword",
    "faction_keyword_allied_faction",
    "faction_keyword_excluded_datasheet",
    "faction_keyword_mandatory_allegiance_ability",
    "faq",
    "faq_config",
    "force_disposition",
    "invulnerable_save",
    "keyword",
    "keyword_ally_restricting_keyword",
    "keyword_restriction_group",
    "keyword_restriction_group_keyword",
    "limited_wargear_choice",
    "limited_wargear_choice_set",
    "limited_wargear_choice_wargear_item",
    "loadout_choice",
    "loadout_choice_set",
    "loadout_choice_wargear_item",
    "metadata",
    "miniature",
    "miniature_keyword",
    "publication",
    "restriction_group_detachment_limit",
    "rule_container",
    "rule_container_component",
    "rule_section",
    "stratagem",
    "stratagem_phase",
    "unit_composition",
    "unit_composition_miniature",
    "unit_composition_required_detachment",
    "unit_composition_required_faction_keyword",
    "wargear_ability",
    "wargear_item",
    "wargear_item_profile",
    "wargear_item_profile_wargear_ability",
    "wargear_limit",
    "wargear_option",
    "wargear_option_group",
    "wargear_rule",
)

EXCLUDED_PREFIXES = (
    "battle",
    "mission",
    "objective",
    "primary_mission",
    "roster",
    "secondary_mission",
    "secondary_objective",
)

EXCLUDED_TABLES = {
    "entitlement",
    "favourite",
    "force_disposition_mission",
    "force_disposition_mission_recommended_preset",
    "grdb_migrations",
}


@dataclass(frozen=True)
class BuilderDataExportResult:
    out_dir: Path
    data_version: int
    table_count: int
    exported_table_count: int
    file_count: int
    total_bytes: int


def quote_ident(name):
    return '"' + str(name).replace('"', '""') + '"'


def resolve_project_path(value):
    path = Path(str(value)).expanduser()
    if not path.is_absolute():
        path = PROJECT_ROOT / path
    return path.resolve()


def connect_readonly(db_path):
    uri = f"file:{db_path}?mode=ro"
    conn = sqlite3.connect(uri, uri=True)
    conn.row_factory = sqlite3.Row
    return conn


def table_names(conn):
    return [
        row["name"]
        for row in conn.execute(
            """
            select name
            from sqlite_schema
            where type = 'table'
            order by name
            """
        )
    ]


def table_columns(conn, table):
    return [
        {
            "name": row["name"],
            "type": row["type"],
            "notNull": bool(row["notnull"]),
            "defaultValue": row["dflt_value"],
            "primaryKeyPosition": row["pk"],
        }
        for row in conn.execute(f"pragma table_info({quote_ident(table)})")
    ]


def table_order_clause(columns):
    pk_columns = [
        column
        for column in sorted(columns, key=lambda item: item["primaryKeyPosition"])
        if column["primaryKeyPosition"]
    ]
    order_columns = pk_columns or columns
    if not order_columns:
        return ""
    return " order by " + ", ".join(quote_ident(column["name"]) for column in order_columns)


def coerce_value(value, column):
    if value is None:
        return None
    if str(column["type"]).upper() == "BOOLEAN":
        return bool(value)
    return value


def table_rows(conn, table, columns):
    column_by_name = {column["name"]: column for column in columns}
    rows = []
    for row in conn.execute(f"select * from {quote_ident(table)}{table_order_clause(columns)}"):
        rows.append({
            key: coerce_value(row[key], column_by_name[key])
            for key in row.keys()
        })
    return rows


def write_json(path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    body = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    path.write_bytes(body)
    return {
        "path": path,
        "bytes": len(body),
        "sha256": hashlib.sha256(body).hexdigest(),
    }


def file_entry(out_dir, record, row_count=None):
    entry = {
        "path": record["path"].relative_to(out_dir).as_posix(),
        "bytes": record["bytes"],
        "sha256": record["sha256"],
    }
    if row_count is not None:
        entry["rows"] = row_count
    return entry


def table_count(conn, table):
    return conn.execute(f"select count(*) as count from {quote_ident(table)}").fetchone()["count"]


def data_version(conn):
    row = conn.execute("select dataVersion from metadata limit 1").fetchone()
    return int(row["dataVersion"]) if row else 0


def db_sha256(db_path):
    digest = hashlib.sha256()
    with db_path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def default_ids(conn):
    faction = conn.execute(
        """
        select id
        from faction_keyword
        where excludedFromArmyBuilder = 0 and name = 'Heretic Astartes'
        limit 1
        """
    ).fetchone()
    if not faction:
        faction = conn.execute(
            """
            select id
            from faction_keyword
            where excludedFromArmyBuilder = 0
            order by lower(name)
            limit 1
            """
        ).fetchone()
    battle_size = conn.execute(
        """
        select id
        from battle_size
        where name = 'Strike Force'
        limit 1
        """
    ).fetchone()
    if not battle_size:
        battle_size = conn.execute(
            "select id from battle_size order by pointsLimit limit 1"
        ).fetchone()
    return {
        "defaultFactionId": faction["id"] if faction else "",
        "defaultBattleSizeId": battle_size["id"] if battle_size else "",
    }


def bootstrap_payload(conn, version, counts):
    defaults = default_ids(conn)
    factions = [
        dict(row)
        for row in conn.execute(
            """
            select id, name, commonName, parentFactionKeywordId
            from faction_keyword
            where excludedFromArmyBuilder = 0
            order by lower(name)
            """
        )
    ]
    battle_sizes = [
        dict(row)
        for row in conn.execute(
            """
            select id, name, pointsLimit, detachmentPointsLimit,
                   enhancementLimit, duplicateUnitLimit
            from battle_size
            order by pointsLimit
            """
        )
    ]
    return {
        "exportSchemaVersion": EXPORT_SCHEMA_VERSION,
        "dataVersion": version,
        **defaults,
        "factions": factions,
        "battleSizes": battle_sizes,
        "tableCounts": counts,
    }


def excluded_table_names(all_tables, exported_tables):
    excluded = []
    for table in all_tables:
        if table in exported_tables:
            continue
        if table in EXCLUDED_TABLES or any(table == prefix or table.startswith(f"{prefix}_") for prefix in EXCLUDED_PREFIXES):
            excluded.append(table)
    return excluded


def audit_payload(conn, all_tables, exported_tables):
    excluded = excluded_table_names(all_tables, exported_tables)
    return {
        "integrityCheck": conn.execute("pragma integrity_check").fetchone()[0],
        "exportedTables": list(exported_tables),
        "excludedTables": [
            {"name": table, "rows": table_count(conn, table)}
            for table in excluded
        ],
        "unexpectedUnexportedTables": [
            table
            for table in all_tables
            if table not in exported_tables and table not in excluded
        ],
    }


def export_builder_data(db_path, out_dir):
    db_path = resolve_project_path(db_path)
    out_dir = resolve_project_path(out_dir)
    if not db_path.exists():
        raise SystemExit(f"Database does not exist: {db_path}")
    out_dir.mkdir(parents=True, exist_ok=True)

    with connect_readonly(db_path) as conn:
        all_tables = table_names(conn)
        missing = [table for table in CATALOG_TABLES if table not in all_tables]
        if missing:
            raise SystemExit("Missing expected catalog tables: " + ", ".join(missing))

        version = data_version(conn)
        counts = {table: table_count(conn, table) for table in CATALOG_TABLES}
        files = []

        bootstrap = bootstrap_payload(conn, version, counts)
        record = write_json(out_dir / "bootstrap.json", bootstrap)
        files.append(file_entry(out_dir, record))

        for table in CATALOG_TABLES:
            columns = table_columns(conn, table)
            rows = table_rows(conn, table, columns)
            payload = {
                "table": table,
                "columns": columns,
                "rows": rows,
            }
            record = write_json(out_dir / "tables" / f"{table}.json", payload)
            files.append(file_entry(out_dir, record, len(rows)))

        audit = audit_payload(conn, all_tables, set(CATALOG_TABLES))
        record = write_json(out_dir / "audit.json", audit)
        files.append(file_entry(out_dir, record))

    manifest = {
        "exportSchemaVersion": EXPORT_SCHEMA_VERSION,
        "dataVersion": version,
        "generatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "source": {
            "database": db_path.name,
            "sha256": db_sha256(db_path),
        },
        "files": sorted(files, key=lambda item: item["path"]),
    }
    manifest_record = write_json(out_dir / "manifest.json", manifest)

    all_files = [*files, file_entry(out_dir, manifest_record)]
    return BuilderDataExportResult(
        out_dir=out_dir,
        data_version=version,
        table_count=len(all_tables),
        exported_table_count=len(CATALOG_TABLES),
        file_count=len(all_files),
        total_bytes=sum(item["bytes"] for item in all_files),
    )


def add_export_builder_data_arguments(parser):
    parser.add_argument("--db", default=str(DEFAULT_DB), help="SQLite database path")
    parser.add_argument(
        "--out",
        default=str(PROJECT_ROOT / "dist" / "builder-data"),
        help="Output directory for builder data JSON.",
    )
    return parser


def parse_args():
    parser = argparse.ArgumentParser(description="Export catalog-only HereticBuilder data for a static client.")
    add_export_builder_data_arguments(parser)
    return parser.parse_args()


def export_builder_data_from_args(args):
    return export_builder_data(args.db, args.out)


def print_export_builder_data_result(result):
    print(f"Builder data: {result.out_dir}")
    print(f"Data version: {result.data_version}")
    print(f"Source tables: {result.table_count}")
    print(f"Exported catalog tables: {result.exported_table_count}")
    print(f"Files: {result.file_count}")
    print(f"Bytes: {result.total_bytes}")


def main():
    print_export_builder_data_result(export_builder_data_from_args(parse_args()))


if __name__ == "__main__":
    main()
