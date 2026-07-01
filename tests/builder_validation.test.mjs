import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

global.document = { querySelector: () => null };

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

global.fetch = async (path) => {
  const rawPath = String(path || "");
  const relativePath = rawPath.startsWith("/") ? rawPath.slice(1) : rawPath;
  const filePath = join(projectRoot, "dist", relativePath);
  try {
    const body = await readFile(filePath, "utf8");
    return {
      ok: true,
      status: 200,
      json: async () => JSON.parse(body),
    };
  } catch {
    return {
      ok: false,
      status: 404,
      json: async () => {
        throw new Error(`Missing test fixture file: ${filePath}`);
      },
    };
  }
};

const { loadCatalog } = await import("../HereticBuilder/static/builder_catalog.js");
const { state } = await import("../HereticBuilder/static/builder_state.js");
const { factionScope } = await import("../HereticBuilder/static/builder_model.js");
const { validateAlliedUnits } = await import("../HereticBuilder/static/builder_allied_rules.js");
const { validateEnhancements } = await import("../HereticBuilder/static/builder_enhancement_rules.js");
const { validateRoster } = await import("../HereticBuilder/static/builder_rules.js");

const realCatalog = await loadCatalog();
state.catalog = realCatalog;

function withCatalog(catalog, callback) {
  const previous = state.catalog;
  state.catalog = catalog;
  try {
    callback();
  } finally {
    state.catalog = previous;
  }
}

function messageCodes(messages) {
  return messages.map((message) => message.code);
}

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

test("cannotBeWarlord miniature enhancement only blocks the enhanced warlord model", () => {
  const enhancement = {
    id: "disciple",
    name: "Disciple of Khorne",
    cannotBeWarlord: true,
    enhancementType: "miniature",
    isIncludedInEnhancementLimit: true,
    isEquipableByEpicHero: true,
    isEquipableByNonCharacterUnit: true,
  };
  const catalog = {
    battleSizeById: new Map([["strike", { enhancementLimit: 4 }]]),
    enhancementById: new Map([[enhancement.id, enhancement]]),
    enhancementRequiredKeywordGroupsByEnhancementId: new Map(),
    enhancementRequiredKeywordGroupKeywordsByGroupId: new Map(),
    enhancementRequiredKeywordGroupFactionsByGroupId: new Map(),
    enhancementExcludedKeywordsByEnhancementId: new Map(),
    enhancementRequiredWargearItemsByEnhancementId: new Map(),
    enhancementBodyguardGroupsByEnhancementId: new Map(),
    enhancementBodyguardGroupDatasheetsByGroupId: new Map(),
    enhancementBodyguardGroupKeywordsByGroupId: new Map(),
    alliedFactionById: new Map(),
    keywordById: new Map(),
    miniatureKeywordsByMiniatureId: new Map(),
    detachmentById: new Map(),
  };
  const roster = { battleSizeId: "strike", attachments: [] };
  const baseUnit = {
    id: "unit",
    name: "Two Model Unit",
    datasheetId: "datasheet",
    allyType: "native",
    isWarlord: true,
    keywordIds: [],
    unitEnhancements: [],
    miniatures: [
      { rosterUnitMiniatureId: "warlord-model", miniatureId: "warlord", count: 1, isWarlord: true, name: "Warlord Model" },
      { rosterUnitMiniatureId: "other-model", miniatureId: "other", count: 1, isWarlord: false, name: "Other Model" },
    ],
  };

  withCatalog(catalog, () => {
    const otherModelMessages = [];
    validateEnhancements(roster, [], [{
      ...baseUnit,
      miniatureEnhancements: [{ ...enhancement, targetId: "other-model" }],
    }], otherModelMessages);
    assert.ok(!messageCodes(otherModelMessages).includes("warlord.invalid_due_to_enhancement"));

    const warlordModelMessages = [];
    validateEnhancements(roster, [], [{
      ...baseUnit,
      miniatureEnhancements: [{ ...enhancement, targetId: "warlord-model" }],
    }], warlordModelMessages);
    assert.ok(messageCodes(warlordModelMessages).includes("warlord.invalid_due_to_enhancement"));
  });
});

test("new-table ally restricting keyword rows respect keyword faction scope when present", () => {
  const baseCatalog = {
    factionAlliedFactionsByFactionId: new Map([["roster-faction", [{ alliedFactionId: "ally" }]]]),
    alliedFactionParentsByAlliedFactionId: new Map([["ally", [{ factionKeywordId: "matching-parent" }]]]),
    keywordAllyRestrictingKeywords: [{ keywordId: "restricted-keyword", restrictingKeywordId: "restricting-keyword" }],
    keywordById: new Map([
      ["restricted-keyword", {
        id: "restricted-keyword",
        name: "Restricted",
        allyRestrictingFactionKeywordId: "other-parent",
      }],
      ["restricting-keyword", { id: "restricting-keyword", name: "Restricting" }],
    ]),
    keywords: [],
    alliedFactionById: new Map([["ally", {}]]),
    alliedFactionDatasheetsByAlliedFactionId: new Map([["ally", [{ datasheetId: "d1" }, { datasheetId: "d2" }]]]),
    alliedFactionPointsLimitsByAlliedFactionId: new Map(),
    alliedFactionKeywordsByAlliedFactionId: new Map(),
    alliedFactionAllowedWarlordsByAlliedFactionId: new Map(),
    alliedFactionRequiredDetachmentsByAlliedFactionId: new Map(),
    alliedFactionAllegianceAbilitiesByAlliedFactionId: new Map(),
    alliedFactionKeywordSlotlessGroupsByKeywordId: new Map(),
    alliedFactionKeywordSlotlessDonorsByGroupId: new Map(),
    alliedFactionKeywordSlotlessReceiversByGroupId: new Map(),
    miniatureById: new Map(),
    detachmentById: new Map(),
    factionById: new Map([["roster-faction", { id: "roster-faction", name: "Roster Faction" }]]),
    factionKeywordById: new Map([["matching-parent", { id: "matching-parent", name: "Matching Parent" }]]),
    battleSizeById: new Map(),
    allegianceAbilityById: new Map(),
    allegianceAbilityGroupById: new Map(),
  };
  const roster = { factionKeywordId: "roster-faction", battleSizeId: "strike" };
  const alliedUnits = [
    { id: "u1", name: "Unit 1", allyType: "ally", datasheetId: "d1", keywordIds: ["restricted-keyword"], points: 10, warlordMiniatureIds: [] },
    { id: "u2", name: "Unit 2", allyType: "ally", datasheetId: "d2", keywordIds: ["restricted-keyword"], points: 10, warlordMiniatureIds: [] },
  ];

  withCatalog(baseCatalog, () => {
    const messages = [];
    validateAlliedUnits(roster, [], alliedUnits, messages);
    assert.ok(!messageCodes(messages).includes("allied_keyword_restricting_keyword.outnumbered_keywords"));
  });

  const matchingCatalog = {
    ...baseCatalog,
    keywordById: new Map([
      ["restricted-keyword", {
        id: "restricted-keyword",
        name: "Restricted",
        allyRestrictingFactionKeywordId: "matching-parent",
      }],
      ["restricting-keyword", { id: "restricting-keyword", name: "Restricting" }],
    ]),
  };
  withCatalog(matchingCatalog, () => {
    const messages = [];
    validateAlliedUnits(roster, [], alliedUnits, messages);
    assert.ok(messageCodes(messages).includes("allied_keyword_restricting_keyword.outnumbered_keywords"));
  });
});
