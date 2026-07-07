import assert from "node:assert/strict";
import test from "node:test";
import {
  availableDatasheets,
  battleSizeNamed,
  datasheetNamed,
  enhancementTargetUnit,
  factionNamed,
  keywordIdsForDatasheet,
  realCatalog,
  state,
} from "./builder_validation_helpers.mjs";
import {
  rosterWithAddedUnit,
  rosterWithWarlord,
} from "../HereticBuilder/static/builder_roster_actions.js";
import {
  renderWarlordEditor,
  updateUnitWarlordFromEditor,
} from "../HereticBuilder/static/builder_roster_unit_warlord_editor.js";
import {
  renderWarlordPicker,
  updateWarlordFromPicker,
} from "../HereticBuilder/static/builder_roster_warlord_picker.js";

function createMockElement(tagName) {
  return {
    attributes: new Map(),
    children: [],
    className: "",
    dataset: {},
    disabled: false,
    listeners: new Map(),
    tagName,
    textContent: "",
    value: "",
    append(...nodes) {
      for (const node of nodes) {
        this.appendChild(node);
      }
    },
    appendChild(node) {
      this.children.push(node);
      this.textContent += node.textContent || "";
      return node;
    },
    addEventListener(name, handler) {
      this.listeners.set(name, handler);
    },
    setAttribute(name, value) {
      this.attributes.set(name, String(value));
    },
  };
}

function duplicateLimitedCharacterDatasheet(roster) {
  const datasheet = availableDatasheets(roster, "native").find((row) => {
    const keywordNames = keywordIdsForDatasheet(row.id)
      .map((id) => realCatalog.keywordById.get(id)?.name)
      .filter(Boolean);
    return keywordNames.includes("Character")
      && !keywordNames.includes("Epic Hero")
      && !keywordNames.includes("Battleline")
      && !keywordNames.includes("Dedicated Transport");
  });
  assert.ok(datasheet, "Expected a duplicate-limited Character datasheet");
  return datasheet;
}

test("unit warlord editor hides units with no selectable warlord target", () => {
  state.catalog = realCatalog;
  const previousDocument = global.document;
  global.document = {
    createElement: createMockElement,
  };

  try {
    const roster = {
      id: "hidden-warlord-editor-roster",
      name: "Hidden Warlord Editor",
      factionKeywordId: factionNamed("Heretic Astartes").id,
      battleSizeId: battleSizeNamed("Strike Force").id,
      detachmentIds: [],
      units: [],
      attachments: [],
    };
    const withSupremeCommander = rosterWithAddedUnit(roster, {
      datasheetId: datasheetNamed("Abaddon the Despoiler").id,
      unitId: "abaddon",
    });
    const withAccursedCultists = rosterWithAddedUnit(withSupremeCommander, {
      datasheetId: datasheetNamed("Accursed Cultists").id,
      unitId: "accursed-cultists",
    });
    const accursedCultists = {
      ...withAccursedCultists.units.find((unit) => unit.id === "accursed-cultists"),
      name: "Accursed Cultists",
    };

    assert.equal(renderWarlordEditor({
      onUpdate: () => {},
      roster: withAccursedCultists,
      unit: accursedCultists,
      validation: { messages: [] },
      validationContext: {},
    }), null);
  } finally {
    global.document = previousDocument;
  }
});

test("unit warlord editor stays visible when the unit has an eligible target", () => {
  state.catalog = realCatalog;
  const previousDocument = global.document;
  global.document = {
    createElement: createMockElement,
  };

  try {
    const roster = {
      id: "visible-warlord-editor-roster",
      name: "Visible Warlord Editor",
      factionKeywordId: factionNamed("Heretic Astartes").id,
      battleSizeId: battleSizeNamed("Strike Force").id,
      detachmentIds: [],
      units: [],
      attachments: [],
    };
    const datasheet = duplicateLimitedCharacterDatasheet(roster);
    const withUnit = rosterWithAddedUnit(roster, {
      datasheetId: datasheet.id,
      unitId: "character-unit",
    });
    const unit = { ...withUnit.units[0], name: datasheet.name };
    const node = renderWarlordEditor({
      onUpdate: () => {},
      roster: withUnit,
      unit,
      validation: { messages: [] },
      validationContext: {},
    });

    assert.equal(node.tagName, "label");
    assert.equal(node.dataset.unitDetailTarget, "warlord");
    assert.equal(node.children[1].tagName, "select");
    assert.equal(node.children[1].title, "Choose Warlord");
    assert.equal(node.children[1].attributes.get("aria-label"), "Choose Warlord");
  } finally {
    global.document = previousDocument;
  }
});

test("roster warlord picker labels its select control", () => {
  state.catalog = realCatalog;
  const previousDocument = global.document;
  global.document = {
    createElement: createMockElement,
  };

  try {
    const roster = {
      id: "visible-roster-warlord-picker",
      name: "Visible Roster Warlord Picker",
      factionKeywordId: factionNamed("Heretic Astartes").id,
      battleSizeId: battleSizeNamed("Strike Force").id,
      detachmentIds: [],
      units: [],
      attachments: [],
    };
    const datasheet = duplicateLimitedCharacterDatasheet(roster);
    const withUnit = rosterWithAddedUnit(roster, {
      datasheetId: datasheet.id,
      unitId: "character-unit",
    });
    const node = renderWarlordPicker({
      onUpdate: () => {},
      roster: withUnit,
    });

    assert.equal(node.tagName, "label");
    assert.equal(node.dataset.editorTarget, "warlord");
    assert.equal(node.children[1].tagName, "select");
    assert.equal(node.children[1].title, "Choose Warlord");
    assert.equal(node.children[1].attributes.get("aria-label"), "Choose Warlord");
  } finally {
    global.document = previousDocument;
  }
});

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
  const datasheet = duplicateLimitedCharacterDatasheet(roster);
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

test("unit warlord editor emits undoable roster updates", async () => {
  state.catalog = realCatalog;
  const roster = {
    id: "warlord-editor-undo-roster",
    name: "Action Roster",
    factionKeywordId: factionNamed("Heretic Astartes").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [],
    units: [],
    attachments: [],
  };
  const datasheet = duplicateLimitedCharacterDatasheet(roster);
  const withUnit = rosterWithAddedUnit(roster, {
    datasheetId: datasheet.id,
    unitId: "unit-1",
  });
  const unit = { ...withUnit.units[0], name: datasheet.name };
  const targetId = unit.miniatures[0].rosterUnitMiniatureId;
  let event = null;

  await updateUnitWarlordFromEditor(
    withUnit,
    unit,
    targetId,
    {},
    () => {},
    (value) => {
      event = value;
    }
  );

  assert.equal(event.message, `Warlord changed for ${datasheet.name}`);
  assert.equal(event.previousRoster, withUnit);
  assert.equal(event.nextRoster.units[0].miniatures[0].isWarlord, true);
});

test("roster warlord picker emits undoable roster updates", async () => {
  state.catalog = realCatalog;
  const roster = {
    id: "warlord-picker-undo-roster",
    name: "Action Roster",
    factionKeywordId: factionNamed("Heretic Astartes").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [],
    units: [],
    attachments: [],
  };
  const datasheet = duplicateLimitedCharacterDatasheet(roster);
  const withUnit = rosterWithAddedUnit(roster, {
    datasheetId: datasheet.id,
    unitId: "unit-1",
  });
  const unit = withUnit.units[0];
  const targetId = unit.miniatures[0].rosterUnitMiniatureId;
  let event = null;

  await updateWarlordFromPicker(
    withUnit,
    JSON.stringify({ rosterUnitMiniatureId: targetId, unitId: unit.id }),
    {},
    () => {},
    (value) => {
      event = value;
    }
  );

  assert.equal(event.message, "Warlord changed");
  assert.equal(event.previousRoster, withUnit);
  assert.equal(event.nextRoster.units[0].miniatures[0].isWarlord, true);
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

test("builder roster action derives Warlord context when omitted", () => {
  state.catalog = realCatalog;
  const intercessor = enhancementTargetUnit({
    id: "direct-context-intercessor",
    datasheetName: "Intercessor Squad",
    miniatureName: "Intercessor Sergeant",
    factionNames: ["Adeptus Astartes"],
  });
  const captain = enhancementTargetUnit({
    id: "direct-context-captain",
    datasheetName: "Captain",
    miniatureName: "Captain",
    factionNames: ["Adeptus Astartes"],
  });
  const roster = {
    id: "warlord-direct-context-roster",
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [],
    factionKeywordId: factionNamed("Adeptus Astartes").id,
    units: [intercessor, captain],
  };

  const rejected = rosterWithWarlord(roster, {
    rosterUnitMiniatureId: intercessor.miniatures[0].rosterUnitMiniatureId,
    unitId: intercessor.id,
  });
  assert.equal(rejected, roster);

  const accepted = rosterWithWarlord(roster, {
    rosterUnitMiniatureId: captain.miniatures[0].rosterUnitMiniatureId,
    unitId: captain.id,
  });
  assert.equal(accepted.units[0].miniatures[0].isWarlord, false);
  assert.equal(accepted.units[1].miniatures[0].isWarlord, true);
});
