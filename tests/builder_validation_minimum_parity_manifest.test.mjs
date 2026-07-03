import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { validationConceptForCode } from "./builder_validation_concepts.mjs";

const currentFile = fileURLToPath(import.meta.url);
const projectRoot = dirname(dirname(currentFile));
const shouldRegisterTests = process.argv.some((arg) => resolve(arg) === currentFile);

const minimumParityConceptByCode = {
  "allegiance_ability.group_limit_exceeded": "AllegianceAbilityGroupRosterLimitValidator",
  "allegiance_ability.group_limit_not_reached": "AllegianceAbilityGroupRosterLimitValidator",
  "allegiance_ability.missing_wargear_item": "AllegianceAbilityValidator",
  "allegiance_ability.multiple_selected": "AllegianceAbilityValidator",
  "allegiance_ability.not_allowed": "AllegianceAbilityValidator",
  "allegiance_ability.not_selected": "AllegianceAbilityValidator",
  "allegiance_ability.required_detachment_missing": "AllegianceAbilityValidator",
  "allied_faction.datasheet_not_allowed": "AlliedFactionDatasheetValidator",
  "allied_faction.not_available": "AlliedFactionValidator",
  "allied_keyword_count.invalid_mutually_exclusive_keywords": "InvalidMutuallyExclusiveKeywords",
  "allied_keyword_count.limit_exceeded": "AlliedKeywordCountValidator",
  "allied_keyword_restricting_keyword.outnumbered_keywords": "KeywordAllyRestrictingKeywordValidator",
  "allied_points.limit_exceeded": "AlliedPointsValidator",
  "allied_unit.required_detachment_not_selected": "AlliedFactionDetachmentValidator",
  "allied_units.required_warlord_missing": "AlliedUnitsRequiredWarlordValidator",
  "attached_unit.incomplete": "RosterAttachedUnitValidator",
  "attached_unit.missing_requirements": "RosterAttachedUnitValidator",
  "attached_unit.must_be_attached": "UnitMustBeAttached",
  "detachment.datasheet_not_allowed": "DetachmentExcludedDatasheetValidator",
  "detachment.linked_datasheet_count_mismatch": "DetachmentRequiredDatasheetValidator",
  "detachment.linked_datasheet_not_allowed": "DetachmentRequiredDatasheetValidator",
  "enhancement.attached_requirement_missing": "EnhancementValidator",
  "enhancement.combat_patrol_multiple_selected": "EnhancementValidator",
  "enhancement.combat_patrol_not_allowed": "EnhancementValidator",
  "enhancement.combat_patrol_required": "EnhancementValidator",
  "enhancement.allied_unit_not_allowed": "EnhancementValidator",
  "enhancement.epic_hero_not_allowed": "EnhancementValidator",
  "enhancement.model_does_not_have_required_keywords": "EnhancementValidator",
  "enhancement.model_does_not_have_required_wargear": "EnhancementValidator",
  "enhancement.model_must_not_have_excluded_keywords": "EnhancementValidator",
  "enhancement.models_have_same_enhancements": "EnhancementValidator",
  "enhancement.roster_has_too_many_enhancements": "EnhancementValidator",
  "enhancement.target_type_invalid": "EnhancementValidator",
  "enhancement.unit_does_not_have_required_keywords": "EnhancementValidator",
  "keyword_restriction_group.limit_exceeded": "KeywordRestrictionGroupValidator",
  "keyword_restriction_group.limit_zero": "KeywordRestrictionGroupValidator",
  "keyword_restriction_group.minimum_not_met": "KeywordRestrictionGroupValidator",
  "mandatory_warlord.detachment_not_selected": "MandatoryWarlordValidator",
  "mandatory_warlord.supreme_commander_not_selected": "SupremeCommanderNotSelected",
  "roster.combat_patrol_datasheet": "RosterUnitValidator",
  "roster.detachment_not_allowed": "RosterDetachmentValidator",
  "roster.detachment_points_limit_exceeded": "DetachmentPointsLimitValidator",
  "roster.detachment_unique_keyword_error": "RosterDetachmentValidator",
  "roster.faction_datasheet_not_allowed": "FactionKeywordExcludedDatasheetValidator",
  "roster.points_limit_exceeded": "RosterPointsValidator",
  "roster.successor_chapter_epic_hero_in_roster": "RosterUnitLimitValidator",
  "roster.unit_limit_exceeded": "RosterUnitLimitValidator",
  "roster.unit_not_native": "RosterUnitValidator",
  "unit.max_model_count_too_many_models": "MaxModelCountValidator",
  "wargear_loadout.invalid_miniature_wargear_loadout": "InvalidWargearLoadout",
  "wargear_loadout.invalid_model_wargear": "WargearLoadoutValidator",
  "wargear_loadout.invalid_unit_wargear": "WargearLoadoutValidator",
  "wargear_loadout.invalid_wargear_requirement": "InvalidWargearRequirement",
  "wargear_loadout.zero_count_model_wargear": "WargearLoadoutValidator",
  "warlord.invalid_due_to_enhancement": "InvalidWarlordDueToEnhancements",
  "warlord.invalid_generic": "WarlordValidator",
};

const minimumParityCases = [
  {
    id: "builder-rule-table-export-counts",
    file: "tests/builder_validation_catalog_inventory.test.mjs",
    anchors: [
      "loaded Builder rule tables match exported table counts",
      "Object.keys(tableCounts).length, 102",
      "LOADED_BUILDER_RULE_TABLES.length, 73",
      "static Builder data export audit has no unexpected roster tables",
      "audit.excludedTables.length, 43",
      "static Builder data manifest lists every exported rule file with matching rows and hashes",
      "manifest.files.length, 104",
      "tableEntries.length, Object.keys(tableCounts).length",
      "entry.sha256",
      "static Builder rule table column lists stay pinned",
      "Object.keys(BUILDER_RULE_TABLE_COLUMNS).length, 73",
      "\"requiresAllUnitsHaveKeywordId\"",
      "\"isCombatPatrolDefault\"",
      "\"duplicateLimit\"",
      "battle size export keeps all roster-limit fields in the thin catalog",
      "[\"Strike Force\", 2000, 3, 4, 3]",
    ],
    codes: [],
  },
  {
    id: "local-official-wh40k-db-roster-rule-table-fingerprints",
    file: "tests/builder_validation_catalog_inventory.test.mjs",
    anchors: [
      "local official WH 40K app DB matches Builder DB for loaded roster rule tables",
      "OFFICIAL_WH40K_APP_DB_PATH",
      "sqliteTableFingerprint",
      "officialFingerprint",
      "builderFingerprint",
    ],
    codes: [],
  },
  {
    id: "saved-wh40k-roster-aggregate-comparison-tool",
    file: "HereticBuilder/tools/compare_wh40k_saved_rosters.mjs",
    anchors: [
      "Read-only comparison of saved WH 40K app roster aggregate validation state",
      "roster_validation_state.validationState as officialState",
      "validateRoster(roster)",
      "builderCodes",
    ],
    codes: [],
  },
  {
    id: "official-validation-storage-aggregate-only",
    file: "tests/builder_validation_catalog_inventory.test.mjs",
    anchors: [
      "local official WH 40K app DB stores only aggregate roster validation state",
      "roster_validation_state",
      "validationStateColumns",
      "%diagnostic%",
    ],
    codes: [],
  },
  {
    id: "saved-wh40k-roster-aggregate-comparison-guard",
    file: "tests/builder_validation_catalog_inventory.test.mjs",
    anchors: [
      "local saved WH 40K app rosters match Builder aggregate validation state",
      "compare_wh40k_saved_rosters.mjs",
      "comparison.match !== true",
      "builderCodes",
    ],
    codes: [],
  },
  {
    id: "official-validation-localization-key-map",
    file: "tests/builder_validation_coverage.test.mjs",
    anchors: [
      "official WH app validation localization keys map to Builder codes",
      "local official WH app validation localization keys stay mapped",
      "OFFICIAL_VALIDATION_KEY_TO_CODE",
      "OFFICIAL_DATASOURCE_VALIDATION_KEY_PATTERN",
    ],
    codes: [],
  },
  {
    id: "thin-client-catalog-path-and-fetch-failure",
    file: "tests/builder_validation_catalog_inventory.test.mjs",
    anchors: [
      "thin client catalog loading keeps path and fetch failure behavior explicit",
      "relative/path",
      "//cdn.example/builder-data/bootstrap.json",
      "\\/builder-data\\/(bootstrap|tables\\/[^/]+)\\.json: 503",
    ],
    codes: [],
  },
  {
    id: "live-allied-rule-table-inventory",
    file: "tests/builder_validation_allied.test.mjs",
    anchors: [
      "all live allied rule tables stay pinned to explicit coverage counts",
      "alliedFactionParentFactionKeywords.length, 25",
      "keywordAllyRestrictingKeywords.length, 0",
      "allyRestrictingKeywordId).length, 4",
    ],
    codes: [],
  },
  {
    id: "native-roster-has-no-allied-diagnostics",
    file: "tests/builder_validation_allied.test.mjs",
    anchors: [
      "allied validation ignores rosters without allied units",
      "native-captain",
      "assert.deepEqual(messages, [])",
    ],
    codes: [],
  },
  {
    id: "live-conditional-keyword-requirements",
    file: "tests/builder_validation_core.test.mjs",
    anchors: [
      "all live conditional keyword rows have satisfied and missing requirement coverage",
      "conditionalKeywords.length, 380",
      "requiredAllegianceAbilityId: 270",
      "requiredRosterFactionKeywordId: 32",
      "requiredDetachmentId: 77",
      "requiredWarlordMiniatureId: 2",
    ],
    codes: [],
  },
  {
    id: "core-required-wargear-item-matcher-edges",
    file: "tests/builder_validation_core.test.mjs",
    anchors: [
      "core wargear item matcher rejects missing options, wrong items, and wrong model targets",
      "missing-option",
      "not-a-wargear-item",
      "wrong-target",
    ],
    codes: [],
  },
  {
    id: "live-allegiance-rule-table-inventory",
    file: "tests/builder_validation_allegiance.test.mjs",
    anchors: [
      "all live allegiance rule tables stay pinned to explicit coverage counts",
      "allegianceAbilityGroups.length, 10",
      "allegianceAbilities.length, 26",
      "factionKeywordMandatoryAllegianceAbilities.length, 0",
      "alliedFactionAllegianceAbilities.length, 0",
    ],
    codes: [],
  },
  {
    id: "live-allegiance-ability-rows",
    file: "tests/builder_validation_allegiance.test.mjs",
    anchors: [
      "all live allegiance ability rows are accepted by their configured group",
      "allegianceAbilities.length, 26",
    ],
    codes: [],
  },
  {
    id: "data-empty-missing-allegiance-group-cache-compat",
    file: "tests/builder_validation_allegiance.test.mjs",
    anchors: [
      "data-empty missing allegiance ability groups stay cache-compatible",
      "cached-missing-allegiance-group-unit",
      "missing-allegiance-group",
      "assert.deepEqual(messages, [])",
    ],
    codes: [],
  },
  {
    id: "live-datasheet-allegiance-group-rows",
    file: "tests/builder_validation_allegiance.test.mjs",
    anchors: [
      "all live datasheet allegiance group rows drive allowed, mandatory, and detachment checks",
      "datasheets.length, 92",
      "allegianceAbilityGroupId)).size, 10",
      "isMandatory).length, 48",
      "detachmentId).length, 87",
      "requiresWargearItemId)).length, 1",
      "validRows, 92",
      "wrongGroupRows, 92",
      "mandatoryRows, 48",
      "detachmentRows, 87",
      "requiredWargearRows, 1",
    ],
    codes: [
      "allegiance_ability.not_allowed",
      "allegiance_ability.not_selected",
      "allegiance_ability.required_detachment_missing",
    ],
  },
  {
    id: "live-enhancement-rule-table-inventory",
    file: "tests/builder_validation_enhancements.test.mjs",
    anchors: [
      "all live enhancement rule tables stay pinned to explicit coverage counts",
      "enhancements.length, 957",
      "enhancementRequiredKeywordGroups.length, 1027",
      "enhancementExcludedKeywords.length, 32",
      "enhancementBodyguardGroups.length, 19",
    ],
    codes: [],
  },
  {
    id: "live-enhancement-core-flag-rows",
    file: "tests/builder_validation_enhancements.test.mjs",
    anchors: [
      "all live enhancement core flag rows have target, eligibility, limit, and roster-limit coverage",
      "enhancements.length, 957",
      "targetTypeInvalidRows, 957",
      "epicAllowedRows, 8",
      "epicBlockedRows, 949",
      "nonCharacterAllowedRows, 78",
      "nonCharacterBlockedRows, 879",
      "limitOneRows, 886",
      "limitThreeRows, 71",
      "validLimitRows, 957",
      "invalidLimitRows, 957",
      "rosterIncludedRows, 948",
      "rosterExcludedRows, 9",
    ],
    codes: [
      "enhancement.target_type_invalid",
      "enhancement.epic_hero_not_allowed",
      "enhancement.unit_does_not_have_required_keywords",
      "enhancement.models_have_same_enhancements",
      "enhancement.roster_has_too_many_enhancements",
    ],
  },
  {
    id: "live-allied-faction-enhancement-permission-rows",
    file: "tests/builder_validation_enhancements.test.mjs",
    anchors: [
      "all live allied faction enhancement permissions allow or reject allied enhancement selections",
      "alliedFactions.length, 21",
      "canTakeEnhancements).length, 5",
      "canTakeEnhancements === false).length, 16",
      "allowedRows, 5",
      "blockedRows, 16",
    ],
    codes: ["enhancement.allied_unit_not_allowed"],
  },
  {
    id: "live-enhancement-excluded-keyword-rows",
    file: "tests/builder_validation_enhancements.test.mjs",
    anchors: [
      "all live enhancement excluded keyword rows reject and accept target keywords",
      "rows.length, 32",
    ],
    codes: ["enhancement.model_must_not_have_excluded_keywords"],
  },
  {
    id: "live-enhancement-required-wargear-rows",
    file: "tests/builder_validation_enhancements.test.mjs",
    anchors: [
      "all live enhancement required wargear rows require and accept configured items",
      "rows.length, 1",
    ],
    codes: ["enhancement.model_does_not_have_required_wargear"],
  },
  {
    id: "live-enhancement-bodyguard-groups",
    file: "tests/builder_validation_enhancements.test.mjs",
    anchors: [
      "all live enhancement bodyguard groups have missing, wrong, and attached coverage",
      "groups.length, 19",
      "enhancementBodyguardGroupDatasheets.length, 19",
      "enhancementBodyguardGroupKeywords.length, 0",
    ],
    codes: ["enhancement.attached_requirement_missing"],
  },
  {
    id: "live-enhancement-bodyguard-type-rows",
    file: "tests/builder_validation_enhancements.test.mjs",
    anchors: [
      "all live enhancement bodyguard groups require their configured leader or support type",
      "groups.length, 19",
      "bodyguardType === \"leader\").length, 19",
      "bodyguardType === \"support\").length, 0",
      "leaderRows, 19",
      "supportRows, 0",
      "validRows, 19",
      "wrongTypeRows, 19",
    ],
    codes: ["enhancement.attached_requirement_missing"],
  },
  {
    id: "data-empty-enhancement-bodyguard-faction-gates",
    file: "tests/builder_validation_enhancements.test.mjs",
    anchors: [
      "data-empty enhancement bodyguard faction gates stay covered",
      "enhancementBodyguardGroups.filter((group) => group.factionKeywordId).length, 0",
      "wrongFaction: true",
    ],
    codes: ["enhancement.attached_requirement_missing"],
  },
  {
    id: "live-enhancement-required-keyword-groups",
    file: "tests/builder_validation_enhancements.test.mjs",
    anchors: [
      "all live enhancement required keyword groups have valid and missing requirement coverage",
      "groups.length, 1027",
      "groupsWithKeywords.length, 578",
      "groupsWithFactions.length, 639",
      "groupsWithDatasheets.length, 83",
    ],
    codes: ["enhancement.model_does_not_have_required_keywords"],
  },
  {
    id: "heretic-astartes-daemon-allies-points",
    file: "tests/builder_validation_allied.test.mjs",
    anchors: [
      "Heretic Astartes Legiones Daemonica allies",
      "daemon-points-under-cap",
      "daemon-points-over-cap",
    ],
    codes: ["allied_points.limit_exceeded"],
  },
  {
    id: "live-allied-points-limits",
    file: "tests/builder_validation_allied.test.mjs",
    anchors: [
      "all live allied faction points limits have valid and invalid coverage",
      "alliedFactionPointsLimits.length, 39",
    ],
    codes: ["allied_points.limit_exceeded"],
  },
  {
    id: "live-faction-allied-faction-rows",
    file: "tests/builder_validation_allied.test.mjs",
    anchors: [
      "all live faction allied faction rows have available and unavailable coverage",
      "factionKeywordAlliedFactions.length, 87",
    ],
    codes: ["allied_faction.not_available"],
  },
  {
    id: "live-allied-faction-datasheet-rows",
    file: "tests/builder_validation_allied.test.mjs",
    anchors: [
      "all live allied faction datasheet rows have allowed and disallowed coverage",
      "alliedFactionDatasheets.length, 320",
    ],
    codes: ["allied_faction.datasheet_not_allowed"],
  },
  {
    id: "live-allied-keyword-limits",
    file: "tests/builder_validation_allied.test.mjs",
    anchors: [
      "all live allied faction keyword limits have valid and invalid coverage",
      "alliedFactionKeywords.length, 54",
      "requiredWarlordMiniatureId).length, 0",
    ],
    codes: ["allied_keyword_count.limit_exceeded"],
  },
  {
    id: "data-empty-allied-keyword-required-warlord-limits",
    file: "tests/builder_validation_allied.test.mjs",
    anchors: [
      "data-empty allied faction keyword required warlord limits stay covered",
      "requiredWarlordMiniatureId).length, 0",
      "requiredWarlordMiniatureId: \"required-warlord\"",
      "warlord-gated-keyword-limit",
    ],
    codes: ["allied_keyword_count.limit_exceeded"],
  },
  {
    id: "live-allied-mutually-exclusive-keyword-buckets",
    file: "tests/builder_validation_allied.test.mjs",
    anchors: [
      "all live mutually exclusive allied keyword buckets reject mixed active keyword groups",
      "mutuallyExclusiveBuckets.length, 12",
    ],
    codes: ["allied_keyword_count.invalid_mutually_exclusive_keywords"],
  },
  {
    id: "live-allied-slotless-keyword-groups",
    file: "tests/builder_validation_allied.test.mjs",
    anchors: [
      "all live allied slotless keyword groups reduce receiver keyword counts",
      "alliedFactionKeywordSlotlessKeywordGroups.length, 12",
    ],
    codes: ["allied_keyword_count.limit_exceeded"],
  },
  {
    id: "data-empty-allied-edge-rows",
    file: "tests/builder_validation_allied.test.mjs",
    anchors: [
      "data-empty allied edge rows cover global restrictions, duplicate restrictions, and malformed slotless groups",
      "keywordAllyRestrictingKeywords.length, 0",
      "slotless-no-donor",
      "slotless-no-receiver",
      "allyRestrictingFactionKeywordId: \"\"",
    ],
    codes: [
      "allied_keyword_count.limit_exceeded",
      "allied_keyword_restricting_keyword.outnumbered_keywords",
    ],
  },
  {
    id: "heretic-astartes-daemon-outnumbering",
    file: "tests/builder_validation_allied.test.mjs",
    anchors: [
      "Heretic Astartes Legiones Daemonica allies",
      "khorne-daemon-outnumbering",
      "nurgle-daemon-outnumbering",
      "slaanesh-daemon-outnumbering",
      "tzeentch-daemon-outnumbering",
    ],
    codes: ["allied_keyword_restricting_keyword.outnumbered_keywords"],
  },
  {
    id: "live-legacy-allied-restricting-keyword-rows",
    file: "tests/builder_validation_allied.test.mjs",
    anchors: [
      "all live legacy allied restricting keyword rows have invalid and paired coverage",
      "legacyRestrictingKeywords.length, 4",
    ],
    codes: ["allied_keyword_restricting_keyword.outnumbered_keywords"],
  },
  {
    id: "heretic-astartes-chaos-knights-cap",
    file: "tests/builder_validation_allied.test.mjs",
    anchors: ["Heretic Astartes Chaos Knights allies"],
    codes: ["allied_keyword_count.limit_exceeded", "allied_keyword_count.invalid_mutually_exclusive_keywords"],
  },
  {
    id: "heretic-astartes-cult-legion-detachment",
    file: "tests/builder_validation_allied.test.mjs",
    anchors: [
      "Heretic Astartes cult legion allies require one configured detachment",
      "Death Guard",
      "Thousand Sons",
      "World Eaters",
      "Emperor’s Children",
    ],
    codes: ["allied_unit.required_detachment_not_selected"],
  },
  {
    id: "live-allied-required-detachment-rows",
    file: "tests/builder_validation_allied.test.mjs",
    anchors: [
      "all live allied required detachment rows have missing and selected coverage",
      "alliedFactionRequiredDetachments.length, 29",
    ],
    codes: ["allied_unit.required_detachment_not_selected"],
  },
  {
    id: "live-allied-allowed-warlord-rows",
    file: "tests/builder_validation_allied.test.mjs",
    anchors: [
      "all live allied allowed warlord rows have missing and selected coverage",
      "alliedFactionAllowedWarlordMiniatures.length, 28",
    ],
    codes: ["allied_units.required_warlord_missing"],
  },
  {
    id: "data-empty-allied-faction-top-level-requirement-fields",
    file: "tests/builder_validation_allied.test.mjs",
    anchors: [
      "data-empty allied faction top-level required detachment and warlord fields stay covered",
      "requiredDetachmentId).length, 0",
      "requiredWarlordMiniatureId).length, 0",
      "requiredDetachmentId: \"required-detachment\"",
      "requiredWarlordMiniatureId: \"required-warlord\"",
    ],
    codes: ["allied_unit.required_detachment_not_selected", "allied_units.required_warlord_missing"],
  },
  {
    id: "heretic-astartes-titanicus-traitoris-cap",
    file: "tests/builder_validation_allied.test.mjs",
    anchors: ["Heretic Astartes Titanicus Traitoris allies"],
    codes: ["allied_keyword_count.limit_exceeded"],
  },
  {
    id: "adeptus-astartes-detachment-dp-overrides",
    file: "tests/builder_validation_factions.test.mjs",
    anchors: [
      "Adeptus Astartes chapter detachment point overrides",
      "Black Templars",
      "Blood Angels",
      "Deathwatch",
      "Stormlance Task Force",
      "Bastion Task Force",
    ],
    codes: ["roster.detachment_points_limit_exceeded"],
  },
  {
    id: "live-detachment-unique-keyword-groups",
    file: "tests/builder_validation_roster_restrictions.test.mjs",
    anchors: [
      "all live detachment unique keyword groups have valid and invalid coverage",
      "detachmentUniqueKeywords.length, 57",
      "rowsByKeywordId.size, 27",
    ],
    codes: ["roster.detachment_unique_keyword_error"],
  },
  {
    id: "live-datasheet-exclusion-rows",
    file: "tests/builder_validation_roster_restrictions.test.mjs",
    anchors: [
      "all live datasheet exclusion rows have valid and invalid coverage",
      "detachmentExcludedDatasheets.length, 23",
      "factionExcludedDatasheets.length, 23",
    ],
    codes: ["detachment.datasheet_not_allowed", "roster.faction_datasheet_not_allowed"],
  },
  {
    id: "live-combat-patrol-linked-datasheets",
    file: "tests/builder_validation_roster_restrictions.test.mjs",
    anchors: [
      "all live Combat Patrol linked datasheet rows have exact roster coverage",
      "detachmentLinkedDatasheets.length, 107",
      "rowsByDetachmentId.size, 24",
    ],
    codes: ["detachment.linked_datasheet_count_mismatch", "detachment.linked_datasheet_not_allowed"],
  },
  {
    id: "adeptus-astartes-successor-epic-hero-conflict",
    file: "tests/builder_validation_factions.test.mjs",
    anchors: ["successor chapter Epic Heroes conflict"],
    codes: ["roster.successor_chapter_epic_hero_in_roster"],
  },
  {
    id: "ynnari-devoted-of-ynnead-warlord",
    file: "tests/builder_validation_factions.test.mjs",
    anchors: ["Devoted of Ynnead requires Yvraine or the Yncarne as Warlord"],
    codes: ["mandatory_warlord.detachment_not_selected"],
  },
  {
    id: "live-detachment-warlord-rows",
    file: "tests/builder_validation_roster_restrictions.test.mjs",
    anchors: [
      "all live detachment warlord rows have valid and invalid coverage",
      "detachmentMandatoryWarlordMiniatures.length, 2",
      "detachmentGrantedWarlordMiniatures.length, 1",
    ],
    codes: ["mandatory_warlord.detachment_not_selected", "warlord.invalid_generic"],
  },
  {
    id: "live-warlord-miniature-flag-rows",
    file: "tests/builder_validation_roster_restrictions.test.mjs",
    anchors: [
      "all live warlord miniature flags have valid and invalid coverage",
      "supremeCommanders.length, 17",
      "cannotBeWarlords.length, 27",
      "nonCharacterWarlords.length, 8",
      "detachmentGrantedWarlordMiniatures.length, 1",
      "supremeInvalidRows, 17",
      "supremeValidRows, 17",
      "cannotRows, 27",
      "grantedRows, 1",
      "nonCharacterRows, 8",
    ],
    codes: [
      "mandatory_warlord.supreme_commander_not_selected",
      "warlord.invalid_generic",
    ],
  },
  {
    id: "live-detachment-faction-cost-disposition-rows",
    file: "tests/builder_validation_roster_restrictions.test.mjs",
    anchors: [
      "all live detachment faction, cost, and disposition rows are applied",
      "detachments.length, 290",
      "rows.length, 457",
      "detachmentFactionPointCosts.length, 4",
      "detachmentForceDispositions.length, 290",
      "forceDispositions.length, 5",
      "allowedRows, 457",
      "unavailableControlRows, 457",
      "listedRows, 433",
      "combatPatrolHiddenRows, 24",
      "overrideRows, 4",
      "baseCostRows, 453",
    ],
    codes: ["roster.detachment_not_allowed"],
  },
  {
    id: "live-datasheet-faction-native-availability-rows",
    file: "tests/builder_validation_roster_restrictions.test.mjs",
    anchors: [
      "all live datasheet faction rows drive native validation and availability",
      "rows.length, 1256",
      "datasheets.length, 1142",
      "datasheetId)).size, 1141",
      "factionKeywordId)).size, 42",
      "factionExcludedDatasheets.length, 23",
      "nativeRows, 1140",
      "descendantBlockedRows, 115",
      "excludedRows, 1",
      "combatPatrolRows, 122",
      "nativeNonCombatListedRows, 1034",
      "unavailableControlRows, 1256",
      "unavailableControlRejectedRows, 1256",
    ],
    codes: [
      "roster.combat_patrol_datasheet",
      "roster.faction_datasheet_not_allowed",
      "roster.unit_not_native",
    ],
  },
  {
    id: "live-battle-size-roster-limits",
    file: "tests/builder_validation_roster_restrictions.test.mjs",
    anchors: [
      "all live battle sizes drive roster points, detachment points, duplicate, and enhancement limits",
      "battleSizes.length, 3",
      "[\"Incursion\", 1000, 2, 2, 2]",
      "[\"Strike Force\", 2000, 3, 3, 4]",
      "[\"Onslaught\", 3000, 3, 3, 4]",
    ],
    codes: [
      "enhancement.roster_has_too_many_enhancements",
      "roster.detachment_points_limit_exceeded",
      "roster.points_limit_exceeded",
      "roster.unit_limit_exceeded",
    ],
  },
  {
    id: "data-empty-model-helper-cache-routing",
    file: "tests/builder_validation_roster_restrictions.test.mjs",
    anchors: [
      "data-empty model helper edge rows keep cached roster data routable",
      "test-equivalent-specific-default",
      "test-fallback-detachment-default",
      "Allied: Allied",
      "1-2 model",
    ],
    codes: [],
  },
  {
    id: "live-datasheet-duplicate-limit-and-max-model-rows",
    file: "tests/builder_validation_roster_restrictions.test.mjs",
    anchors: [
      "all live datasheet duplicate-limit and max-model rows have valid and invalid coverage",
      "datasheetIsCombatPatrol(datasheet)).length, 1035",
      "epicHeroDatasheets.length, 151",
      "battlelineDatasheets.length, 61",
      "dedicatedTransportDatasheets.length, 36",
      "sixLimitDatasheets.length, 97",
      "standardDatasheets.length, 787",
      "maxModelDatasheets.length, 8",
      "validDuplicateRows, 1035",
      "invalidDuplicateRows, 1035",
      "validMaxModelRows, 8",
      "invalidMaxModelRows, 8",
    ],
    codes: [
      "roster.unit_limit_exceeded",
      "unit.max_model_count_too_many_models",
    ],
  },
  {
    id: "live-unit-composition-rows",
    file: "tests/builder_validation_roster_restrictions.test.mjs",
    anchors: [
      "all live unit composition rows have available, unavailable, and miniature-shape coverage",
      "compositions.length, 1516",
      "miniatureRows.length, 2258",
      "requiredFactionRows.length, 51",
      "requiredDetachmentRows.length, 8",
      "availableRows, 1516",
      "factionUnavailableRows, 51",
      "detachmentUnavailableRows, 8",
      "generatedMiniatureRows, 2258",
      "minCountTotal, 4933",
      "maxCountTotal, 5759",
    ],
    codes: [],
  },
  {
    id: "live-datasheet-points-steps",
    file: "tests/builder_validation_roster_restrictions.test.mjs",
    anchors: [
      "all live datasheet points steps apply from the configured duplicate position",
      "rows.length, 334",
      "stepAt || 0) === 2).length, 95",
      "stepAt || 0) === 3).length, 234",
      "stepAt || 0) === 4).length, 5",
      "beforeThresholdRows, 578",
      "appliedThresholdRows, 668",
      "appliedStepPointsTotal, 10790",
    ],
    codes: [],
  },
  {
    id: "asuryani-ynnari-keyword-restrictions",
    file: "tests/builder_validation_factions.test.mjs",
    anchors: ["Aeldari keyword restriction groups cover Asuryani/Ynnari exclusions and Drukhari limits"],
    codes: ["keyword_restriction_group.limit_zero"],
  },
  {
    id: "drukhari-harlequin-character-limits",
    file: "tests/builder_validation_factions.test.mjs",
    anchors: [
      "Aeldari keyword restriction groups cover Asuryani/Ynnari exclusions and Drukhari limits",
      "Drukhari",
      "Death Jester",
      "death-jester-2",
    ],
    codes: ["keyword_restriction_group.limit_exceeded"],
  },
  {
    id: "live-top-level-keyword-restriction-limits",
    file: "tests/builder_validation_factions.test.mjs",
    anchors: [
      "all live top-level keyword restriction limits have valid and invalid coverage",
      "limitedGroups.length, 15",
      "requiresWarlordMiniatureId).length, 0",
    ],
    codes: ["keyword_restriction_group.limit_zero", "keyword_restriction_group.limit_exceeded"],
  },
  {
    id: "data-empty-warlord-gated-keyword-restriction-groups",
    file: "tests/builder_validation_factions.test.mjs",
    anchors: [
      "data-empty warlord-gated keyword restriction groups stay covered",
      "requiresWarlordMiniatureId).length, 0",
      "warlord-gated-keyword-restriction-limit",
      "warlord-gated-keyword-restriction-zero",
    ],
    codes: ["keyword_restriction_group.limit_zero", "keyword_restriction_group.limit_exceeded"],
  },
  {
    id: "data-empty-keywordless-restriction-groups",
    file: "tests/builder_validation_factions.test.mjs",
    anchors: [
      "data-empty keyword restriction groups without keywords stay inactive",
      "empty-keyword-restriction-group",
      "empty-keyword-detachment-limit",
    ],
    codes: [],
  },
  {
    id: "enhancement-roster-limit",
    file: "tests/builder_validation_enhancements.test.mjs",
    anchors: ["enhancement roster, duplicate, and per-unit limits"],
    codes: ["enhancement.roster_has_too_many_enhancements"],
  },
  {
    id: "live-combat-patrol-enhancement-defaults",
    file: "tests/builder_validation_enhancements.test.mjs",
    anchors: [
      "all live Combat Patrol enhancement defaults require exactly one default and reject alternatives",
      "combatPatrolDetachments.length, 24",
      ")).length, 48",
      "enhancement.isCombatPatrolDefault).length, 24",
      "requiredRows, 24",
      "duplicateRows, 24",
      "alternateRows, 24",
    ],
    codes: [
      "enhancement.combat_patrol_required",
      "enhancement.combat_patrol_multiple_selected",
      "enhancement.combat_patrol_not_allowed",
    ],
  },
  {
    id: "enhancement-required-keyword-excluded-keyword-wargear",
    file: "tests/builder_validation_enhancements.test.mjs",
    anchors: ["enhancements enforce required keywords, excluded keywords, and required wargear"],
    codes: [
      "enhancement.model_does_not_have_required_keywords",
      "enhancement.model_must_not_have_excluded_keywords",
      "enhancement.model_does_not_have_required_wargear",
    ],
  },
  {
    id: "enhancement-disciple-of-khorne-warlord-target",
    file: "tests/builder_validation_enhancements.test.mjs",
    anchors: ["cannotBeWarlord miniature enhancement only blocks the enhanced warlord model"],
    codes: ["warlord.invalid_due_to_enhancement"],
  },
  {
    id: "attachment-valid-invalid-and-must-attach",
    file: "tests/builder_validation_attachments.test.mjs",
    anchors: [
      "attachment groups validate incomplete, duplicate, and invalid pairings",
      "leader-without-bodyguard",
      "support-without-bodyguard",
      "bodyguard-without-attached-model",
      "invalid-support-group",
      "duplicate-a",
    ],
    codes: ["attached_unit.must_be_attached", "attached_unit.incomplete", "attached_unit.missing_requirements"],
  },
  {
    id: "live-datasheet-bodyguard-rule-table-inventory",
    file: "tests/builder_validation_attachments.test.mjs",
    anchors: [
      "all live datasheet bodyguard rule tables stay pinned to explicit coverage counts",
      "groups.length, 1266",
      "datasheetBodyguardGroupDatasheets.length, 1260",
      "datasheetBodyguardGroupKeywords.length, 14",
    ],
    codes: [],
  },
  {
    id: "live-datasheet-bodyguard-groups",
    file: "tests/builder_validation_attachments.test.mjs",
    anchors: [
      "all live datasheet bodyguard groups accept configured bodyguards and reject invalid bodyguards",
      "groups.length, 1266",
    ],
    codes: ["attached_unit.missing_requirements"],
  },
  {
    id: "live-datasheet-bodyguard-type-rows",
    file: "tests/builder_validation_attachments.test.mjs",
    anchors: [
      "all live datasheet bodyguard groups require their configured leader or support type",
      "groups.length, 1266",
      "bodyguardType === \"leader\").length, 1056",
      "bodyguardType === \"support\").length, 210",
      "leaderRows, 1056",
      "supportRows, 210",
      "validRows, 1266",
      "wrongTypeRows, 1266",
    ],
    codes: ["attached_unit.missing_requirements"],
  },
  {
    id: "live-datasheet-bodyguard-detachment-keyword-conditions",
    file: "tests/builder_validation_attachments.test.mjs",
    anchors: [
      "all live datasheet bodyguard detachment and shared-keyword conditions reject missing states",
      "requiredDetachmentGroups.length, 305",
      "excludedDetachmentGroups.length, 61",
      "sharedKeywordGroups.length, 305",
      "keywordGroups.length, 6",
    ],
    codes: ["attached_unit.missing_requirements"],
  },
  {
    id: "data-empty-datasheet-bodyguard-faction-gates",
    file: "tests/builder_validation_attachments.test.mjs",
    anchors: [
      "data-empty datasheet bodyguard faction gates stay covered",
      "datasheetBodyguardGroups.filter((group) => group.factionKeywordId).length, 0",
      "faction-gated-datasheet-bodyguard",
    ],
    codes: ["attached_unit.missing_requirements"],
  },
  {
    id: "wargear-high-risk-app-parity-manifest",
    file: "tests/builder_validation_wargear_parity_cases.test.mjs",
    anchors: [
      "wargearParityCases.length, 25",
      "cthonian-twin-concussion-gauntlet-limit-valid",
      "cthonian-twin-concussion-gauntlet-over-limit-invalid",
      "officialConcept",
      "manifest.setupCount, 26",
      "T’au Empire / Advanced Acquisition Cadre / Pathfinder Team",
      "Orks / More Dakka! / Tankbustas",
      "manual WH app wargear UI setup doc tracks every manifest setup",
      "wargear manifest export CLI emits JSON and markdown formats",
    ],
    codes: [
      "wargear_loadout.invalid_miniature_wargear_loadout",
      "wargear_loadout.invalid_wargear_requirement",
      "wargear_loadout.zero_count_model_wargear",
    ],
  },
  {
    id: "wargear-high-risk-app-parity-json-export",
    file: "HereticBuilder/tools/export_wargear_parity_manifest.mjs",
    anchors: [
      "wargearParityManifest",
      "JSON.stringify",
      "--format",
      "markdownOutput",
      "unitWargearSummary",
      "WH app UI setups",
      "WH app state",
      "--check-results",
      "checkResults",
      "resultSummaryStatus",
    ],
    codes: [],
  },
  {
    id: "live-wargear-rule-table-inventory",
    file: "tests/builder_validation_wargear.test.mjs",
    anchors: [
      "all live wargear rule tables stay pinned to explicit coverage counts",
      "wargearItems.length, 3516",
      "loadoutChoiceSets.length, 2445",
      "loadoutChoices.length, 5374",
      "limitedWargearChoiceSets.length, 343",
      "allModelWargearChoiceSets.length, 28",
    ],
    codes: [],
  },
  {
    id: "live-wargear-option-defaults",
    file: "tests/builder_validation_wargear.test.mjs",
    anchors: [
      "all live wargear options generate scoped default selections",
      "unitGroups.length, 19",
      "miniatureGroups.length, 3006",
      "unitOptions.length, 21",
      "miniatureOptions.length, 6301",
      "unitDefaultRows, 5",
      "miniatureDefaultRows, 3690",
      "miniatureDefaultTotal, 6821",
    ],
    codes: [],
  },
  {
    id: "live-wargear-option-scope-and-points",
    file: "tests/builder_validation_wargear.test.mjs",
    anchors: [
      "all live wargear options validate target scope and selected points",
      "wargearOptions.length, 6322",
      "validUnitScopeRows, 21",
      "validMiniatureScopeRows, 6301",
      "invalidUnitScopeRows, 6301",
      "invalidMiniatureScopeRows, 21",
      "paidOptionRows, 83",
      "selectedPointsTotal, 1492",
    ],
    codes: ["wargear_loadout.invalid_unit_wargear", "wargear_loadout.invalid_model_wargear"],
  },
  {
    id: "live-regular-loadout-choice-sets",
    file: "tests/builder_validation_wargear.test.mjs",
    anchors: [
      "all live regular loadout choice sets generate valid and invalid coverage",
      "sets.length, 2445",
      "loadoutChoices.length, 5374",
      "loadoutChoiceWargearItems.length, 8325",
      "generatedLoadoutCount, 6209",
    ],
    codes: [],
  },
  {
    id: "live-base-miniature-loadout-rows",
    file: "tests/builder_validation_wargear.test.mjs",
    anchors: [
      "all live base miniature loadout rows generate scoped default wargear",
      "loadouts.length, 1300",
      "rows.length, 3132",
      "emptyLoadouts, 2",
      "directRows, 3115",
      "foreignRows, 17",
      "foreignLoadouts, 8",
    ],
    codes: [],
  },
  {
    id: "live-limited-wargear-choices-and-limits",
    file: "tests/builder_validation_wargear.test.mjs",
    anchors: [
      "all live limited wargear choices and limits accept valid selections and reject over-limit selections",
      "sets.length, 343",
      "choices.length, 569",
      "limitedWargearChoiceWargearItems.length, 676",
      "limits.length, 492",
      "acceptedChoiceRows, 541",
      "disabledChoiceRows, 26",
      "invalidLimitRows, 492",
    ],
    codes: ["wargear_loadout.invalid_wargear_requirement"],
  },
  {
    id: "live-all-model-wargear-choice-sets",
    file: "tests/builder_validation_wargear.test.mjs",
    anchors: [
      "all live all-model wargear choices and sets accept complete selections and reject incomplete selections",
      "sets.length, 28",
      "choices.length, 63",
      "allModelWargearChoiceWargearItems.length, 69",
      "baseChoices.length, 44",
      "substituteChoices.length, 19",
      "acceptedBaseRows, 44",
      "acceptedSubstituteRows, 16",
      "acceptedStandaloneSubstituteRows, 3",
      "underfilledSetRows, 27",
      "baseConflictSetRows, 16",
      "missingBaseSubstituteRows, 16",
    ],
    codes: ["wargear_loadout.invalid_wargear_requirement"],
  },
  {
    id: "data-empty-wargear-loadout-math-edges",
    file: "tests/builder_validation_wargear.test.mjs",
    anchors: [
      "data-empty wargear loadout math edge rows stay covered",
      "test-zero-limit-loadout-set",
      "test-empty-regular-loadout-set",
      "test-over-limit-loadout-set",
      "name:exact duplicate bridge",
    ],
    codes: [],
  },
  {
    id: "data-empty-wargear-requirement-edge-rows",
    file: "tests/builder_validation_wargear.test.mjs",
    anchors: [
      "data-empty wargear requirement edge rows stay covered",
      "duplicate-vector",
      "test-empty-all-model-set",
      "wargear_loadout.invalid_wargear_requirement",
    ],
    codes: ["wargear_loadout.invalid_wargear_requirement"],
  },
  {
    id: "allegiance-pactbound-mark-of-chaos",
    file: "tests/builder_validation_allegiance.test.mjs",
    anchors: ["Pactbound Zealots Mark of Chaos"],
    codes: [
      "allegiance_ability.not_selected",
      "allegiance_ability.multiple_selected",
      "allegiance_ability.required_detachment_missing",
    ],
  },
  {
    id: "live-mandatory-allegiance-groups",
    file: "tests/builder_validation_allegiance.test.mjs",
    anchors: [
      "all live mandatory allegiance groups require one selection and reject multiples",
      "mandatoryGroups.length, 5",
    ],
    codes: ["allegiance_ability.not_selected", "allegiance_ability.multiple_selected"],
  },
  {
    id: "live-detachment-scoped-allegiance-groups",
    file: "tests/builder_validation_allegiance.test.mjs",
    anchors: [
      "all live detachment-scoped allegiance groups require their detachment",
      "detachmentGroups.length, 7",
    ],
    codes: ["allegiance_ability.required_detachment_missing"],
  },
  {
    id: "allegiance-daemonic-required-wargear",
    file: "tests/builder_validation_allegiance.test.mjs",
    anchors: ["Daemonic Allegiance abilities enforce required wargear"],
    codes: ["allegiance_ability.missing_wargear_item"],
  },
  {
    id: "live-required-wargear-allegiance-abilities",
    file: "tests/builder_validation_allegiance.test.mjs",
    anchors: [
      "all live allegiance abilities with required wargear require and accept that wargear",
      "abilities.length, 4",
    ],
    codes: ["allegiance_ability.missing_wargear_item"],
  },
  {
    id: "allegiance-roster-min-max-groups",
    file: "tests/builder_validation_allegiance.test.mjs",
    anchors: [
      "detachment allegiance keyword groups enforce roster min and max limits",
      "Houndpack Lance Keyword",
      "Headhunter Task Force Keywords",
    ],
    codes: ["allegiance_ability.group_limit_not_reached", "allegiance_ability.group_limit_exceeded"],
  },
  {
    id: "live-allegiance-roster-min-max-groups",
    file: "tests/builder_validation_allegiance.test.mjs",
    anchors: [
      "all live allegiance roster min and max groups have valid and invalid coverage",
      "minGroups.length, 1",
      "maxGroups.length, 4",
    ],
    codes: ["allegiance_ability.group_limit_not_reached", "allegiance_ability.group_limit_exceeded"],
  },
  {
    id: "live-detachment-keyword-restriction-limits",
    file: "tests/builder_validation_factions.test.mjs",
    anchors: [
      "all live detachment keyword restriction limits have valid and invalid coverage",
      "limits.length, 7",
    ],
    codes: ["keyword_restriction_group.minimum_not_met", "keyword_restriction_group.limit_exceeded"],
  },
];

const manualMinimumParityCaseIds = [
  "heretic-astartes-daemon-allies-points",
  "heretic-astartes-daemon-outnumbering",
  "heretic-astartes-chaos-knights-cap",
  "heretic-astartes-cult-legion-detachment",
  "heretic-astartes-titanicus-traitoris-cap",
  "adeptus-astartes-detachment-dp-overrides",
  "adeptus-astartes-successor-epic-hero-conflict",
  "ynnari-devoted-of-ynnead-warlord",
  "asuryani-ynnari-keyword-restrictions",
  "drukhari-harlequin-character-limits",
  "enhancement-roster-limit",
  "enhancement-required-keyword-excluded-keyword-wargear",
  "enhancement-disciple-of-khorne-warlord-target",
  "attachment-valid-invalid-and-must-attach",
  "allegiance-pactbound-mark-of-chaos",
  "allegiance-daemonic-required-wargear",
  "allegiance-roster-min-max-groups",
];

function execNodeWithoutParentCoverage(args, options = {}) {
  const childEnv = { ...process.env };
  const childCoverageDir = childEnv.NODE_V8_COVERAGE
    ? mkdtempSync(join(tmpdir(), "heretic-builder-child-coverage-"))
    : null;
  if (childCoverageDir) {
    childEnv.NODE_V8_COVERAGE = childCoverageDir;
  }
  try {
    return execFileSync(process.execPath, args, {
      encoding: "utf8",
      env: childEnv,
      maxBuffer: 128 * 1024 * 1024,
      ...options,
    });
  } finally {
    if (childCoverageDir) {
      rmSync(childCoverageDir, { recursive: true, force: true });
    }
  }
}

if (shouldRegisterTests) {
  test("minimum WH app parity suite is mapped to focused Builder tests", async () => {
    assert.equal(minimumParityCases.length, 90);
    const caseIds = new Set(minimumParityCases.map((parityCase) => parityCase.id));
    assert.equal(manualMinimumParityCaseIds.length, 17);
    for (const manualCaseId of manualMinimumParityCaseIds) {
      assert.ok(caseIds.has(manualCaseId), `manual pending allowlist has unknown case ${manualCaseId}`);
    }
    for (const parityCase of minimumParityCases) {
      const source = await readFile(join(projectRoot, parityCase.file), "utf8");
      for (const anchor of parityCase.anchors) {
        assert.ok(source.includes(anchor), `${parityCase.id} missing anchor ${anchor}`);
      }
      for (const code of parityCase.codes) {
        assert.ok(source.includes(code), `${parityCase.id} missing validation code ${code}`);
        assert.ok(minimumParityConceptByCode[code], `${parityCase.id} missing expected concept for ${code}`);
        assert.equal(
          validationConceptForCode(code),
          minimumParityConceptByCode[code],
          `${parityCase.id} concept mismatch for ${code}`,
        );
      }
    }
  });

  test("manual WH app wargear checklist tracks executable parity cases", async () => {
    const wargearParitySource = await readFile(
      join(projectRoot, "tests/builder_validation_wargear_parity_cases.test.mjs"),
      "utf8",
    );
    const checklist = await readFile(join(projectRoot, "docs/wh40k_app_manual_parity_checklist.md"), "utf8");
    const caseIds = [...wargearParitySource.matchAll(/id: "([^"]+)"/g)].map((match) => match[1]);

    assert.equal(caseIds.length, 25);
    for (const caseId of caseIds) {
      assert.ok(checklist.includes(`\`${caseId}\``), `manual WH app checklist missing ${caseId}`);
    }
  });

  test("manual WH app checklist tracks every minimum parity group", async () => {
    const checklist = await readFile(join(projectRoot, "docs/wh40k_app_manual_parity_checklist.md"), "utf8");
    assert.ok(checklist.includes("## Minimum manifest parity groups"));

    for (const parityCase of minimumParityCases) {
      assert.ok(checklist.includes(`\`${parityCase.id}\``), `manual WH app checklist missing ${parityCase.id}`);
    }

    const exportTool = join(projectRoot, "HereticBuilder", "tools", "export_minimum_parity_manifest.mjs");
    const passPackTool = join(projectRoot, "HereticBuilder", "tools", "export_manual_wh40k_pass_pack.mjs");
    const wargearExportTool = join(projectRoot, "HereticBuilder", "tools", "export_wargear_parity_manifest.mjs");
    const jsonManifest = JSON.parse(execNodeWithoutParentCoverage([exportTool, "--json"]));
    assert.equal(jsonManifest.caseCount, 90);
    assert.equal(jsonManifest.cases[0].id, "builder-rule-table-export-counts");

    const markdown = execNodeWithoutParentCoverage([exportTool, "--format", "markdown"]);
    assert.ok(markdown.startsWith("# WH 40K app minimum parity manifest"));
    assert.ok(markdown.includes("| Case id | Test file | Codes | Concepts | WH app method | WH app result | Parity |"));
    assert.ok(markdown.includes("| `live-allied-rule-table-inventory` | tests/builder_validation_allied.test.mjs | none | none | Pending | Pending | Pending |"));

    const manualSummary = JSON.parse(execNodeWithoutParentCoverage([
      exportTool,
      "--check-results",
      join(projectRoot, "docs/wh40k_app_manual_parity_checklist.md"),
      "--allow-manual-pending-only",
    ]));
    assert.equal(manualSummary.status, "pending");
    assert.equal(manualSummary.expectedRows, 90);
    assert.equal(manualSummary.parsedRows, 90);
    assert.equal(manualSummary.missingRows.length, 0);
    assert.equal(manualSummary.pendingRows.length, 17);
    assert.equal(manualSummary.disallowedPendingRows.length, 0);

    const resultsDir = mkdtempSync(join(tmpdir(), "heretic-builder-minimum-results-"));
    try {
      const pendingResultsPath = join(resultsDir, "pending.md");
      writeFileSync(pendingResultsPath, markdown);
      const pendingSummary = JSON.parse(execNodeWithoutParentCoverage([
        exportTool,
        "--check-results",
        pendingResultsPath,
        "--allow-pending",
      ]));
      assert.equal(pendingSummary.status, "pending");
      assert.equal(pendingSummary.pendingRows.length, 90);
      assert.equal(pendingSummary.disallowedPendingRows.length, 0);

      assert.throws(
        () => execNodeWithoutParentCoverage([
          exportTool,
          "--check-results",
          pendingResultsPath,
          "--allow-manual-pending-only",
        ]),
        (error) => {
          const strictPendingSummary = JSON.parse(error.stdout);
          assert.equal(strictPendingSummary.status, "mismatch");
          assert.equal(strictPendingSummary.pendingRows.length, 90);
          assert.equal(strictPendingSummary.disallowedPendingRows.length, 73);
          return true;
        }
      );

      const filledMarkdown = markdown.split("\n").map((line) => {
        if (!line.startsWith("| `")) {
          return line;
        }
        return line.replace(
          " | Pending | Pending | Pending |",
          " | official app manual pass | agrees with Builder | match |",
        );
      }).join("\n");
      const filledResultsPath = join(resultsDir, "filled.md");
      writeFileSync(filledResultsPath, filledMarkdown);
      const matchSummary = JSON.parse(execNodeWithoutParentCoverage([
        exportTool,
        "--check-results",
        filledResultsPath,
      ]));
      assert.equal(matchSummary.status, "match");
      assert.equal(matchSummary.pendingRows.length, 0);

      const mismatchResultsPath = join(resultsDir, "mismatch.md");
      writeFileSync(
        mismatchResultsPath,
        filledMarkdown.replace(" | official app manual pass | agrees with Builder | match |", " | official app manual pass | agrees with Builder | typo |")
      );
      assert.throws(
        () => execNodeWithoutParentCoverage([exportTool, "--check-results", mismatchResultsPath]),
        (error) => {
          const mismatchSummary = JSON.parse(error.stdout);
          assert.equal(mismatchSummary.status, "mismatch");
          assert.equal(mismatchSummary.invalidParityRows.length, 1);
          return true;
        }
      );

      const passPackJson = JSON.parse(execNodeWithoutParentCoverage([passPackTool, "--json"]));
      assert.equal(passPackJson.minimumManualCaseCount, 17);
      assert.equal(passPackJson.wargearCaseCount, 25);
      assert.equal(passPackJson.wargearSetupCount, 26);
      assert.equal(passPackJson.minimumRows[0].id, "heretic-astartes-daemon-allies-points");
      assert.equal(passPackJson.wargearRows.at(-1).caseId, "invalid-unit-loadout");
      const generatedPassPack = execNodeWithoutParentCoverage([passPackTool, "--format", "markdown"]).trim();
      const passPackPath = join(projectRoot, "docs", "wh40k_app_manual_pass_pack.md");
      const checkedInPassPack = await readFile(passPackPath, "utf8");
      assert.equal(checkedInPassPack.trim(), generatedPassPack);
      const generatedRunbook = execNodeWithoutParentCoverage([passPackTool, "--format", "runbook"]).trim();
      const checkedInRunbook = await readFile(join(projectRoot, "docs", "wh40k_app_manual_runbook.md"), "utf8");
      assert.equal(checkedInRunbook.trim(), generatedRunbook);
      assert.equal(execNodeWithoutParentCoverage([passPackTool, "--runbook"]).trim(), generatedRunbook);
      assert.ok(generatedRunbook.startsWith("# WH 40K app manual runbook"));
      assert.ok(generatedRunbook.includes("Total manual rows: 43"));
      assert.ok(generatedRunbook.includes("| Heretic Astartes allies | 1, 2, 3, 4, 5 |"));
      assert.ok(generatedRunbook.includes("| Leagues of Votann / Armoured Trailblazers | 1, 3, 4, 5, 10 |"));
      assert.ok(generatedRunbook.includes("| T’au Empire / Advanced Acquisition Cadre | 20, 26 |"));
      const generatedStatus = execNodeWithoutParentCoverage([
        passPackTool,
        "--status",
        "--from",
        passPackPath,
        "--format",
        "markdown",
      ]).trim();
      const checkedInStatus = await readFile(join(projectRoot, "docs", "wh40k_app_manual_status.md"), "utf8");
      assert.equal(checkedInStatus.trim(), generatedStatus);
      assert.ok(generatedStatus.startsWith("# WH 40K app manual pass pack status"));
      assert.ok(generatedStatus.includes("Total rows: 43"));
      assert.ok(generatedStatus.includes("Pending: 43"));
      assert.ok(generatedStatus.includes("Action pending: 43"));
      assert.ok(generatedStatus.includes("Next pending batch: Minimum UI / Heretic Astartes allies (rows 1, 2, 3, 4, 5)"));
      const generatedNextAction = execNodeWithoutParentCoverage([
        passPackTool,
        "--next-action",
        "--from",
        passPackPath,
        "--format",
        "markdown",
      ]).trim();
      const checkedInNextAction = await readFile(join(projectRoot, "docs", "wh40k_app_manual_next_action.md"), "utf8");
      assert.equal(checkedInNextAction.trim(), generatedNextAction);
      assert.ok(generatedNextAction.startsWith("# WH 40K app manual next action"));
      assert.ok(generatedNextAction.includes("State: fill-next-batch"));
      assert.ok(generatedNextAction.includes("Pending rows: 43"));
      assert.ok(generatedNextAction.includes("Next batch: Minimum UI / Heretic Astartes allies (rows 1, 2, 3, 4, 5)"));
      assert.ok(generatedNextAction.includes("--extract next-pending-batch"));
      const nextActionJson = JSON.parse(execNodeWithoutParentCoverage([
        passPackTool,
        "--next-action",
        "--from",
        passPackPath,
      ]));
      assert.equal(nextActionJson.state, "fill-next-batch");
      assert.equal(nextActionJson.pendingRows, 43);
      assert.equal(nextActionJson.nextBatch.name, "Heretic Astartes allies");
      const generatedNextBatch = execNodeWithoutParentCoverage([
        passPackTool,
        "--extract",
        "next-pending-batch",
        "--from",
        passPackPath,
      ]).trim();
      const checkedInNextBatch = await readFile(join(projectRoot, "docs", "wh40k_app_manual_next_batch.md"), "utf8");
      assert.equal(checkedInNextBatch.trim(), generatedNextBatch);
      assert.ok(generatedNextBatch.startsWith("# WH 40K app next pending batch"));
      assert.ok(generatedNextBatch.includes("Section: Minimum UI"));
      assert.ok(generatedNextBatch.includes("Batch: Heretic Astartes allies"));
      assert.ok(generatedNextBatch.includes("Pass-pack rows: 1, 2, 3, 4, 5"));
      assert.ok(generatedNextBatch.includes("| 1 | `heretic-astartes-daemon-allies-points` |"));
      const pendingBatchSummary = JSON.parse(execNodeWithoutParentCoverage([
        passPackTool,
        "--check-batch",
        passPackPath.replace("wh40k_app_manual_pass_pack.md", "wh40k_app_manual_next_batch.md"),
        "--from",
        passPackPath,
        "--allow-pending",
      ]));
      assert.equal(pendingBatchSummary.status, "pending");
      assert.equal(pendingBatchSummary.section, "Minimum UI");
      assert.equal(pendingBatchSummary.batch, "Heretic Astartes allies");
      assert.equal(pendingBatchSummary.parsedRows, 5);
      assert.equal(pendingBatchSummary.counts.pending, 5);
      assert.throws(
        () => execNodeWithoutParentCoverage([
          passPackTool,
          "--check-batch",
          passPackPath.replace("wh40k_app_manual_pass_pack.md", "wh40k_app_manual_next_batch.md"),
          "--from",
          passPackPath,
        ]),
        (error) => {
          const pendingSummary = JSON.parse(error.stdout);
          assert.equal(pendingSummary.status, "pending");
          return true;
        }
      );
      const filledMinimumNextBatchPath = join(resultsDir, "filled-minimum-next-batch.md");
      const filledMinimumNextBatch = generatedNextBatch.split("\n").map((line) => {
        if (!line.startsWith("| ") || line.startsWith("| Row") || line.startsWith("| ---")) {
          return line;
        }
        return line.replace(
          " | Pending | Pending | Pending |",
          " | official app agrees | match | none |",
        );
      }).join("\n");
      writeFileSync(filledMinimumNextBatchPath, filledMinimumNextBatch);
      const filledMinimumBatchSummary = JSON.parse(execNodeWithoutParentCoverage([
        passPackTool,
        "--check-batch",
        filledMinimumNextBatchPath,
        "--from",
        passPackPath,
      ]));
      assert.equal(filledMinimumBatchSummary.status, "ready");
      assert.equal(filledMinimumBatchSummary.counts.match, 5);
      assert.equal(filledMinimumBatchSummary.actionTotals.none, 5);
      const mergedFirstBatchPassPack = execNodeWithoutParentCoverage([
        passPackTool,
        "--merge-batch",
        filledMinimumNextBatchPath,
        "--from",
        passPackPath,
      ]);
      const mergedFirstBatchPassPackPath = join(resultsDir, "merged-first-batch-pass-pack.md");
      writeFileSync(mergedFirstBatchPassPackPath, mergedFirstBatchPassPack);
      const mergedFirstBatchSummary = JSON.parse(execNodeWithoutParentCoverage([
        passPackTool,
        "--check-results",
        mergedFirstBatchPassPackPath,
        "--allow-pending",
      ]));
      assert.equal(mergedFirstBatchSummary.status, "pending");
      assert.equal(mergedFirstBatchSummary.minimum.pendingRows.length, 12);
      assert.equal(mergedFirstBatchSummary.wargear.pendingRows.length, 26);
      const mergedFirstBatchNext = execNodeWithoutParentCoverage([
        passPackTool,
        "--extract",
        "next-pending-batch",
        "--from",
        mergedFirstBatchPassPackPath,
      ]);
      assert.ok(mergedFirstBatchNext.includes("Batch: Adeptus Astartes faction rules"));
      const badActionNextBatchPath = join(resultsDir, "bad-action-next-batch.md");
      writeFileSync(
        badActionNextBatchPath,
        filledMinimumNextBatch.replace(" | match | none |", " | match | logic |"),
      );
      assert.throws(
        () => execNodeWithoutParentCoverage([
          passPackTool,
          "--check-batch",
          badActionNextBatchPath,
          "--from",
          passPackPath,
        ]),
        (error) => {
          const mismatchSummary = JSON.parse(error.stdout);
          assert.equal(mismatchSummary.status, "mismatch");
          assert.equal(mismatchSummary.structuralSummary.minimumActionMismatches, 1);
          return true;
        }
      );
      assert.throws(
        () => execNodeWithoutParentCoverage([
          passPackTool,
          "--merge-batch",
          badActionNextBatchPath,
          "--from",
          passPackPath,
        ]),
        (error) => {
          const mismatchSummary = JSON.parse(error.stdout);
          assert.equal(mismatchSummary.status, "mismatch");
          assert.equal(mismatchSummary.minimum.actionMismatches.length, 1);
          return true;
        }
      );
      const generatedActionBacklog = execNodeWithoutParentCoverage([
        passPackTool,
        "--extract",
        "action-backlog",
        "--from",
        passPackPath,
      ]).trim();
      const checkedInActionBacklog = await readFile(join(projectRoot, "docs", "wh40k_app_manual_action_backlog.md"), "utf8");
      assert.equal(checkedInActionBacklog.trim(), generatedActionBacklog);
      assert.ok(generatedActionBacklog.startsWith("# WH 40K app manual action backlog"));
      assert.ok(generatedActionBacklog.includes("Pending rows: 43"));
      assert.ok(generatedActionBacklog.includes("No actionable follow-ups yet."));
      const passPackStatus = JSON.parse(execNodeWithoutParentCoverage([
        passPackTool,
        "--status",
        "--from",
        passPackPath,
      ]));
      assert.equal(passPackStatus.totalRows, 43);
      assert.equal(passPackStatus.totals.pending, 43);
      assert.equal(passPackStatus.totals.match, 0);
      assert.equal(passPackStatus.actionTotals.pending, 43);
      assert.equal(passPackStatus.actionTotals.none, 0);
      assert.equal(passPackStatus.nextPendingBatch.name, "Heretic Astartes allies");

      assert.throws(
        () => execNodeWithoutParentCoverage(
          [passPackTool, "--check-results", passPackPath],
          { stdio: ["ignore", "ignore", "pipe"] },
        ),
        (error) => {
          assert.equal(error.status, 1);
          return true;
        }
      );

      const passPackSummary = JSON.parse(execNodeWithoutParentCoverage([
        passPackTool,
        "--check-results",
        passPackPath,
        "--allow-pending",
      ]));
      assert.equal(passPackSummary.status, "pending");
      assert.equal(passPackSummary.minimum.expectedRows, 17);
      assert.equal(passPackSummary.minimum.parsedRows, 17);
      assert.equal(passPackSummary.minimum.pendingRows.length, 17);
      assert.equal(passPackSummary.minimum.actionMismatches.length, 0);
      assert.equal(passPackSummary.wargear.expectedRows, 26);
      assert.equal(passPackSummary.wargear.parsedRows, 26);
      assert.equal(passPackSummary.wargear.pendingRows.length, 26);
      assert.equal(passPackSummary.wargear.actionMismatches.length, 0);

      let inMinimumOnlyWargearSection = false;
      const minimumOnlyFilledPassPack = generatedPassPack.split("\n").map((line) => {
        if (line.startsWith("## Wargear UI Cases")) {
          inMinimumOnlyWargearSection = true;
          return line;
        }
        if (!inMinimumOnlyWargearSection && line.startsWith("| ") && line.includes(" | Pending | Pending | Pending |")) {
          return line.replace(
            " | Pending | Pending | Pending |",
            " | official app agrees | match | none |",
          );
        }
        return line;
      }).join("\n");
      const minimumOnlyFilledPassPackPath = join(resultsDir, "minimum-only-filled-pass-pack.md");
      writeFileSync(minimumOnlyFilledPassPackPath, minimumOnlyFilledPassPack);
      const wargearNextBatch = execNodeWithoutParentCoverage([
        passPackTool,
        "--extract",
        "next-pending-batch",
        "--from",
        minimumOnlyFilledPassPackPath,
      ]);
      assert.ok(wargearNextBatch.includes("Section: Wargear UI"));
      assert.ok(wargearNextBatch.includes("Batch: Leagues of Votann / Armoured Trailblazers"));
      assert.ok(wargearNextBatch.includes("| 1 | `duplicate-name-cthonian-beserks-default-valid` | valid |"));
      const filledWargearNextBatchPath = join(resultsDir, "filled-wargear-next-batch.md");
      const filledWargearNextBatch = wargearNextBatch.split("\n").map((line) => {
        if (!line.startsWith("| ") || line.startsWith("| Row") || line.startsWith("| ---")) {
          return line;
        }
        const expectedState = line.includes(" | invalid | ") ? "invalid" : "valid";
        return line.replace(
          " | Pending | Pending | Pending | Pending |",
          ` | ${expectedState} | manual app diagnostic | match | none |`,
        );
      }).join("\n");
      writeFileSync(filledWargearNextBatchPath, filledWargearNextBatch);
      const filledWargearBatchSummary = JSON.parse(execNodeWithoutParentCoverage([
        passPackTool,
        "--check-batch",
        filledWargearNextBatchPath,
        "--from",
        minimumOnlyFilledPassPackPath,
      ]));
      assert.equal(filledWargearBatchSummary.status, "ready");
      assert.equal(filledWargearBatchSummary.parsedRows, 5);
      assert.equal(filledWargearBatchSummary.counts.match, 5);
      const mergedWargearBatchPassPack = execNodeWithoutParentCoverage([
        passPackTool,
        "--merge-batch",
        filledWargearNextBatchPath,
        "--from",
        minimumOnlyFilledPassPackPath,
      ]);
      const mergedWargearBatchPassPackPath = join(resultsDir, "merged-wargear-batch-pass-pack.md");
      writeFileSync(mergedWargearBatchPassPackPath, mergedWargearBatchPassPack);
      const mergedWargearBatchSummary = JSON.parse(execNodeWithoutParentCoverage([
        passPackTool,
        "--check-results",
        mergedWargearBatchPassPackPath,
        "--allow-pending",
      ]));
      assert.equal(mergedWargearBatchSummary.status, "pending");
      assert.equal(mergedWargearBatchSummary.minimum.pendingRows.length, 0);
      assert.equal(mergedWargearBatchSummary.wargear.pendingRows.length, 21);
      const mergedWargearBatchNext = execNodeWithoutParentCoverage([
        passPackTool,
        "--extract",
        "next-pending-batch",
        "--from",
        mergedWargearBatchPassPackPath,
      ]);
      assert.ok(mergedWargearBatchNext.includes("Batch: Orks / More Dakka!"));

      let inWargearSection = false;
      const filledPassPack = generatedPassPack.split("\n").map((line) => {
        if (line.startsWith("## Wargear UI Cases")) {
          inWargearSection = true;
          return line;
        }
        if (line.startsWith("## Completion Rule")) {
          inWargearSection = false;
          return line;
        }
        if (!line.startsWith("| ")) {
          return line;
        }
        if (inWargearSection && line.includes(" | Pending | Pending | Pending | Pending |")) {
          const expectedState = line.includes(" | invalid | ") ? "invalid" : "valid";
          return line.replace(
            " | Pending | Pending | Pending | Pending |",
            ` | ${expectedState} | manual app diagnostic | match | none |`,
          );
        }
        if (!inWargearSection && line.includes(" | Pending | Pending |")) {
          return line.replace(
            " | Pending | Pending | Pending |",
            " | official app agrees | match | none |",
          );
        }
        return line;
      }).join("\n");
      const filledPassPackPath = join(resultsDir, "filled-pass-pack.md");
      writeFileSync(filledPassPackPath, filledPassPack);
      const filledPassPackSummary = JSON.parse(execNodeWithoutParentCoverage([
        passPackTool,
        "--check-results",
        filledPassPackPath,
      ]));
      assert.equal(filledPassPackSummary.status, "match");
      assert.equal(filledPassPackSummary.minimum.pendingRows.length, 0);
      assert.equal(filledPassPackSummary.wargear.pendingRows.length, 0);
      const filledStatus = JSON.parse(execNodeWithoutParentCoverage([
        passPackTool,
        "--status",
        "--from",
        filledPassPackPath,
      ]));
      assert.equal(filledStatus.totalRows, 43);
      assert.equal(filledStatus.totals.match, 43);
      assert.equal(filledStatus.totals.pending, 0);
      assert.equal(filledStatus.actionTotals.none, 43);
      assert.equal(filledStatus.actionTotals.pending, 0);
      assert.equal(filledStatus.nextPendingBatch, null);
      const filledNextAction = JSON.parse(execNodeWithoutParentCoverage([
        passPackTool,
        "--next-action",
        "--from",
        filledPassPackPath,
      ]));
      assert.equal(filledNextAction.state, "complete");
      assert.equal(filledNextAction.pendingRows, 0);
      assert.equal(filledNextAction.nextBatch, null);
      const filledNextBatch = execNodeWithoutParentCoverage([
        passPackTool,
        "--extract",
        "next-pending-batch",
        "--from",
        filledPassPackPath,
      ]);
      assert.ok(filledNextBatch.includes("Total pending rows: 0"));
      assert.ok(filledNextBatch.includes("No pending batch."));
      const filledActionBacklog = execNodeWithoutParentCoverage([
        passPackTool,
        "--extract",
        "action-backlog",
        "--from",
        filledPassPackPath,
      ]);
      assert.ok(filledActionBacklog.includes("Pending rows: 0"));
      assert.ok(filledActionBacklog.includes("No actionable follow-ups yet."));

      const extractedMinimumChecklist = execNodeWithoutParentCoverage([
        passPackTool,
        "--extract",
        "minimum-checklist",
        "--from",
        filledPassPackPath,
      ]);
      const extractedMinimumChecklistPath = join(resultsDir, "extracted-minimum-checklist.md");
      writeFileSync(extractedMinimumChecklistPath, extractedMinimumChecklist);
      const extractedMinimumSummary = JSON.parse(execNodeWithoutParentCoverage([
        exportTool,
        "--check-results",
        extractedMinimumChecklistPath,
      ]));
      assert.equal(extractedMinimumSummary.status, "match");
      assert.equal(extractedMinimumSummary.pendingRows.length, 0);
      assert.ok(extractedMinimumChecklist.includes("| `heretic-astartes-daemon-allies-points` | Manual WH app UI:"));
      assert.ok(extractedMinimumChecklist.includes(" | official app agrees | match |"));

      const extractedWargearResults = execNodeWithoutParentCoverage([
        passPackTool,
        "--extract",
        "wargear-results",
        "--from",
        filledPassPackPath,
      ]);
      const extractedWargearResultsPath = join(resultsDir, "extracted-wargear-results.md");
      writeFileSync(extractedWargearResultsPath, extractedWargearResults);
      const extractedWargearSummary = JSON.parse(execNodeWithoutParentCoverage([
        wargearExportTool,
        "--check-results",
        extractedWargearResultsPath,
      ]));
      assert.equal(extractedWargearSummary.status, "match");
      assert.equal(extractedWargearSummary.parsedRows, 26);
      assert.equal(extractedWargearSummary.pendingRows.length, 0);
      assert.ok(extractedWargearResults.startsWith("# WH 40K app wargear parity results"));

      const passPackMismatchPath = join(resultsDir, "mismatch-pass-pack.md");
      writeFileSync(
        passPackMismatchPath,
        filledPassPack.replace(
          " | valid | manual app diagnostic | match | none |",
          " | invalid | manual app diagnostic | mismatch | logic |",
        ),
      );
      assert.throws(
        () => execNodeWithoutParentCoverage([passPackTool, "--check-results", passPackMismatchPath]),
        (error) => {
          const mismatchSummary = JSON.parse(error.stdout);
          assert.equal(mismatchSummary.status, "mismatch");
          assert.equal(mismatchSummary.wargear.stateMismatches.length, 1);
          return true;
        }
      );
      const mismatchActionBacklog = execNodeWithoutParentCoverage([
        passPackTool,
        "--extract",
        "action-backlog",
        "--from",
        passPackMismatchPath,
      ]);
      assert.ok(mismatchActionBacklog.includes("Logic actions: 1"));
      assert.ok(mismatchActionBacklog.includes("| logic | Wargear UI | 1 | `duplicate-name-cthonian-beserks-default-valid` | mismatch |"));
      const mismatchNextAction = JSON.parse(execNodeWithoutParentCoverage([
        passPackTool,
        "--next-action",
        "--from",
        passPackMismatchPath,
      ]));
      assert.equal(mismatchNextAction.state, "work-action-backlog");
      assert.equal(mismatchNextAction.actionTotals.logic, 1);
      assert.equal(mismatchNextAction.pendingRows, 0);
      const passPackActionMismatchPath = join(resultsDir, "action-mismatch-pass-pack.md");
      writeFileSync(
        passPackActionMismatchPath,
        filledPassPack.replace(
          " | valid | manual app diagnostic | match | none |",
          " | invalid | manual app diagnostic | mismatch | none |",
        ),
      );
      assert.throws(
        () => execNodeWithoutParentCoverage([passPackTool, "--check-results", passPackActionMismatchPath]),
        (error) => {
          const mismatchSummary = JSON.parse(error.stdout);
          assert.equal(mismatchSummary.status, "mismatch");
          assert.equal(mismatchSummary.wargear.actionMismatches.length, 1);
          assert.deepEqual(mismatchSummary.wargear.actionMismatches[0].expectedActions, ["logic", "builder-ui"]);
          return true;
        }
      );
      assert.throws(
        () => execNodeWithoutParentCoverage([
          passPackTool,
          "--extract",
          "next-pending-batch",
          "--from",
          passPackActionMismatchPath,
        ]),
        (error) => {
          const mismatchSummary = JSON.parse(error.stdout);
          assert.equal(mismatchSummary.status, "mismatch");
          assert.equal(mismatchSummary.wargear.actionMismatches.length, 1);
          return true;
        }
      );
      assert.throws(
        () => execNodeWithoutParentCoverage([
          passPackTool,
          "--extract",
          "action-backlog",
          "--from",
          passPackActionMismatchPath,
        ]),
        (error) => {
          const mismatchSummary = JSON.parse(error.stdout);
          assert.equal(mismatchSummary.status, "mismatch");
          assert.equal(mismatchSummary.wargear.actionMismatches.length, 1);
          return true;
        }
      );
      assert.throws(
        () => execNodeWithoutParentCoverage([
          passPackTool,
          "--extract",
          "wargear-results",
          "--from",
          passPackMismatchPath,
        ]),
        (error) => {
          const mismatchSummary = JSON.parse(error.stdout);
          assert.equal(mismatchSummary.status, "mismatch");
          assert.equal(mismatchSummary.wargear.stateMismatches.length, 1);
          return true;
        }
      );
    } finally {
      rmSync(resultsDir, { recursive: true, force: true });
    }
  });
}

export { minimumParityCases, minimumParityConceptByCode, manualMinimumParityCaseIds };
