#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from roster_builder_assets import DEFAULT_DB, PROJECT_ROOT, UNIT_IMAGES_BY_ID, UNIT_IMAGES_BY_NAME, UNIT_IMAGE_ROOT


EXPORT_SCHEMA_VERSION = 1
LOADOUT_PRECOMPUTE_MAX = 1000

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

BUILDER_CLIENT_CORE_CATALOG_TABLES = (
    "detachment",
    "detachment_faction_keyword",
    "detachment_faction_detachment_points_cost",
    "detachment_unique_keyword",
    "detachment_required_datasheet",
    "detachment_linked_datasheet",
    "detachment_mandatory_warlord_miniature",
    "detachment_granted_warlord_miniature",
    "faction_keyword",
    "faction_keyword_excluded_datasheet",
    "detachment_excluded_datasheet",
    "datasheet",
    "datasheet_faction_keyword",
    "datasheet_points_step",
    "datasheet_bodyguard_group",
    "datasheet_bodyguard_group_datasheet",
    "datasheet_bodyguard_group_keyword",
    "unit_composition",
    "unit_composition_miniature",
    "unit_composition_required_faction_keyword",
    "unit_composition_required_detachment",
    "miniature",
    "keyword",
    "miniature_keyword",
    "conditional_keyword",
    "publication",
    "detachment_force_disposition",
    "force_disposition",
)

BUILDER_CLIENT_FACTION_HEAVY_CATALOG_TABLES = (
    "faction_keyword_mandatory_allegiance_ability",
    "allegiance_ability_group",
    "allegiance_ability",
    "enhancement",
    "enhancement_keyword_points_cost",
    "enhancement_excluded_keyword",
    "enhancement_required_wargear_item",
    "enhancement_required_keyword_group",
    "enhancement_required_keyword_group_keyword",
    "enhancement_required_keyword_group_faction_keyword",
    "enhancement_bodyguard_group",
    "enhancement_bodyguard_group_datasheet",
    "enhancement_bodyguard_group_keyword",
    "allied_faction",
    "faction_keyword_allied_faction",
    "allied_faction_parent_faction_keyword",
    "allied_faction_datasheet",
    "allied_faction_points_limit",
    "allied_faction_keyword",
    "allied_faction_allowed_warlord_miniature",
    "allied_faction_required_detachment",
    "allied_faction_allegiance_ability",
    "allied_faction_keyword_slotless_keyword_group",
    "allied_faction_keyword_slotless_keyword_group_donor_keyword",
    "allied_faction_keyword_slotless_keyword_group_receiver_keyword",
    "keyword_ally_restricting_keyword",
    "keyword_restriction_group",
    "keyword_restriction_group_keyword",
    "restriction_group_detachment_limit",
    "base_miniature_loadout",
    "base_miniature_loadout_wargear_option",
    "loadout_choice_set",
    "loadout_choice",
    "loadout_choice_wargear_item",
    "limited_wargear_choice_set",
    "limited_wargear_choice",
    "limited_wargear_choice_wargear_item",
    "wargear_limit",
    "all_model_wargear_choice_set",
    "all_model_wargear_choice",
    "all_model_wargear_choice_wargear_item",
    "wargear_option_group",
    "wargear_option",
    "wargear_item",
)

BUILDER_CLIENT_CATALOG_TABLES = (
    *BUILDER_CLIENT_CORE_CATALOG_TABLES,
    *BUILDER_CLIENT_FACTION_HEAVY_CATALOG_TABLES,
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

GENERATED_DATA_DIRS = (
    "precomputed-loadouts",
    "tables",
)

GENERATED_DATA_FILE_PATTERNS = (
    "audit.json",
    "bootstrap.json",
    "manifest.json",
    "precomputed-loadouts*.json",
    "unit-images*.json",
)

PAYLOAD_EXCLUDED_COLUMNS = {
    "datasheet": {
        "bannerImage",
        "baseSize",
        "isFreeFromEntitlements",
        "lore",
        "rowImage",
        "unitComposition",
    },
    "enhancement": {
        "displayOrder",
        "lore",
        "publicationId",
        "rules",
    },
    "detachment": {
        "bannerImage",
        "isFreeFromEntitlements",
        "publicationId",
        "rowImage",
    },
    "faction_keyword": {
        "armySelectionImage",
        "lore",
        "moreInfoImage",
        "rosterFactionImage",
        "rosterHeaderImage",
    },
    "publication": {
        "combatPatrolName",
        "displayOrder",
        "errataDate",
        "factionBackgroundImage",
        "factionKeywordId",
        "productId",
    },
    "allegiance_ability": {
        "rules",
    },
    "wargear_item": {
        "noMultiProfileIcon",
        "ruleText",
        "wargearType",
    },
    "miniature": {
        "displayOrder",
        "isIndividualModels",
        "leadership",
        "miniatureSlots",
        "movement",
        "objectiveControl",
        "save",
        "statlineHidden",
        "toughness",
        "wounds",
    },
    "miniature_keyword": {
        "displayOrder",
    },
    "datasheet_faction_keyword": {
        "displayOrder",
    },
    "unit_composition": {
        "referenceGroupingKeywordId",
    },
}

PAYLOAD_EXTRA_COLUMNS = {
    "datasheet": (
        {
            "name": "unitImageFilename",
            "type": "TEXT",
            "notNull": False,
            "defaultValue": None,
            "primaryKeyPosition": 0,
        },
    ),
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


def clear_generated_builder_data(out_dir):
    for dirname in GENERATED_DATA_DIRS:
        path = out_dir / dirname
        if path.is_dir():
            shutil.rmtree(path)
        elif path.exists():
            path.unlink()

    for pattern in GENERATED_DATA_FILE_PATTERNS:
        for path in out_dir.glob(pattern):
            if path.is_dir():
                shutil.rmtree(path)
            elif path.exists():
                path.unlink()


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


def json_payload_bytes(payload):
    body = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return body


def write_json(path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    body = json_payload_bytes(payload)
    path.write_bytes(body)
    return {
        "path": path,
        "bytes": len(body),
        "sha256": hashlib.sha256(body).hexdigest(),
    }


def hashed_json_path(logical_path, digest):
    path = Path(logical_path)
    return (path.parent / f"{path.stem}-{digest[:12]}{path.suffix}").as_posix()


def write_hashed_json(out_dir, logical_path, payload):
    body = json_payload_bytes(payload)
    digest = hashlib.sha256(body).hexdigest()
    path = out_dir / hashed_json_path(logical_path, digest)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(body)
    return {
        "path": path,
        "bytes": len(body),
        "sha256": digest,
    }


def precomputed_loadout_shards(loadouts):
    shards = {}
    for row in loadouts.get("contexts", []):
        shards.setdefault(row["datasheetId"], []).append(row)
    return {
        datasheet_id: {
            "datasheetId": datasheet_id,
            "contexts": contexts,
        }
        for datasheet_id, contexts in sorted(shards.items())
    }


def file_entry(out_dir, record, row_count=None, logical_path=None):
    path = record["path"].relative_to(out_dir).as_posix()
    entry = {
        "logicalPath": logical_path or path,
        "path": path,
        "bytes": record["bytes"],
        "sha256": record["sha256"],
    }
    if row_count is not None:
        entry["rows"] = row_count
    return entry


def manifest_file_entry(entry):
    result = {
        "logicalPath": entry["logicalPath"],
        "path": entry["path"],
    }
    if "rows" in entry:
        result["rows"] = entry["rows"]
    return result


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


def lower_name(value):
    return str(value or "").strip().lower()


def add_wargear_alias_item(buckets, datasheet_id, miniature_id, wargear_item_id, name):
    key_name = lower_name(name)
    if not datasheet_id or not wargear_item_id or not key_name:
        return
    key = (datasheet_id, None)
    names = buckets.setdefault(key, {})
    names.setdefault(key_name, set()).add(wargear_item_id)


def wargear_alias_source_rows(conn):
    queries = (
        """
        select groups.datasheetId, groups.miniatureId, options.wargearItemId, items.name
        from wargear_option options
        join wargear_option_group groups on groups.id = options.wargearOptionGroupId
        join wargear_item items on items.id = options.wargearItemId
        """,
        """
        select sets.datasheetId, sets.miniatureId, items.wargearItemId, wargear.name
        from loadout_choice_set sets
        join loadout_choice choices on choices.loadoutChoiceSetId = sets.id
        join loadout_choice_wargear_item items on items.loadoutChoiceId = choices.id
        join wargear_item wargear on wargear.id = items.wargearItemId
        """,
        """
        select sets.datasheetId, sets.miniatureId, items.wargearItemId, wargear.name
        from limited_wargear_choice_set sets
        join limited_wargear_choice choices on choices.limitedWargearChoiceSetId = sets.id
        join limited_wargear_choice_wargear_item items on items.limitedWargearChoiceId = choices.id
        join wargear_item wargear on wargear.id = items.wargearItemId
        """,
        """
        select sets.datasheetId, sets.miniatureId, items.wargearItemId, wargear.name
        from all_model_wargear_choice_set sets
        join all_model_wargear_choice choices on choices.allModelWargearChoiceSetId = sets.id
        join all_model_wargear_choice_wargear_item items on items.allModelWargearChoiceId = choices.id
        join wargear_item wargear on wargear.id = items.wargearItemId
        """,
    )
    for query in queries:
        yield from conn.execute(query)


def wargear_aliases(conn):
    buckets = {}
    for row in wargear_alias_source_rows(conn):
        add_wargear_alias_item(
            buckets,
            row["datasheetId"],
            row["miniatureId"],
            row["wargearItemId"],
            row["name"],
        )

    aliases = []
    for (datasheet_id, miniature_id), names in buckets.items():
        for name, item_ids in names.items():
            if len(item_ids) < 2:
                continue
            for item_id in sorted(item_ids):
                aliases.append({
                    "datasheetId": datasheet_id,
                    "miniatureId": miniature_id,
                    "wargearItemId": item_id,
                    "key": f"name:{name}",
                })
    return sorted(
        aliases,
        key=lambda item: (
            item["datasheetId"] or "",
            item["miniatureId"] or "",
            item["key"],
            item["wargearItemId"],
        ),
    )


def loadout_context_key(datasheet_id, miniature_id=None):
    return (datasheet_id or "", miniature_id or "")


def wargear_alias_map(aliases):
    result = {}
    for row in aliases:
        result.setdefault(
            loadout_context_key(row.get("datasheetId"), row.get("miniatureId")),
            {},
        )[row["wargearItemId"]] = row["key"]
    return result


def canonical_wargear_key(wargear_item_id, datasheet_id, miniature_id, aliases):
    if not wargear_item_id:
        return ""
    exact = aliases.get(loadout_context_key(datasheet_id, miniature_id), {}).get(wargear_item_id)
    if exact:
        return exact
    datasheet_wide = aliases.get(loadout_context_key(datasheet_id, None), {}).get(wargear_item_id)
    if datasheet_wide:
        return datasheet_wide
    return f"id:{wargear_item_id}"


def clean_counts(counts):
    result = {}
    for key, value in (counts or {}).items():
        count = int(value or 0)
        if count > 0:
            result[key] = count
    return result


def add_counts(*items):
    result = {}
    for counts in items:
        for key, value in (counts or {}).items():
            result[key] = result.get(key, 0) + int(value or 0)
    return clean_counts(result)


def count_key(counts):
    return "|".join(
        f"{key}:{value}"
        for key, value in sorted(clean_counts(counts).items())
        if value > 0
    )


def dedupe_counts(items):
    seen = set()
    result = []
    for item in items:
        clean = clean_counts(item)
        key = count_key(clean)
        if key in seen:
            continue
        seen.add(key)
        result.append(clean)
    return result


def combinations(items, limit, start=0):
    if limit == 0:
        return [[]]
    result = []
    for index in range(start, len(items) - limit + 1):
        for tail in combinations(items, limit - 1, index + 1):
            result.append([items[index], *tail])
    return result


def combinations_with_replacement(items, limit, start=0):
    if limit == 0:
        return [[]]
    result = []
    for index in range(start, len(items)):
        for tail in combinations_with_replacement(items, limit - 1, index):
            result.append([items[index], *tail])
    return result


def choice_set_loadouts(choice_set):
    choices = choice_set.get("choices") or []
    limit = choice_set.get("limit") or 0
    if limit == 0:
        return [{}]
    if not choices:
        return []
    if choice_set.get("allowDuplicates"):
        return dedupe_counts(add_counts(*items) for items in combinations_with_replacement(choices, limit))
    empty_choices = [choice for choice in choices if not choice]
    if empty_choices:
        non_empty_choices = [choice for choice in choices if choice]
        raw = []
        for selected_count in range(0, min(limit, len(non_empty_choices)) + 1):
            raw.extend(combinations(non_empty_choices, selected_count))
        return dedupe_counts(add_counts(*items) for items in raw)
    if limit > len(choices):
        return []
    return dedupe_counts(add_counts(*items) for items in combinations(choices, limit))


def valid_loadouts_from_choice_sets(sets):
    regular_sets = [item for item in sets if not item.get("alternate")]
    alternate_sets = [item for item in sets if item.get("alternate")]
    loadouts = []
    if regular_sets:
        products = [{}]
        for choice_set in regular_sets:
            set_loadouts = choice_set_loadouts(choice_set)
            if not set_loadouts:
                products = []
                break
            next_products = []
            for base in products:
                for piece in set_loadouts:
                    next_products.append(add_counts(base, piece))
            products = next_products
        loadouts.extend(products)
    else:
        loadouts.append({})
    for choice_set in alternate_sets:
        loadouts.extend(choice_set_loadouts(choice_set))
    return dedupe_counts(loadouts)


def rows_by_key(rows, key):
    result = {}
    for row in rows:
        result.setdefault(row[key], []).append(row)
    return result


def loadout_choice_items(rows, datasheet_id, miniature_id, item_ids, aliases):
    counts = {}
    for row in rows:
        if row["wargearItemId"] not in item_ids:
            continue
        key = canonical_wargear_key(row["wargearItemId"], datasheet_id, miniature_id, aliases)
        counts[key] = counts.get(key, 0) + int(row["count"] or 0)
    return clean_counts(counts)


def precomputed_loadouts(conn, aliases, max_loadouts_per_context=LOADOUT_PRECOMPUTE_MAX):
    alias_by_context = wargear_alias_map(aliases)
    loadout_sets = [dict(row) for row in conn.execute("select * from loadout_choice_set")]
    choices_by_set = rows_by_key(
        [dict(row) for row in conn.execute("select * from loadout_choice")],
        "loadoutChoiceSetId",
    )
    items_by_choice = rows_by_key(
        [dict(row) for row in conn.execute("select * from loadout_choice_wargear_item")],
        "loadoutChoiceId",
    )
    item_ids = {
        row["id"]
        for row in conn.execute("select id from wargear_item")
    }

    sets_by_datasheet = rows_by_key(loadout_sets, "datasheetId")
    contexts = []
    skipped = 0
    for datasheet_id, sets in sorted(sets_by_datasheet.items()):
        miniature_ids = sorted({row["miniatureId"] for row in sets if row.get("miniatureId")})
        for miniature_id in [None, *miniature_ids]:
            normalized = []
            for row in sorted(
                [
                    item
                    for item in sets
                    if (item.get("miniatureId") == miniature_id if miniature_id else not item.get("miniatureId"))
                ],
                key=lambda item: (bool(item.get("alternate")), item["id"]),
            ):
                normalized.append({
                    **row,
                    "choices": [
                        loadout_choice_items(
                            items_by_choice.get(choice["id"], []),
                            row["datasheetId"],
                            row.get("miniatureId"),
                            item_ids,
                            alias_by_context,
                        )
                        for choice in choices_by_set.get(row["id"], [])
                    ],
                })
            if not normalized:
                continue
            valid = valid_loadouts_from_choice_sets(normalized)
            if len(valid) > max_loadouts_per_context:
                skipped += 1
                continue
            contexts.append({
                "datasheetId": datasheet_id,
                "loadoutChoiceSetIds": [row["id"] for row in normalized],
                "miniatureId": miniature_id or "",
                "fingerprints": [count_key(item) for item in valid],
            })
    return {
        "maxLoadoutsPerContext": max_loadouts_per_context,
        "contextCount": len(contexts),
        "skippedContextCount": skipped,
        "contexts": contexts,
    }


def bootstrap_payload(conn, version, counts, aliases):
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
        "wargearAliases": aliases,
        "tableCounts": counts,
    }


def unit_image_filename(datasheet_id, name):
    image = UNIT_IMAGES_BY_ID.get(datasheet_id) or UNIT_IMAGES_BY_NAME.get(str(name or "").lower())
    filename = image.get("filename") if image else ""
    if filename and (UNIT_IMAGE_ROOT / filename).exists():
        return filename
    return ""


def attach_unit_image_filenames(table, rows):
    if table != "datasheet":
        return rows
    for row in rows:
        filename = unit_image_filename(row.get("id"), row.get("name"))
        if filename:
            row["unitImageFilename"] = filename
    return rows


def prune_payload_columns(table, columns, rows):
    excluded = PAYLOAD_EXCLUDED_COLUMNS.get(table, set())
    if not excluded:
        return columns, rows
    filtered_columns = [
        column for column in columns
        if column["name"] not in excluded
    ]
    for row in rows:
        for name in excluded:
            row.pop(name, None)
    return filtered_columns, rows


def payload_columns(table, columns):
    return [
        *columns,
        *PAYLOAD_EXTRA_COLUMNS.get(table, ()),
    ]


def rows_as_arrays(columns, rows):
    names = [column["name"] for column in columns]
    return [
        [row.get(name) for name in names]
        for row in rows
    ]


def excluded_table_names(all_tables, exported_tables):
    excluded = []
    for table in all_tables:
        if table in exported_tables:
            continue
        if table in EXCLUDED_TABLES or any(table == prefix or table.startswith(f"{prefix}_") for prefix in EXCLUDED_PREFIXES):
            excluded.append(table)
    return excluded


def audit_payload(conn, all_tables, exported_tables, metadata, file_entries=()):
    excluded = excluded_table_names(all_tables, exported_tables)
    return {
        **metadata,
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
        "fileIntegrity": sorted(file_entries, key=lambda item: item["path"]),
    }


def export_builder_data(db_path, out_dir):
    db_path = resolve_project_path(db_path)
    out_dir = resolve_project_path(out_dir)
    if not db_path.exists():
        raise SystemExit(f"Database does not exist: {db_path}")
    out_dir.mkdir(parents=True, exist_ok=True)
    clear_generated_builder_data(out_dir)

    with connect_readonly(db_path) as conn:
        all_tables = table_names(conn)
        missing = [table for table in CATALOG_TABLES if table not in all_tables]
        if missing:
            raise SystemExit("Missing expected catalog tables: " + ", ".join(missing))
        missing_client_tables = [
            table for table in BUILDER_CLIENT_CATALOG_TABLES
            if table not in CATALOG_TABLES
        ]
        if missing_client_tables:
            raise SystemExit("Missing client catalog audit tables: " + ", ".join(missing_client_tables))

        version = data_version(conn)
        metadata = {
            "exportSchemaVersion": EXPORT_SCHEMA_VERSION,
            "dataVersion": version,
            "generatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "source": {
                "database": db_path.name,
                "sha256": db_sha256(db_path),
            },
            "tableGroups": {
                "core": list(BUILDER_CLIENT_CORE_CATALOG_TABLES),
                "factionHeavy": list(BUILDER_CLIENT_FACTION_HEAVY_CATALOG_TABLES),
            },
        }
        counts = {table: table_count(conn, table) for table in CATALOG_TABLES}
        files = []
        unlisted_files = []

        aliases = wargear_aliases(conn)

        bootstrap = bootstrap_payload(conn, version, counts, aliases)
        record = write_json(out_dir / "bootstrap.json", bootstrap)
        files.append(file_entry(out_dir, record))

        loadouts = precomputed_loadouts(conn, aliases)
        precomputed_shards = precomputed_loadout_shards(loadouts)
        precomputed_manifest = {
            "maxLoadoutsPerContext": loadouts["maxLoadoutsPerContext"],
            "contextCount": loadouts["contextCount"],
            "skippedContextCount": loadouts["skippedContextCount"],
            "shardCount": len(precomputed_shards),
            "shards": [],
        }
        for datasheet_id, shard in precomputed_shards.items():
            logical_path = f"precomputed-loadouts/{datasheet_id}.json"
            record = write_hashed_json(out_dir, logical_path, shard)
            entry = file_entry(out_dir, record, len(shard["contexts"]), logical_path)
            precomputed_manifest["shards"].append({
                "datasheetId": datasheet_id,
                "path": entry["path"],
                "rows": entry["rows"],
            })
            unlisted_files.append(entry)
        record = write_hashed_json(out_dir, "precomputed-loadouts/manifest.json", precomputed_manifest)
        files.append(file_entry(out_dir, record, logical_path="precomputed-loadouts/manifest.json"))

        for table in BUILDER_CLIENT_CATALOG_TABLES:
            columns = table_columns(conn, table)
            rows = attach_unit_image_filenames(table, table_rows(conn, table, columns))
            columns, rows = prune_payload_columns(table, columns, rows)
            columns = payload_columns(table, columns)
            payload = {
                "table": table,
                "rowFormat": "array",
                "columns": columns,
                "rows": rows_as_arrays(columns, rows),
            }
            logical_path = f"tables/{table}.json"
            record = write_hashed_json(out_dir, logical_path, payload)
            files.append(file_entry(out_dir, record, len(rows), logical_path))

        audit = audit_payload(conn, all_tables, set(CATALOG_TABLES), metadata, files)
        record = write_json(out_dir / "audit.json", audit)
        files.append(file_entry(out_dir, record))

    manifest = {
        "files": [
            manifest_file_entry(item)
            for item in sorted(files, key=lambda item: item["path"])
        ],
    }
    manifest_record = write_json(out_dir / "manifest.json", manifest)

    all_files = [*files, *unlisted_files, file_entry(out_dir, manifest_record)]
    return BuilderDataExportResult(
        out_dir=out_dir,
        data_version=version,
        table_count=len(all_tables),
        exported_table_count=len(BUILDER_CLIENT_CATALOG_TABLES),
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
