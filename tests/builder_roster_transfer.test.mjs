import assert from "node:assert/strict";
import test from "node:test";

import {
  exportRostersPayload,
  parseImportedRosters,
  rostersWithNonConflictingIds,
  serializeRosters,
} from "../HereticBuilder/static/builder_roster_transfer.js";

test("Builder roster export payload is versioned and cloned", () => {
  const roster = {
    id: "roster-1",
    factionKeywordId: "faction-1",
    battleSizeId: "size-1",
    detachmentIds: ["detachment-1"],
    runtimeOnly: "not exported",
    units: [{
      id: "unit-1",
      datasheetId: "datasheet-1",
      compositionId: "composition-1",
      points: 999,
    }],
    attachments: [],
  };

  const payload = exportRostersPayload([roster], 879);
  roster.units[0].id = "mutated";

  assert.equal(payload.kind, "heretic-builder-rosters");
  assert.equal(payload.version, 1);
  assert.equal(payload.dataVersion, 879);
  assert.match(payload.exportedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(payload.rosters[0].units[0].id, "unit-1");
  assert.equal("runtimeOnly" in payload.rosters[0], false);
  assert.equal("points" in payload.rosters[0].units[0], false);
});

test("Builder roster import parses only supported roster export files", () => {
  const source = serializeRosters([{
    id: "roster-1",
    name: "Roster",
    factionKeywordId: "faction-1",
    battleSizeId: "size-1",
    dataVersion: 879,
    detachmentIds: ["detachment-1"],
    listSummary: {
      detachmentPoints: 1,
      pointsTotal: 120,
      validationState: "invalid",
    },
    units: [{
      id: "unit-1",
      allyType: "native",
      datasheetId: "datasheet-1",
      compositionId: "composition-1",
      wargear: { "option-1": 2 },
      unitEnhancements: [{ id: "enhancement-1" }],
      miniatureEnhancements: [{ id: "enhancement-2", targetId: "miniature-target-1" }],
      allegianceAbilities: [{ id: "allegiance-1" }],
      miniatures: [{
        id: "miniature-row-1",
        rosterUnitMiniatureId: "miniature-target-1",
        miniatureId: "miniature-1",
        count: 1,
        isWarlord: true,
        wargear: { "option-2": 1 },
      }],
    }],
    attachments: [{
      id: "attachment-1",
      members: [
        { rosterUnitId: "unit-1", attachmentType: "bodyguard" },
        { rosterUnitId: "unit-2", attachmentType: "leader" },
      ],
    }],
  }], 879);

  const [roster] = parseImportedRosters(source);

  assert.equal(roster.id, "roster-1");
  assert.equal(roster.dataVersion, 879);
  assert.deepEqual(roster.detachmentIds, ["detachment-1"]);
  assert.deepEqual(roster.listSummary, {
    detachmentPoints: 1,
    pointsTotal: 120,
    validationState: "invalid",
  });
  assert.deepEqual(roster.units, [{
    id: "unit-1",
    allyType: "native",
    datasheetId: "datasheet-1",
    compositionId: "composition-1",
    wargear: { "option-1": 2 },
    unitEnhancements: [{ id: "enhancement-1" }],
    miniatureEnhancements: [{ id: "enhancement-2", targetId: "miniature-target-1" }],
    allegianceAbilities: [{ id: "allegiance-1" }],
    miniatures: [{
      id: "miniature-row-1",
      rosterUnitMiniatureId: "miniature-target-1",
      miniatureId: "miniature-1",
      count: 1,
      isWarlord: true,
      wargear: { "option-2": 1 },
    }],
  }]);
  assert.deepEqual(roster.attachments, [{
    id: "attachment-1",
    members: [
      { rosterUnitId: "unit-1", attachmentType: "bodyguard" },
      { rosterUnitId: "unit-2", attachmentType: "leader" },
    ],
  }]);
});

test("Builder roster import strips non-schema runtime fields", () => {
  const source = serializeRosters([{
    id: "roster-1",
    name: "Roster",
    factionKeywordId: "faction-1",
    battleSizeId: "size-1",
    detachmentIds: ["detachment-1", 7, ""],
    unexpected: "drop me",
    units: [{
      id: "unit-1",
      allyType: "",
      datasheetId: "datasheet-1",
      compositionId: "composition-1",
      points: 999,
      wargear: { "option-1": 0, "option-2": "3", "": 4 },
      unitEnhancements: [{ id: "enhancement-1", targetId: "not-a-unit-field" }],
      allegianceAbilities: [{ id: "allegiance-1", targetId: "not-an-allegiance-field" }],
      miniatures: [{
        miniatureId: "miniature-1",
        count: "2",
        name: "Catalog name should win later",
        wargear: { "option-3": "1" },
      }],
    }],
    attachments: [],
  }], 879);

  const [roster] = parseImportedRosters(source);

  assert.equal("unexpected" in roster, false);
  assert.equal("points" in roster.units[0], false);
  assert.equal("name" in roster.units[0].miniatures[0], false);
  assert.equal(roster.units[0].allyType, "native");
  assert.deepEqual(roster.detachmentIds, ["detachment-1"]);
  assert.deepEqual(roster.units[0].wargear, { "option-2": 3 });
  assert.deepEqual(roster.units[0].unitEnhancements, [{ id: "enhancement-1" }]);
  assert.deepEqual(roster.units[0].allegianceAbilities, [{ id: "allegiance-1" }]);
  assert.deepEqual(roster.units[0].miniatures[0].wargear, { "option-3": 1 });
});

test("Builder roster import can avoid local id collisions", () => {
  const rosters = [
    { id: "existing", name: "First" },
    { id: "new", name: "Second" },
    { id: "new", name: "Third" },
  ];
  const ids = ["generated-1", "existing", "generated-2"];
  const next = rostersWithNonConflictingIds(rosters, ["existing"], () => ids.shift());

  assert.deepEqual(next.map((roster) => roster.id), ["generated-1", "new", "generated-2"]);
  assert.equal(next[0].name, "First");
  assert.equal(next[1], rosters[1]);
  assert.equal(next[2].name, "Third");
});

test("Builder roster import rejects unsupported or invalid files", () => {
  assert.throws(() => parseImportedRosters("{}"), /Unsupported roster export file/);
  assert.throws(() => parseImportedRosters(serializeRosters([{
    id: "roster-1",
    factionKeywordId: "faction-1",
  }], 879)), /invalid roster/);
  assert.throws(() => parseImportedRosters(serializeRosters([{
    id: "roster-1",
    factionKeywordId: "faction-1",
    battleSizeId: "size-1",
    attachedUnits: [],
  }], 879)), /Old roster format is not supported: Roster contains attachedUnits/);
  assert.throws(() => parseImportedRosters(serializeRosters([{
    id: "roster-1",
    factionKeywordId: "faction-1",
    battleSizeId: "size-1",
    units: [{
      id: "unit-1",
      datasheetId: "datasheet-1",
      compositionId: "composition-1",
      enhancementIds: [],
    }],
  }], 879)), /Old roster format is not supported: Roster unit contains enhancementIds/);
  assert.throws(() => parseImportedRosters(serializeRosters([{
    id: "roster-1",
    factionKeywordId: "faction-1",
    battleSizeId: "size-1",
    units: [{
      id: "unit-1",
      datasheetId: "datasheet-1",
      compositionId: "composition-1",
      miniatures: [{
        miniatureId: "miniature-1",
        enhancementIds: [],
      }],
    }],
  }], 879)), /Old roster format is not supported: Roster miniature contains enhancementIds/);
});
