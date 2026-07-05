import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { realCatalog } from "./builder_validation_helpers.mjs";
import { loadBootstrap, loadCatalog } from "../HereticBuilder/static/builder_catalog.js";
import { siteHref } from "../HereticBuilder/static/builder_state.js";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const OFFICIAL_WH40K_APP_DB_PATH =
  "/Users/losikov/Library/Containers/com.gamesworkshop.w40k/Data/Library/Application Support/db.sqlite";
const OFFICIAL_SEED_DUMP_PATH =
  "/Applications/WH 40K.app/Wrapper/w40.app/Datasource_SeedDatasource.bundle/dump.json";
const BUILDER_SQLITE_DB_PATH = join(projectRoot, "data", "heretic_db.sqlite");

const LOADED_BUILDER_RULE_TABLES = [
  ["battle_size", "battleSizes"],
  ["detachment", "detachments"],
  ["detachment_faction_keyword", "detachmentFactionKeywords"],
  ["detachment_faction_detachment_points_cost", "detachmentFactionPointCosts"],
  ["detachment_unique_keyword", "detachmentUniqueKeywords"],
  ["detachment_required_datasheet", "detachmentRequiredDatasheets"],
  ["detachment_linked_datasheet", "detachmentLinkedDatasheets"],
  ["detachment_mandatory_warlord_miniature", "detachmentMandatoryWarlordMiniatures"],
  ["detachment_granted_warlord_miniature", "detachmentGrantedWarlordMiniatures"],
  ["faction_keyword", "factionKeywords"],
  ["faction_keyword_excluded_datasheet", "factionExcludedDatasheets"],
  ["detachment_excluded_datasheet", "detachmentExcludedDatasheets"],
  ["datasheet", "datasheets"],
  ["datasheet_faction_keyword", "datasheetFactionKeywords"],
  ["datasheet_points_step", "datasheetPointsSteps"],
  ["datasheet_bodyguard_group", "datasheetBodyguardGroups"],
  ["datasheet_bodyguard_group_datasheet", "datasheetBodyguardGroupDatasheets"],
  ["datasheet_bodyguard_group_keyword", "datasheetBodyguardGroupKeywords"],
  ["unit_composition", "unitCompositions"],
  ["unit_composition_miniature", "unitCompositionMiniatures"],
  ["unit_composition_required_faction_keyword", "compositionRequiredFactionKeywords"],
  ["unit_composition_required_detachment", "compositionRequiredDetachments"],
  ["miniature", "miniatures"],
  ["keyword", "keywords"],
  ["miniature_keyword", "miniatureKeywords"],
  ["conditional_keyword", "conditionalKeywords"],
  ["publication", "publications"],
  ["detachment_force_disposition", "detachmentForceDispositions"],
  ["force_disposition", "forceDispositions"],
  ["faction_keyword_mandatory_allegiance_ability", "factionKeywordMandatoryAllegianceAbilities"],
  ["allegiance_ability_group", "allegianceAbilityGroups"],
  ["allegiance_ability", "allegianceAbilities"],
  ["enhancement", "enhancements"],
  ["enhancement_keyword_points_cost", "enhancementKeywordPointsCosts"],
  ["enhancement_excluded_keyword", "enhancementExcludedKeywords"],
  ["enhancement_required_wargear_item", "enhancementRequiredWargearItems"],
  ["enhancement_required_keyword_group", "enhancementRequiredKeywordGroups"],
  ["enhancement_required_keyword_group_keyword", "enhancementRequiredKeywordGroupKeywords"],
  ["enhancement_required_keyword_group_faction_keyword", "enhancementRequiredKeywordGroupFactionKeywords"],
  ["enhancement_bodyguard_group", "enhancementBodyguardGroups"],
  ["enhancement_bodyguard_group_datasheet", "enhancementBodyguardGroupDatasheets"],
  ["enhancement_bodyguard_group_keyword", "enhancementBodyguardGroupKeywords"],
  ["allied_faction", "alliedFactions"],
  ["faction_keyword_allied_faction", "factionKeywordAlliedFactions"],
  ["allied_faction_parent_faction_keyword", "alliedFactionParentFactionKeywords"],
  ["allied_faction_datasheet", "alliedFactionDatasheets"],
  ["allied_faction_points_limit", "alliedFactionPointsLimits"],
  ["allied_faction_keyword", "alliedFactionKeywords"],
  ["allied_faction_allowed_warlord_miniature", "alliedFactionAllowedWarlordMiniatures"],
  ["allied_faction_required_detachment", "alliedFactionRequiredDetachments"],
  ["allied_faction_allegiance_ability", "alliedFactionAllegianceAbilities"],
  ["allied_faction_keyword_slotless_keyword_group", "alliedFactionKeywordSlotlessKeywordGroups"],
  ["allied_faction_keyword_slotless_keyword_group_donor_keyword", "alliedFactionKeywordSlotlessDonorKeywords"],
  ["allied_faction_keyword_slotless_keyword_group_receiver_keyword", "alliedFactionKeywordSlotlessReceiverKeywords"],
  ["keyword_ally_restricting_keyword", "keywordAllyRestrictingKeywords"],
  ["keyword_restriction_group", "keywordRestrictionGroups"],
  ["keyword_restriction_group_keyword", "keywordRestrictionGroupKeywords"],
  ["restriction_group_detachment_limit", "restrictionGroupDetachmentLimits"],
  ["base_miniature_loadout", "baseMiniatureLoadouts"],
  ["base_miniature_loadout_wargear_option", "baseMiniatureLoadoutWargearOptions"],
  ["loadout_choice_set", "loadoutChoiceSets"],
  ["loadout_choice", "loadoutChoices"],
  ["loadout_choice_wargear_item", "loadoutChoiceWargearItems"],
  ["limited_wargear_choice_set", "limitedWargearChoiceSets"],
  ["limited_wargear_choice", "limitedWargearChoices"],
  ["limited_wargear_choice_wargear_item", "limitedWargearChoiceWargearItems"],
  ["wargear_limit", "wargearLimits"],
  ["all_model_wargear_choice_set", "allModelWargearChoiceSets"],
  ["all_model_wargear_choice", "allModelWargearChoices"],
  ["all_model_wargear_choice_wargear_item", "allModelWargearChoiceWargearItems"],
  ["wargear_option_group", "wargearGroups"],
  ["wargear_option", "wargearOptions"],
  ["wargear_item", "wargearItems"],
];

const BUILDER_RULE_TABLE_COLUMNS = {
  "battle_size": ["id", "name", "pointsLimit", "detachmentPointsLimit", "enhancementLimit", "duplicateUnitLimit"],
  "detachment": ["id", "name", "displayOrder", "publicationId", "bannerImage", "rowImage", "isFreeFromEntitlements", "detachmentPointsCost", "isCombatPatrol"],
  "detachment_faction_keyword": ["detachmentId", "factionKeywordId"],
  "detachment_faction_detachment_points_cost": ["detachmentId", "factionKeywordId", "detachmentPointsCost"],
  "detachment_unique_keyword": ["detachmentId", "keywordId"],
  "detachment_required_datasheet": ["detachmentId", "datasheetId"],
  "detachment_linked_datasheet": ["detachmentId", "datasheetId", "count"],
  "detachment_mandatory_warlord_miniature": ["detachmentId", "miniatureId"],
  "detachment_granted_warlord_miniature": ["detachmentId", "miniatureId"],
  "faction_keyword": ["id", "name", "commonName", "moreInfoImage", "armySelectionImage", "rosterFactionImage", "rosterHeaderImage", "lore", "parentFactionKeywordId", "excludedFromArmyBuilder", "mandatoryWarlordId"],
  "faction_keyword_excluded_datasheet": ["factionKeywordId", "datasheetId"],
  "detachment_excluded_datasheet": ["detachmentId", "datasheetId"],
  "datasheet": ["id", "name", "bannerImage", "rowImage", "unitComposition", "publicationId", "maxModelCount", "allegianceAbilityGroupId", "displayOrder", "isSuccessorChapter", "isFreeFromEntitlements", "lore", "baseSize"],
  "datasheet_faction_keyword": ["datasheetId", "factionKeywordId", "displayOrder"],
  "datasheet_points_step": ["id", "datasheetId", "stepAt", "stepPoints"],
  "datasheet_bodyguard_group": ["id", "bodyguardType", "factionKeywordId", "datasheetId", "excludedDetachmentId", "requiredDetachmentId", "requiresAllUnitsHaveKeywordId"],
  "datasheet_bodyguard_group_datasheet": ["datasheetBodyguardGroupId", "datasheetId"],
  "datasheet_bodyguard_group_keyword": ["datasheetBodyguardGroupId", "keywordId"],
  "unit_composition": ["id", "datasheetId", "points", "isDefault", "displayOrder", "referenceGroupingKeywordId"],
  "unit_composition_miniature": ["unitCompositionId", "miniatureId", "min", "max"],
  "unit_composition_required_faction_keyword": ["unitCompositionId", "factionKeywordId"],
  "unit_composition_required_detachment": ["unitCompositionId", "detachmentId"],
  "miniature": ["id", "name", "movement", "toughness", "save", "wounds", "leadership", "objectiveControl", "statlineHidden", "isSupremeCommander", "cannotBeWarlord", "excludedFromEnhancements", "datasheetId", "displayOrder", "isIndividualModels", "canBeNonCharacterWarlord", "miniatureSlots"],
  "keyword": ["id", "name", "allyRestrictingFactionKeywordId", "allyRestrictingKeywordId"],
  "miniature_keyword": ["miniatureId", "keywordId", "displayOrder"],
  "conditional_keyword": ["id", "datasheetId", "keywordId", "requiredWarlordMiniatureId", "requiredAllegianceAbilityId", "requiredRosterFactionKeywordId", "requiredDetachmentId"],
  "publication": ["id", "name", "factionBackgroundImage", "factionKeywordId", "combatPatrolName", "displayOrder", "productId", "errataDate", "isCombatPatrol"],
  "detachment_force_disposition": ["detachmentId", "forceDispositionId"],
  "force_disposition": ["id", "name"],
  "faction_keyword_mandatory_allegiance_ability": ["factionKeywordId", "allegianceAbilityId"],
  "allegiance_ability_group": ["id", "name", "detachmentId", "isMandatory", "minRosterLimit", "maxRosterLimit"],
  "allegiance_ability": ["id", "name", "rules", "requiresWargearItemId", "allegianceAbilityGroupId", "displayOrder"],
  "enhancement": ["id", "name", "rules", "lore", "basePointsCost", "publicationId", "detachmentId", "displayOrder", "cannotBeWarlord", "isIncludedInEnhancementLimit", "isEquipableByEpicHero", "isEquipableByNonCharacterUnit", "enhancementType", "limit", "isCombatPatrolDefault"],
  "enhancement_keyword_points_cost": ["id", "enhancementId", "keywordId", "pointsCost", "displayOrder"],
  "enhancement_excluded_keyword": ["enhancementId", "keywordId"],
  "enhancement_required_wargear_item": ["enhancementId", "wargearItemId"],
  "enhancement_required_keyword_group": ["id", "enhancementId", "datasheetId"],
  "enhancement_required_keyword_group_keyword": ["enhancementRequiredKeywordGroupId", "keywordId"],
  "enhancement_required_keyword_group_faction_keyword": ["enhancementRequiredKeywordGroupId", "factionKeywordId"],
  "enhancement_bodyguard_group": ["id", "bodyguardType", "factionKeywordId", "enhancementId"],
  "enhancement_bodyguard_group_datasheet": ["enhancementBodyguardGroupId", "datasheetId"],
  "enhancement_bodyguard_group_keyword": ["enhancementBodyguardGroupId", "keywordId"],
  "allied_faction": ["id", "requiredWarlordMiniatureId", "canTakeEnhancements", "isMutuallyExclusiveKeywordLimit", "requiredDetachmentId", "isSiblingFaction"],
  "faction_keyword_allied_faction": ["factionKeywordId", "alliedFactionId"],
  "allied_faction_parent_faction_keyword": ["factionKeywordId", "alliedFactionId"],
  "allied_faction_datasheet": ["alliedFactionId", "datasheetId"],
  "allied_faction_points_limit": ["alliedFactionId", "battleSizeId", "pointsLimit"],
  "allied_faction_keyword": ["id", "alliedFactionId", "keywordId", "limitCount", "requiredWarlordMiniatureId", "battleSizeId"],
  "allied_faction_allowed_warlord_miniature": ["alliedFactionId", "miniatureId"],
  "allied_faction_required_detachment": ["alliedFactionId", "detachmentId"],
  "allied_faction_allegiance_ability": ["alliedFactionId", "allegianceAbilityId"],
  "allied_faction_keyword_slotless_keyword_group": ["alliedFactionKeywordId", "id"],
  "allied_faction_keyword_slotless_keyword_group_donor_keyword": ["alliedFactionKeywordSlotlessKeywordGroupId", "keywordId"],
  "allied_faction_keyword_slotless_keyword_group_receiver_keyword": ["alliedFactionKeywordSlotlessKeywordGroupId", "keywordId"],
  "keyword_ally_restricting_keyword": ["keywordId", "restrictingKeywordId"],
  "keyword_restriction_group": ["id", "factionKeywordId", "requiresWarlordMiniatureId", "excludedFactionKeywordId", "limit"],
  "keyword_restriction_group_keyword": ["keywordId", "keywordRestrictionGroupId"],
  "restriction_group_detachment_limit": ["id", "restrictionGroupId", "detachmentId", "minRosterLimit", "maxRosterLimit"],
  "base_miniature_loadout": ["id", "miniatureId", "datasheetId"],
  "base_miniature_loadout_wargear_option": ["count", "wargearOptionId", "baseMiniatureLoadoutId"],
  "loadout_choice_set": ["id", "datasheetId", "miniatureId", "limit", "allowDuplicates", "alternate"],
  "loadout_choice": ["id", "loadoutChoiceSetId"],
  "loadout_choice_wargear_item": ["loadoutChoiceId", "wargearItemId", "count"],
  "limited_wargear_choice_set": ["id", "datasheetId", "miniatureId", "mandatory"],
  "limited_wargear_choice": ["id", "limitedWargearChoiceSetId"],
  "limited_wargear_choice_wargear_item": ["limitedWargearChoiceId", "wargearItemId", "count"],
  "wargear_limit": ["id", "limitedWargearChoiceSetId", "modelCount", "choiceLimit", "duplicateLimit"],
  "all_model_wargear_choice_set": ["id", "datasheetId", "miniatureId"],
  "all_model_wargear_choice": ["id", "allModelWargearChoiceSetId", "substitute"],
  "all_model_wargear_choice_wargear_item": ["allModelWargearChoiceId", "wargearItemId", "count"],
  "wargear_option_group": ["id", "instructionText", "datasheetId", "miniatureId", "displayOrder", "isStaticWargear"],
  "wargear_option": ["id", "inputType", "wargearOptionGroupId", "wargearItemId", "defaultValue", "displayOrder", "points"],
  "wargear_item": ["id", "name", "wargearType", "ruleText", "noMultiProfileIcon"],
};

const DATA_EMPTY_RULE_TABLES = [
  ["faction_keyword_mandatory_allegiance_ability", "factionKeywordMandatoryAllegianceAbilities"],
  ["allied_faction_allegiance_ability", "alliedFactionAllegianceAbilities"],
  ["detachment_required_datasheet", "detachmentRequiredDatasheets"],
  ["enhancement_keyword_points_cost", "enhancementKeywordPointsCosts"],
  ["keyword_ally_restricting_keyword", "keywordAllyRestrictingKeywords"],
];

const OFFICIAL_SEED_DUMP_REFERENCE_OR_GAME_TABLES = [
  "amendment",
  "army_rule",
  "army_rule_behaviour_type",
  "army_rule_excluded_from_command_bunker_faction_keyword",
  "army_rule_faction_keyword",
  "behaviour_type",
  "bullet_point",
  "datasheet_ability",
  "datasheet_damage",
  "datasheet_datasheet_ability",
  "datasheet_rule",
  "datasheet_sub_ability",
  "detachment_detail",
  "detachment_detail_bullet_point",
  "detachment_rule",
  "enhancement_datasheet_ability",
  "enhancement_wargear_item_profile",
  "faq",
  "faq_config",
  "force_disposition_mission",
  "force_disposition_mission_recommended_preset",
  "invulnerable_save",
  "mission_deployment",
  "mission_layout",
  "mission_layout_linked_deployment",
  "mission_pack",
  "mission_pack_agenda_achieved",
  "mission_pack_briefing",
  "mission_pack_briefing_narrative_point",
  "mission_pack_location",
  "mission_pack_location_location_bonus",
  "mission_pack_location_warzone_rule",
  "mission_pack_upgrade",
  "mission_preset",
  "mission_twist",
  "objective",
  "primary_mission",
  "primary_mission_action",
  "primary_mission_objective",
  "primary_mission_objective_scorable_period",
  "primary_mission_objective_scoring",
  "rule_container",
  "rule_container_component",
  "rule_section",
  "secondary_mission",
  "secondary_mission_action",
  "secondary_mission_objective",
  "secondary_mission_objective_scorable_period",
  "secondary_mission_objective_scoring",
  "secondary_mission_restricted_secondary_mission",
  "secondary_objective",
  "stratagem",
  "stratagem_phase",
  "wargear_ability",
  "wargear_item_profile",
  "wargear_item_profile_wargear_ability",
  "wargear_rule",
];

function builderDataPath(path) {
  return join(projectRoot, "dist", "builder-data", path);
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function sqlite3Available() {
  try {
    execFileSync("sqlite3", ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function quoteSqlIdentifier(identifier) {
  return `"${identifier.replaceAll("\"", "\"\"")}"`;
}

function sqliteScalar(dbPath, sql) {
  return execFileSync("sqlite3", [dbPath, sql], { encoding: "utf8" }).trim();
}

function sqliteRows(dbPath, sql) {
  const output = execFileSync("sqlite3", ["-json", dbPath, sql], {
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
  }).trim();
  return output ? JSON.parse(output) : [];
}

function sqliteTableFingerprint(dbPath, tableName, columns) {
  const selectedColumns = columns.map(quoteSqlIdentifier);
  const sql = [
    `select ${selectedColumns.join(",")}`,
    `from ${quoteSqlIdentifier(tableName)}`,
    `order by ${selectedColumns.join(",")}`,
  ].join(" ");
  const rowsJson = execFileSync("sqlite3", ["-json", dbPath, sql], {
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
  });

  return sha256(rowsJson);
}

const localOfficialDbComparisonAvailable =
  existsSync(OFFICIAL_WH40K_APP_DB_PATH) &&
  existsSync(BUILDER_SQLITE_DB_PATH) &&
  sqlite3Available();

test("thin client catalog loading keeps path and fetch failure behavior explicit", async () => {
  assert.equal(siteHref(""), "");
  assert.equal(siteHref("relative/path"), "relative/path");
  assert.equal(siteHref("//cdn.example/builder-data/bootstrap.json"), "//cdn.example/builder-data/bootstrap.json");
  assert.equal(siteHref("/builder-data/bootstrap.json"), "/builder-data/bootstrap.json");

  const previousFetch = global.fetch;
  global.fetch = async () => ({
    ok: false,
    status: 503,
    json: async () => {
      throw new Error("unexpected json read");
    },
  });
  try {
    await assert.rejects(
      loadCatalog(),
      /\/builder-data\/(bootstrap|precomputed-loadouts|unit-images|tables\/[^/]+)\.json: 503/
    );
  } finally {
    global.fetch = previousFetch;
  }
});

test("GitHub Pages project base path prefixes Builder data URLs", async () => {
  const previousDocument = global.document;
  global.document = {
    querySelector: (selector) => (
      selector === 'meta[name="heretic-base-path"]' ? { content: "/builder/" } : null
    ),
  };
  try {
    const { siteHref: projectSiteHref } = await import(
      `../HereticBuilder/static/builder_state.js?github-pages-base-path=${Date.now()}`
    );
    assert.equal(projectSiteHref("relative/path"), "relative/path");
    assert.equal(projectSiteHref("//cdn.example/builder-data/bootstrap.json"), "//cdn.example/builder-data/bootstrap.json");
    assert.equal(projectSiteHref("/builder-data/bootstrap.json"), "/builder/builder-data/bootstrap.json");
    assert.equal(projectSiteHref("/static/builder.js"), "/builder/static/builder.js");
  } finally {
    global.document = previousDocument;
  }
});

test("Builder roster storage stays browser-local and serverless", () => {
  const source = readFileSync(join(projectRoot, "HereticBuilder", "static", "builder_storage.js"), "utf8");
  assert.match(source, /indexedDB/);
  assert.doesNotMatch(source, /localStorage|sessionStorage/);
  assert.doesNotMatch(source, /fetch\s*\(/);
});

test("thin client bootstrap loading does not fetch full rule tables", async () => {
  const previousFetch = global.fetch;
  const paths = [];
  global.fetch = async (path) => {
    paths.push(String(path));
    return previousFetch(path);
  };
  try {
    const catalog = await loadBootstrap();
    assert.equal(catalog.bootstrap.dataVersion, realCatalog.bootstrap.dataVersion);
    assert.ok(catalog.factions.length > 0);
    assert.ok(catalog.battleSizes.length > 0);
    assert.equal(catalog.bootstrap.precomputedLoadouts, undefined);
    assert.equal(catalog.datasheets, undefined);
  } finally {
    global.fetch = previousFetch;
  }
  assert.deepEqual(paths, ["/builder-data/bootstrap.json"]);
});

test("data-empty rule tables stay explicit until live fixture coverage is added", () => {
  const liveTables = DATA_EMPTY_RULE_TABLES
    .map(([tableName, catalogKey]) => [tableName, realCatalog[catalogKey]?.length ?? 0])
    .filter(([, count]) => count > 0);

  assert.deepEqual(
    liveTables,
    [],
    [
      `Data version ${realCatalog.bootstrap?.dataVersion || "unknown"} has live rows in rule tables previously covered by synthetic fixtures.`,
      "Add live roster validation coverage for each listed table, then update this inventory test and the parity audit.",
    ].join(" ")
  );
});

test("loaded Builder rule tables match exported table counts", () => {
  const tableCounts = realCatalog.bootstrap?.tableCounts || {};
  assert.equal(Object.keys(tableCounts).length, 102);
  assert.equal(LOADED_BUILDER_RULE_TABLES.length, 73);

  const mismatches = LOADED_BUILDER_RULE_TABLES
    .map(([tableName, catalogKey]) => [
      tableName,
      catalogKey,
      tableCounts[tableName],
      realCatalog[catalogKey]?.length ?? 0,
    ])
    .filter(([, , exportedCount, loadedCount]) => exportedCount !== loadedCount);

  assert.deepEqual(mismatches, []);
});

test(
  "local official WH 40K app DB matches Builder DB for loaded roster rule tables",
  {
    skip: !localOfficialDbComparisonAvailable &&
      "official WH 40K app DB or sqlite3 CLI is not available on this machine",
  },
  () => {
    const mismatches = LOADED_BUILDER_RULE_TABLES
      .map(([tableName]) => {
        const columns = BUILDER_RULE_TABLE_COLUMNS[tableName];
        assert.ok(columns, `${tableName} should have pinned column coverage`);

        const countSql = `select count(*) from ${quoteSqlIdentifier(tableName)}`;
        const officialCount = Number(sqliteScalar(OFFICIAL_WH40K_APP_DB_PATH, countSql));
        const builderCount = Number(sqliteScalar(BUILDER_SQLITE_DB_PATH, countSql));
        const officialFingerprint = sqliteTableFingerprint(OFFICIAL_WH40K_APP_DB_PATH, tableName, columns);
        const builderFingerprint = sqliteTableFingerprint(BUILDER_SQLITE_DB_PATH, tableName, columns);

        return {
          tableName,
          officialCount,
          builderCount,
          officialFingerprint,
          builderFingerprint,
        };
      })
      .filter((entry) => (
        entry.officialCount !== entry.builderCount ||
        entry.officialFingerprint !== entry.builderFingerprint
      ));

    assert.deepEqual(mismatches, []);
  }
);

test(
  "local official WH 40K app seed dump table inventory stays classified",
  {
    skip: !existsSync(OFFICIAL_SEED_DUMP_PATH) &&
      "official WH 40K app seed dump is not available on this machine",
  },
  async () => {
    const seedDump = JSON.parse(await readFile(OFFICIAL_SEED_DUMP_PATH, "utf8"));
    const seedTables = Object.keys(seedDump.data).sort();
    const loadedRuleTables = LOADED_BUILDER_RULE_TABLES.map(([tableName]) => tableName).sort();
    const loadedRuleTableSet = new Set(loadedRuleTables);
    const tableCounts = realCatalog.bootstrap.tableCounts;

    assert.equal(seedDump.metadata.data_version, realCatalog.bootstrap.dataVersion);
    assert.equal(seedTables.length, 129);

    assert.deepEqual(
      loadedRuleTables.filter((tableName) => !seedDump.data[tableName]),
      ["keyword_ally_restricting_keyword"],
    );
    assert.deepEqual(
      Object.keys(tableCounts).filter((tableName) => !seedDump.data[tableName]).sort(),
      ["keyword_ally_restricting_keyword", "metadata"],
    );
    assert.deepEqual(
      Object.keys(tableCounts)
        .filter((tableName) => seedDump.data[tableName])
        .map((tableName) => ({
          builderRows: tableCounts[tableName],
          seedRows: seedDump.data[tableName].length,
          tableName,
        }))
        .filter((row) => row.builderRows !== row.seedRows),
      [],
    );
    assert.deepEqual(
      seedTables.filter((tableName) => !loadedRuleTableSet.has(tableName)),
      OFFICIAL_SEED_DUMP_REFERENCE_OR_GAME_TABLES,
    );
  }
);

test(
  "local official WH 40K app DB stores only aggregate roster validation state",
  {
    skip: !localOfficialDbComparisonAvailable &&
      "official WH 40K app DB or sqlite3 CLI is not available on this machine",
  },
  () => {
    const validationStorageTables = sqliteRows(OFFICIAL_WH40K_APP_DB_PATH, `
      select name, type
      from sqlite_master
      where type = 'table'
        and (
          lower(name) like '%valid%'
          or lower(name) like '%error%'
          or lower(name) like '%message%'
          or lower(name) like '%diagnostic%'
          or lower(name) like '%warning%'
        )
      order by name
    `);
    assert.deepEqual(validationStorageTables, [{
      name: "roster_validation_state",
      type: "table",
    }]);

    const validationStateColumns = sqliteRows(
      OFFICIAL_WH40K_APP_DB_PATH,
      "pragma table_info(roster_validation_state)"
    ).map((column) => ({
      name: column.name,
      type: column.type,
      notnull: Number(column.notnull),
      primaryKey: Number(column.pk),
    }));

    assert.deepEqual(validationStateColumns, [
      { name: "id", type: "TEXT", notnull: 1, primaryKey: 0 },
      { name: "rosterId", type: "TEXT", notnull: 1, primaryKey: 1 },
      { name: "validationState", type: "TEXT", notnull: 0, primaryKey: 0 },
    ]);
  }
);

test(
  "local saved WH 40K app rosters match Builder aggregate validation state",
  {
    skip: !localOfficialDbComparisonAvailable &&
      "official WH 40K app DB or sqlite3 CLI is not available on this machine",
  },
  () => {
    const childEnv = { ...process.env };
    const childCoverageDir = childEnv.NODE_V8_COVERAGE
      ? mkdtempSync(join(tmpdir(), "heretic-builder-child-coverage-"))
      : null;
    if (childCoverageDir) {
      childEnv.NODE_V8_COVERAGE = childCoverageDir;
    }
    let output;
    try {
      output = execFileSync(process.execPath, [
        join(projectRoot, "HereticBuilder", "tools", "compare_wh40k_saved_rosters.mjs"),
        OFFICIAL_WH40K_APP_DB_PATH,
        "--json",
      ], {
        encoding: "utf8",
        env: childEnv,
        maxBuffer: 128 * 1024 * 1024,
      });
    } finally {
      if (childCoverageDir) {
        rmSync(childCoverageDir, { recursive: true, force: true });
      }
    }
    const comparisons = JSON.parse(output);

    assert.ok(comparisons.length > 0, "Expected at least one saved WH app roster to compare");
    assert.deepEqual(
      comparisons
        .filter((comparison) => comparison.match !== true)
        .map((comparison) => ({
          rosterId: comparison.rosterId,
          name: comparison.name,
          officialState: comparison.officialState,
          builderState: comparison.builderState,
          builderCodes: comparison.builderCodes,
        })),
      []
    );
  }
);

test("static Builder data export audit has no unexpected roster tables", async () => {
  const response = await fetch("/builder-data/audit.json");
  assert.equal(response.ok, true);

  const audit = await response.json();
  assert.equal(audit.integrityCheck, "ok");
  assert.equal(audit.exportedTables.length, Object.keys(realCatalog.bootstrap.tableCounts).length);
  assert.equal(audit.excludedTables.length, 43);
  assert.deepEqual(audit.unexpectedUnexportedTables, []);
});

test("standalone Builder build cache-busts HTML and local module imports", () => {
  const outDir = mkdtempSync(join(tmpdir(), "heretic-builder-cache-bust-"));
  try {
    execFileSync("python3", [
      "HereticBuilder/tools/build_builder_site.py",
      "--out",
      outDir,
      "--base-path",
      "/builder",
    ], { cwd: projectRoot });

    const index = readFileSync(join(outDir, "index.html"), "utf8");
    const match = index.match(/\/builder\/static\/builder\.js\?v=([a-f0-9]{12})/);
    assert.ok(match, "Expected builder.js content hash in standalone HTML");
    const version = match[1];
    assert.match(index, new RegExp(`/builder/static/builder\\.css\\?v=${version}`));

    const builderSource = readFileSync(join(outDir, "static", "builder.js"), "utf8");
    assert.match(builderSource, new RegExp(`\\.\\/builder_catalog\\.js\\?v=${version}`));
    assert.match(builderSource, new RegExp(`\\.\\/builder_route_renderers\\.js\\?v=${version}`));
    assert.match(builderSource, new RegExp(`\\.\\/builder_roster_runtime\\.js\\?v=${version}`));

    const routeRenderersSource = readFileSync(join(outDir, "static", "builder_route_renderers.js"), "utf8");
    assert.match(routeRenderersSource, new RegExp(`\\.\\/builder_route_basic_renderers\\.js\\?v=${version}`));
    assert.match(routeRenderersSource, new RegExp(`\\.\\/builder_route_roster_renderers\\.js\\?v=${version}`));
    assert.match(routeRenderersSource, new RegExp(`\\.\\/builder_catalog_runtime\\.js\\?v=${version}`));

    const routeBasicRenderersSource = readFileSync(join(outDir, "static", "builder_route_basic_renderers.js"), "utf8");
    assert.match(routeBasicRenderersSource, new RegExp(`\\.\\/builder_module_loaders\\.js\\?v=${version}`));
    assert.match(routeBasicRenderersSource, new RegExp(`\\.\\/builder_roster_io_actions\\.js\\?v=${version}`));
    assert.match(routeBasicRenderersSource, new RegExp(`\\.\\/builder_roster_runtime\\.js\\?v=${version}`));

    const routeRosterRenderersSource = readFileSync(join(outDir, "static", "builder_route_roster_renderers.js"), "utf8");
    assert.match(routeRosterRenderersSource, new RegExp(`\\.\\/builder_route_not_found_renderer\\.js\\?v=${version}`));
    assert.match(routeRosterRenderersSource, new RegExp(`\\.\\/builder_route_roster_detail_renderer\\.js\\?v=${version}`));
    assert.match(routeRosterRenderersSource, new RegExp(`\\.\\/builder_route_unit_detail_renderer\\.js\\?v=${version}`));

    const routeRosterDetailRendererSource = readFileSync(
      join(outDir, "static", "builder_route_roster_detail_renderer.js"),
      "utf8",
    );
    assert.match(routeRosterDetailRendererSource, new RegExp(`\\.\\/builder_module_loaders\\.js\\?v=${version}`));
    assert.match(routeRosterDetailRendererSource, new RegExp(`\\.\\/builder_roster_io_actions\\.js\\?v=${version}`));
    assert.match(routeRosterDetailRendererSource, new RegExp(`\\.\\/builder_roster_runtime\\.js\\?v=${version}`));

    const routeUnitDetailRendererSource = readFileSync(join(outDir, "static", "builder_route_unit_detail_renderer.js"), "utf8");
    assert.match(routeUnitDetailRendererSource, new RegExp(`\\.\\/builder_module_loaders\\.js\\?v=${version}`));
    assert.match(routeUnitDetailRendererSource, new RegExp(`\\.\\/builder_roster_io_actions\\.js\\?v=${version}`));
    assert.match(routeUnitDetailRendererSource, new RegExp(`\\.\\/builder_roster_runtime\\.js\\?v=${version}`));

    const routeNotFoundRendererSource = readFileSync(join(outDir, "static", "builder_route_not_found_renderer.js"), "utf8");
    assert.match(routeNotFoundRendererSource, new RegExp(`\\.\\/builder_module_loaders\\.js\\?v=${version}`));

    const rosterIoSource = readFileSync(join(outDir, "static", "builder_roster_io_actions.js"), "utf8");
    assert.match(rosterIoSource, new RegExp(`\\.\\/builder_module_loaders\\.js\\?v=${version}`));
    assert.match(rosterIoSource, new RegExp(`\\.\\/builder_roster_transfer_actions\\.js\\?v=${version}`));

    const rosterTransferActionsSource = readFileSync(join(outDir, "static", "builder_roster_transfer_actions.js"), "utf8");
    assert.match(rosterTransferActionsSource, new RegExp(`\\.\\/builder_module_loaders\\.js\\?v=${version}`));
    assert.match(rosterTransferActionsSource, new RegExp(`\\.\\/builder_catalog_runtime\\.js\\?v=${version}`));
    assert.match(rosterTransferActionsSource, new RegExp(`\\.\\/builder_roster_runtime\\.js\\?v=${version}`));

    const catalogRuntimeSource = readFileSync(join(outDir, "static", "builder_catalog_runtime.js"), "utf8");
    assert.match(catalogRuntimeSource, new RegExp(`\\.\\/builder_catalog\\.js\\?v=${version}`));
    assert.match(catalogRuntimeSource, new RegExp(`\\.\\/builder_roster_runtime\\.js\\?v=${version}`));

    const catalogSource = readFileSync(join(outDir, "static", "builder_catalog.js"), "utf8");
    assert.match(catalogSource, new RegExp(`\\.\\/builder_catalog_loader\\.js\\?v=${version}`));
    assert.match(catalogSource, new RegExp(`\\.\\/builder_catalog_indexes\\.js\\?v=${version}`));
    assert.match(catalogSource, new RegExp(`\\.\\/builder_catalog_tables\\.js\\?v=${version}`));

    const catalogIndexesSource = readFileSync(join(outDir, "static", "builder_catalog_indexes.js"), "utf8");
    assert.match(catalogIndexesSource, new RegExp(`\\.\\/builder_catalog_group_indexes\\.js\\?v=${version}`));
    assert.match(catalogIndexesSource, new RegExp(`\\.\\/builder_catalog_id_indexes\\.js\\?v=${version}`));

    const catalogIdIndexesSource = readFileSync(join(outDir, "static", "builder_catalog_id_indexes.js"), "utf8");
    assert.match(catalogIdIndexesSource, new RegExp(`\\.\\/builder_catalog_index_helpers\\.js\\?v=${version}`));

    const catalogGroupIndexesSource = readFileSync(join(outDir, "static", "builder_catalog_group_indexes.js"), "utf8");
    assert.match(catalogGroupIndexesSource, new RegExp(`\\.\\/builder_catalog_allied_group_indexes\\.js\\?v=${version}`));
    assert.match(catalogGroupIndexesSource, new RegExp(`\\.\\/builder_catalog_detachment_group_indexes\\.js\\?v=${version}`));
    assert.match(catalogGroupIndexesSource, new RegExp(`\\.\\/builder_catalog_enhancement_group_indexes\\.js\\?v=${version}`));
    assert.match(catalogGroupIndexesSource, new RegExp(`\\.\\/builder_catalog_unit_group_indexes\\.js\\?v=${version}`));
    assert.match(catalogGroupIndexesSource, new RegExp(`\\.\\/builder_catalog_wargear_group_indexes\\.js\\?v=${version}`));

    const catalogAlliedGroupIndexesSource = readFileSync(join(outDir, "static", "builder_catalog_allied_group_indexes.js"), "utf8");
    assert.match(catalogAlliedGroupIndexesSource, new RegExp(`\\.\\/builder_catalog_index_helpers\\.js\\?v=${version}`));
    const catalogDetachmentGroupIndexesSource = readFileSync(join(outDir, "static", "builder_catalog_detachment_group_indexes.js"), "utf8");
    assert.match(catalogDetachmentGroupIndexesSource, new RegExp(`\\.\\/builder_catalog_index_helpers\\.js\\?v=${version}`));
    const catalogEnhancementGroupIndexesSource = readFileSync(join(outDir, "static", "builder_catalog_enhancement_group_indexes.js"), "utf8");
    assert.match(catalogEnhancementGroupIndexesSource, new RegExp(`\\.\\/builder_catalog_index_helpers\\.js\\?v=${version}`));
    const catalogUnitGroupIndexesSource = readFileSync(join(outDir, "static", "builder_catalog_unit_group_indexes.js"), "utf8");
    assert.match(catalogUnitGroupIndexesSource, new RegExp(`\\.\\/builder_catalog_index_helpers\\.js\\?v=${version}`));
    const catalogWargearGroupIndexesSource = readFileSync(join(outDir, "static", "builder_catalog_wargear_group_indexes.js"), "utf8");
    assert.match(catalogWargearGroupIndexesSource, new RegExp(`\\.\\/builder_catalog_index_helpers\\.js\\?v=${version}`));

    const loaderSource = readFileSync(join(outDir, "static", "builder_module_loaders.js"), "utf8");
    assert.match(loaderSource, new RegExp(`\\.\\/builder_roster_list_view\\.js\\?v=${version}`));
    assert.match(loaderSource, new RegExp(`\\.\\/builder_roster_transfer\\.js\\?v=${version}`));
    assert.match(loaderSource, new RegExp(`\\.\\/builder_roster_unit_detail_view\\.js\\?v=${version}`));

    const transferSource = readFileSync(join(outDir, "static", "builder_roster_transfer.js"), "utf8");
    assert.match(transferSource, new RegExp(`\\.\\/builder_roster_transfer_normalize\\.js\\?v=${version}`));

    const transferNormalizeSource = readFileSync(join(outDir, "static", "builder_roster_transfer_normalize.js"), "utf8");
    assert.match(transferNormalizeSource, new RegExp(`\\.\\/builder_roster_transfer_normalize_helpers\\.js\\?v=${version}`));
    assert.match(transferNormalizeSource, new RegExp(`\\.\\/builder_roster_transfer_normalize_attachments\\.js\\?v=${version}`));
    assert.match(transferNormalizeSource, new RegExp(`\\.\\/builder_roster_transfer_normalize_units\\.js\\?v=${version}`));

    const transferNormalizeUnitsSource = readFileSync(join(outDir, "static", "builder_roster_transfer_normalize_units.js"), "utf8");
    assert.match(transferNormalizeUnitsSource, new RegExp(`\\.\\/builder_roster_transfer_normalize_helpers\\.js\\?v=${version}`));

    const transferNormalizeHelpersSource = readFileSync(
      join(outDir, "static", "builder_roster_transfer_normalize_helpers.js"),
      "utf8",
    );
    assert.match(transferNormalizeHelpersSource, new RegExp(`\\.\\/builder_roster_transfer_legacy_fields\\.js\\?v=${version}`));
    assert.match(transferNormalizeHelpersSource, new RegExp(`\\.\\/builder_roster_transfer_list_summary\\.js\\?v=${version}`));
    assert.match(transferNormalizeHelpersSource, new RegExp(`\\.\\/builder_roster_transfer_selection_rows\\.js\\?v=${version}`));
    assert.match(transferNormalizeHelpersSource, new RegExp(`\\.\\/builder_roster_transfer_wargear_map\\.js\\?v=${version}`));
    assert.match(transferNormalizeHelpersSource, new RegExp(`\\.\\/builder_roster_transfer_values\\.js\\?v=${version}`));

    const transferWargearMapSource = readFileSync(join(outDir, "static", "builder_roster_transfer_wargear_map.js"), "utf8");
    assert.match(transferWargearMapSource, new RegExp(`\\.\\/builder_roster_transfer_values\\.js\\?v=${version}`));

    const transferListSummarySource = readFileSync(join(outDir, "static", "builder_roster_transfer_list_summary.js"), "utf8");
    assert.match(transferListSummarySource, new RegExp(`\\.\\/builder_roster_transfer_values\\.js\\?v=${version}`));

    const listSource = readFileSync(join(outDir, "static", "builder_roster_list_view.js"), "utf8");
    assert.match(listSource, new RegExp(`\\.\\/builder_dom\\.js\\?v=${version}`));

    const actionsSource = readFileSync(join(outDir, "static", "builder_roster_actions.js"), "utf8");
    assert.match(actionsSource, new RegExp(`\\.\\/builder_roster_attachment_actions\\.js\\?v=${version}`));
    assert.match(actionsSource, new RegExp(`\\.\\/builder_roster_detachment_actions\\.js\\?v=${version}`));
    assert.match(actionsSource, new RegExp(`\\.\\/builder_roster_unit_actions\\.js\\?v=${version}`));

    const attachmentActionsSource = readFileSync(join(outDir, "static", "builder_roster_attachment_actions.js"), "utf8");
    assert.match(attachmentActionsSource, new RegExp(`\\.\\/builder_roster_action_helpers\\.js\\?v=${version}`));
    assert.match(attachmentActionsSource, new RegExp(`\\.\\/builder_roster_attachment_members\\.js\\?v=${version}`));
    assert.match(attachmentActionsSource, new RegExp(`\\.\\/builder_roster_attachment_remove_actions\\.js\\?v=${version}`));

    const detachmentActionsSource = readFileSync(join(outDir, "static", "builder_roster_detachment_actions.js"), "utf8");
    assert.match(detachmentActionsSource, new RegExp(`\\.\\/builder_roster_action_helpers\\.js\\?v=${version}`));

    const unitActionsSource = readFileSync(join(outDir, "static", "builder_roster_unit_actions.js"), "utf8");
    assert.match(unitActionsSource, new RegExp(`\\.\\/builder_roster_unit_base_actions\\.js\\?v=${version}`));
    assert.match(unitActionsSource, new RegExp(`\\.\\/builder_roster_unit_wargear_actions\\.js\\?v=${version}`));
    assert.match(unitActionsSource, new RegExp(`\\.\\/builder_roster_unit_upgrade_actions\\.js\\?v=${version}`));

    const unitBaseActionsSource = readFileSync(join(outDir, "static", "builder_roster_unit_base_actions.js"), "utf8");
    assert.match(unitBaseActionsSource, new RegExp(`\\.\\/builder_model\\.js\\?v=${version}`));
    assert.match(unitBaseActionsSource, new RegExp(`\\.\\/builder_roster_attachment_members\\.js\\?v=${version}`));
    assert.match(unitBaseActionsSource, new RegExp(`\\.\\/builder_roster_action_helpers\\.js\\?v=${version}`));
    assert.match(unitBaseActionsSource, new RegExp(`\\.\\/builder_roster_unit_default_rows\\.js\\?v=${version}`));

    const unitWargearActionsSource = readFileSync(join(outDir, "static", "builder_roster_unit_wargear_actions.js"), "utf8");
    assert.match(unitWargearActionsSource, new RegExp(`\\.\\/builder_roster_action_helpers\\.js\\?v=${version}`));
    assert.match(unitWargearActionsSource, new RegExp(`\\.\\/builder_roster_unit_default_rows\\.js\\?v=${version}`));

    const unitUpgradeActionsSource = readFileSync(join(outDir, "static", "builder_roster_unit_upgrade_actions.js"), "utf8");
    assert.match(unitUpgradeActionsSource, new RegExp(`\\.\\/builder_roster_action_helpers\\.js\\?v=${version}`));

    const loadoutMathSource = readFileSync(join(outDir, "static", "builder_loadout_math.js"), "utf8");
    assert.match(loadoutMathSource, new RegExp(`\\.\\/builder_loadout_catalog\\.js\\?v=${version}`));
    assert.match(loadoutMathSource, new RegExp(`\\.\\/builder_loadout_counts\\.js\\?v=${version}`));
    assert.match(loadoutMathSource, new RegExp(`\\.\\/builder_loadout_choices\\.js\\?v=${version}`));
    assert.match(loadoutMathSource, new RegExp(`\\.\\/builder_loadout_matcher\\.js\\?v=${version}`));

    const loadoutCatalogSource = readFileSync(join(outDir, "static", "builder_loadout_catalog.js"), "utf8");
    assert.match(loadoutCatalogSource, new RegExp(`\\.\\/builder_loadout_choice_items\\.js\\?v=${version}`));
    assert.match(loadoutCatalogSource, new RegExp(`\\.\\/builder_loadout_choice_sets\\.js\\?v=${version}`));
    assert.match(loadoutCatalogSource, new RegExp(`\\.\\/builder_loadout_keys\\.js\\?v=${version}`));

    const loadoutChoiceItemsSource = readFileSync(join(outDir, "static", "builder_loadout_choice_items.js"), "utf8");
    assert.match(loadoutChoiceItemsSource, new RegExp(`\\.\\/builder_loadout_counts\\.js\\?v=${version}`));
    assert.match(loadoutChoiceItemsSource, new RegExp(`\\.\\/builder_loadout_keys\\.js\\?v=${version}`));

    const loadoutChoiceSetsSource = readFileSync(join(outDir, "static", "builder_loadout_choice_sets.js"), "utf8");
    assert.match(loadoutChoiceSetsSource, new RegExp(`\\.\\/builder_loadout_choice_items\\.js\\?v=${version}`));

    const loadoutCountsSource = readFileSync(join(outDir, "static", "builder_loadout_counts.js"), "utf8");
    assert.match(loadoutCountsSource, new RegExp(`\\.\\/builder_loadout_count_keys\\.js\\?v=${version}`));
    assert.match(loadoutCountsSource, new RegExp(`\\.\\/builder_loadout_count_arithmetic\\.js\\?v=${version}`));
    assert.match(loadoutCountsSource, new RegExp(`\\.\\/builder_loadout_combinations\\.js\\?v=${version}`));

    const loadoutCountArithmeticSource = readFileSync(
      join(outDir, "static", "builder_loadout_count_arithmetic.js"),
      "utf8",
    );
    assert.match(loadoutCountArithmeticSource, new RegExp(`\\.\\/builder_loadout_count_keys\\.js\\?v=${version}`));

    const loadoutChoicesSource = readFileSync(join(outDir, "static", "builder_loadout_choices.js"), "utf8");
    assert.match(loadoutChoicesSource, new RegExp(`\\.\\/builder_loadout_precomputed\\.js\\?v=${version}`));
    assert.match(loadoutChoicesSource, new RegExp(`\\.\\/builder_loadout_counts\\.js\\?v=${version}`));

    const loadoutMatcherSource = readFileSync(join(outDir, "static", "builder_loadout_matcher.js"), "utf8");
    assert.match(loadoutMatcherSource, new RegExp(`\\.\\/builder_loadout_catalog\\.js\\?v=${version}`));
    assert.match(loadoutMatcherSource, new RegExp(`\\.\\/builder_loadout_counts\\.js\\?v=${version}`));
    assert.match(loadoutMatcherSource, new RegExp(`\\.\\/builder_loadout_choices\\.js\\?v=${version}`));

    const modelWargearSource = readFileSync(join(outDir, "static", "builder_model_wargear.js"), "utf8");
    assert.match(modelWargearSource, new RegExp(`\\.\\/builder_model_wargear_defaults\\.js\\?v=${version}`));

    const modelWargearDefaultsSource = readFileSync(join(outDir, "static", "builder_model_wargear_defaults.js"), "utf8");
    assert.match(modelWargearDefaultsSource, new RegExp(`\\.\\/builder_model_wargear_default_loadouts\\.js\\?v=${version}`));

    const modelWargearDefaultLoadoutsSource = readFileSync(join(outDir, "static", "builder_model_wargear_default_loadouts.js"), "utf8");
    assert.match(modelWargearDefaultLoadoutsSource, new RegExp(`\\.\\/builder_model_wargear_default_options\\.js\\?v=${version}`));
    assert.match(modelWargearDefaultLoadoutsSource, new RegExp(`\\.\\/builder_model_wargear_default_search\\.js\\?v=${version}`));

    const modelWargearDefaultSearchSource = readFileSync(join(outDir, "static", "builder_model_wargear_default_search.js"), "utf8");
    assert.match(modelWargearDefaultSearchSource, new RegExp(`\\.\\/builder_model_wargear_default_candidates\\.js\\?v=${version}`));
    assert.match(modelWargearDefaultSearchSource, new RegExp(`\\.\\/builder_model_wargear_default_options\\.js\\?v=${version}`));
    assert.match(modelWargearDefaultSearchSource, new RegExp(`\\.\\/builder_model_wargear_default_scores\\.js\\?v=${version}`));

    const modelWargearDefaultCandidatesSource = readFileSync(
      join(outDir, "static", "builder_model_wargear_default_candidates.js"),
      "utf8",
    );
    assert.match(modelWargearDefaultCandidatesSource, new RegExp(`\\.\\/builder_model_wargear_default_scores\\.js\\?v=${version}`));

    const modelSource = readFileSync(join(outDir, "static", "builder_model.js"), "utf8");
    assert.match(modelSource, new RegExp(`\\.\\/builder_model_core\\.js\\?v=${version}`));
    assert.match(modelSource, new RegExp(`\\.\\/builder_model_detachments\\.js\\?v=${version}`));
    assert.match(modelSource, new RegExp(`\\.\\/builder_model_selections\\.js\\?v=${version}`));

    const modelSelectionsSource = readFileSync(join(outDir, "static", "builder_model_selections.js"), "utf8");
    assert.match(modelSelectionsSource, new RegExp(`\\.\\/builder_model_composition_factions\\.js\\?v=${version}`));
    assert.match(modelSelectionsSource, new RegExp(`\\.\\/builder_model_conditional_keyword_rules\\.js\\?v=${version}`));
    assert.match(modelSelectionsSource, new RegExp(`\\.\\/builder_model_selection_rows\\.js\\?v=${version}`));

    const modelCompositionsSource = readFileSync(join(outDir, "static", "builder_model_compositions.js"), "utf8");
    assert.match(modelCompositionsSource, new RegExp(`\\.\\/builder_model_composition_availability\\.js\\?v=${version}`));
    assert.match(modelCompositionsSource, new RegExp(`\\.\\/builder_model_miniatures\\.js\\?v=${version}`));

    const modelCompositionAvailabilitySource = readFileSync(join(outDir, "static", "builder_model_composition_availability.js"), "utf8");
    assert.match(modelCompositionAvailabilitySource, new RegExp(`\\.\\/builder_model_composition_choices\\.js\\?v=${version}`));
    assert.match(modelCompositionAvailabilitySource, new RegExp(`\\.\\/builder_model_composition_effective\\.js\\?v=${version}`));
    assert.match(modelCompositionAvailabilitySource, new RegExp(`\\.\\/builder_model_composition_filters\\.js\\?v=${version}`));

    const modelCompositionChoicesSource = readFileSync(join(outDir, "static", "builder_model_composition_choices.js"), "utf8");
    assert.match(modelCompositionChoicesSource, new RegExp(`\\.\\/builder_model_composition_filters\\.js\\?v=${version}`));

    const modelCompositionEffectiveSource = readFileSync(join(outDir, "static", "builder_model_composition_effective.js"), "utf8");
    assert.match(modelCompositionEffectiveSource, new RegExp(`\\.\\/builder_model_composition_choices\\.js\\?v=${version}`));
    assert.match(modelCompositionEffectiveSource, new RegExp(`\\.\\/builder_model_composition_filters\\.js\\?v=${version}`));

    const modelSummarySource = readFileSync(join(outDir, "static", "builder_model_summary.js"), "utf8");
    assert.match(modelSummarySource, new RegExp(`\\.\\/builder_model_selections\\.js\\?v=${version}`));
    assert.match(modelSummarySource, new RegExp(`\\.\\/builder_model_points\\.js\\?v=${version}`));
    assert.match(modelSummarySource, new RegExp(`\\.\\/builder_model_summary_enhancements\\.js\\?v=${version}`));
    assert.match(modelSummarySource, new RegExp(`\\.\\/builder_model_summary_keywords\\.js\\?v=${version}`));
    assert.match(modelSummarySource, new RegExp(`\\.\\/builder_model_summary_points\\.js\\?v=${version}`));

    const modelSummaryEnhancementsSource = readFileSync(join(outDir, "static", "builder_model_summary_enhancements.js"), "utf8");
    assert.match(modelSummaryEnhancementsSource, new RegExp(`\\.\\/builder_model_points\\.js\\?v=${version}`));
    assert.match(modelSummaryEnhancementsSource, new RegExp(`\\.\\/builder_model_selections\\.js\\?v=${version}`));

    const modelSummaryKeywordsSource = readFileSync(join(outDir, "static", "builder_model_summary_keywords.js"), "utf8");
    assert.match(modelSummaryKeywordsSource, new RegExp(`\\.\\/builder_model_keywords\\.js\\?v=${version}`));
    assert.match(modelSummaryKeywordsSource, new RegExp(`\\.\\/builder_model_selections\\.js\\?v=${version}`));

    const modelSummaryPointsSource = readFileSync(join(outDir, "static", "builder_model_summary_points.js"), "utf8");
    assert.match(modelSummaryPointsSource, new RegExp(`\\.\\/builder_model_points\\.js\\?v=${version}`));
    assert.match(modelSummaryPointsSource, new RegExp(`\\.\\/builder_model_wargear\\.js\\?v=${version}`));

    const modelKeywordsSource = readFileSync(join(outDir, "static", "builder_model_keywords.js"), "utf8");
    assert.match(modelKeywordsSource, new RegExp(`\\.\\/builder_model_selections\\.js\\?v=${version}`));
    assert.match(modelKeywordsSource, new RegExp(`\\.\\/builder_model_compositions\\.js\\?v=${version}`));

    const modelAvailabilitySource = readFileSync(join(outDir, "static", "builder_model_availability.js"), "utf8");
    assert.match(modelAvailabilitySource, new RegExp(`\\.\\/builder_allied_unit_sources\\.js\\?v=${version}`));
    assert.match(modelAvailabilitySource, new RegExp(`\\.\\/builder_datasheet_availability\\.js\\?v=${version}`));
    assert.match(modelAvailabilitySource, new RegExp(`\\.\\/builder_detachment_availability\\.js\\?v=${version}`));

    const datasheetAvailabilitySource = readFileSync(join(outDir, "static", "builder_datasheet_availability.js"), "utf8");
    assert.match(datasheetAvailabilitySource, new RegExp(`\\.\\/builder_datasheet_combat_patrol\\.js\\?v=${version}`));
    assert.match(datasheetAvailabilitySource, new RegExp(`\\.\\/builder_datasheet_faction_filters\\.js\\?v=${version}`));
    assert.match(datasheetAvailabilitySource, new RegExp(`\\.\\/builder_model_selections\\.js\\?v=${version}`));
    assert.match(datasheetAvailabilitySource, new RegExp(`\\.\\/builder_model_compositions\\.js\\?v=${version}`));
    assert.match(datasheetAvailabilitySource, new RegExp(`\\.\\/builder_allied_unit_sources\\.js\\?v=${version}`));

    const enhancementRulesSource = readFileSync(join(outDir, "static", "builder_enhancement_rules.js"), "utf8");
    assert.match(enhancementRulesSource, new RegExp(`\\.\\/builder_enhancement_eligibility\\.js\\?v=${version}`));
    assert.match(enhancementRulesSource, new RegExp(`\\.\\/builder_enhancement_limit_rules\\.js\\?v=${version}`));
    assert.match(enhancementRulesSource, new RegExp(`\\.\\/builder_enhancement_selection\\.js\\?v=${version}`));

    const enhancementLimitSource = readFileSync(join(outDir, "static", "builder_enhancement_limit_rules.js"), "utf8");
    assert.match(enhancementLimitSource, new RegExp(`\\.\\/builder_enhancement_combat_patrol_rules\\.js\\?v=${version}`));
    assert.match(enhancementLimitSource, new RegExp(`\\.\\/builder_enhancement_limit_scopes\\.js\\?v=${version}`));

    const enhancementCombatPatrolSource = readFileSync(
      join(outDir, "static", "builder_enhancement_combat_patrol_rules.js"),
      "utf8",
    );
    assert.match(enhancementCombatPatrolSource, new RegExp(`\\.\\/builder_enhancement_limit_scopes\\.js\\?v=${version}`));

    const enhancementEligibilitySource = readFileSync(join(outDir, "static", "builder_enhancement_eligibility.js"), "utf8");
    assert.match(enhancementEligibilitySource, new RegExp(`\\.\\/builder_enhancement_keyword_rules\\.js\\?v=${version}`));

    const allegianceRulesSource = readFileSync(join(outDir, "static", "builder_allegiance_rules.js"), "utf8");
    assert.match(allegianceRulesSource, new RegExp(`\\.\\/builder_allegiance_helpers\\.js\\?v=${version}`));
    assert.match(allegianceRulesSource, new RegExp(`\\.\\/builder_allegiance_candidates\\.js\\?v=${version}`));
    assert.match(allegianceRulesSource, new RegExp(`\\.\\/builder_allegiance_group_limits\\.js\\?v=${version}`));

    const allegianceCandidatesSource = readFileSync(join(outDir, "static", "builder_allegiance_candidates.js"), "utf8");
    assert.match(allegianceCandidatesSource, new RegExp(`\\.\\/builder_allegiance_helpers\\.js\\?v=${version}`));

    const attachmentRulesSource = readFileSync(join(outDir, "static", "builder_attachment_rules.js"), "utf8");
    assert.match(attachmentRulesSource, new RegExp(`\\.\\/builder_attachment_matchers\\.js\\?v=${version}`));
    assert.match(attachmentRulesSource, new RegExp(`\\.\\/builder_attachment_enhancement_rules\\.js\\?v=${version}`));

    const attachmentEnhancementRulesSource = readFileSync(join(outDir, "static", "builder_attachment_enhancement_rules.js"), "utf8");
    assert.match(attachmentEnhancementRulesSource, new RegExp(`\\.\\/builder_attachment_matchers\\.js\\?v=${version}`));
    assert.match(attachmentEnhancementRulesSource, new RegExp(`\\.\\/builder_attachment_enhancement_bodyguard_rules\\.js\\?v=${version}`));

    const attachmentEnhancementBodyguardRulesSource = readFileSync(join(outDir, "static", "builder_attachment_enhancement_bodyguard_rules.js"), "utf8");
    assert.match(attachmentEnhancementBodyguardRulesSource, new RegExp(`\\.\\/builder_attachment_matchers\\.js\\?v=${version}`));

    const alliedRulesSource = readFileSync(join(outDir, "static", "builder_allied_rules.js"), "utf8");
    assert.match(alliedRulesSource, new RegExp(`\\.\\/builder_allied_faction_rules\\.js\\?v=${version}`));
    assert.match(alliedRulesSource, new RegExp(`\\.\\/builder_allied_keyword_rules\\.js\\?v=${version}`));
    assert.match(alliedRulesSource, new RegExp(`\\.\\/builder_allied_rule_helpers\\.js\\?v=${version}`));

    const alliedFactionRulesSource = readFileSync(join(outDir, "static", "builder_allied_faction_rules.js"), "utf8");
    assert.match(alliedFactionRulesSource, new RegExp(`\\.\\/builder_allied_faction_availability_rules\\.js\\?v=${version}`));
    assert.match(alliedFactionRulesSource, new RegExp(`\\.\\/builder_allied_faction_datasheet_rules\\.js\\?v=${version}`));
    assert.match(alliedFactionRulesSource, new RegExp(`\\.\\/builder_allied_faction_detachment_rules\\.js\\?v=${version}`));
    assert.match(alliedFactionRulesSource, new RegExp(`\\.\\/builder_allied_faction_points_rules\\.js\\?v=${version}`));
    assert.match(alliedFactionRulesSource, new RegExp(`\\.\\/builder_allied_faction_warlord_rules\\.js\\?v=${version}`));

    const alliedKeywordRulesSource = readFileSync(join(outDir, "static", "builder_allied_keyword_rules.js"), "utf8");
    assert.match(alliedKeywordRulesSource, new RegExp(`\\.\\/builder_allied_allegiance_requirement_rules\\.js\\?v=${version}`));
    assert.match(alliedKeywordRulesSource, new RegExp(`\\.\\/builder_allied_keyword_limit_rules\\.js\\?v=${version}`));
    assert.match(alliedKeywordRulesSource, new RegExp(`\\.\\/builder_allied_restricting_keyword_rules\\.js\\?v=${version}`));

    const restrictionRulesSource = readFileSync(join(outDir, "static", "builder_restriction_rules.js"), "utf8");
    assert.match(restrictionRulesSource, new RegExp(`\\.\\/builder_detachment_restriction_rules\\.js\\?v=${version}`));
    assert.match(restrictionRulesSource, new RegExp(`\\.\\/builder_keyword_restriction_rules\\.js\\?v=${version}`));
    assert.match(restrictionRulesSource, new RegExp(`\\.\\/builder_successor_chapter_rules\\.js\\?v=${version}`));
    assert.match(restrictionRulesSource, new RegExp(`\\.\\/builder_unit_composition_rules\\.js\\?v=${version}`));

    const detachmentRestrictionRulesSource = readFileSync(
      join(outDir, "static", "builder_detachment_restriction_rules.js"),
      "utf8",
    );
    assert.match(detachmentRestrictionRulesSource, new RegExp(`\\.\\/builder_detachment_datasheet_rules\\.js\\?v=${version}`));
    assert.match(detachmentRestrictionRulesSource, new RegExp(`\\.\\/builder_detachment_unique_keyword_rules\\.js\\?v=${version}`));

    const keywordRestrictionRulesSource = readFileSync(join(outDir, "static", "builder_keyword_restriction_rules.js"), "utf8");
    assert.match(keywordRestrictionRulesSource, new RegExp(`\\.\\/builder_keyword_restriction_groups\\.js\\?v=${version}`));

    const unitEditorSource = readFileSync(join(outDir, "static", "builder_roster_unit_editor_view.js"), "utf8");
    assert.match(unitEditorSource, new RegExp(`\\.\\/builder_roster_unit_candidates\\.js\\?v=${version}`));
    assert.match(unitEditorSource, new RegExp(`\\.\\/builder_roster_unit_controls\\.js\\?v=${version}`));
    assert.match(unitEditorSource, new RegExp(`\\.\\/builder_roster_unit_rows\\.js\\?v=${version}`));

    const unitCandidatesSource = readFileSync(join(outDir, "static", "builder_roster_unit_candidates.js"), "utf8");
    assert.match(unitCandidatesSource, new RegExp(`\\.\\/builder_roster_unit_candidate_status\\.js\\?v=${version}`));

    const unitRowsSource = readFileSync(join(outDir, "static", "builder_roster_unit_rows.js"), "utf8");
    assert.match(unitRowsSource, new RegExp(`\\.\\/builder_roster_unit_badges\\.js\\?v=${version}`));
    assert.match(unitRowsSource, new RegExp(`\\.\\/builder_roster_unit_validation_status\\.js\\?v=${version}`));
    assert.match(unitRowsSource, new RegExp(`\\.\\/builder_unit_images\\.js\\?v=${version}`));

    const detachmentEditorSource = readFileSync(join(outDir, "static", "builder_roster_detachment_editor_view.js"), "utf8");
    assert.match(detachmentEditorSource, new RegExp(`\\.\\/builder_roster_detachment_candidates\\.js\\?v=${version}`));
    assert.match(detachmentEditorSource, new RegExp(`\\.\\/builder_roster_detachment_controls\\.js\\?v=${version}`));
    assert.match(detachmentEditorSource, new RegExp(`\\.\\/builder_roster_detachment_rows\\.js\\?v=${version}`));

    const detachmentControlsSource = readFileSync(join(outDir, "static", "builder_roster_detachment_controls.js"), "utf8");
    assert.match(detachmentControlsSource, new RegExp(`\\.\\/builder_roster_detachment_candidates\\.js\\?v=${version}`));

    const detachmentRowsSource = readFileSync(join(outDir, "static", "builder_roster_detachment_rows.js"), "utf8");
    assert.match(detachmentRowsSource, new RegExp(`\\.\\/builder_codex_links\\.js\\?v=${version}`));
    assert.match(detachmentRowsSource, new RegExp(`\\.\\/builder_validation_view\\.js\\?v=${version}`));

    const unitDetailSource = readFileSync(join(outDir, "static", "builder_roster_unit_detail_view.js"), "utf8");
    assert.match(unitDetailSource, new RegExp(`\\.\\/builder_roster_unit_detail_actions\\.js\\?v=${version}`));
    assert.match(unitDetailSource, new RegExp(`\\.\\/builder_roster_unit_detail_editors\\.js\\?v=${version}`));
    assert.match(unitDetailSource, new RegExp(`\\.\\/builder_roster_unit_overview_view\\.js\\?v=${version}`));
    assert.match(unitDetailSource, new RegExp(`\\.\\/builder_roster_unit_wargear_section_view\\.js\\?v=${version}`));

    const unitOverviewSource = readFileSync(join(outDir, "static", "builder_roster_unit_overview_view.js"), "utf8");
    assert.match(unitOverviewSource, new RegExp(`\\.\\/builder_roster_unit_detail_editors\\.js\\?v=${version}`));
    assert.match(unitOverviewSource, new RegExp(`\\.\\/builder_unit_images\\.js\\?v=${version}`));

    const unitWargearSectionSource = readFileSync(join(outDir, "static", "builder_roster_unit_wargear_section_view.js"), "utf8");
    assert.match(unitWargearSectionSource, new RegExp(`\\.\\/builder_roster_unit_wargear_view\\.js\\?v=${version}`));

    const unitWargearViewSource = readFileSync(join(outDir, "static", "builder_roster_unit_wargear_view.js"), "utf8");
    assert.match(unitWargearViewSource, new RegExp(`\\.\\/builder_roster_unit_wargear_options_view\\.js\\?v=${version}`));
    assert.match(unitWargearViewSource, new RegExp(`\\.\\/builder_roster_unit_wargear_validation_view\\.js\\?v=${version}`));

    const unitDetailEditorsSource = readFileSync(join(outDir, "static", "builder_roster_unit_detail_editors.js"), "utf8");
    assert.match(unitDetailEditorsSource, new RegExp(`\\.\\/builder_roster_unit_allegiance_editor\\.js\\?v=${version}`));
    assert.match(unitDetailEditorsSource, new RegExp(`\\.\\/builder_roster_unit_composition_editor\\.js\\?v=${version}`));
    assert.match(unitDetailEditorsSource, new RegExp(`\\.\\/builder_roster_unit_enhancement_editor\\.js\\?v=${version}`));
    assert.match(unitDetailEditorsSource, new RegExp(`\\.\\/builder_roster_unit_warlord_editor\\.js\\?v=${version}`));

    const unitEnhancementEditorSource = readFileSync(join(outDir, "static", "builder_roster_unit_enhancement_editor.js"), "utf8");
    assert.match(unitEnhancementEditorSource, new RegExp(`\\.\\/builder_roster_unit_enhancement_options\\.js\\?v=${version}`));
    assert.match(unitEnhancementEditorSource, new RegExp(`\\.\\/builder_roster_unit_enhancement_select\\.js\\?v=${version}`));

    const unitEnhancementSelectSource = readFileSync(join(outDir, "static", "builder_roster_unit_enhancement_select.js"), "utf8");
    assert.match(unitEnhancementSelectSource, new RegExp(`\\.\\/builder_roster_unit_enhancement_options\\.js\\?v=${version}`));

    const validationSource = readFileSync(join(outDir, "static", "builder_validation_view.js"), "utf8");
    assert.match(validationSource, new RegExp(`\\.\\/builder_validation_groups\\.js\\?v=${version}`));
    assert.match(validationSource, new RegExp(`\\.\\/builder_validation_message_list\\.js\\?v=${version}`));
    assert.match(validationSource, new RegExp(`\\.\\/builder_validation_scopes\\.js\\?v=${version}`));

    const validationMessageListSource = readFileSync(join(outDir, "static", "builder_validation_message_list.js"), "utf8");
    assert.match(validationMessageListSource, new RegExp(`\\.\\/builder_validation_groups\\.js\\?v=${version}`));

    const validationGroupsSource = readFileSync(join(outDir, "static", "builder_validation_groups.js"), "utf8");
    assert.match(validationGroupsSource, new RegExp(`\\.\\/builder_validation_scope_labels\\.js\\?v=${version}`));

    const validationScopesSource = readFileSync(join(outDir, "static", "builder_validation_scopes.js"), "utf8");
    assert.match(validationScopesSource, new RegExp(`\\.\\/builder_validation_attachment_scopes\\.js\\?v=${version}`));

    const rosterValidationSource = readFileSync(join(outDir, "static", "builder_roster_validation.js"), "utf8");
    assert.match(rosterValidationSource, new RegExp(`\\.\\/builder_roster_validation_basic_rules\\.js\\?v=${version}`));
    assert.match(rosterValidationSource, new RegExp(`\\.\\/builder_roster_validation_context\\.js\\?v=${version}`));
    assert.match(rosterValidationSource, new RegExp(`\\.\\/builder_roster_validation_rule_runner\\.js\\?v=${version}`));
    assert.match(rosterValidationSource, new RegExp(`\\.\\/builder_roster_validation_unit_rules\\.js\\?v=${version}`));

    const rosterValidationRuleRunnerSource = readFileSync(join(outDir, "static", "builder_roster_validation_rule_runner.js"), "utf8");
    assert.match(rosterValidationRuleRunnerSource, new RegExp(`\\.\\/builder_warlord_rules\\.js\\?v=${version}`));
    assert.match(rosterValidationRuleRunnerSource, new RegExp(`\\.\\/builder_wargear_rules\\.js\\?v=${version}`));
    assert.match(rosterValidationRuleRunnerSource, new RegExp(`\\.\\/builder_restriction_rules\\.js\\?v=${version}`));

    const wargearRulesSource = readFileSync(join(outDir, "static", "builder_wargear_rules.js"), "utf8");
    assert.match(wargearRulesSource, new RegExp(`\\.\\/builder_wargear_all_model_rules\\.js\\?v=${version}`));
    assert.match(wargearRulesSource, new RegExp(`\\.\\/builder_wargear_limited_rules\\.js\\?v=${version}`));

    const wargearSelectionSource = readFileSync(join(outDir, "static", "builder_wargear_selection.js"), "utf8");
    assert.match(wargearSelectionSource, new RegExp(`\\.\\/builder_wargear_entry_targets\\.js\\?v=${version}`));
    assert.match(wargearSelectionSource, new RegExp(`\\.\\/builder_wargear_selection_counts\\.js\\?v=${version}`));

    const wargearSelectionCountsSource = readFileSync(join(outDir, "static", "builder_wargear_selection_counts.js"), "utf8");
    assert.match(wargearSelectionCountsSource, new RegExp(`\\.\\/builder_wargear_entry_targets\\.js\\?v=${version}`));

    const allModelWargearRulesSource = readFileSync(join(outDir, "static", "builder_wargear_all_model_rules.js"), "utf8");
    assert.match(allModelWargearRulesSource, new RegExp(`\\.\\/builder_wargear_all_model_choices\\.js\\?v=${version}`));
    assert.match(allModelWargearRulesSource, new RegExp(`\\.\\/builder_wargear_all_model_family_checks\\.js\\?v=${version}`));

    const allModelFamilyChecksSource = readFileSync(join(outDir, "static", "builder_wargear_all_model_family_checks.js"), "utf8");
    assert.match(allModelFamilyChecksSource, new RegExp(`\\.\\/builder_wargear_all_model_choices\\.js\\?v=${version}`));
    assert.match(allModelFamilyChecksSource, new RegExp(`\\.\\/builder_wargear_all_model_family_counts\\.js\\?v=${version}`));

    const allModelFamilyCountsSource = readFileSync(join(outDir, "static", "builder_wargear_all_model_family_counts.js"), "utf8");
    assert.match(allModelFamilyCountsSource, new RegExp(`\\.\\/builder_wargear_all_model_choices\\.js\\?v=${version}`));

    const limitedWargearRulesSource = readFileSync(join(outDir, "static", "builder_wargear_limited_rules.js"), "utf8");
    assert.match(limitedWargearRulesSource, new RegExp(`\\.\\/builder_wargear_limited_choices\\.js\\?v=${version}`));
    assert.match(limitedWargearRulesSource, new RegExp(`\\.\\/builder_wargear_limited_cover\\.js\\?v=${version}`));

    const limitedWargearCoverSource = readFileSync(join(outDir, "static", "builder_wargear_limited_cover.js"), "utf8");
    assert.match(limitedWargearCoverSource, new RegExp(`\\.\\/builder_wargear_limited_choices\\.js\\?v=${version}`));

    const warlordRulesSource = readFileSync(join(outDir, "static", "builder_warlord_rules.js"), "utf8");
    assert.match(warlordRulesSource, new RegExp(`\\.\\/builder_warlord_eligibility\\.js\\?v=${version}`));
    assert.match(warlordRulesSource, new RegExp(`\\.\\/builder_warlord_candidates\\.js\\?v=${version}`));
    assert.match(warlordRulesSource, new RegExp(`\\.\\/builder_warlord_selected_rules\\.js\\?v=${version}`));
    assert.match(warlordRulesSource, new RegExp(`\\.\\/builder_warlord_scopes\\.js\\?v=${version}`));

    const warlordSelectedRulesSource = readFileSync(join(outDir, "static", "builder_warlord_selected_rules.js"), "utf8");
    assert.match(warlordSelectedRulesSource, new RegExp(`\\.\\/builder_warlord_eligibility\\.js\\?v=${version}`));
    assert.match(warlordSelectedRulesSource, new RegExp(`\\.\\/builder_warlord_scopes\\.js\\?v=${version}`));

    const warlordCandidatesSource = readFileSync(join(outDir, "static", "builder_warlord_candidates.js"), "utf8");
    assert.match(warlordCandidatesSource, new RegExp(`\\.\\/builder_warlord_eligibility\\.js\\?v=${version}`));

    const attachmentEditorSource = readFileSync(join(outDir, "static", "builder_roster_attachment_editor_view.js"), "utf8");
    assert.match(attachmentEditorSource, new RegExp(`\\.\\/builder_roster_attachment_controls\\.js\\?v=${version}`));
    assert.match(attachmentEditorSource, new RegExp(`\\.\\/builder_roster_attachment_options\\.js\\?v=${version}`));
    assert.match(attachmentEditorSource, new RegExp(`\\.\\/builder_roster_attachment_rows\\.js\\?v=${version}`));

    const attachmentControlsSource = readFileSync(join(outDir, "static", "builder_roster_attachment_controls.js"), "utf8");
    assert.match(attachmentControlsSource, new RegExp(`\\.\\/builder_roster_attachment_control_selects\\.js\\?v=${version}`));
    assert.match(attachmentControlsSource, new RegExp(`\\.\\/builder_roster_actions\\.js\\?v=${version}`));

    const attachmentControlSelectsSource = readFileSync(join(outDir, "static", "builder_roster_attachment_control_selects.js"), "utf8");
    assert.match(attachmentControlSelectsSource, new RegExp(`\\.\\/builder_dom\\.js\\?v=${version}`));
    assert.match(attachmentControlSelectsSource, new RegExp(`\\.\\/builder_roster_attachment_options\\.js\\?v=${version}`));

    const attachmentRowsSource = readFileSync(join(outDir, "static", "builder_roster_attachment_rows.js"), "utf8");
    assert.match(attachmentRowsSource, new RegExp(`\\.\\/builder_roster_attachment_member_view\\.js\\?v=${version}`));
    assert.match(attachmentRowsSource, new RegExp(`\\.\\/builder_roster_attachment_row_model\\.js\\?v=${version}`));
    assert.match(attachmentRowsSource, new RegExp(`\\.\\/builder_unit_images\\.js\\?v=${version}`));

    const attachmentMemberViewSource = readFileSync(join(outDir, "static", "builder_roster_attachment_member_view.js"), "utf8");
    assert.match(attachmentMemberViewSource, new RegExp(`\\.\\/builder_roster_attachment_options\\.js\\?v=${version}`));
    assert.match(attachmentMemberViewSource, new RegExp(`\\.\\/builder_roster_attachment_row_model\\.js\\?v=${version}`));
    assert.match(attachmentMemberViewSource, new RegExp(`\\.\\/builder_unit_images\\.js\\?v=${version}`));

    const attachmentRowModelSource = readFileSync(join(outDir, "static", "builder_roster_attachment_row_model.js"), "utf8");
    assert.match(attachmentRowModelSource, new RegExp(`\\.\\/builder_validation_view\\.js\\?v=${version}`));

    const attachmentOptionsSource = readFileSync(join(outDir, "static", "builder_roster_attachment_options.js"), "utf8");
    assert.match(attachmentOptionsSource, new RegExp(`\\.\\/builder_roster_attachment_candidates\\.js\\?v=${version}`));
    assert.match(attachmentOptionsSource, new RegExp(`\\.\\/builder_roster_attachment_types\\.js\\?v=${version}`));
    assert.match(attachmentOptionsSource, new RegExp(`\\.\\/builder_roster_attachment_unavailable\\.js\\?v=${version}`));

    const attachmentUnavailableSource = readFileSync(join(outDir, "static", "builder_roster_attachment_unavailable.js"), "utf8");
    assert.match(attachmentUnavailableSource, new RegExp(`\\.\\/builder_roster_attachment_candidates\\.js\\?v=${version}`));
    assert.match(attachmentUnavailableSource, new RegExp(`\\.\\/builder_roster_attachment_failures\\.js\\?v=${version}`));

    const attachmentFailuresSource = readFileSync(join(outDir, "static", "builder_roster_attachment_failures.js"), "utf8");
    assert.match(attachmentFailuresSource, new RegExp(`\\.\\/builder_roster_attachment_failure_messages\\.js\\?v=${version}`));
    assert.match(attachmentFailuresSource, new RegExp(`\\.\\/builder_roster_attachment_rule_failures\\.js\\?v=${version}`));

    const attachmentRuleFailuresSource = readFileSync(join(outDir, "static", "builder_roster_attachment_rule_failures.js"), "utf8");
    assert.match(attachmentRuleFailuresSource, new RegExp(`\\.\\/builder_roster_attachment_types\\.js\\?v=${version}`));

    const rosterDetailSource = readFileSync(join(outDir, "static", "builder_roster_detail_view.js"), "utf8");
    assert.match(rosterDetailSource, new RegExp(`\\.\\/builder_roster_overview_view\\.js\\?v=${version}`));
    assert.match(rosterDetailSource, new RegExp(`\\.\\/builder_roster_validation_actions\\.js\\?v=${version}`));

    const rosterOverviewSource = readFileSync(join(outDir, "static", "builder_roster_overview_view.js"), "utf8");
    assert.match(rosterOverviewSource, new RegExp(`\\.\\/builder_roster_warlord_picker\\.js\\?v=${version}`));

    const rosterWarlordPickerSource = readFileSync(join(outDir, "static", "builder_roster_warlord_picker.js"), "utf8");
    assert.match(rosterWarlordPickerSource, new RegExp(`\\.\\/builder_warlord_rules\\.js\\?v=${version}`));

    const rosterValidationActionsSource = readFileSync(join(outDir, "static", "builder_roster_validation_actions.js"), "utf8");
    assert.match(rosterValidationActionsSource, new RegExp(`\\.\\/builder_roster_validation_action_scroll\\.js\\?v=${version}`));
    assert.match(rosterValidationActionsSource, new RegExp(`\\.\\/builder_roster_validation_action_targets\\.js\\?v=${version}`));

    const rosterValidationActionTargetsSource = readFileSync(
      join(outDir, "static", "builder_roster_validation_action_targets.js"),
      "utf8",
    );
    assert.match(rosterValidationActionTargetsSource, new RegExp(`\\.\\/builder_roster_validation_code_action_targets\\.js\\?v=${version}`));
  } finally {
    rmSync(outDir, { force: true, recursive: true });
  }
});

test("static Builder data manifest lists every exported rule file with matching rows and hashes", async () => {
  const response = await fetch("/builder-data/manifest.json");
  assert.equal(response.ok, true);

  const manifest = await response.json();
  const tableCounts = realCatalog.bootstrap.tableCounts;
  const files = new Map(manifest.files.map((entry) => [entry.path, entry]));
  const tableEntries = manifest.files.filter((entry) => entry.path.startsWith("tables/"));

  assert.equal(manifest.exportSchemaVersion, realCatalog.bootstrap.exportSchemaVersion);
  assert.equal(manifest.dataVersion, realCatalog.bootstrap.dataVersion);
  assert.equal(manifest.files.length, 106);
  assert.equal(tableEntries.length, Object.keys(tableCounts).length);
  assert.ok(files.has("bootstrap.json"));
  assert.ok(files.has("precomputed-loadouts.json"));
  assert.ok(files.has("unit-images.json"));
  assert.ok(files.has("audit.json"));

  assert.deepEqual(
    tableEntries.map((entry) => entry.path.replace(/^tables\/|\.json$/g, "")).sort(),
    Object.keys(tableCounts).sort()
  );

  for (const entry of manifest.files) {
    const fileBuffer = await readFile(builderDataPath(entry.path));
    assert.equal(entry.bytes, fileBuffer.length, `${entry.path} byte count changed`);
    assert.equal(entry.sha256, sha256(fileBuffer), `${entry.path} sha256 changed`);
  }

  for (const [tableName] of LOADED_BUILDER_RULE_TABLES) {
    const entry = files.get(`tables/${tableName}.json`);
    assert.ok(entry, `${tableName} should be listed in manifest`);
    assert.equal(entry.rows, tableCounts[tableName], `${tableName} manifest rows should match tableCounts`);
  }
});

test("static Builder data exports compact unit image map", async () => {
  const response = await fetch("/builder-data/unit-images.json");
  assert.equal(response.ok, true);

  const payload = await response.json();
  const abaddon = realCatalog.datasheets.find((datasheet) => datasheet.name === "Abaddon the Despoiler");
  assert.ok(abaddon);
  const filename = payload.imagesByDatasheetId[abaddon.id];

  assert.match(filename, /^abaddon-the-despoiler__[a-f0-9]+__banner\.png$/);
  assert.ok(existsSync(join(projectRoot, "HereticBuilder", "assets", "unit-images", filename)));
});

test("builder data export precomputes bounded loadout fingerprints", () => {
  const outDir = mkdtempSync(join(tmpdir(), "heretic-builder-data-export-"));
  try {
    execFileSync(
      "python3",
      ["HereticBuilder/tools/export_builder_data.py", "--out", outDir],
      { cwd: projectRoot, stdio: "ignore" }
    );
    const bootstrap = JSON.parse(readFileSync(join(outDir, "bootstrap.json"), "utf8"));
    const loadouts = JSON.parse(readFileSync(join(outDir, "precomputed-loadouts.json"), "utf8"));

    assert.equal(bootstrap.precomputedLoadouts, undefined);
    assert.equal(loadouts.maxLoadoutsPerContext, 1000);
    assert.equal(loadouts.contextCount, 1578);
    assert.equal(loadouts.skippedContextCount, 2);
    assert.equal(
      loadouts.contexts.reduce((total, row) => total + row.fingerprints.length, 0),
      9082
    );
    assert.equal(
      loadouts.contexts.filter((row) => row.loadoutChoiceSetIds?.length).length,
      loadouts.contextCount
    );
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});

test("static Builder rule table column lists stay pinned", async () => {
  assert.equal(Object.keys(BUILDER_RULE_TABLE_COLUMNS).length, 73);

  for (const [tableName, expectedColumns] of Object.entries(BUILDER_RULE_TABLE_COLUMNS)) {
    const response = await fetch(`/builder-data/tables/${tableName}.json`);
    assert.equal(response.ok, true, `${tableName} should be exported`);

    const payload = await response.json();
    assert.deepEqual(
      payload.columns.map((column) => column.name),
      expectedColumns,
      `${tableName} column list changed`
    );

    const rowsMissingColumns = (payload.rows || [])
      .map((row, index) => [
        index,
        expectedColumns.filter((columnName) => !Object.hasOwn(row, columnName)),
      ])
      .filter(([, missingColumns]) => missingColumns.length);

    assert.deepEqual(rowsMissingColumns, [], `${tableName} rows should carry all exported columns`);
  }
});

test("battle size export keeps all roster-limit fields in the thin catalog", () => {
  assert.deepEqual(
    realCatalog.battleSizes.map((size) => [
      size.name,
      size.pointsLimit,
      size.detachmentPointsLimit,
      size.enhancementLimit,
      size.duplicateUnitLimit,
    ]),
    [
      ["Incursion", 1000, 2, 2, 2],
      ["Strike Force", 2000, 3, 4, 3],
      ["Onslaught", 3000, 3, 4, 3],
    ]
  );
});
