import assert from "node:assert/strict";
import test from "node:test";
import {
  battleSizeNamed,
  datasheetNamed,
  detachmentNamed,
  factionNamed,
  keywordNamed,
  realCatalog,
  state,
  unitSummary,
  withCatalog,
} from "./builder_validation_helpers.mjs";
import {
  rosterWithAddedUnit,
  rosterWithMiniatureEnhancement,
  rosterWithUnitEnhancement,
} from "../HereticBuilder/static/builder_roster_actions.js";
import {
  enhancementChangeMessage,
  renderEnhancementsEditor,
  updateEnhancementFromEditor,
} from "../HereticBuilder/static/builder_roster_unit_enhancement_editor.js";
import {
  enhancementKindLabel,
  enhancementSectionTitle,
} from "../HereticBuilder/static/builder_roster_unit_enhancement_labels.js";

const ENHANCEMENT_FIXTURES = {
  miniature: {
    datasheetId: "9bc4c7d0-d4dd-4fa4-b77d-d3512b36eae2",
    detachmentId: "12492ec7-0f2c-46fa-822a-80b0c2e8bfd6",
    enhancementId: "994771ac-14b5-40c7-8ade-01bae240edae",
    factionName: "Heretic Astartes",
  },
  unit: {
    datasheetId: "eff3e091-a068-49b7-9a0a-6eb02e546be4",
    detachmentId: "0bb425be-1dff-4825-96ba-704523da27c4",
    enhancementId: "6bb394ee-ecc3-4447-bead-f3d003753b0b",
    factionName: "Adeptus Astartes",
  },
};

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

function rosterWithFixtureUnit(fixture, detachmentIds = [fixture.detachmentId]) {
  state.catalog = realCatalog;
  const roster = {
    id: "action-roster-upgrades",
    name: "Action Roster",
    factionKeywordId: factionNamed(fixture.factionName).id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds,
    units: [],
    attachments: [],
  };
  const withUnit = rosterWithAddedUnit(roster, {
    datasheetId: fixture.datasheetId,
    unitId: "unit-1",
  });
  assert.equal(withUnit.units.length, 1, "Expected fixture datasheet to be available");
  return { roster: withUnit, unit: withUnit.units[0] };
}

function catalogWithoutEnhancements() {
  return {
    ...realCatalog,
    enhancements: [],
    enhancementById: new Map(),
  };
}

test("unit enhancement editor hides when no actionable enhancement exists", () => {
  const previousDocument = global.document;
  global.document = {
    createElement: createMockElement,
  };

  try {
    const { roster, unit } = rosterWithFixtureUnit(ENHANCEMENT_FIXTURES.unit, []);
    const summary = unitSummary(roster, unit);
    let node = undefined;

    withCatalog(catalogWithoutEnhancements(), () => {
      node = renderEnhancementsEditor({
        onUpdate: () => {},
        roster,
        unit: summary,
        validation: { messages: [] },
        validationContext: {},
      });
    });

    assert.equal(node, null);
  } finally {
    global.document = previousDocument;
  }
});

test("unit enhancement editor hides when detachment enhancements are all target-ineligible", () => {
  const previousDocument = global.document;
  global.document = {
    createElement: createMockElement,
  };

  try {
    state.catalog = realCatalog;
    const roster = rosterWithAddedUnit({
      id: "action-roster-epic-enhancements",
      name: "Action Roster",
      factionKeywordId: factionNamed("Heretic Astartes").id,
      battleSizeId: battleSizeNamed("Strike Force").id,
      detachmentIds: [detachmentNamed("Veterans of the Long War").id],
      units: [],
      attachments: [],
    }, {
      datasheetId: datasheetNamed("Abaddon the Despoiler").id,
      unitId: "unit-epic",
    });
    const summary = unitSummary(roster, roster.units[0]);
    const node = renderEnhancementsEditor({
      onUpdate: () => {},
      roster,
      unit: summary,
      validation: { messages: [] },
      validationContext: {},
    });

    assert.equal(node, null);
  } finally {
    global.document = previousDocument;
  }
});

test("unit enhancement editor stays visible for enhancement validation", () => {
  const previousDocument = global.document;
  global.document = {
    createElement: createMockElement,
  };

  try {
    const { roster, unit } = rosterWithFixtureUnit(ENHANCEMENT_FIXTURES.unit, []);
    const summary = unitSummary(roster, unit);
    let node = undefined;

    withCatalog(catalogWithoutEnhancements(), () => {
      node = renderEnhancementsEditor({
        onUpdate: () => {},
        roster,
        unit: summary,
        validation: {
          messages: [{
            code: "enhancement.unit_has_too_many_enhancements",
            level: "error",
            scope: { unitId: unit.id },
            text: "Too many enhancements.",
          }],
        },
        validationContext: {},
      });
    });

    assert.equal(node.className, "builder-section unit-enhancements-section");
    assert.equal(node.dataset.unitDetailTarget, "enhancements");
    assert.match(node.textContent, /Enhancements/);
    assert.match(node.textContent, /Too many enhancements\./);
  } finally {
    global.document = previousDocument;
  }
});

test("unit enhancement editor labels enhancement selects", () => {
  const previousDocument = global.document;
  global.document = {
    createElement: createMockElement,
  };

  try {
    const { roster, unit } = rosterWithFixtureUnit(ENHANCEMENT_FIXTURES.unit);
    const summary = unitSummary(roster, unit);
    const node = renderEnhancementsEditor({
      onUpdate: () => {},
      roster,
      unit: summary,
      validation: { messages: [] },
      validationContext: {},
    });
    const field = node.children.find((child) => child.className === "field enhancement-field");
    const select = field.children.find((child) => child.tagName === "select");

    assert.match(node.textContent, /Upgrades/);
    assert.equal(node.dataset.sectionTitle, "Upgrades");
    assert.equal(field.children[0].textContent, "Whole unit");
    assert.equal(select.title, `Choose upgrade for ${field.children[0].textContent}`);
    assert.equal(select.attributes.get("aria-label"), select.title);
    assert.equal(select.children[0].textContent, "No upgrade");
  } finally {
    global.document = previousDocument;
  }
});

test("unit enhancement labels distinguish enhancements, upgrades, and mixed lists", () => {
  const enhancement = { enhancementType: "unit" };
  const upgrade = { enhancementType: "upgrade" };

  assert.equal(enhancementKindLabel([enhancement]), "enhancement");
  assert.equal(enhancementKindLabel([enhancement], { plural: true }), "enhancements");
  assert.equal(enhancementKindLabel([upgrade]), "upgrade");
  assert.equal(enhancementKindLabel([upgrade], { plural: true }), "upgrades");
  assert.equal(enhancementKindLabel([enhancement, upgrade]), "enhancement or upgrade");
  assert.equal(enhancementKindLabel([enhancement, upgrade], { plural: true }), "enhancements or upgrades");

  assert.equal(enhancementSectionTitle([enhancement]), "Enhancements");
  assert.equal(enhancementSectionTitle([upgrade]), "Upgrades");
  assert.equal(enhancementSectionTitle([enhancement, upgrade]), "Enhancements & Upgrades");

  assert.equal(enhancementChangeMessage({ name: "Captain" }, [enhancement]), "Enhancement changed for Captain");
  assert.equal(enhancementChangeMessage({ name: "Captain" }, [upgrade]), "Upgrade changed for Captain");
  assert.equal(
    enhancementChangeMessage({ name: "Captain" }, [enhancement, upgrade]),
    "Enhancement or upgrade changed for Captain"
  );
});

test("builder roster actions write compact enhancement selections", () => {
  const { roster, unit } = rosterWithFixtureUnit(ENHANCEMENT_FIXTURES.unit);
  const withUnitEnhancement = rosterWithUnitEnhancement(roster, unit.id, ENHANCEMENT_FIXTURES.unit.enhancementId);
  assert.deepEqual(withUnitEnhancement.units[0].unitEnhancements, [{ id: ENHANCEMENT_FIXTURES.unit.enhancementId }]);
  assert.deepEqual(rosterWithUnitEnhancement(withUnitEnhancement, unit.id, "").units[0].unitEnhancements, []);

  const miniatureRoster = rosterWithFixtureUnit(ENHANCEMENT_FIXTURES.miniature);
  const targetMiniature = miniatureRoster.unit.miniatures[0];
  const withMiniatureEnhancement = rosterWithMiniatureEnhancement(miniatureRoster.roster, miniatureRoster.unit.id, {
    enhancementId: ENHANCEMENT_FIXTURES.miniature.enhancementId,
    rosterUnitMiniatureId: targetMiniature.rosterUnitMiniatureId,
  });
  assert.deepEqual(withMiniatureEnhancement.units[0].miniatureEnhancements, [{
    id: ENHANCEMENT_FIXTURES.miniature.enhancementId,
    targetId: targetMiniature.rosterUnitMiniatureId,
  }]);
  assert.deepEqual(rosterWithMiniatureEnhancement(withMiniatureEnhancement, miniatureRoster.unit.id, {
    enhancementId: "",
    rosterUnitMiniatureId: targetMiniature.rosterUnitMiniatureId,
  }).units[0].miniatureEnhancements, []);
});

test("unit enhancement editor emits undoable roster updates", async () => {
  const { roster, unit } = rosterWithFixtureUnit(ENHANCEMENT_FIXTURES.unit);
  let event = null;

  await updateEnhancementFromEditor(
    roster,
    { ...unit, name: "Captain" },
    {
      enhancements: [state.catalog.enhancementById.get(ENHANCEMENT_FIXTURES.unit.enhancementId)],
      targetKind: "unit",
      targetId: unit.id,
    },
    ENHANCEMENT_FIXTURES.unit.enhancementId,
    {},
    () => {},
    (value) => {
      event = value;
    }
  );

  assert.equal(event.message, "Upgrade changed for Captain");
  assert.equal(event.previousRoster, roster);
  assert.deepEqual(event.nextRoster.units[0].unitEnhancements, [{ id: ENHANCEMENT_FIXTURES.unit.enhancementId }]);
});

test("builder roster action derives enhancement context when omitted", () => {
  const unitFixture = ENHANCEMENT_FIXTURES.unit;
  const withoutUnitDetachment = rosterWithFixtureUnit(unitFixture, []);
  const rejectedUnitEnhancement = rosterWithUnitEnhancement(
    withoutUnitDetachment.roster,
    withoutUnitDetachment.unit.id,
    unitFixture.enhancementId
  );
  assert.equal(rejectedUnitEnhancement, withoutUnitDetachment.roster);

  const miniatureFixture = ENHANCEMENT_FIXTURES.miniature;
  const withoutMiniatureDetachment = rosterWithFixtureUnit(miniatureFixture, []);
  const targetMiniature = withoutMiniatureDetachment.unit.miniatures[0];
  const rejectedMiniatureEnhancement = rosterWithMiniatureEnhancement(
    withoutMiniatureDetachment.roster,
    withoutMiniatureDetachment.unit.id,
    {
      enhancementId: miniatureFixture.enhancementId,
      rosterUnitMiniatureId: targetMiniature.rosterUnitMiniatureId,
    }
  );
  assert.equal(rejectedMiniatureEnhancement, withoutMiniatureDetachment.roster);
});

test("builder roster action rejects invalid enhancement targets when context is supplied", () => {
  const characterKeywordId = keywordNamed("Character").id;
  const unitEnhancement = {
    id: "action-unit-enhancement",
    name: "Action Unit Enhancement",
    detachmentId: "",
    enhancementType: "unit",
    isEquipableByEpicHero: false,
    isEquipableByNonCharacterUnit: false,
  };
  const miniatureEnhancement = {
    ...unitEnhancement,
    id: "action-miniature-enhancement",
    enhancementType: "miniature",
    name: "Action Miniature Enhancement",
  };
  const catalog = {
    ...realCatalog,
    enhancements: [unitEnhancement, miniatureEnhancement],
    enhancementById: new Map([
      [unitEnhancement.id, unitEnhancement],
      [miniatureEnhancement.id, miniatureEnhancement],
    ]),
    enhancementBodyguardGroupsByEnhancementId: new Map(),
    enhancementBodyguardGroupDatasheetsByGroupId: new Map(),
    enhancementBodyguardGroupKeywordsByGroupId: new Map(),
    enhancementExcludedKeywordsByEnhancementId: new Map(),
    enhancementRequiredKeywordGroupsByEnhancementId: new Map(),
    enhancementRequiredKeywordGroupFactionsByGroupId: new Map(),
    enhancementRequiredKeywordGroupKeywordsByGroupId: new Map(),
    enhancementRequiredWargearItemsByEnhancementId: new Map(),
  };
  const rosterMiniature = {
    id: "model-1",
    miniatureId: "miniature-1",
    rosterUnitMiniatureId: "model-1",
  };
  const roster = {
    id: "enhancement-guard-roster",
    attachments: [],
    units: [{
      id: "unit-1",
      miniatureEnhancements: [],
      miniatures: [rosterMiniature],
      unitEnhancements: [],
    }],
  };
  const baseUnit = {
    id: "unit-1",
    allyType: "native",
    keywordIds: [],
    miniatures: [{ ...rosterMiniature, count: 1, name: "Line Model" }],
  };
  const characterUnit = {
    ...baseUnit,
    keywordIds: [characterKeywordId],
    miniatures: [{
      ...baseUnit.miniatures[0],
      keywordIds: [characterKeywordId],
    }],
  };

  withCatalog(catalog, () => {
    const rejectedUnitEnhancement = rosterWithUnitEnhancement(roster, "unit-1", unitEnhancement.id, {
      detachments: [],
      keywordIds: [],
      unit: baseUnit,
      units: [baseUnit],
    });
    assert.equal(rejectedUnitEnhancement, roster);

    const acceptedUnitEnhancement = rosterWithUnitEnhancement(roster, "unit-1", unitEnhancement.id, {
      detachments: [],
      keywordIds: [characterKeywordId],
      unit: characterUnit,
      units: [characterUnit],
    });
    assert.deepEqual(acceptedUnitEnhancement.units[0].unitEnhancements, [{ id: unitEnhancement.id }]);
    assert.deepEqual(rosterWithUnitEnhancement(acceptedUnitEnhancement, "unit-1", "", {
      detachments: [],
      keywordIds: [],
      unit: baseUnit,
      units: [baseUnit],
    }).units[0].unitEnhancements, []);

    const rejectedMiniatureEnhancement = rosterWithMiniatureEnhancement(roster, "unit-1", {
      detachments: [],
      enhancementId: miniatureEnhancement.id,
      keywordIds: [],
      miniature: baseUnit.miniatures[0],
      rosterUnitMiniatureId: "model-1",
      unit: baseUnit,
      units: [baseUnit],
    });
    assert.equal(rejectedMiniatureEnhancement, roster);

    const acceptedMiniatureEnhancement = rosterWithMiniatureEnhancement(roster, "unit-1", {
      detachments: [],
      enhancementId: miniatureEnhancement.id,
      keywordIds: [characterKeywordId],
      miniature: characterUnit.miniatures[0],
      rosterUnitMiniatureId: "model-1",
      unit: characterUnit,
      units: [characterUnit],
    });
    assert.deepEqual(acceptedMiniatureEnhancement.units[0].miniatureEnhancements, [{
      id: miniatureEnhancement.id,
      targetId: "model-1",
    }]);
    assert.deepEqual(rosterWithMiniatureEnhancement(acceptedMiniatureEnhancement, "unit-1", {
      detachments: [],
      enhancementId: "",
      keywordIds: [],
      miniature: baseUnit.miniatures[0],
      rosterUnitMiniatureId: "model-1",
      unit: baseUnit,
      units: [baseUnit],
    }).units[0].miniatureEnhancements, []);
  });
});
