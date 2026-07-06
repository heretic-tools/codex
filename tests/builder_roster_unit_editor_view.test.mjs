import assert from "node:assert/strict";
import test from "node:test";
import {
  availableDatasheets,
  battleSizeNamed,
  factionNamed,
  keywordIdsForDatasheet,
  realCatalog,
  state,
} from "./builder_validation_helpers.mjs";
import { rosterWithAddedUnit } from "../HereticBuilder/static/builder_roster_actions.js";
import {
  parseUnitOptionValue,
  unitCandidateGroups,
  unitCandidateStatus,
  unitOptionValue,
  unitSourceBadgeText,
} from "../HereticBuilder/static/builder_roster_unit_editor_view.js";

function regularDuplicateLimitedDatasheet(roster) {
  const datasheet = availableDatasheets(roster, "native").find((row) => {
    const keywordNames = keywordIdsForDatasheet(row.id)
      .map((id) => realCatalog.keywordById.get(id)?.name)
      .filter(Boolean);
    return !keywordNames.includes("Epic Hero")
      && !keywordNames.includes("Battleline")
      && !keywordNames.includes("Dedicated Transport");
  });
  assert.ok(datasheet, "Expected a non-Epic, non-Battleline, non-Transport native datasheet");
  return datasheet;
}

test("unit candidate status explains duplicate caps and point pressure", () => {
  state.catalog = realCatalog;
  const roster = {
    battleSizeId: battleSizeNamed("Strike Force").id,
  };
  const validation = {
    points: {
      limit: 2000,
      total: 1990,
    },
  };
  const captain = { datasheetId: "captain", keywordNames: ["Character"], points: 80 };
  const captains = Array.from({ length: 3 }, (_, index) => ({
    ...captain,
    id: `captain-${index}`,
  }));

  assert.deepEqual(
    unitCandidateStatus(roster, validation, captain, captains),
    { severity: "error", reason: "limit 3 reached" }
  );

  const battleline = { datasheetId: "battleline", keywordNames: ["Battleline"], points: 20 };
  const battlelineUnits = Array.from({ length: 5 }, (_, index) => ({
    ...battleline,
    id: `battleline-${index}`,
  }));
  assert.deepEqual(
    unitCandidateStatus(roster, validation, battleline, battlelineUnits),
    { severity: "warning", reason: "10 pts over" }
  );

  assert.deepEqual(
    unitCandidateStatus(roster, { points: { limit: 2000, total: 1000 } }, battleline, [
      ...battlelineUnits,
      { ...battleline, id: "battleline-5" },
    ]),
    { severity: "error", reason: "limit 6 reached" }
  );
});

test("unit candidate groups combine native and allied datasheets in one picker", () => {
  state.catalog = realCatalog;
  const faction = factionNamed("Heretic Astartes");
  const roster = {
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [],
    factionKeywordId: faction.id,
    units: [],
  };

  const groups = unitCandidateGroups(roster, { points: { limit: 2000, total: 0 } });

  assert.ok(groups.length > 1, "expected native plus at least one allied group");
  assert.equal(groups[0].source.value, "native");
  assert.ok(groups[0].rows.length, "expected native datasheets");
  assert.ok(groups.slice(1).some((group) => group.source.value !== "native" && group.rows.length));
  assert.deepEqual(unitCandidateGroups(roster, { points: { limit: 2000, total: 0 } }, "definitely-no-unit"), []);
});

test("unit candidate groups preserve duplicate-limit reasons after action guard", () => {
  state.catalog = realCatalog;
  const roster = {
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [],
    factionKeywordId: factionNamed("Heretic Astartes").id,
    units: [],
  };
  const datasheet = regularDuplicateLimitedDatasheet(roster);
  let current = roster;
  for (let index = 0; index < 3; index += 1) {
    current = rosterWithAddedUnit(current, {
      datasheetId: datasheet.id,
      unitId: `candidate-duplicate-${index}`,
    });
  }

  const groups = unitCandidateGroups(current, { points: { limit: 2000, total: 0 } }, datasheet.name);
  const row = groups.flatMap((group) => group.rows).find((item) => item.datasheet.id === datasheet.id);

  assert.ok(row?.candidate, "Expected duplicate-limited candidate summary to remain visible");
  assert.deepEqual(row.status, { severity: "error", reason: "limit 3 reached" });
});

test("unit option values round-trip ally type and datasheet id", () => {
  const value = unitOptionValue("chaos-knights", "war-dog");

  assert.deepEqual(
    parseUnitOptionValue(value),
    { allyType: "chaos-knights", datasheetId: "war-dog" }
  );
  assert.deepEqual(
    parseUnitOptionValue("plain-datasheet-id"),
    { allyType: "native", datasheetId: "plain-datasheet-id" }
  );
});

test("unit source badge names selected allied unit source", () => {
  state.catalog = realCatalog;
  const faction = factionNamed("Heretic Astartes");
  const alliedRows = realCatalog.factionAlliedFactionsByFactionId.get(faction.id) || [];
  const longAllied = alliedRows.find((row) => (
    (realCatalog.alliedFactionParentsByAlliedFactionId.get(row.alliedFactionId) || []).length > 2
  ));
  assert.ok(longAllied);

  assert.equal(unitSourceBadgeText({ allyType: "native" }), "");
  assert.match(unitSourceBadgeText({ allyType: longAllied.alliedFactionId }), /^Allied: /);
  assert.ok(unitSourceBadgeText({ allyType: longAllied.alliedFactionId }).endsWith("..."));
});
