import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { realCatalog } from "./builder_validation_helpers.mjs";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

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

function builderDataPath(path) {
  return join(projectRoot, "dist", "builder-data", path);
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

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

test("static Builder data export audit has no unexpected roster tables", async () => {
  const response = await fetch("/builder-data/audit.json");
  assert.equal(response.ok, true);

  const audit = await response.json();
  assert.equal(audit.integrityCheck, "ok");
  assert.equal(audit.exportedTables.length, Object.keys(realCatalog.bootstrap.tableCounts).length);
  assert.equal(audit.excludedTables.length, 43);
  assert.deepEqual(audit.unexpectedUnexportedTables, []);
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
  assert.equal(manifest.files.length, 104);
  assert.equal(tableEntries.length, Object.keys(tableCounts).length);
  assert.ok(files.has("bootstrap.json"));
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
