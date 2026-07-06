import assert from "node:assert/strict";
import test from "node:test";
import {
  factionNamed,
  realCatalog,
  state,
  withCatalog,
} from "./builder_validation_helpers.mjs";
import { rosterWithUnitAllegianceAbility } from "../HereticBuilder/static/builder_roster_actions.js";
import { updateUnitAllegianceFromEditor } from "../HereticBuilder/static/builder_roster_unit_allegiance_editor.js";

function firstDetachmentGatedAllegianceSelection() {
  for (const datasheet of realCatalog.datasheets) {
    const group = realCatalog.allegianceAbilityGroupById.get(datasheet.allegianceAbilityGroupId);
    if (!group?.detachmentId) {
      continue;
    }
    const ability = (realCatalog.allegianceAbilitiesByGroupId.get(group.id) || [])
      .find((item) => !item.requiresWargearItemId);
    if (!ability) {
      continue;
    }
    const factionRows = realCatalog.datasheetFactionKeywordsByDatasheetId.get(datasheet.id) || [];
    const factionKeywordId = factionRows[0]?.factionKeywordId
      || factionNamed("Heretic Astartes").id;
    return { ability, datasheet, factionKeywordId, group };
  }
  assert.fail("Expected a detachment-gated allegiance selection");
}

test("builder roster actions write compact allegiance ability selections", () => {
  state.catalog = realCatalog;
  const { ability, datasheet, factionKeywordId, group } = firstDetachmentGatedAllegianceSelection();
  const roster = {
    id: "allegiance-action-roster",
    detachmentIds: [group.detachmentId],
    factionKeywordId,
    units: [{
      id: "unit-1",
      allegianceAbilities: [],
      datasheetId: datasheet.id,
      miniatures: [],
      wargear: {},
    }],
  };

  const selected = rosterWithUnitAllegianceAbility(roster, "unit-1", ability.id);
  assert.deepEqual(selected.units[0].allegianceAbilities, [{ id: ability.id }]);
  assert.deepEqual(roster.units[0].allegianceAbilities, []);

  const cleared = rosterWithUnitAllegianceAbility(selected, "unit-1", "");
  assert.deepEqual(cleared.units[0].allegianceAbilities, []);
});

test("unit allegiance editor emits undoable roster updates", async () => {
  state.catalog = realCatalog;
  const { ability, datasheet, factionKeywordId, group } = firstDetachmentGatedAllegianceSelection();
  const roster = {
    id: "allegiance-editor-undo-roster",
    detachmentIds: [group.detachmentId],
    factionKeywordId,
    units: [{
      id: "unit-1",
      allegianceAbilities: [],
      datasheetId: datasheet.id,
      miniatures: [],
      name: datasheet.name,
      wargear: {},
    }],
  };
  let event = null;

  await updateUnitAllegianceFromEditor(
    roster,
    roster.units[0],
    ability.id,
    {},
    () => {},
    (value) => {
      event = value;
    }
  );

  assert.equal(event.message, `Allegiance changed for ${datasheet.name}`);
  assert.equal(event.previousRoster, roster);
  assert.deepEqual(event.nextRoster.units[0].allegianceAbilities, [{ id: ability.id }]);
});

test("builder roster action derives allegiance context when omitted", () => {
  state.catalog = realCatalog;
  const { ability, datasheet, factionKeywordId, group } = firstDetachmentGatedAllegianceSelection();
  const roster = {
    id: "allegiance-action-derived-context-roster",
    detachmentIds: [],
    factionKeywordId,
    units: [{
      id: "unit-1",
      allegianceAbilities: [],
      datasheetId: datasheet.id,
      miniatures: [],
      wargear: {},
    }],
  };

  const rejected = rosterWithUnitAllegianceAbility(roster, "unit-1", ability.id);
  assert.equal(rejected, roster);

  const selected = rosterWithUnitAllegianceAbility({
    ...roster,
    detachmentIds: [group.detachmentId],
  }, "unit-1", ability.id);
  assert.deepEqual(selected.units[0].allegianceAbilities, [{ id: ability.id }]);
});

test("builder roster action rejects invalid allegiance abilities when context is supplied", () => {
  const detachment = {
    id: "action-allegiance-detachment",
    name: "Action Allegiance Detachment",
  };
  const group = {
    detachmentId: detachment.id,
    id: "action-allegiance-group",
    isMandatory: false,
    name: "Action Allegiance Group",
  };
  const ability = {
    allegianceAbilityGroupId: group.id,
    id: "action-allegiance-ability",
    name: "Action Allegiance Ability",
  };
  const catalog = {
    ...realCatalog,
    allegianceAbilitiesByGroupId: new Map([[group.id, [ability]]]),
    allegianceAbilityById: new Map([[ability.id, ability]]),
    allegianceAbilityGroupById: new Map([[group.id, group]]),
    detachmentById: new Map([
      ...realCatalog.detachmentById.entries(),
      [detachment.id, detachment],
    ]),
    mandatoryAllegianceAbilitiesByFactionId: new Map(),
  };
  const roster = {
    id: "allegiance-guard-roster",
    detachmentIds: [],
    factionKeywordId: factionNamed("Heretic Astartes").id,
    units: [{
      id: "unit-1",
      allegianceAbilities: [],
    }],
  };
  const unit = {
    id: "unit-1",
    allegianceAbilities: [],
    allegianceAbilityGroupId: group.id,
    miniatures: [],
    wargear: {},
  };

  withCatalog(catalog, () => {
    const rejected = rosterWithUnitAllegianceAbility(roster, "unit-1", ability.id, {
      detachments: [],
      unit,
      units: [unit],
    });
    assert.equal(rejected, roster);

    const selected = rosterWithUnitAllegianceAbility({
      ...roster,
      detachmentIds: [detachment.id],
    }, "unit-1", ability.id, {
      detachments: [detachment],
      unit,
      units: [unit],
    });
    assert.deepEqual(selected.units[0].allegianceAbilities, [{ id: ability.id }]);

    const cleared = rosterWithUnitAllegianceAbility(selected, "unit-1", "", {
      detachments: [],
      unit,
      units: [unit],
    });
    assert.deepEqual(cleared.units[0].allegianceAbilities, []);
  });
});
