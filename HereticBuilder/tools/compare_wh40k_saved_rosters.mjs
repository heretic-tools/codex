#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { basename } from "node:path";
import {
  messageCodes,
  realCatalog,
  state,
  validateRoster,
} from "../../tests/builder_validation_helpers.mjs";

const DEFAULT_OFFICIAL_DB_PATH =
  "/Users/losikov/Library/Containers/com.gamesworkshop.w40k/Data/Library/Application Support/db.sqlite";

function usage() {
  return [
    `Usage: node ${basename(process.argv[1])} [official-db.sqlite] [--json]`,
    "",
    "Read-only comparison of saved WH 40K app roster aggregate validation state",
    "against the local Builder validator. Detailed WH app diagnostics are not",
    "stored in roster_validation_state; this script compares only valid/invalid.",
  ].join("\n");
}

function parseArgs(argv) {
  const result = {
    dbPath: DEFAULT_OFFICIAL_DB_PATH,
    json: false,
  };
  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") {
      console.log(usage());
      process.exit(0);
    }
    if (arg === "--json") {
      result.json = true;
      continue;
    }
    result.dbPath = arg;
  }
  return result;
}

function sqliteRows(dbPath, sql) {
  const output = execFileSync("sqlite3", ["-json", dbPath, sql], {
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
  }).trim();
  return output ? JSON.parse(output) : [];
}

function groupBy(rows, key) {
  const grouped = new Map();
  for (const row of rows) {
    const value = row[key];
    if (!grouped.has(value)) {
      grouped.set(value, []);
    }
    grouped.get(value).push(row);
  }
  return grouped;
}

function countMap(rows, keyField, countField) {
  const result = {};
  for (const row of rows) {
    result[row[keyField]] = Number(row[countField] || 0);
  }
  return result;
}

function buildRosters(dbPath) {
  const rosters = sqliteRows(dbPath, `
    select
      roster.id,
      roster.name,
      roster.factionKeywordId,
      roster.battleSizeId,
      roster_validation_state.validationState as officialState
    from roster
    left join roster_validation_state on roster_validation_state.rosterId = roster.id
    order by roster.modifiedAt desc, roster.name
  `);
  const detachments = groupBy(sqliteRows(dbPath, "select rosterId, detachmentId from roster_detachment"), "rosterId");
  const units = groupBy(sqliteRows(dbPath, "select id, rosterId, datasheetId, allyType from roster_unit"), "rosterId");
  const miniatures = groupBy(sqliteRows(dbPath, `
    select id, rosterUnitId, miniatureId, count, isWarlord
    from roster_unit_miniature
  `), "rosterUnitId");
  const unitWargear = groupBy(sqliteRows(dbPath, `
    select rosterUnitId, wargearOptionId, count
    from roster_unit_wargear_option
  `), "rosterUnitId");
  const miniatureWargear = groupBy(sqliteRows(dbPath, `
    select rosterUnitMiniatureId, wargearOptionId, count
    from roster_unit_miniature_wargear_option
  `), "rosterUnitMiniatureId");
  const unitEnhancements = groupBy(sqliteRows(dbPath, `
    select rosterUnitId, enhancementId
    from roster_unit_enhancement
  `), "rosterUnitId");
  const miniatureEnhancements = groupBy(sqliteRows(dbPath, `
    select rosterUnitMiniatureId, enhancementId
    from roster_unit_miniature_enhancement
  `), "rosterUnitMiniatureId");
  const allegianceAbilities = groupBy(sqliteRows(dbPath, `
    select rosterUnitId, allegianceAbilityId
    from roster_unit_allegiance_ability
  `), "rosterUnitId");
  const attachmentGroups = groupBy(sqliteRows(dbPath, `
    select id, rosterId
    from roster_attached_unit
  `), "rosterId");
  const attachmentMembers = groupBy(sqliteRows(dbPath, `
    select rosterAttachedUnitId, rosterUnitId, attachmentType
    from roster_attached_unit_roster_unit
  `), "rosterAttachedUnitId");

  return rosters.map((roster) => ({
    officialState: roster.officialState || "unknown",
    roster: {
      id: roster.id,
      name: roster.name,
      factionKeywordId: roster.factionKeywordId,
      battleSizeId: roster.battleSizeId,
      detachmentIds: (detachments.get(roster.id) || []).map((row) => row.detachmentId),
      attachments: (attachmentGroups.get(roster.id) || []).map((group) => ({
        id: group.id,
        members: (attachmentMembers.get(group.id) || []).map((member) => ({
          rosterUnitId: member.rosterUnitId,
          attachmentType: member.attachmentType,
        })),
      })),
      units: (units.get(roster.id) || []).map((unit) => ({
        id: unit.id,
        datasheetId: unit.datasheetId,
        allyType: unit.allyType || "native",
        allegianceAbilities: (allegianceAbilities.get(unit.id) || []).map((row) => row.allegianceAbilityId),
        unitEnhancements: (unitEnhancements.get(unit.id) || []).map((row) => ({ id: row.enhancementId })),
        miniatureEnhancements: (miniatures.get(unit.id) || [])
          .flatMap((miniature) => (
            miniatureEnhancements.get(miniature.id) || []
          ).map((row) => ({
            id: row.enhancementId,
            targetId: miniature.id,
          }))),
        wargear: countMap(unitWargear.get(unit.id) || [], "wargearOptionId", "count"),
        miniatures: (miniatures.get(unit.id) || []).map((miniature) => ({
          id: miniature.id,
          rosterUnitMiniatureId: miniature.id,
          miniatureId: miniature.miniatureId,
          count: Number(miniature.count || 0),
          isWarlord: Boolean(miniature.isWarlord),
          wargear: countMap(miniatureWargear.get(miniature.id) || [], "wargearOptionId", "count"),
        })),
      })),
    },
  }));
}

const args = parseArgs(process.argv.slice(2));
if (!existsSync(args.dbPath)) {
  console.error(`Official WH 40K app DB not found: ${args.dbPath}`);
  process.exit(2);
}

state.catalog = realCatalog;
const comparisons = buildRosters(args.dbPath).map(({ officialState, roster }) => {
  const validation = validateRoster(roster);
  const faction = realCatalog.factionKeywordById.get(roster.factionKeywordId)?.name || roster.factionKeywordId;
  const battleSize = realCatalog.battleSizeById.get(roster.battleSizeId)?.name || roster.battleSizeId;
  return {
    rosterId: roster.id,
    name: roster.name,
    faction,
    battleSize,
    officialState,
    builderState: validation.state,
    match: officialState === "unknown" ? null : officialState === validation.state,
    builderCodes: messageCodes(validation.messages),
  };
});

if (args.json) {
  console.log(JSON.stringify(comparisons, null, 2));
} else {
  for (const comparison of comparisons) {
    console.log(`${comparison.name} (${comparison.faction}, ${comparison.battleSize})`);
    console.log(`  roster:   ${comparison.rosterId}`);
    console.log(`  official: ${comparison.officialState}`);
    console.log(`  builder:  ${comparison.builderState}`);
    console.log(`  match:    ${comparison.match === null ? "unknown" : comparison.match ? "yes" : "no"}`);
    console.log(`  codes:    ${comparison.builderCodes.join(", ") || "<none>"}`);
  }
}

if (comparisons.some((comparison) => comparison.match === false)) {
  process.exit(1);
}
