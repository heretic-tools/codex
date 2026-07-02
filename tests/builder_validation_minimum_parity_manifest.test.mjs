import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { validationConceptForCode } from "./builder_validation_concepts.mjs";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

const minimumParityConceptByCode = {
  "allegiance_ability.group_limit_exceeded": "AllegianceAbilityGroupRosterLimitValidator",
  "allegiance_ability.group_limit_not_reached": "AllegianceAbilityGroupRosterLimitValidator",
  "allegiance_ability.missing_wargear_item": "AllegianceAbilityValidator",
  "allegiance_ability.multiple_selected": "AllegianceAbilityValidator",
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
  "enhancement.model_does_not_have_required_keywords": "EnhancementValidator",
  "enhancement.model_does_not_have_required_wargear": "EnhancementValidator",
  "enhancement.model_must_not_have_excluded_keywords": "EnhancementValidator",
  "enhancement.roster_has_too_many_enhancements": "EnhancementValidator",
  "keyword_restriction_group.limit_exceeded": "KeywordRestrictionGroupValidator",
  "keyword_restriction_group.limit_zero": "KeywordRestrictionGroupValidator",
  "keyword_restriction_group.minimum_not_met": "KeywordRestrictionGroupValidator",
  "mandatory_warlord.detachment_not_selected": "MandatoryWarlordValidator",
  "roster.detachment_points_limit_exceeded": "DetachmentPointsLimitValidator",
  "roster.detachment_unique_keyword_error": "RosterDetachmentValidator",
  "roster.faction_datasheet_not_allowed": "FactionKeywordExcludedDatasheetValidator",
  "roster.successor_chapter_epic_hero_in_roster": "RosterUnitLimitValidator",
  "wargear_loadout.invalid_miniature_wargear_loadout": "InvalidWargearLoadout",
  "wargear_loadout.invalid_wargear_requirement": "InvalidWargearRequirement",
  "wargear_loadout.zero_count_model_wargear": "WargearLoadoutValidator",
  "warlord.invalid_due_to_enhancement": "InvalidWarlordDueToEnhancements",
  "warlord.invalid_generic": "WarlordValidator",
};

const minimumParityCases = [
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
    ],
    codes: ["keyword_restriction_group.limit_zero", "keyword_restriction_group.limit_exceeded"],
  },
  {
    id: "enhancement-roster-limit",
    file: "tests/builder_validation_enhancements.test.mjs",
    anchors: ["enhancement roster, duplicate, and per-unit limits"],
    codes: ["enhancement.roster_has_too_many_enhancements"],
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
    id: "wargear-high-risk-app-parity-manifest",
    file: "tests/builder_validation_wargear_parity_cases.test.mjs",
    anchors: [
      "wargearParityCases.length, 25",
      "cthonian-twin-concussion-gauntlet-limit-valid",
      "cthonian-twin-concussion-gauntlet-over-limit-invalid",
      "officialConcept",
    ],
    codes: [
      "wargear_loadout.invalid_miniature_wargear_loadout",
      "wargear_loadout.invalid_wargear_requirement",
      "wargear_loadout.zero_count_model_wargear",
    ],
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

test("minimum WH app parity suite is mapped to focused Builder tests", async () => {
  assert.equal(minimumParityCases.length, 49);
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

export { minimumParityCases, minimumParityConceptByCode };
