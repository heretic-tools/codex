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
import { compositionSelectModel } from "../HereticBuilder/static/builder_roster_unit_composition_options.js";
import { enhancementSelectRows } from "../HereticBuilder/static/builder_roster_unit_enhancement_options.js";
import {
  wargearOptionLabel,
  wargearOptionRowsForGroup,
} from "../HereticBuilder/static/builder_roster_unit_wargear_options.js";
import { wargearGroupsFor } from "../HereticBuilder/static/builder_roster_unit_wargear_groups.js";
import {
  unitWarlordOptionLabel,
  unitWarlordSelectModel,
} from "../HereticBuilder/static/builder_roster_unit_warlord_options.js";
import { enhancementSelectModels } from "../HereticBuilder/static/builder_roster_unit_enhancement_models.js";
import {
  warlordOptionLabel,
  warlordPickerModel,
} from "../HereticBuilder/static/builder_roster_warlord_options.js";
import { unitLabel } from "../HereticBuilder/static/builder_roster_attachment_types.js";

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

test("warlord picker labels collapse duplicate unit and model names", () => {
  assert.equal(
    warlordOptionLabel(
      { name: "Abaddon the Despoiler" },
      { count: 1, name: "Abaddon the Despoiler" }
    ),
    "Abaddon the Despoiler (1 model)"
  );
  assert.equal(
    warlordOptionLabel(
      { name: "Intercessor Squad" },
      { count: 1, name: "Intercessor Sergeant" }
    ),
    "Intercessor Squad / Intercessor Sergeant (1 model)"
  );
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

test("unit warlord select labels use concise placeholder and readable model counts", () => {
  assert.equal(unitWarlordOptionLabel({ count: 1, name: "Captain" }), "Captain (1 model)");
  assert.equal(unitWarlordOptionLabel({ count: 2, name: "Sergeant" }), "Sergeant (2 models)");

  state.catalog = realCatalog;
  const captain = enhancementTargetUnit({
    id: "unit-warlord-label-captain",
    datasheetName: "Captain",
    miniatureName: "Captain",
    factionNames: ["Adeptus Astartes"],
  });
  const roster = {
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [],
    factionKeywordId: factionNamed("Adeptus Astartes").id,
    units: [captain],
  };
  const model = unitWarlordSelectModel(roster, captain);

  assert.equal(model.options[0].label, "Not Warlord");
  assert.equal(model.options[1].label, "Captain (1 model)");
});

test("attachment unit labels use readable model counts", () => {
  const units = [
    { id: "leader-1", modelCount: 1, name: "Captain" },
    { id: "leader-2", modelCount: 2, name: "Captain" },
  ];

  assert.equal(unitLabel(units[0], "Leader", units), "Leader: Captain #1 (1 model)");
  assert.equal(unitLabel(units[1], "Support", units), "Support: Captain #2 (2 models)");
});

test("enhancement model labels use readable model counts", () => {
  state.catalog = realCatalog;
  const enhancement = realCatalog.enhancements.find((item) => item.enhancementType === "miniature");
  assert.ok(enhancement, "Expected a miniature enhancement");
  const captain = enhancementTargetUnit({
    id: "enhancement-label-captain",
    datasheetName: "Captain",
    miniatureName: "Captain",
    factionNames: ["Adeptus Astartes"],
  });
  captain.miniatures[0].count = 2;
  captain.miniatureEnhancements = [{
    id: enhancement.id,
    targetId: captain.miniatures[0].rosterUnitMiniatureId,
  }];

  const models = enhancementSelectModels({
    detachmentIds: [],
    factionKeywordId: factionNamed("Adeptus Astartes").id,
    units: [captain],
  }, captain);

  assert.equal(models.find((model) => model.targetKind === "miniature")?.label, "Captain (2 models)");
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

test("composition select model exposes current composition labels", () => {
  state.catalog = realCatalog;
  const captain = enhancementTargetUnit({
    id: "composition-captain",
    datasheetName: "Captain",
    miniatureName: "Captain",
    factionNames: ["Adeptus Astartes"],
  });
  const roster = {
    detachmentIds: [],
    factionKeywordId: factionNamed("Adeptus Astartes").id,
    units: [captain],
  };

  const model = compositionSelectModel(roster, captain);

  assert.ok(model.currentId);
  assert.ok(model.options.length);
  assert.equal(model.options[0].value, model.currentId);
  assert.match(model.options[0].label, /pts\)$/);
});

test("wargear groups model filters unit and miniature scopes", () => {
  state.catalog = realCatalog;
  const datasheetGroups = [...realCatalog.wargearGroupsByDatasheetId.entries()]
    .find(([, groups]) => groups.some((group) => !group.miniatureId) && groups.some((group) => group.miniatureId));
  assert.ok(datasheetGroups, "Expected a datasheet with unit and model wargear groups");
  const [datasheetId, groups] = datasheetGroups;
  const miniatureId = groups.find((group) => group.miniatureId)?.miniatureId;
  const unit = { datasheetId };

  const unitGroups = wargearGroupsFor(unit);
  const miniatureGroups = wargearGroupsFor(unit, miniatureId);

  assert.ok(unitGroups.length);
  assert.ok(miniatureGroups.length);
  assert.ok(unitGroups.every((group) => !group.miniatureId));
  assert.ok(miniatureGroups.every((group) => group.miniatureId === miniatureId));
  assert.deepEqual(
    unitGroups.map((group) => group.displayOrder || 0),
    [...unitGroups].map((group) => group.displayOrder || 0).sort((left, right) => left - right)
  );
});

test("wargear option rows expose labels without DOM lookups", () => {
  state.catalog = realCatalog;
  const group = realCatalog.wargearGroups.find((item) => (
    (realCatalog.wargearOptionsByGroupId.get(item.id) || []).some((optionRow) => optionRow.points)
  ));
  assert.ok(group, "Expected a wargear group with a paid option");
  const paidOption = (realCatalog.wargearOptionsByGroupId.get(group.id) || [])
    .find((optionRow) => optionRow.points);
  assert.ok(paidOption, "Expected a paid wargear option");

  const rows = wargearOptionRowsForGroup(group);
  const paidRow = rows.find((row) => row.optionRow.id === paidOption.id);

  assert.equal(rows.length, (realCatalog.wargearOptionsByGroupId.get(group.id) || []).length);
  assert.equal(paidRow.label, wargearOptionLabel(paidOption));
  assert.match(paidRow.label, / pts$/);
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
