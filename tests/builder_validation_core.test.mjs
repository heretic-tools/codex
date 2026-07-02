import assert from "node:assert/strict";
import test from "node:test";
import {
  state,
  costForDetachment,
  defaultMiniatures,
  defaultWargear,
  conditionalKeywordApplies,
  factionScope,
  enhancementPoints,
  unitSummary,
  validateAllegianceAbilities,
  validateAlliedUnits,
  validateAttachedUnits,
  validateEnhancements,
  validateDetachmentDatasheets,
  validateDetachmentUniqueKeywords,
  validateKeywordRestrictions,
  validateSuccessorChapterEpicHeroes,
  validateUnitCompositions,
  validateRoster,
  validateWargearLoadouts,
  validateWarlord,
  realCatalog,
  withCatalog,
  messageCodes,
  rowNamed,
  factionNamed,
  battleSizeNamed,
  detachmentNamed,
  keywordNamed,
  miniatureNamed,
  datasheetNamed,
  combatPatrolDatasheetNamed,
  rosterUnitRef,
  rosterUnitFromDatasheetId,
  enhancementNamed,
  miniatureNamedForDatasheet,
  datasheetNamedForAlly,
  keywordIdsForDatasheet,
  alliedFactionWithParent,
  alliedFactionForRosterAndParent,
  alliedUnit,
  alliedUnitWarlord,
  allegianceGroup,
  allegianceAbility,
  allegianceAbilityWithRequiredWargear,
  allegianceUnit,
  defaultCompositionForDatasheet,
  defaultWargearUnit,
  miniatureInUnit,
  optionIdForMiniatureItem,
  setMiniatureWargear,
  enhancementTargetUnit,
  withMiniatureEnhancement,
  datasheetIdForEnhancementBodyguard
} from "./builder_validation_helpers.mjs";
import { unitHasWargearItem } from "../HereticBuilder/static/builder_validation_core.js";

test("validateRoster emits stable codes for real catalog messages", () => {
  state.catalog = realCatalog;
  const validation = validateRoster({
    id: "test-roster",
    name: "Empty Test Roster",
    factionKeywordId: realCatalog.bootstrap.defaultFactionId,
    battleSizeId: realCatalog.bootstrap.defaultBattleSizeId,
    detachmentIds: [],
    units: [],
  });

  assert.ok(validation.messages.length > 0);
  assert.ok(validation.messages.every((message) => typeof message.code === "string" && message.code.length > 0));
  assert.deepEqual(messageCodes(validation.messages), [
    "roster.detachment_not_selected",
    "roster.empty",
  ]);
});

test("core wargear item matcher rejects missing options, wrong items, and wrong model targets", () => {
  state.catalog = realCatalog;
  const datasheet = datasheetNamed("Termagants");
  const miniature = miniatureNamedForDatasheet("Termagants", "Termagant");
  const fleshborerOptionId = optionIdForMiniatureItem(datasheet.id, miniature.id, "Fleshborer");
  const fleshborerOption = realCatalog.wargearOptionById.get(fleshborerOptionId);
  assert.ok(fleshborerOption, "Expected Termagant Fleshborer option");

  const unit = {
    id: "core-wargear-matcher",
    datasheetId: datasheet.id,
    wargear: {
      "missing-option": 1,
    },
    miniatures: [{
      id: "core-wargear-matcher-miniature",
      rosterUnitMiniatureId: "core-wargear-matcher-miniature",
      miniatureId: miniature.id,
      count: 1,
      wargear: {
        [fleshborerOptionId]: 1,
      },
    }],
  };

  assert.equal(unitHasWargearItem(unit, fleshborerOption.wargearItemId), true);
  assert.equal(unitHasWargearItem(unit, "not-a-wargear-item"), false);
  assert.equal(unitHasWargearItem(unit, fleshborerOption.wargearItemId, {
    rosterUnitMiniatureId: "wrong-target",
    miniatureId: "wrong-miniature",
  }), false);
});

test("factionScope walks the full faction keyword table, including hidden parents", () => {
  withCatalog({
    factionKeywordById: new Map([
      ["child", { id: "child", parentFactionKeywordId: "hidden-parent" }],
      ["hidden-parent", { id: "hidden-parent", parentFactionKeywordId: "" }],
    ]),
    factionById: new Map([
      ["child", { id: "child", parentFactionKeywordId: "hidden-parent" }],
    ]),
  }, () => {
    assert.deepEqual(factionScope("child"), ["child", "hidden-parent"]);
  });
});

test("conditional keywords match required roster faction through parent scope", () => {
  const composition = { id: "composition", datasheetId: "datasheet", points: 0, isDefault: true, displayOrder: 1 };
  withCatalog({
    datasheetById: new Map([["datasheet", { id: "datasheet", name: "Datasheet", maxModelCount: 1 }]]),
    compositionById: new Map([[composition.id, composition]]),
    compositionsByDatasheetId: new Map([["datasheet", [composition]]]),
    compositionMiniaturesByCompositionId: new Map([[composition.id, [{ miniatureId: "miniature", min: 1, max: 1 }]]]),
    requiredFactionKeywordsByCompositionId: new Map(),
    requiredDetachmentsByCompositionId: new Map(),
    miniatureById: new Map([["miniature", { id: "miniature", name: "Miniature" }]]),
    miniatureKeywordsByMiniatureId: new Map([["miniature", []]]),
    miniaturesByDatasheetId: new Map([["datasheet", [{ id: "miniature", datasheetId: "datasheet", name: "Miniature" }]]]),
    conditionalKeywordsByDatasheetId: new Map([[
      "datasheet",
      [{ datasheetId: "datasheet", keywordId: "conditional-keyword", requiredRosterFactionKeywordId: "parent" }],
    ]]),
    keywordById: new Map([["conditional-keyword", { id: "conditional-keyword", name: "Conditional" }]]),
    factionKeywordById: new Map([
      ["child", { id: "child", parentFactionKeywordId: "parent" }],
      ["parent", { id: "parent", parentFactionKeywordId: "" }],
    ]),
    allegianceAbilityById: new Map(),
    enhancementById: new Map(),
    datasheetPointsStepsByDatasheetId: new Map(),
    wargearOptionById: new Map(),
    datasheetFactionKeywordsByDatasheetId: new Map(),
  }, () => {
    const summary = unitSummary({
      factionKeywordId: "child",
      detachmentIds: [],
      units: [{
        id: "unit",
        datasheetId: "datasheet",
        miniatures: [{ miniatureId: "miniature", count: 1 }],
      }],
    }, {
      id: "unit",
      datasheetId: "datasheet",
      miniatures: [{ miniatureId: "miniature", count: 1 }],
    });
    assert.ok(summary.keywordIds.includes("conditional-keyword"));
    assert.ok(summary.conditionalKeywordIds.includes("conditional-keyword"));
  });
});

function factionOutsideScope(requiredFactionKeywordId) {
  const faction = realCatalog.factionKeywords.find((item) => !factionScope(item.id).includes(requiredFactionKeywordId));
  assert.ok(faction, `Expected faction outside scope ${requiredFactionKeywordId}`);
  return faction.id;
}

function satisfiedConditionalKeywordContext(row) {
  return {
    roster: {
      factionKeywordId: row.requiredRosterFactionKeywordId || realCatalog.factionKeywords[0].id,
      detachmentIds: row.requiredDetachmentId ? [row.requiredDetachmentId] : [],
    },
    detachmentIds: new Set(row.requiredDetachmentId ? [row.requiredDetachmentId] : []),
    allegianceAbilityIds: new Set(row.requiredAllegianceAbilityId ? [row.requiredAllegianceAbilityId] : []),
    warlordMiniatureIds: new Set(row.requiredWarlordMiniatureId ? [row.requiredWarlordMiniatureId] : []),
  };
}

test("all live conditional keyword rows have satisfied and missing requirement coverage", () => {
  state.catalog = realCatalog;
  assert.equal(realCatalog.conditionalKeywords.length, 380);

  const requirementCounts = {
    requiredAllegianceAbilityId: 0,
    requiredRosterFactionKeywordId: 0,
    requiredDetachmentId: 0,
    requiredWarlordMiniatureId: 0,
  };
  const shapeCounts = new Map();
  for (const row of realCatalog.conditionalKeywords) {
    for (const key of Object.keys(requirementCounts)) {
      if (row[key]) {
        requirementCounts[key] += 1;
      }
    }
    const shape = Object.keys(requirementCounts).filter((key) => row[key]).sort().join("+");
    shapeCounts.set(shape, (shapeCounts.get(shape) || 0) + 1);

    assert.ok(realCatalog.datasheetById.get(row.datasheetId), `Expected datasheet ${row.datasheetId}`);
    assert.ok(realCatalog.keywordById.get(row.keywordId), `Expected keyword ${row.keywordId}`);
    if (row.requiredAllegianceAbilityId) {
      assert.ok(realCatalog.allegianceAbilityById.get(row.requiredAllegianceAbilityId));
    }
    if (row.requiredRosterFactionKeywordId) {
      assert.ok(realCatalog.factionKeywordById.get(row.requiredRosterFactionKeywordId));
    }
    if (row.requiredDetachmentId) {
      assert.ok(realCatalog.detachmentById.get(row.requiredDetachmentId));
    }
    if (row.requiredWarlordMiniatureId) {
      assert.ok(realCatalog.miniatureById.get(row.requiredWarlordMiniatureId));
    }

    const satisfied = satisfiedConditionalKeywordContext(row);
    assert.equal(
      conditionalKeywordApplies(
        row,
        satisfied.roster,
        satisfied.detachmentIds,
        satisfied.allegianceAbilityIds,
        satisfied.warlordMiniatureIds
      ),
      true,
      `conditional_keyword ${row.id} should apply when all requirements are satisfied`
    );

    if (row.requiredAllegianceAbilityId) {
      assert.equal(
        conditionalKeywordApplies(
          row,
          satisfied.roster,
          satisfied.detachmentIds,
          new Set(),
          satisfied.warlordMiniatureIds
        ),
        false,
        `conditional_keyword ${row.id} should require its allegiance ability`
      );
    }
    if (row.requiredRosterFactionKeywordId) {
      assert.equal(
        conditionalKeywordApplies(
          row,
          { ...satisfied.roster, factionKeywordId: factionOutsideScope(row.requiredRosterFactionKeywordId) },
          satisfied.detachmentIds,
          satisfied.allegianceAbilityIds,
          satisfied.warlordMiniatureIds
        ),
        false,
        `conditional_keyword ${row.id} should require its roster faction scope`
      );
    }
    if (row.requiredDetachmentId) {
      assert.equal(
        conditionalKeywordApplies(
          row,
          { ...satisfied.roster, detachmentIds: [] },
          new Set(),
          satisfied.allegianceAbilityIds,
          satisfied.warlordMiniatureIds
        ),
        false,
        `conditional_keyword ${row.id} should require its detachment`
      );
    }
    if (row.requiredWarlordMiniatureId) {
      assert.equal(
        conditionalKeywordApplies(
          row,
          satisfied.roster,
          satisfied.detachmentIds,
          satisfied.allegianceAbilityIds,
          new Set()
        ),
        false,
        `conditional_keyword ${row.id} should require its Warlord miniature`
      );
    }
  }

  assert.deepEqual(requirementCounts, {
    requiredAllegianceAbilityId: 270,
    requiredRosterFactionKeywordId: 32,
    requiredDetachmentId: 77,
    requiredWarlordMiniatureId: 2,
  });
  assert.deepEqual(Object.fromEntries([...shapeCounts.entries()].sort()), {
    requiredAllegianceAbilityId: 270,
    requiredDetachmentId: 76,
    "requiredDetachmentId+requiredWarlordMiniatureId": 1,
    requiredRosterFactionKeywordId: 32,
    requiredWarlordMiniatureId: 1,
  });
});

test("enhancement keyword point overrides use active keywords and display order", () => {
  const composition = { id: "composition", datasheetId: "datasheet", points: 100, isDefault: true, displayOrder: 1 };
  const enhancement = {
    id: "enhancement",
    name: "Keyword Cost Enhancement",
    basePointsCost: 20,
  };
  const catalog = {
    datasheetById: new Map([["datasheet", { id: "datasheet", name: "Datasheet", maxModelCount: 1 }]]),
    compositionById: new Map([[composition.id, composition]]),
    compositionsByDatasheetId: new Map([["datasheet", [composition]]]),
    compositionMiniaturesByCompositionId: new Map([[composition.id, [{ miniatureId: "miniature", min: 1, max: 1 }]]]),
    requiredFactionKeywordsByCompositionId: new Map(),
    requiredDetachmentsByCompositionId: new Map(),
    miniatureById: new Map([["miniature", { id: "miniature", name: "Miniature" }]]),
    miniatureKeywordsByMiniatureId: new Map([[
      "miniature",
      [{ keywordId: "late-keyword" }, { keywordId: "early-keyword" }],
    ]]),
    miniaturesByDatasheetId: new Map([["datasheet", [{ id: "miniature", datasheetId: "datasheet", name: "Miniature" }]]]),
    conditionalKeywordsByDatasheetId: new Map(),
    keywordById: new Map([
      ["late-keyword", { id: "late-keyword", name: "Late" }],
      ["early-keyword", { id: "early-keyword", name: "Early" }],
    ]),
    factionKeywordById: new Map([["faction", { id: "faction", parentFactionKeywordId: "" }]]),
    alliedFactionParentsByAlliedFactionId: new Map(),
    allegianceAbilityById: new Map(),
    enhancementById: new Map([[enhancement.id, enhancement]]),
    enhancementKeywordPointsCostsByEnhancementId: new Map([[
      enhancement.id,
      [
        { enhancementId: enhancement.id, keywordId: "late-keyword", pointsCost: 5, displayOrder: 2 },
        { enhancementId: enhancement.id, keywordId: "early-keyword", pointsCost: 15, displayOrder: 1 },
      ],
    ]]),
    datasheetPointsStepsByDatasheetId: new Map(),
    wargearOptionById: new Map(),
    datasheetFactionKeywordsByDatasheetId: new Map(),
  };

  withCatalog(catalog, () => {
    assert.equal(enhancementPoints(enhancement.id, ["late-keyword"]), 5);
    assert.equal(enhancementPoints(enhancement.id, ["late-keyword", "early-keyword"]), 15);
    assert.equal(enhancementPoints(enhancement.id, ["missing-keyword"]), 20);

    const unit = {
      id: "unit",
      datasheetId: "datasheet",
      unitEnhancements: [{ id: enhancement.id }],
      miniatures: [{ miniatureId: "miniature", count: 1 }],
    };
    const summary = unitSummary({
      factionKeywordId: "faction",
      detachmentIds: [],
      units: [unit],
    }, unit);

    assert.equal(summary.unitEnhancements[0].points, 15);
    assert.equal(summary.points, 115);

    const oldShapeUnit = {
      ...unit,
      unitEnhancements: [enhancement.id],
    };
    const oldShapeSummary = unitSummary({
      factionKeywordId: "faction",
      detachmentIds: [],
      units: [oldShapeUnit],
    }, oldShapeUnit);
    assert.deepEqual(oldShapeSummary.unitEnhancements, []);
  });
});
