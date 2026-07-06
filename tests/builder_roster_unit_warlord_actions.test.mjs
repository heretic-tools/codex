import assert from "node:assert/strict";
import test from "node:test";
import {
  availableDatasheets,
  battleSizeNamed,
  factionNamed,
  realCatalog,
  state,
} from "./builder_validation_helpers.mjs";
import {
  rosterWithAddedUnit,
  rosterWithWarlord,
} from "../HereticBuilder/static/builder_roster_actions.js";

test("builder roster actions keep only one selected Warlord", () => {
  state.catalog = realCatalog;
  const roster = {
    id: "action-roster-warlord",
    name: "Action Roster",
    factionKeywordId: factionNamed("Heretic Astartes").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [],
    units: [],
    attachments: [],
  };
  const datasheet = availableDatasheets(roster, "native")[0];
  assert.ok(datasheet, "Expected an available datasheet");
  const withFirstUnit = rosterWithAddedUnit(roster, {
    datasheetId: datasheet.id,
    unitId: "unit-1",
  });
  const withSecondUnit = rosterWithAddedUnit(withFirstUnit, {
    datasheetId: datasheet.id,
    unitId: "unit-2",
  });
  const firstUnit = withSecondUnit.units[0];
  const secondUnit = withSecondUnit.units[1];
  const firstTarget = firstUnit.miniatures[0].rosterUnitMiniatureId;
  const secondTarget = secondUnit.miniatures[0].rosterUnitMiniatureId;

  const firstWarlord = rosterWithWarlord(withSecondUnit, {
    rosterUnitMiniatureId: firstTarget,
    unitId: firstUnit.id,
  });
  assert.equal(firstWarlord.units[0].miniatures[0].isWarlord, true);
  assert.equal(firstWarlord.units[1].miniatures[0].isWarlord, false);

  const secondWarlord = rosterWithWarlord(firstWarlord, {
    rosterUnitMiniatureId: secondTarget,
    unitId: secondUnit.id,
  });
  assert.equal(secondWarlord.units[0].miniatures[0].isWarlord, false);
  assert.equal(secondWarlord.units[1].miniatures[0].isWarlord, true);

  const noWarlord = rosterWithWarlord(secondWarlord, {});
  assert.equal(noWarlord.units.some((row) => row.miniatures.some((miniature) => miniature.isWarlord)), false);
});

test("builder roster action rejects invalid Warlord targets when context is supplied", () => {
  state.catalog = realCatalog;
  const roster = {
    id: "warlord-guard-roster",
    factionKeywordId: factionNamed("Heretic Astartes").id,
    detachmentIds: [],
    units: [{
      id: "unit-1",
      miniatures: [{
        miniatureId: "non-character-miniature",
        rosterUnitMiniatureId: "model-1",
      }],
    }],
  };
  const baseUnit = {
    id: "unit-1",
    datasheetId: "non-character-datasheet",
    keywordIds: [],
    miniatures: [{
      count: 1,
      miniatureId: "non-character-miniature",
      name: "Line Model",
      rosterUnitMiniatureId: "model-1",
    }],
  };

  const rejected = rosterWithWarlord(roster, {
    detachments: [],
    rosterUnitMiniatureId: "model-1",
    unitId: "unit-1",
    units: [baseUnit],
  });
  assert.equal(rejected, roster);

  const accepted = rosterWithWarlord(roster, {
    detachments: [],
    rosterUnitMiniatureId: "model-1",
    unitId: "unit-1",
    units: [{
      ...baseUnit,
      miniatures: [{
        ...baseUnit.miniatures[0],
        canBeNonCharacterWarlord: true,
      }],
    }],
  });
  assert.equal(accepted.units[0].miniatures[0].isWarlord, true);

  const cleared = rosterWithWarlord(accepted, {});
  assert.equal(cleared.units[0].miniatures[0].isWarlord, false);
});
