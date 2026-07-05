import assert from "node:assert/strict";
import test from "node:test";
import {
  state,
  costForDetachment,
  defaultMiniatures,
  defaultWargear,
  factionScope,
  enhancementCandidateStatus,
  validateAllegianceAbilities,
  validateAlliedUnits,
  validateAttachedUnits,
  validateEnhancements,
  validateDetachmentDatasheets,
  validateDetachmentUniqueKeywords,
  validateKeywordRestrictions,
  validateSuccessorChapterEpicHeroes,
  validateUnitCompositions,
  unitSummary,
  validateRoster,
  validateWargearLoadouts,
  validateWarlord,
  realCatalog,
  withCatalog,
  messageCodes,
  rowNamed,
  factionNamed,
  battleSizeNamed,
  detachmentNamed,
  keywordNamed,
  miniatureNamed,
  datasheetNamed,
  combatPatrolDatasheetNamed,
  rosterUnitRef,
  rosterUnitFromDatasheetId,
  enhancementNamed,
  miniatureNamedForDatasheet,
  datasheetNamedForAlly,
  keywordIdsForDatasheet,
  alliedFactionWithParent,
  alliedFactionForRosterAndParent,
  alliedUnit,
  alliedUnitWarlord,
  allegianceGroup,
  allegianceAbility,
  allegianceAbilityWithRequiredWargear,
  allegianceUnit,
  defaultCompositionForDatasheet,
  defaultWargearUnit,
  miniatureInUnit,
  optionIdForMiniatureItem,
  setMiniatureWargear,
  enhancementTargetUnit,
  withMiniatureEnhancement,
  datasheetIdForEnhancementBodyguard
} from "./builder_validation_helpers.mjs";
export {
  assert,
  test,
  state,
  costForDetachment,
  defaultMiniatures,
  defaultWargear,
  factionScope,
  enhancementCandidateStatus,
  validateAllegianceAbilities,
  validateAlliedUnits,
  validateAttachedUnits,
  validateEnhancements,
  validateDetachmentDatasheets,
  validateDetachmentUniqueKeywords,
  validateKeywordRestrictions,
  validateSuccessorChapterEpicHeroes,
  validateUnitCompositions,
  unitSummary,
  validateRoster,
  validateWargearLoadouts,
  validateWarlord,
  realCatalog,
  withCatalog,
  messageCodes,
  rowNamed,
  factionNamed,
  battleSizeNamed,
  detachmentNamed,
  keywordNamed,
  miniatureNamed,
  datasheetNamed,
  combatPatrolDatasheetNamed,
  rosterUnitRef,
  rosterUnitFromDatasheetId,
  enhancementNamed,
  miniatureNamedForDatasheet,
  datasheetNamedForAlly,
  keywordIdsForDatasheet,
  alliedFactionWithParent,
  alliedFactionForRosterAndParent,
  alliedUnit,
  alliedUnitWarlord,
  allegianceGroup,
  allegianceAbility,
  allegianceAbilityWithRequiredWargear,
  allegianceUnit,
  defaultCompositionForDatasheet,
  defaultWargearUnit,
  miniatureInUnit,
  optionIdForMiniatureItem,
  setMiniatureWargear,
  enhancementTargetUnit,
  withMiniatureEnhancement,
  datasheetIdForEnhancementBodyguard,
};

export function countBy(rows, key) {
  const counts = {};
  for (const row of rows) {
    counts[String(row[key])] = (counts[String(row[key])] || 0) + 1;
  }
  return counts;
}

export function outsideFactionId(requiredFactionIds) {
  const required = new Set(requiredFactionIds);
  const faction = realCatalog.factionKeywords.find((row) => !factionScope(row.id).some((id) => required.has(id)));
  assert.ok(faction, `Expected a faction outside ${[...required].join(", ")}`);
  return faction.id;
}

export function outsideDatasheetId(datasheetId) {
  const datasheet = realCatalog.datasheets.find((row) => row.id !== datasheetId);
  assert.ok(datasheet, `Expected a datasheet outside ${datasheetId}`);
  return datasheet.id;
}

export function catalogWithOnlyEnhancementRequiredGroup(group) {
  const keywordRows = realCatalog.enhancementRequiredKeywordGroupKeywordsByGroupId.get(group.id) || [];
  const factionRows = realCatalog.enhancementRequiredKeywordGroupFactionsByGroupId.get(group.id) || [];
  return {
    ...realCatalog,
    enhancementRequiredKeywordGroupsByEnhancementId: new Map([[group.enhancementId, [group]]]),
    enhancementRequiredKeywordGroupKeywordsByGroupId: keywordRows.length ? new Map([[group.id, keywordRows]]) : new Map(),
    enhancementRequiredKeywordGroupFactionsByGroupId: factionRows.length ? new Map([[group.id, factionRows]]) : new Map(),
    enhancementExcludedKeywordsByEnhancementId: new Map(),
    enhancementRequiredWargearItemsByEnhancementId: new Map(),
    enhancementBodyguardGroupsByEnhancementId: new Map(),
    enhancementBodyguardGroupDatasheetsByGroupId: new Map(),
    enhancementBodyguardGroupKeywordsByGroupId: new Map(),
  };
}

export function enhancementRequiredGroupFixture(group, options = {}) {
  const enhancement = realCatalog.enhancementById.get(group.enhancementId);
  assert.ok(enhancement, `Expected enhancement ${group.enhancementId}`);
  const detachment = realCatalog.detachmentById.get(enhancement.detachmentId);
  assert.ok(detachment, `Expected detachment ${enhancement.detachmentId}`);
  const keywordRows = realCatalog.enhancementRequiredKeywordGroupKeywordsByGroupId.get(group.id) || [];
  const factionRows = realCatalog.enhancementRequiredKeywordGroupFactionsByGroupId.get(group.id) || [];
  const requiredKeywordIds = keywordRows
    .map((row) => row.keywordId)
    .filter((id) => id !== options.missingKeywordId);
  const characterKeywordId = keywordNamed("Character").id;
  const targetKeywordIds = new Set(requiredKeywordIds);
  if (options.missingKeywordId !== characterKeywordId) {
    targetKeywordIds.add(characterKeywordId);
  }
  const requiredFactionIds = factionRows.map((row) => row.factionKeywordId);
  const factionKeywordId = options.missingFaction
    ? outsideFactionId(requiredFactionIds)
    : (requiredFactionIds[0] || factionNamed("Adeptus Astartes").id);
  const datasheetId = options.wrongDatasheet
    ? outsideDatasheetId(group.datasheetId)
    : (group.datasheetId || datasheetNamed("Captain").id);
  const targetId = `${group.id}:model`;
  const unit = {
    id: `${group.id}:unit:${options.label || "valid"}`,
    name: `${enhancement.name} required keyword fixture`,
    datasheetId,
    allyType: "native",
    factionKeywordIds: options.missingFaction ? [] : requiredFactionIds,
    keywordIds: enhancement.enhancementType === "miniature" && options.missingKeywordId !== characterKeywordId
      ? [characterKeywordId]
      : [...targetKeywordIds],
    conditionalKeywordIds: enhancement.enhancementType === "miniature" ? [...targetKeywordIds] : [],
    keywordNames: [],
    isWarlord: false,
    warlordMiniatureIds: [],
    unitEnhancements: enhancement.enhancementType === "miniature" ? [] : [{ id: enhancement.id }],
    miniatureEnhancements: enhancement.enhancementType === "miniature" ? [{ id: enhancement.id, targetId }] : [],
    wargear: {},
    miniatures: [{
      id: targetId,
      rosterUnitMiniatureId: targetId,
      miniatureId: `${group.id}:synthetic-miniature`,
      name: `${enhancement.name} target`,
      count: 1,
      isWarlord: false,
      wargear: {},
    }],
  };
  return {
    roster: {
      factionKeywordId,
      battleSizeId: battleSizeNamed("Strike Force").id,
      attachments: [],
    },
    detachment: { ...detachment, isCombatPatrol: false },
    unit,
  };
}

export function validateEnhancementRequiredGroup(group, options = {}) {
  const fixture = enhancementRequiredGroupFixture(group, options);
  const messages = [];
  withCatalog(catalogWithOnlyEnhancementRequiredGroup(group), () => {
    validateEnhancements(fixture.roster, [fixture.detachment], [fixture.unit], messages);
  });
  return messageCodes(messages);
}

export function catalogWithOnlyEnhancementExcludedKeyword(row) {
  return {
    ...realCatalog,
    enhancementRequiredKeywordGroupsByEnhancementId: new Map(),
    enhancementRequiredKeywordGroupKeywordsByGroupId: new Map(),
    enhancementRequiredKeywordGroupFactionsByGroupId: new Map(),
    enhancementExcludedKeywordsByEnhancementId: new Map([[row.enhancementId, [row]]]),
    enhancementRequiredWargearItemsByEnhancementId: new Map(),
    enhancementBodyguardGroupsByEnhancementId: new Map(),
    enhancementBodyguardGroupDatasheetsByGroupId: new Map(),
    enhancementBodyguardGroupKeywordsByGroupId: new Map(),
  };
}

export function catalogWithOnlyEnhancementRequiredWargear(row) {
  return {
    ...realCatalog,
    enhancementRequiredKeywordGroupsByEnhancementId: new Map(),
    enhancementRequiredKeywordGroupKeywordsByGroupId: new Map(),
    enhancementRequiredKeywordGroupFactionsByGroupId: new Map(),
    enhancementExcludedKeywordsByEnhancementId: new Map(),
    enhancementRequiredWargearItemsByEnhancementId: new Map([[row.enhancementId, [row]]]),
    enhancementBodyguardGroupsByEnhancementId: new Map(),
    enhancementBodyguardGroupDatasheetsByGroupId: new Map(),
    enhancementBodyguardGroupKeywordsByGroupId: new Map(),
  };
}

export function catalogWithOnlyEnhancementBodyguardGroup(group) {
  const datasheetRows = realCatalog.enhancementBodyguardGroupDatasheetsByGroupId.get(group.id) || [];
  return {
    ...realCatalog,
    enhancementRequiredKeywordGroupsByEnhancementId: new Map(),
    enhancementRequiredKeywordGroupKeywordsByGroupId: new Map(),
    enhancementRequiredKeywordGroupFactionsByGroupId: new Map(),
    enhancementExcludedKeywordsByEnhancementId: new Map(),
    enhancementRequiredWargearItemsByEnhancementId: new Map(),
    enhancementBodyguardGroupsByEnhancementId: new Map([[group.enhancementId, [group]]]),
    enhancementBodyguardGroupDatasheetsByGroupId: datasheetRows.length ? new Map([[group.id, datasheetRows]]) : new Map(),
    enhancementBodyguardGroupKeywordsByGroupId: new Map(),
  };
}

export function enhancementFixture(enhancement, options = {}) {
  const detachment = realCatalog.detachmentById.get(enhancement.detachmentId);
  assert.ok(detachment, `Expected detachment ${enhancement.detachmentId}`);
  const characterKeywordId = keywordNamed("Character").id;
  const targetKeywordIds = new Set([characterKeywordId, ...(options.targetKeywordIds || [])]);
  const targetId = `${options.id || enhancement.id}:model`;
  const datasheetId = options.datasheetId || datasheetNamed("Captain").id;
  const miniatureId = options.miniatureId || `${options.id || enhancement.id}:synthetic-miniature`;
  const miniature = {
    id: targetId,
    rosterUnitMiniatureId: targetId,
    miniatureId,
    name: `${enhancement.name} target`,
    count: 1,
    isWarlord: false,
    wargear: options.miniatureWargear || {},
  };
  const unit = {
    id: `${options.id || enhancement.id}:unit:${options.label || "fixture"}`,
    name: `${enhancement.name} fixture`,
    datasheetId,
    allyType: "native",
    factionKeywordIds: options.factionKeywordIds || [],
    keywordIds: enhancement.enhancementType === "miniature" ? [characterKeywordId] : [...targetKeywordIds],
    conditionalKeywordIds: enhancement.enhancementType === "miniature" ? [...targetKeywordIds] : [],
    keywordNames: [],
    isWarlord: false,
    warlordMiniatureIds: [],
    unitEnhancements: enhancement.enhancementType === "miniature" ? [] : [{ id: enhancement.id }],
    miniatureEnhancements: enhancement.enhancementType === "miniature" ? [{ id: enhancement.id, targetId }] : [],
    wargear: options.unitWargear || {},
    miniatures: [miniature],
  };
  return {
    roster: {
      factionKeywordId: options.factionKeywordId || factionNamed("Adeptus Astartes").id,
      battleSizeId: battleSizeNamed("Strike Force").id,
      attachments: options.attachments || [],
    },
    detachment: { ...detachment, isCombatPatrol: false },
    unit,
    miniature,
  };
}

export function validateEnhancementExcludedKeyword(row, options = {}) {
  const enhancement = realCatalog.enhancementById.get(row.enhancementId);
  assert.ok(enhancement, `Expected enhancement ${row.enhancementId}`);
  const fixture = enhancementFixture(enhancement, {
    id: `${row.enhancementId}:${row.keywordId}`,
    label: options.withKeyword ? "with-excluded-keyword" : "without-excluded-keyword",
    targetKeywordIds: options.withKeyword ? [row.keywordId] : [],
  });
  const messages = [];
  withCatalog(catalogWithOnlyEnhancementExcludedKeyword(row), () => {
    validateEnhancements(fixture.roster, [fixture.detachment], [fixture.unit], messages);
  });
  return messageCodes(messages);
}

export function optionForWargearItem(wargearItemId) {
  const option = realCatalog.wargearOptions.find((row) => row.wargearItemId === wargearItemId);
  assert.ok(option, `Expected wargear option for item ${wargearItemId}`);
  const group = realCatalog.wargearGroupById.get(option.wargearOptionGroupId);
  assert.ok(group, `Expected wargear option group ${option.wargearOptionGroupId}`);
  return { option, group };
}

export function validateEnhancementRequiredWargear(row, options = {}) {
  const enhancement = realCatalog.enhancementById.get(row.enhancementId);
  assert.ok(enhancement, `Expected enhancement ${row.enhancementId}`);
  const { option, group } = optionForWargearItem(row.wargearItemId);
  const fixture = enhancementFixture(enhancement, {
    id: `${row.enhancementId}:${row.wargearItemId}`,
    label: options.equipped ? "equipped" : "missing-wargear",
    datasheetId: group.datasheetId,
    miniatureId: group.miniatureId,
    miniatureWargear: options.equipped ? { [option.id]: 1 } : {},
  });
  const messages = [];
  withCatalog(catalogWithOnlyEnhancementRequiredWargear(row), () => {
    validateEnhancements(fixture.roster, [fixture.detachment], [fixture.unit], messages);
  });
  return messageCodes(messages);
}

export function bodyguardFixture(group, options = {}) {
  const enhancement = realCatalog.enhancementById.get(group.enhancementId);
  assert.ok(enhancement, `Expected enhancement ${group.enhancementId}`);
  const datasheetRow = realCatalog.enhancementBodyguardGroupDatasheetsByGroupId.get(group.id)?.[0];
  assert.ok(datasheetRow, `Expected bodyguard datasheet row for ${group.id}`);
  const requiredFactionKeywordId = group.factionKeywordId || factionNamed("Adeptus Astartes").id;
  const factionKeywordId = options.wrongFaction
    ? outsideFactionId([requiredFactionKeywordId])
    : requiredFactionKeywordId;
  const leaderFixture = enhancementFixture(enhancement, {
    id: `${group.id}:leader`,
    factionKeywordId,
  });
  const bodyguardDatasheetId = options.wrongDatasheet
    ? outsideDatasheetId(datasheetRow.datasheetId)
    : datasheetRow.datasheetId;
  const bodyguard = {
    id: `${group.id}:bodyguard:${options.wrongDatasheet ? "wrong" : "valid"}`,
    name: realCatalog.datasheetById.get(bodyguardDatasheetId)?.name || "Bodyguard",
    datasheetId: bodyguardDatasheetId,
    allyType: "native",
    factionKeywordIds: [],
    keywordIds: keywordIdsForDatasheet(bodyguardDatasheetId),
    keywordNames: [],
    warlordMiniatureIds: [],
    unitEnhancements: [],
    miniatureEnhancements: [],
    wargear: {},
    miniatures: [],
  };
  const attachments = options.attached ? [{
    id: `${group.id}:attachment`,
    members: [
      { rosterUnitId: leaderFixture.unit.id, attachmentType: options.attachmentType || group.bodyguardType },
      { rosterUnitId: bodyguard.id, attachmentType: "bodyguard" },
    ],
  }] : [];
  return {
    roster: {
      ...leaderFixture.roster,
      attachments,
    },
    detachment: leaderFixture.detachment,
    units: [leaderFixture.unit, bodyguard],
  };
}

export function validateEnhancementBodyguardGroup(group, options = {}) {
  const fixture = bodyguardFixture(group, options);
  const messages = [];
  withCatalog(catalogWithOnlyEnhancementBodyguardGroup(group), () => {
    validateEnhancements(fixture.roster, [fixture.detachment], fixture.units, messages);
  });
  return messageCodes(messages);
}

export const ENHANCEMENT_FLAG_SIZE_ID = "enhancement-flag-size";

export function catalogWithOnlyEnhancementFlags(enhancements, enhancementLimit = 9999) {
  return {
    ...realCatalog,
    enhancements,
    enhancementById: new Map(enhancements.map((enhancement) => [enhancement.id, enhancement])),
    battleSizeById: new Map([
      ...realCatalog.battleSizeById.entries(),
      [ENHANCEMENT_FLAG_SIZE_ID, { id: ENHANCEMENT_FLAG_SIZE_ID, name: "Enhancement Flag Size", enhancementLimit }],
    ]),
    enhancementRequiredKeywordGroupsByEnhancementId: new Map(),
    enhancementRequiredKeywordGroupKeywordsByGroupId: new Map(),
    enhancementRequiredKeywordGroupFactionsByGroupId: new Map(),
    enhancementExcludedKeywordsByEnhancementId: new Map(),
    enhancementRequiredWargearItemsByEnhancementId: new Map(),
    enhancementBodyguardGroupsByEnhancementId: new Map(),
    enhancementBodyguardGroupDatasheetsByGroupId: new Map(),
    enhancementBodyguardGroupKeywordsByGroupId: new Map(),
  };
}

export function correctTargetKindForEnhancement(enhancement) {
  return enhancement.enhancementType === "miniature" ? "miniature" : "unit";
}

export function enhancementFlagUnit(enhancement, index = 0, options = {}) {
  const targetKind = options.targetKind || correctTargetKindForEnhancement(enhancement);
  const keywordIds = (options.keywordNames || [])
    .map((name) => keywordNamed(name).id);
  const targetId = `${enhancement.id}:${targetKind}:${index}:model`;
  return {
    id: `${enhancement.id}:${targetKind}:${index}:unit`,
    name: `${enhancement.name} flag fixture ${index}`,
    datasheetId: datasheetNamed("Captain").id,
    allyType: options.allyType || "native",
    factionKeywordIds: options.factionKeywordIds || [factionNamed("Adeptus Astartes").id],
    keywordIds: targetKind === "unit" ? keywordIds : [],
    conditionalKeywordIds: targetKind === "miniature" ? keywordIds : [],
    keywordNames: [],
    isWarlord: false,
    warlordMiniatureIds: [],
    unitEnhancements: targetKind === "unit" ? [{ id: enhancement.id }] : [],
    miniatureEnhancements: targetKind === "miniature" ? [{ id: enhancement.id, targetId }] : [],
    wargear: {},
    miniatures: [{
      id: targetId,
      rosterUnitMiniatureId: targetId,
      miniatureId: `${enhancement.id}:${targetKind}:${index}:miniature`,
      name: `${enhancement.name} model ${index}`,
      count: 1,
      isWarlord: false,
      wargear: {},
    }],
  };
}

export function validateEnhancementFlagRows(enhancements, units, enhancementLimit = 9999) {
  const messages = [];
  const detachments = enhancements.map((enhancement) => {
    const detachment = realCatalog.detachmentById.get(enhancement.detachmentId);
    assert.ok(detachment, `Expected detachment ${enhancement.detachmentId}`);
    return { ...detachment, isCombatPatrol: false };
  });
  withCatalog(catalogWithOnlyEnhancementFlags(enhancements, enhancementLimit), () => {
    validateEnhancements(
      {
        factionKeywordId: factionNamed("Adeptus Astartes").id,
        battleSizeId: ENHANCEMENT_FLAG_SIZE_ID,
        attachments: [],
      },
      detachments,
      units,
      messages
    );
  });
  return messageCodes(messages);
}
