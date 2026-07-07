import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
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
  removeUnitFromRow,
  unitCandidateGroups,
  unitCandidateStatus,
  unitModelCountLabel,
  unitOpenLabel,
  unitOptionValue,
  unitSummaryGroupLabel,
  unitSummaryGroups,
  unitSummarySort,
  unitSourceBadgeText,
} from "../HereticBuilder/static/builder_roster_unit_editor_view.js";
import { unitSourceBadgeNode } from "../HereticBuilder/static/builder_roster_unit_badges.js";
import { renderUnitRow } from "../HereticBuilder/static/builder_roster_unit_rows.js";
import {
  compactNames,
  unitRowSummaryText,
} from "../HereticBuilder/static/builder_roster_unit_row_summary.js";
import { renderUnitControls } from "../HereticBuilder/static/builder_roster_unit_controls.js";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function createMockClassList() {
  const classes = new Set();
  return {
    add: (...names) => names.forEach((name) => classes.add(name)),
    contains: (name) => classes.has(name),
    remove: (...names) => names.forEach((name) => classes.delete(name)),
    toggle: (name, value) => (value ? classes.add(name) : classes.delete(name)),
  };
}

function createMockElement(tagName) {
  return {
    attributes: new Map(),
    children: [],
    classList: createMockClassList(),
    className: "",
    dataset: {},
    disabled: false,
    hidden: false,
    listeners: new Map(),
    name: "",
    placeholder: "",
    style: {
      removeProperty() {},
    },
    tagName,
    textContent: "",
    title: "",
    type: "",
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
    focus() {
      this.focused = true;
    },
    replaceChildren(...nodes) {
      this.children = [];
      this.textContent = "";
      this.append(...nodes);
    },
    setAttribute(name, value) {
      this.attributes.set(name, String(value));
    },
  };
}

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

test("unit add search clears with Escape and refreshes options", () => {
  const previousDocument = global.document;
  const previousCatalog = state.catalog;
  state.catalog = realCatalog;
  global.document = {
    createElement: createMockElement,
  };

  try {
    const controls = renderUnitControls({
      newId: () => "unit-1",
      onUpdate: () => {},
      roster: {
        battleSizeId: battleSizeNamed("Strike Force").id,
        detachmentIds: [],
        factionKeywordId: factionNamed("Heretic Astartes").id,
        units: [],
      },
      validation: { points: { limit: 2000, total: 0 } },
    });
    const searchWrap = controls.children[0];
    const search = searchWrap.children[0];
    const clearSearch = searchWrap.children[1];
    const unitSelect = controls.children[1];
    const add = controls.children[2];

    search.value = "definitely-no-unit";
    search.listeners.get("input")();
    assert.equal(clearSearch.hidden, false);
    assert.equal(add.disabled, true);
    assert.equal(unitSelect.disabled, true);

    const event = {
      key: "Escape",
      prevented: false,
      stopped: false,
      preventDefault() {
        this.prevented = true;
      },
      stopPropagation() {
        this.stopped = true;
      },
    };
    search.listeners.get("keydown")(event);
    assert.equal(search.value, "");
    assert.equal(clearSearch.hidden, true);
    assert.equal(add.disabled, false);
    assert.equal(unitSelect.disabled, false);
    assert.equal(event.prevented, true);
    assert.equal(event.stopped, true);
  } finally {
    state.catalog = previousCatalog;
    global.document = previousDocument;
  }
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

test("unit summaries are grouped by roster role for scanning", () => {
  assert.equal(unitSummaryGroupLabel({ keywordNames: ["Character", "Epic Hero"] }), "Character");
  assert.equal(unitSummaryGroupLabel({ keywordNames: ["Battleline"] }), "Battleline");
  assert.equal(unitSummaryGroupLabel({ keywordNames: ["Dedicated Transport"] }), "Dedicated Transport");
  assert.equal(unitSummaryGroupLabel({ keywordNames: ["Infantry"] }), "Other");

  assert.deepEqual(
    unitSummaryGroups([
      { id: "other-1", keywordNames: ["Infantry"] },
      { id: "battleline-1", keywordNames: ["Battleline"] },
      { id: "character-1", keywordNames: ["Character"] },
      { id: "transport-1", keywordNames: ["Dedicated Transport"] },
      { id: "other-2", keywordNames: [] },
    ]).map((group) => [group.label, group.rows.map((row) => row.id)]),
    [
      ["Character", ["character-1"]],
      ["Battleline", ["battleline-1"]],
      ["Dedicated Transport", ["transport-1"]],
      ["Other", ["other-1", "other-2"]],
    ]
  );
});

test("unit summaries sort inside role groups for stable scanning", () => {
  assert.deepEqual(
    unitSummaryGroups([
      { id: "other-expensive", keywordNames: [], name: "Chosen", points: 90 },
      { id: "other-cheap", keywordNames: [], name: "Chosen", points: 80 },
      { id: "character-late", keywordNames: ["Character"], name: "Master of Possession", points: 70 },
      { id: "character-first", keywordNames: ["Character"], name: "Abaddon the Despoiler", points: 285 },
      { id: "other-alpha", keywordNames: [], name: "Cultist Mob", points: 50 },
    ]).map((group) => [group.label, group.rows.map((row) => row.id)]),
    [
      ["Character", ["character-first", "character-late"]],
      ["Other", ["other-cheap", "other-expensive", "other-alpha"]],
    ]
  );

  assert.ok(unitSummarySort({ name: "Chosen", points: 80 }, { name: "Chosen", points: 90 }) < 0);
});

test("unit source badge names selected allied unit source", () => {
  const previousDocument = global.document;
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

  global.document = { createElement: createMockElement };
  try {
    const badge = unitSourceBadgeNode({ allyType: longAllied.alliedFactionId });
    assert.equal(badge.className, "meta-badge");
    assert.match(badge.textContent, /^Allied: /);
    assert.ok(badge.textContent.endsWith("..."));
    assert.match(badge.title, /^Allied: /);
    assert.equal(badge.attributes.get("aria-label"), badge.title);
  } finally {
    global.document = previousDocument;
  }
});

test("unit row open label names the row action", () => {
  assert.equal(unitOpenLabel({ name: "Chosen" }), "Open unit: Chosen");
  assert.equal(unitOpenLabel({}), "Open unit: Unit");
  assert.equal(
    unitOpenLabel({
      isWarlord: true,
      modelCount: 1,
      name: "Abaddon the Despoiler",
      points: 285,
    }),
    "Open unit: Abaddon the Despoiler, 1 model, 285 pts, Warlord"
  );
  assert.equal(
    unitOpenLabel({ modelCount: 2, name: "War Dogs", points: 140 }, { sourceLabel: "Allied: Chaos Knights" }),
    "Open unit: War Dogs, 2 models, 140 pts, Allied: Chaos Knights"
  );
  assert.equal(
    unitOpenLabel(
      { modelCount: 5, name: "Chosen", points: 125 },
      { summaryText: "Abilities: Khorne" }
    ),
    "Open unit: Chosen, 5 models, 125 pts, Abilities: Khorne"
  );
});

test("unit rows pluralize model counts", () => {
  assert.equal(unitModelCountLabel(0), "0 models");
  assert.equal(unitModelCountLabel(1), "1 model");
  assert.equal(unitModelCountLabel(2), "2 models");

  const previousDocument = global.document;
  const previousCatalog = state.catalog;
  global.document = {
    createElement: createMockElement,
  };
  state.catalog = {
    unitImagesByDatasheetId: new Map(),
  };

  try {
    const row = renderUnitRow(
      { attachments: [], units: [{ id: "unit-1", datasheetId: "chosen" }] },
      { datasheetId: "chosen", id: "unit-1", modelCount: 1, name: "Chosen", points: 80 },
      { messages: [] },
      () => {},
      () => {}
    );

    assert.ok(row.textContent.includes("1 model"));
    assert.equal(row.children[0].title, "Open unit: Chosen, 1 model, 80 pts");
    assert.equal(row.children[0].attributes.get("aria-label"), "Open unit: Chosen, 1 model, 80 pts");
    assert.equal(row.textContent.includes("1 models"), false);
  } finally {
    state.catalog = previousCatalog;
    global.document = previousDocument;
  }
});

test("unit row summary exposes upgrades without dumping default wargear", () => {
  const previousCatalog = state.catalog;
  state.catalog = {
    baseMiniatureLoadoutsByDatasheetId: new Map(),
    baseMiniatureLoadoutsByMiniatureId: new Map(),
    baseMiniatureLoadoutWargearOptionsByLoadoutId: new Map(),
    compositionById: new Map(),
    compositionMiniaturesByCompositionId: new Map(),
    loadoutChoiceSetLoadoutsByChoiceSetId: new Map(),
    loadoutChoiceSetsByDatasheetId: new Map(),
    wargearGroupById: new Map(),
    wargearGroupsByDatasheetId: new Map([["chosen", []]]),
    wargearItemById: new Map([["plasma", { id: "plasma", name: "Plasma gun" }]]),
    wargearOptionById: new Map([["plasma-option", {
      id: "plasma-option",
      points: 5,
      wargearItemId: "plasma",
    }]]),
    wargearOptionsByGroupId: new Map(),
  };

  try {
    assert.equal(compactNames(["one", "two", "three"], 2), "one, two +1");
    assert.equal(
      unitRowSummaryText({
        allegianceAbilities: [{ name: "Mark of Chaos" }],
        compositionId: "",
        datasheetId: "chosen",
        miniatureEnhancements: [{ name: "Talisman" }],
        miniatures: [],
        unitEnhancements: [{ name: "Daemon Weapon" }],
        wargear: { "plasma-option": 2 },
      }),
      "Enhancements: Daemon Weapon, Talisman / Abilities: Mark of Chaos / Wargear: 2x Plasma gun"
    );
    assert.equal(unitRowSummaryText({
      allegianceAbilities: [],
      compositionId: "",
      datasheetId: "chosen",
      miniatureEnhancements: [],
      miniatures: [],
      unitEnhancements: [],
      wargear: {},
    }), "");
    assert.equal(unitRowSummaryText({
      allegianceAbilities: [],
      compositionId: "",
      datasheetId: "chosen",
      miniatureEnhancements: [],
      miniatures: [],
      unitEnhancements: [{ enhancementType: "upgrade", name: "Death in the Dark" }],
      wargear: {},
    }), "Upgrades: Death in the Dark");
    assert.equal(unitRowSummaryText({
      allegianceAbilities: [],
      compositionId: "",
      datasheetId: "chosen",
      miniatureEnhancements: [{ enhancementType: "miniature", name: "Shroud Field" }],
      miniatures: [],
      unitEnhancements: [{ enhancementType: "upgrade", name: "Death in the Dark" }],
      wargear: {},
    }), "Enhancements & Upgrades: Death in the Dark, Shroud Field");
  } finally {
    state.catalog = previousCatalog;
  }
});

test("unit rows render compact upgrade summary when present", () => {
  const previousDocument = global.document;
  const previousCatalog = state.catalog;
  global.document = {
    createElement: createMockElement,
  };
  state.catalog = {
    baseMiniatureLoadoutsByDatasheetId: new Map(),
    baseMiniatureLoadoutsByMiniatureId: new Map(),
    baseMiniatureLoadoutWargearOptionsByLoadoutId: new Map(),
    compositionById: new Map(),
    compositionMiniaturesByCompositionId: new Map(),
    loadoutChoiceSetLoadoutsByChoiceSetId: new Map(),
    loadoutChoiceSetsByDatasheetId: new Map(),
    unitImagesByDatasheetId: new Map(),
    wargearGroupById: new Map(),
    wargearGroupsByDatasheetId: new Map([["chosen", []]]),
    wargearItemById: new Map(),
    wargearOptionById: new Map(),
    wargearOptionsByGroupId: new Map(),
  };

  try {
    const row = renderUnitRow(
      { attachments: [], units: [{ id: "unit-1", datasheetId: "chosen" }] },
      {
        allegianceAbilities: [{ name: "Mark of Chaos" }],
        compositionId: "",
        datasheetId: "chosen",
        id: "unit-1",
        miniatureEnhancements: [],
        miniatures: [],
        modelCount: 1,
        name: "Chosen",
        points: 80,
        unitEnhancements: [{ name: "Daemon Weapon" }],
        wargear: {},
      },
      { messages: [] },
      () => {},
      () => {}
    );

    assert.ok(row.textContent.includes("Enhancements: Daemon Weapon / Abilities: Mark of Chaos"));
    assert.equal(row.children[0].children[2].className, "unit-row-summary");
    assert.equal(
      row.children[0].attributes.get("aria-label"),
      "Open unit: Chosen, 1 model, 80 pts, Enhancements: Daemon Weapon / Abilities: Mark of Chaos"
    );
  } finally {
    state.catalog = previousCatalog;
    global.document = previousDocument;
  }
});

test("unit row removal can delegate to an undo-aware handler", async () => {
  const roster = {
    attachments: [],
    units: [
      { id: "unit-1", datasheetId: "chosen" },
      { id: "unit-2", datasheetId: "cultists" },
    ],
  };
  const summary = { id: "unit-1", name: "Chosen" };
  let fallbackCalled = false;
  let removeEvent = null;

  await removeUnitFromRow(
    roster,
    summary,
    () => {
      fallbackCalled = true;
    },
    (event) => {
      removeEvent = event;
    }
  );

  assert.equal(fallbackCalled, false);
  assert.equal(removeEvent.message, "Chosen removed");
  assert.equal(removeEvent.previousRoster, roster);
  assert.deepEqual(removeEvent.nextRoster.units.map((unit) => unit.id), ["unit-2"]);
});

test("unit editor exposes its Add control as the section primary action", () => {
  const source = readFileSync(
    join(projectRoot, "HereticBuilder", "static", "builder_roster_unit_controls.js"),
    "utf8"
  );

  assert.ok(source.includes('add.dataset.editorPrimaryAction = "true"'));
});
