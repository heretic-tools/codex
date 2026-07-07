import assert from "node:assert/strict";
import test from "node:test";
import {
  battleSizeNamed,
  factionNamed,
  realCatalog,
  state,
  unitSummary,
  withCatalog,
} from "./builder_validation_helpers.mjs";
import {
  rosterWithAddedUnit,
  rosterWithUnitAllegianceAbility,
} from "../HereticBuilder/static/builder_roster_actions.js";
import {
  renderAllegianceEditor,
  updateUnitAllegianceFromEditor,
} from "../HereticBuilder/static/builder_roster_unit_allegiance_editor.js";

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

function rosterWithAllegianceUnit(detachmentIds = []) {
  state.catalog = realCatalog;
  const { datasheet, factionKeywordId, group } = firstDetachmentGatedAllegianceSelection();
  const roster = {
    id: "allegiance-editor-render-roster",
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds,
    factionKeywordId,
    units: [],
    attachments: [],
  };
  const withUnit = rosterWithAddedUnit(roster, {
    datasheetId: datasheet.id,
    unitId: "unit-1",
  });
  return {
    group,
    roster: withUnit,
    unit: unitSummary(withUnit, withUnit.units[0]),
  };
}

test("unit allegiance editor hides controls until an actionable option exists", () => {
  const previousDocument = global.document;
  global.document = {
    createElement: createMockElement,
  };

  try {
    const hidden = rosterWithAllegianceUnit();
    assert.equal(renderAllegianceEditor({
      onUpdate: () => {},
      roster: hidden.roster,
      unit: hidden.unit,
      validation: { messages: [] },
      validationContext: {},
    }), null);

    const visible = rosterWithAllegianceUnit([hidden.group.detachmentId]);
    const node = renderAllegianceEditor({
      onUpdate: () => {},
      roster: visible.roster,
      unit: visible.unit,
      validation: { messages: [] },
      validationContext: {},
    });

    assert.equal(node.tagName, "label");
    assert.equal(node.dataset.unitDetailTarget, "allegiance");
    assert.equal(node.children[1].tagName, "select");
    assert.equal(node.children[1].title, `Choose ${node.children[0].textContent}`);
    assert.equal(node.children[1].attributes.get("aria-label"), node.children[1].title);
    const status = node.children.find((child) => child.className === "field-status allegiance-availability-status");
    assert.match(status.textContent, /\d+ available/);
    assert.equal(node.children[1].attributes.get("aria-describedby"), status.id);
  } finally {
    global.document = previousDocument;
  }
});

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
