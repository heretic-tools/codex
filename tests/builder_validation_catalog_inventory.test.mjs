import assert from "node:assert/strict";
import test from "node:test";
import { realCatalog } from "./builder_validation_helpers.mjs";

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
