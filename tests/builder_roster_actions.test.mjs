import assert from "node:assert/strict";
import test from "node:test";
import {
  availableDatasheets,
  availableDetachments,
  battleSizeNamed,
  factionNamed,
  realCatalog,
  state,
  validateRoster,
  withCatalog,
} from "./builder_validation_helpers.mjs";
import {
  rosterWithAddedAttachment,
  rosterWithAddedDetachment,
  rosterWithAddedUnit,
  rosterWithMiniatureEnhancement,
  rosterWithRemovedAttachment,
  rosterWithRemovedAttachmentMember,
  rosterWithRemovedDetachment,
  rosterWithRemovedUnit,
  rosterWithUnitAllegianceAbility,
  rosterWithUnitDefaultWargear,
  rosterWithUnitEnhancement,
  rosterWithUnitComposition,
  rosterWithUnitWargearCount,
  rosterWithWarlord,
} from "../HereticBuilder/static/builder_roster_actions.js";

test("builder roster actions manage current-shape attachment groups", () => {
  const roster = {
    id: "attachment-roster",
    attachments: [],
    units: [
      { id: "leader-1", datasheetId: "leader" },
      { id: "support-1", datasheetId: "support" },
      { id: "bodyguard-1", datasheetId: "bodyguard" },
    ],
  };

  const withLeader = rosterWithAddedAttachment(roster, {
    attachedUnitId: "leader-1",
    attachmentId: "attachment-1",
    attachmentType: "leader",
    bodyguardUnitId: "bodyguard-1",
  });
  assert.deepEqual(withLeader.attachments, [{
    id: "attachment-1",
    members: [
      { rosterUnitId: "leader-1", attachmentType: "leader" },
      { rosterUnitId: "bodyguard-1", attachmentType: "bodyguard" },
    ],
  }]);

  const withSupport = rosterWithAddedAttachment(withLeader, {
    attachedUnitId: "support-1",
    attachmentId: "ignored-new-id",
    attachmentType: "support",
    bodyguardUnitId: "bodyguard-1",
  });
  assert.equal(withSupport.attachments.length, 1);
  assert.deepEqual(withSupport.attachments[0].members, [
    { rosterUnitId: "leader-1", attachmentType: "leader" },
    { rosterUnitId: "bodyguard-1", attachmentType: "bodyguard" },
    { rosterUnitId: "support-1", attachmentType: "support" },
  ]);

  assert.equal(rosterWithAddedAttachment(withSupport, {
    attachedUnitId: "leader-1",
    attachmentId: "attachment-2",
    attachmentType: "leader",
    bodyguardUnitId: "support-1",
  }).attachments.length, 1);

  const withoutSupport = rosterWithRemovedAttachmentMember(withSupport, "attachment-1", "support-1");
  assert.deepEqual(withoutSupport.attachments[0].members, [
    { rosterUnitId: "leader-1", attachmentType: "leader" },
    { rosterUnitId: "bodyguard-1", attachmentType: "bodyguard" },
  ]);

  const withoutLeader = rosterWithRemovedAttachmentMember(withoutSupport, "attachment-1", "leader-1");
  assert.deepEqual(withoutLeader.attachments, []);

  assert.deepEqual(rosterWithRemovedAttachment(withSupport, "attachment-1").attachments, []);
  assert.deepEqual(rosterWithRemovedUnit(withSupport, "bodyguard-1").attachments, []);

  const ignoredLegacyAttachment = rosterWithRemovedUnit({
    ...roster,
    attachments: [{
      id: "legacy-attachment",
      bodyguardUnitId: "bodyguard-1",
      leaderUnitId: "leader-1",
    }],
  }, "bodyguard-1");
  assert.deepEqual(ignoredLegacyAttachment.attachments, [{
    id: "legacy-attachment",
    bodyguardUnitId: "bodyguard-1",
    leaderUnitId: "leader-1",
  }]);
});

test("builder roster action rejects invalid attachment pairs when summaries are supplied", () => {
  const catalog = {
    ...realCatalog,
    datasheetBodyguardGroupsByDatasheetId: new Map([["leader-datasheet", [{
      id: "leader-bodyguard-group",
      datasheetId: "leader-datasheet",
      bodyguardType: "leader",
      factionKeywordId: "",
      excludedDetachmentId: "",
      requiredDetachmentId: "",
      requiresAllUnitsHaveKeywordId: "",
    }]]]),
    datasheetBodyguardGroupDatasheetsByGroupId: new Map([
      ["leader-bodyguard-group", [{ datasheetId: "bodyguard-datasheet" }]],
    ]),
    datasheetBodyguardGroupKeywordsByGroupId: new Map(),
  };
  const roster = {
    id: "attachment-guard-roster",
    factionKeywordId: "faction",
    detachmentIds: [],
    attachments: [],
  };
  const units = [
    { id: "leader", name: "Leader", datasheetId: "leader-datasheet", keywordIds: [] },
    { id: "bodyguard", name: "Bodyguard", datasheetId: "bodyguard-datasheet", keywordIds: [] },
    { id: "wrong-bodyguard", name: "Wrong Bodyguard", datasheetId: "wrong-datasheet", keywordIds: [] },
  ];

  withCatalog(catalog, () => {
    const invalid = rosterWithAddedAttachment(roster, {
      attachedUnitId: "leader",
      attachmentId: "invalid-attachment",
      attachmentType: "leader",
      bodyguardUnitId: "wrong-bodyguard",
      units,
    });
    assert.equal(invalid, roster);

    const valid = rosterWithAddedAttachment(roster, {
      attachedUnitId: "leader",
      attachmentId: "valid-attachment",
      attachmentType: "leader",
      bodyguardUnitId: "bodyguard",
      units,
    });
    assert.deepEqual(valid.attachments, [{
      id: "valid-attachment",
      members: [
        { rosterUnitId: "leader", attachmentType: "leader" },
        { rosterUnitId: "bodyguard", attachmentType: "bodyguard" },
      ],
    }]);
  });
});

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

test("builder roster actions add and remove detachments and default units", () => {
  state.catalog = realCatalog;
  const faction = factionNamed("Heretic Astartes");
  const roster = {
    id: "action-roster",
    name: "Action Roster",
    factionKeywordId: faction.id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [],
    units: [],
    attachments: [],
  };

  const detachment = availableDetachments(faction.id)[0];
  assert.ok(detachment, "Expected an available detachment");
  const withDetachment = rosterWithAddedDetachment(roster, detachment.id);
  assert.deepEqual(withDetachment.detachmentIds, [detachment.id]);
  assert.equal(rosterWithAddedDetachment(withDetachment, detachment.id).detachmentIds.length, 1);

  const datasheet = availableDatasheets(withDetachment, "native")[0];
  assert.ok(datasheet, "Expected an available datasheet");
  const withUnit = rosterWithAddedUnit(withDetachment, {
    datasheetId: datasheet.id,
    unitId: "unit-1",
  });
  assert.equal(withUnit.units.length, 1);
  assert.equal(withUnit.units[0].datasheetId, datasheet.id);
  assert.equal(withUnit.units[0].allyType, "native");
  assert.ok(withUnit.units[0].compositionId);
  assert.ok(withUnit.units[0].miniatures.length > 0);
  assert.ok(withUnit.units[0].miniatures.every((miniature) => miniature.rosterUnitMiniatureId));
  assert.equal(validateRoster(withUnit).messages.some((message) => message.code === "unit.composition_missing"), false);

  const removedUnit = rosterWithRemovedUnit(withUnit, "unit-1");
  assert.deepEqual(removedUnit.units, []);
  const removedDetachment = rosterWithRemovedDetachment(removedUnit, 0);
  assert.deepEqual(removedDetachment.detachmentIds, []);
});

test("builder roster actions update unit composition and scoped wargear", () => {
  state.catalog = realCatalog;
  const faction = factionNamed("Heretic Astartes");
  const roster = {
    id: "action-roster-wargear",
    name: "Action Roster",
    factionKeywordId: faction.id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [],
    units: [],
    attachments: [],
  };
  const datasheet = availableDatasheets(roster, "native")
    .find((row) => (realCatalog.wargearGroupsByDatasheetId.get(row.id) || []).length);
  assert.ok(datasheet, "Expected a datasheet with wargear groups");
  const withUnit = rosterWithAddedUnit(roster, {
    datasheetId: datasheet.id,
    unitId: "unit-1",
  });
  const unit = withUnit.units[0];

  const composition = (realCatalog.compositionsByDatasheetId.get(datasheet.id) || [])
    .find((row) => row.id !== unit.compositionId);
  if (composition) {
    const changed = rosterWithUnitComposition(withUnit, unit.id, composition.id);
    assert.equal(changed.units[0].compositionId, composition.id);
    assert.notDeepEqual(changed.units[0].miniatures, unit.miniatures);
  }

  const group = (realCatalog.wargearGroupsByDatasheetId.get(datasheet.id) || [])
    .find((row) => !row.miniatureId || unit.miniatures.some((miniature) => miniature.miniatureId === row.miniatureId));
  assert.ok(group, "Expected a scoped wargear group");
  const option = (realCatalog.wargearOptionsByGroupId.get(group.id) || [])[0];
  assert.ok(option, "Expected a wargear option");
  const miniature = group.miniatureId
    ? unit.miniatures.find((row) => row.miniatureId === group.miniatureId)
    : null;
  const changedWargear = rosterWithUnitWargearCount(withUnit, unit.id, {
    optionId: option.id,
    count: 2,
    rosterUnitMiniatureId: miniature?.rosterUnitMiniatureId || "",
  });
  if (miniature) {
    const changedMiniature = changedWargear.units[0].miniatures.find((row) => row.rosterUnitMiniatureId === miniature.rosterUnitMiniatureId);
    assert.equal(changedMiniature.wargear[option.id], 2);
  } else {
    assert.equal(changedWargear.units[0].wargear[option.id], 2);
  }
  const resetWargear = rosterWithUnitDefaultWargear({
    ...changedWargear,
    units: changedWargear.units.map((row) => row.id === unit.id
      ? {
        ...row,
        miniatures: row.miniatures.map((item, index) => ({
          ...item,
          isWarlord: index === 0,
        })),
      }
      : row),
  }, unit.id);
  assert.deepEqual(resetWargear.units[0].wargear, unit.wargear);
  assert.deepEqual(
    resetWargear.units[0].miniatures.map((row) => row.wargear),
    unit.miniatures.map((row) => row.wargear)
  );
  assert.deepEqual(
    resetWargear.units[0].miniatures.map((row) => row.rosterUnitMiniatureId),
    unit.miniatures.map((row) => row.rosterUnitMiniatureId)
  );
  assert.equal(resetWargear.units[0].miniatures[0].isWarlord, true);

  const unitEnhancement = realCatalog.enhancements.find((row) => row.enhancementType !== "miniature");
  assert.ok(unitEnhancement, "Expected a unit enhancement");
  const withUnitEnhancement = rosterWithUnitEnhancement(withUnit, unit.id, unitEnhancement.id);
  assert.deepEqual(withUnitEnhancement.units[0].unitEnhancements, [{ id: unitEnhancement.id }]);
  assert.deepEqual(rosterWithUnitEnhancement(withUnitEnhancement, unit.id, "").units[0].unitEnhancements, []);

  const miniatureEnhancement = realCatalog.enhancements.find((row) => row.enhancementType === "miniature");
  assert.ok(miniatureEnhancement, "Expected a miniature enhancement");
  const targetMiniature = unit.miniatures[0];
  const withMiniatureEnhancement = rosterWithMiniatureEnhancement(withUnit, unit.id, {
    enhancementId: miniatureEnhancement.id,
    rosterUnitMiniatureId: targetMiniature.rosterUnitMiniatureId,
  });
  assert.deepEqual(withMiniatureEnhancement.units[0].miniatureEnhancements, [{
    id: miniatureEnhancement.id,
    targetId: targetMiniature.rosterUnitMiniatureId,
  }]);
  assert.deepEqual(rosterWithMiniatureEnhancement(withMiniatureEnhancement, unit.id, {
    enhancementId: "",
    rosterUnitMiniatureId: targetMiniature.rosterUnitMiniatureId,
  }).units[0].miniatureEnhancements, []);

  const withSecondUnit = rosterWithAddedUnit(withUnit, {
    datasheetId: datasheet.id,
    unitId: "unit-2",
  });
  const secondUnit = withSecondUnit.units[1];
  const firstWarlord = rosterWithWarlord(withSecondUnit, {
    rosterUnitMiniatureId: targetMiniature.rosterUnitMiniatureId,
    unitId: unit.id,
  });
  assert.equal(firstWarlord.units[0].miniatures[0].isWarlord, true);
  assert.equal(firstWarlord.units[1].miniatures[0].isWarlord, false);

  const secondTarget = secondUnit.miniatures[0].rosterUnitMiniatureId;
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
