import assert from "node:assert/strict";
import test from "node:test";
import { realCatalog } from "./builder_validation_helpers.mjs";

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

const DATA_EMPTY_RULE_TABLES = [
  ["faction_keyword_mandatory_allegiance_ability", "factionKeywordMandatoryAllegianceAbilities"],
  ["allied_faction_allegiance_ability", "alliedFactionAllegianceAbilities"],
  ["detachment_required_datasheet", "detachmentRequiredDatasheets"],
  ["enhancement_keyword_points_cost", "enhancementKeywordPointsCosts"],
  ["keyword_ally_restricting_keyword", "keywordAllyRestrictingKeywords"],
];

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
