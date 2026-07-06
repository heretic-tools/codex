import assert from "node:assert/strict";
import test from "node:test";
import {
  factionNamed,
  realCatalog,
  withCatalog,
} from "./builder_validation_helpers.mjs";
import { rosterWithUnitAllegianceAbility } from "../HereticBuilder/static/builder_roster_actions.js";

test("builder roster actions write compact allegiance ability selections", () => {
  const roster = {
    id: "allegiance-action-roster",
    units: [{
      id: "unit-1",
      allegianceAbilities: [],
    }],
  };

  const selected = rosterWithUnitAllegianceAbility(roster, "unit-1", "ability-1");
  assert.deepEqual(selected.units[0].allegianceAbilities, [{ id: "ability-1" }]);
  assert.deepEqual(roster.units[0].allegianceAbilities, []);

  const cleared = rosterWithUnitAllegianceAbility(selected, "unit-1", "");
  assert.deepEqual(cleared.units[0].allegianceAbilities, []);
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
