import assert from "node:assert/strict";
import test from "node:test";
import {
  allegianceUnit,
  battleSizeNamed,
  enhancementTargetUnit,
  factionNamed,
  keywordIdsForDatasheet,
  realCatalog,
  state,
} from "./builder_validation_helpers.mjs";
import { allegianceEditorOptions } from "../HereticBuilder/static/builder_roster_unit_allegiance_options.js";
import { enhancementSelectRows } from "../HereticBuilder/static/builder_roster_unit_enhancement_options.js";
import { unitWarlordSelectModel } from "../HereticBuilder/static/builder_roster_unit_warlord_options.js";
import { warlordPickerModel } from "../HereticBuilder/static/builder_roster_warlord_options.js";

function warlordValue(unit) {
  return JSON.stringify({
    rosterUnitMiniatureId: unit.miniatures[0].rosterUnitMiniatureId,
    unitId: unit.id,
  });
}

function firstDetachmentGatedAllegiance() {
  const group = realCatalog.allegianceAbilityGroups.find((item) => item.detachmentId);
  assert.ok(group, "Expected a detachment-gated allegiance group");
  const ability = (realCatalog.allegianceAbilitiesByGroupId.get(group.id) || [])[0];
  assert.ok(ability, `Expected an ability for ${group.name}`);
  return {
    ability: {
      ...ability,
      groupId: ability.allegianceAbilityGroupId,
      groupName: group.name,
    },
    group,
  };
}

test("warlord picker disables invalid non-current candidates", () => {
  state.catalog = realCatalog;
  const captain = enhancementTargetUnit({
    id: "captain",
    datasheetName: "Captain",
    miniatureName: "Captain",
    factionNames: ["Adeptus Astartes"],
  });
  const intercessor = enhancementTargetUnit({
    id: "intercessor-sergeant",
    datasheetName: "Intercessor Squad",
    miniatureName: "Intercessor Sergeant",
    factionNames: ["Adeptus Astartes"],
  });
  const roster = {
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [],
    factionKeywordId: factionNamed("Adeptus Astartes").id,
    units: [captain, intercessor],
  };

  const model = warlordPickerModel(roster);
  const captainOption = model.options.find((row) => row.value === warlordValue(captain));
  const intercessorOption = model.options.find((row) => row.value === warlordValue(intercessor));

  assert.equal(captainOption.disabled, false);
  assert.equal(intercessorOption.disabled, true);
  assert.match(intercessorOption.label, /not eligible/);
});

test("warlord picker keeps the current invalid candidate visible and enabled", () => {
  state.catalog = realCatalog;
  const intercessor = enhancementTargetUnit({
    id: "intercessor-sergeant",
    datasheetName: "Intercessor Squad",
    miniatureName: "Intercessor Sergeant",
    factionNames: ["Adeptus Astartes"],
    isWarlord: true,
  });
  const roster = {
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [],
    factionKeywordId: factionNamed("Adeptus Astartes").id,
    units: [intercessor],
  };

  const model = warlordPickerModel(roster);
  const intercessorOption = model.options.find((row) => row.value === warlordValue(intercessor));

  assert.equal(model.currentValue, warlordValue(intercessor));
  assert.equal(intercessorOption.disabled, false);
  assert.match(intercessorOption.label, /not eligible/);
});

test("unit warlord select model disables invalid non-current candidates", () => {
  state.catalog = realCatalog;
  const intercessor = enhancementTargetUnit({
    id: "unit-warlord-intercessor",
    datasheetName: "Intercessor Squad",
    miniatureName: "Intercessor Sergeant",
    factionNames: ["Adeptus Astartes"],
  });
  const roster = {
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [],
    factionKeywordId: factionNamed("Adeptus Astartes").id,
    units: [intercessor],
  };

  const model = unitWarlordSelectModel(roster, intercessor);
  const intercessorOption = model.options.find((row) => row.value === intercessor.miniatures[0].rosterUnitMiniatureId);

  assert.equal(intercessorOption.disabled, true);
  assert.match(intercessorOption.label, /not eligible/);
});

test("unit warlord select model keeps the current invalid candidate visible and enabled", () => {
  state.catalog = realCatalog;
  const intercessor = enhancementTargetUnit({
    id: "current-unit-warlord-intercessor",
    datasheetName: "Intercessor Squad",
    miniatureName: "Intercessor Sergeant",
    factionNames: ["Adeptus Astartes"],
    isWarlord: true,
  });
  const roster = {
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [],
    factionKeywordId: factionNamed("Adeptus Astartes").id,
    units: [intercessor],
  };

  const model = unitWarlordSelectModel(roster, intercessor);
  const intercessorOption = model.options.find((row) => row.value === intercessor.miniatures[0].rosterUnitMiniatureId);

  assert.equal(model.currentId, intercessor.miniatures[0].rosterUnitMiniatureId);
  assert.equal(intercessorOption.disabled, false);
  assert.match(intercessorOption.label, /not eligible/);
});

test("allegiance editor disables invalid non-current options", () => {
  state.catalog = realCatalog;
  const { ability, group } = firstDetachmentGatedAllegiance();
  const unit = allegianceUnit({ id: "missing-detachment-unit", group });
  const roster = {
    detachmentIds: [],
    factionKeywordId: factionNamed("Heretic Astartes").id,
    units: [unit],
  };

  const model = allegianceEditorOptions(roster, unit);
  const abilityOption = model.options.find((row) => row.value === ability.id);

  assert.equal(abilityOption.disabled, true);
  assert.match(abilityOption.label, /requires /);
});

test("allegiance editor keeps the current invalid option visible and enabled", () => {
  state.catalog = realCatalog;
  const { ability, group } = firstDetachmentGatedAllegiance();
  const unit = allegianceUnit({
    abilities: [ability],
    group,
    id: "current-missing-detachment-unit",
  });
  const roster = {
    detachmentIds: [],
    factionKeywordId: factionNamed("Heretic Astartes").id,
    units: [unit],
  };

  const model = allegianceEditorOptions(roster, unit);
  const abilityOption = model.options.find((row) => row.value === ability.id);

  assert.equal(model.currentId, ability.id);
  assert.equal(abilityOption.disabled, false);
  assert.match(abilityOption.label, /requires /);
});

test("enhancement select rows disable invalid non-current options", () => {
  state.catalog = realCatalog;
  const detachment = realCatalog.detachments.find((item) => item.name === "Librarius Conclave");
  assert.ok(detachment, "Expected Librarius Conclave");
  const enhancement = realCatalog.enhancements.find((item) => (
    item.name === "Fusillade" && item.detachmentId === detachment.id
  ));
  assert.ok(enhancement, "Expected Fusillade");
  const intercessor = enhancementTargetUnit({
    id: "intercessor-enhancement-target",
    datasheetName: "Intercessor Squad",
    miniatureName: "Intercessor Sergeant",
    factionNames: ["Adeptus Astartes"],
  });
  const roster = {
    detachmentIds: [detachment.id],
    factionKeywordId: factionNamed("Adeptus Astartes").id,
    units: [intercessor],
  };

  const rows = enhancementSelectRows({
    currentId: "",
    enhancements: [enhancement],
    keywordIds: keywordIdsForDatasheet(intercessor.datasheetId),
    miniature: intercessor.miniatures[0],
    roster,
    targetKind: "miniature",
    unit: intercessor,
    units: [intercessor],
  });

  assert.equal(rows[0].disabled, true);
  assert.equal(rows[0].status.reason, "Character required");
});

test("enhancement select rows keep the current invalid option visible and enabled", () => {
  state.catalog = realCatalog;
  const detachment = realCatalog.detachments.find((item) => item.name === "Librarius Conclave");
  assert.ok(detachment, "Expected Librarius Conclave");
  const enhancement = realCatalog.enhancements.find((item) => (
    item.name === "Fusillade" && item.detachmentId === detachment.id
  ));
  assert.ok(enhancement, "Expected Fusillade");
  const intercessor = enhancementTargetUnit({
    id: "current-intercessor-enhancement-target",
    datasheetName: "Intercessor Squad",
    miniatureName: "Intercessor Sergeant",
    factionNames: ["Adeptus Astartes"],
  });
  const roster = {
    detachmentIds: [detachment.id],
    factionKeywordId: factionNamed("Adeptus Astartes").id,
    units: [intercessor],
  };

  const rows = enhancementSelectRows({
    currentId: enhancement.id,
    enhancements: [enhancement],
    keywordIds: keywordIdsForDatasheet(intercessor.datasheetId),
    miniature: intercessor.miniatures[0],
    roster,
    targetKind: "miniature",
    unit: intercessor,
    units: [intercessor],
  });

  assert.equal(rows[0].disabled, false);
  assert.equal(rows[0].status.reason, "Character required");
});
