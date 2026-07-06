import assert from "node:assert/strict";
import test from "node:test";
import {
  availableCompositions,
  availableDatasheets,
  availableDetachments,
  battleSizeNamed,
  compositionFactionIds,
  datasheetIsCombatPatrol,
  factionNamed,
  keywordNamed,
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
  assert.deepEqual(rosterWithRemovedUnit(withSupport, "leader-1").attachments, []);
  assert.deepEqual(rosterWithRemovedUnit(withSupport, "unattached-unit").attachments, withSupport.attachments);
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
  const combatPatrolDetachmentRow = realCatalog.detachmentFactionKeywords
    .find((row) => realCatalog.detachmentById.get(row.detachmentId)?.isCombatPatrol);
  assert.ok(combatPatrolDetachmentRow, "Expected a Combat Patrol detachment row");
  assert.equal(rosterWithAddedDetachment({
    ...roster,
    factionKeywordId: combatPatrolDetachmentRow.factionKeywordId,
  }, combatPatrolDetachmentRow.detachmentId).detachmentIds.length, 0);
  const factionDetachmentIds = new Set(availableDetachments(faction.id).map((row) => row.id));
  const foreignDetachment = availableDetachments(factionNamed("Adeptus Astartes").id)
    .find((row) => !factionDetachmentIds.has(row.id));
  assert.ok(foreignDetachment, "Expected a detachment unavailable to Heretic Astartes");
  assert.equal(rosterWithAddedDetachment(roster, foreignDetachment.id), roster);

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

test("builder roster action rejects datasheets unavailable to the roster", () => {
  state.catalog = realCatalog;
  const roster = {
    id: "unavailable-datasheet-action-roster",
    name: "Unavailable Datasheet Action Roster",
    factionKeywordId: factionNamed("Heretic Astartes").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [],
    units: [],
    attachments: [],
  };
  const combatPatrolDatasheet = realCatalog.datasheets.find((datasheet) => datasheetIsCombatPatrol(datasheet));
  assert.ok(combatPatrolDatasheet, "Expected a Combat Patrol datasheet");
  assert.equal(rosterWithAddedUnit(roster, {
    datasheetId: combatPatrolDatasheet.id,
    unitId: "combat-patrol-unit",
  }), roster);

  const nativeIds = new Set(availableDatasheets(roster, "native").map((datasheet) => datasheet.id));
  const otherRoster = {
    ...roster,
    factionKeywordId: factionNamed("Adeptus Astartes").id,
  };
  const foreignDatasheet = availableDatasheets(otherRoster, "native")
    .find((datasheet) => !nativeIds.has(datasheet.id));
  assert.ok(foreignDatasheet, "Expected a datasheet unavailable to Heretic Astartes");
  assert.equal(rosterWithAddedUnit(roster, {
    datasheetId: foreignDatasheet.id,
    unitId: "foreign-unit",
  }), roster);
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

  const composition = availableCompositions(
    datasheet.id,
    compositionFactionIds(roster, "native"),
    roster.detachmentIds || []
  )
    .find((row) => row.id !== unit.compositionId);
  if (composition) {
    const changed = rosterWithUnitComposition(withUnit, unit.id, composition.id);
    assert.equal(changed.units[0].compositionId, composition.id);
    assert.notDeepEqual(changed.units[0].miniatures, unit.miniatures);
  }
  const otherDatasheetComposition = realCatalog.unitCompositions
    .find((row) => row.datasheetId !== unit.datasheetId);
  assert.ok(otherDatasheetComposition, "Expected a composition from another datasheet");
  assert.equal(
    rosterWithUnitComposition(withUnit, unit.id, otherDatasheetComposition.id),
    withUnit
  );
  const requiredDetachmentCompositionRow = realCatalog.compositionRequiredDetachments
    .map((row) => ({
      composition: realCatalog.compositionById.get(row.unitCompositionId),
      row,
    }))
    .find(({ composition }) => (
      composition
      && realCatalog.datasheetFactionKeywords.some((item) => item.datasheetId === composition.datasheetId)
    ));
  assert.ok(requiredDetachmentCompositionRow, "Expected a detachment-required composition");
  const requiredDetachmentFaction = realCatalog.datasheetFactionKeywords
    .find((item) => item.datasheetId === requiredDetachmentCompositionRow.composition.datasheetId);
  const restrictedRoster = {
    id: "restricted-composition-roster",
    factionKeywordId: requiredDetachmentFaction.factionKeywordId,
    detachmentIds: [],
    units: [{
      id: "restricted-composition-unit",
      allyType: "native",
      compositionId: "existing-composition",
      datasheetId: requiredDetachmentCompositionRow.composition.datasheetId,
      miniatureEnhancements: [],
      miniatures: [],
      unitEnhancements: [],
      wargear: {},
    }],
  };
  assert.equal(
    rosterWithUnitComposition(
      restrictedRoster,
      "restricted-composition-unit",
      requiredDetachmentCompositionRow.composition.id
    ),
    restrictedRoster
  );

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
  const otherDatasheetOption = realCatalog.wargearOptions.find((row) => {
    const rowGroup = realCatalog.wargearGroupById.get(row.wargearOptionGroupId);
    return rowGroup && rowGroup.datasheetId !== unit.datasheetId;
  });
  assert.ok(otherDatasheetOption, "Expected a wargear option from another datasheet");
  assert.equal(rosterWithUnitWargearCount(withUnit, unit.id, {
    optionId: otherDatasheetOption.id,
    count: 1,
  }), withUnit);
  const modelOnlyGroup = (realCatalog.wargearGroupsByDatasheetId.get(datasheet.id) || [])
    .find((row) => row.miniatureId && unit.miniatures.some((item) => item.miniatureId === row.miniatureId));
  if (modelOnlyGroup) {
    const modelOnlyOption = (realCatalog.wargearOptionsByGroupId.get(modelOnlyGroup.id) || [])[0];
    assert.ok(modelOnlyOption, "Expected a model-only wargear option");
    assert.equal(rosterWithUnitWargearCount(withUnit, unit.id, {
      optionId: modelOnlyOption.id,
      count: 1,
    }), withUnit);
  }
  const unitOnlyGroup = (realCatalog.wargearGroupsByDatasheetId.get(datasheet.id) || [])
    .find((row) => !row.miniatureId);
  if (unitOnlyGroup && unit.miniatures[0]) {
    const unitOnlyOption = (realCatalog.wargearOptionsByGroupId.get(unitOnlyGroup.id) || [])[0];
    assert.ok(unitOnlyOption, "Expected a unit-level wargear option");
    assert.equal(rosterWithUnitWargearCount(withUnit, unit.id, {
      optionId: unitOnlyOption.id,
      count: 1,
      rosterUnitMiniatureId: unit.miniatures[0].rosterUnitMiniatureId,
    }), withUnit);
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
