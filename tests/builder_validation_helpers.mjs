import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

global.document = { querySelector: () => null };

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

global.fetch = async (path) => {
  const rawPath = String(path || "");
  const relativePath = rawPath.startsWith("/") ? rawPath.slice(1) : rawPath;
  const filePath = join(projectRoot, "dist", relativePath);
  try {
    const body = await readFile(filePath, "utf8");
    return {
      ok: true,
      status: 200,
      json: async () => JSON.parse(body),
    };
  } catch {
    return {
      ok: false,
      status: 404,
      json: async () => {
        throw new Error(`Missing test fixture file: ${filePath}`);
      },
    };
  }
};

const { loadCatalog } = await import("../HereticBuilder/static/builder_catalog.js");
const { state } = await import("../HereticBuilder/static/builder_state.js");
const {
  availableCompositions,
  costForDetachment,
  defaultMiniatures,
  defaultWargear,
  conditionalKeywordApplies,
  factionScope,
  enhancementPoints,
  unitSummary,
} = await import("../HereticBuilder/static/builder_model.js");
const { validateAllegianceAbilities } = await import("../HereticBuilder/static/builder_allegiance_rules.js");
const { validateAlliedUnits } = await import("../HereticBuilder/static/builder_allied_rules.js");
const { validateAttachedUnits } = await import("../HereticBuilder/static/builder_attachment_rules.js");
const { validateEnhancements } = await import("../HereticBuilder/static/builder_enhancement_rules.js");
const {
  validateDetachmentDatasheets,
  validateDetachmentUniqueKeywords,
  validateKeywordRestrictions,
  validateSuccessorChapterEpicHeroes,
  validateUnitCompositions,
} = await import("../HereticBuilder/static/builder_restriction_rules.js");
const { validateRoster } = await import("../HereticBuilder/static/builder_rules.js");
const { validateWargearLoadouts } = await import("../HereticBuilder/static/builder_wargear_rules.js");
const { validateWarlord } = await import("../HereticBuilder/static/builder_warlord_rules.js");
const { canonicalWargearKey } = await import("../HereticBuilder/static/builder_loadout_math.js");

const realCatalog = await loadCatalog();
state.catalog = realCatalog;

function withCatalog(catalog, callback) {
  const previous = state.catalog;
  state.catalog = catalog;
  try {
    callback();
  } finally {
    state.catalog = previous;
  }
}

function messageCodes(messages) {
  return messages.map((message) => message.code);
}

function rowNamed(rows, name) {
  const row = rows.find((item) => item.name === name);
  assert.ok(row, `Expected catalog row named ${name}`);
  return row;
}

function factionNamed(name) {
  return rowNamed(realCatalog.factionKeywords, name);
}

function battleSizeNamed(name) {
  return rowNamed(realCatalog.battleSizes, name);
}

function detachmentNamed(name) {
  return rowNamed(realCatalog.detachments, name);
}

function keywordNamed(name) {
  return rowNamed(realCatalog.keywords, name);
}

function miniatureNamed(name) {
  return rowNamed(realCatalog.miniatures, name);
}

function datasheetNamed(name) {
  return rowNamed(realCatalog.datasheets, name);
}

function combatPatrolDatasheetNamed(name) {
  const datasheet = realCatalog.datasheets.find((item) => (
    item.name === name && realCatalog.publicationById.get(item.publicationId)?.isCombatPatrol
  ));
  assert.ok(datasheet, `Expected Combat Patrol datasheet ${name}`);
  return datasheet;
}

function rosterUnitRef(datasheetName, id, extra = {}) {
  return {
    id,
    datasheetId: datasheetNamed(datasheetName).id,
    ...extra,
  };
}

function rosterUnitFromDatasheetId(datasheetId, id) {
  const datasheet = realCatalog.datasheetById.get(datasheetId);
  assert.ok(datasheet, `Expected datasheet ${datasheetId}`);
  const miniature = (realCatalog.miniaturesByDatasheetId.get(datasheetId) || [])[0];
  return {
    id,
    name: datasheet.name,
    datasheetId,
    allyType: "native",
    factionKeywordIds: (realCatalog.datasheetFactionKeywordsByDatasheetId.get(datasheetId) || [])
      .map((row) => row.factionKeywordId),
    keywordIds: keywordIdsForDatasheet(datasheetId),
    keywordNames: [],
    warlordMiniatureIds: [],
    unitEnhancements: [],
    miniatureEnhancements: [],
    wargear: {},
    miniatures: miniature ? [{
      ...miniature,
      id: `${id}:${miniature.id}`,
      rosterUnitMiniatureId: `${id}:${miniature.id}`,
      miniatureId: miniature.id,
      name: miniature.name,
      count: 1,
      isWarlord: false,
      wargear: {},
    }] : [],
  };
}

function enhancementNamed(name, detachmentName = "") {
  const detachment = detachmentName ? detachmentNamed(detachmentName) : null;
  const enhancement = realCatalog.enhancements.find((item) => (
    item.name === name && (!detachment || item.detachmentId === detachment.id)
  ));
  assert.ok(enhancement, `Expected enhancement ${name}`);
  return enhancement;
}

function miniatureNamedForDatasheet(datasheetName, miniatureName) {
  const datasheet = datasheetNamed(datasheetName);
  const miniature = (realCatalog.miniaturesByDatasheetId.get(datasheet.id) || [])
    .find((item) => item.name === miniatureName);
  assert.ok(miniature, `Expected ${miniatureName} in ${datasheetName}`);
  return miniature;
}

function datasheetNamedForAlly(name, allyType) {
  const allowedIds = new Set(
    (realCatalog.alliedFactionDatasheetsByAlliedFactionId.get(allyType) || [])
      .map((row) => row.datasheetId)
  );
  const datasheet = realCatalog.datasheets.find((item) => item.name === name && allowedIds.has(item.id));
  assert.ok(datasheet, `Expected allied datasheet named ${name}`);
  return datasheet;
}

function keywordIdsForDatasheet(datasheetId) {
  const keywordIds = new Set();
  for (const miniature of realCatalog.miniaturesByDatasheetId.get(datasheetId) || []) {
    for (const row of realCatalog.miniatureKeywordsByMiniatureId.get(miniature.id) || []) {
      keywordIds.add(row.keywordId);
    }
  }
  return [...keywordIds];
}

function alliedFactionWithParent(parentFactionName) {
  const parent = factionNamed(parentFactionName);
  const row = realCatalog.alliedFactionParentFactionKeywords.find((item) => item.factionKeywordId === parent.id);
  assert.ok(row, `Expected allied faction parent ${parentFactionName}`);
  return row.alliedFactionId;
}

function alliedFactionForRosterAndParent(rosterFactionName, parentFactionName) {
  const rosterFaction = factionNamed(rosterFactionName);
  const parentFaction = factionNamed(parentFactionName);
  const row = (realCatalog.factionAlliedFactionsByFactionId.get(rosterFaction.id) || [])
    .find((item) => (
      realCatalog.alliedFactionParentsByAlliedFactionId.get(item.alliedFactionId) || []
    ).some((parent) => parent.factionKeywordId === parentFaction.id));
  assert.ok(row, `Expected ${parentFactionName} allies for ${rosterFactionName}`);
  return row.alliedFactionId;
}

function alliedUnit({ id, datasheetName, allyType, points = 100 }) {
  const datasheet = datasheetNamedForAlly(datasheetName, allyType);
  return {
    id: id || `${allyType}:${datasheet.id}:${points}`,
    name: datasheet.name,
    datasheetId: datasheet.id,
    allyType,
    keywordIds: keywordIdsForDatasheet(datasheet.id),
    points,
    warlordMiniatureIds: [],
  };
}

function alliedUnitWarlord(unit, miniatureName = "") {
  const miniature = (realCatalog.miniaturesByDatasheetId.get(unit.datasheetId) || [])
    .find((item) => !miniatureName || item.name === miniatureName);
  assert.ok(miniature, `Expected warlord miniature for ${unit.name}`);
  return {
    ...unit,
    warlordMiniatureIds: [miniature.id],
  };
}

function allegianceGroup(name, detachmentName = "", abilityNames = []) {
  const detachment = detachmentName ? detachmentNamed(detachmentName) : null;
  const group = realCatalog.allegianceAbilityGroups.find((item) => (
    item.name === name && (detachment ? item.detachmentId === detachment.id : !item.detachmentId)
    && abilityNames.every((abilityName) => (
      realCatalog.allegianceAbilitiesByGroupId.get(item.id) || []
    ).some((ability) => ability.name === abilityName))
  ));
  assert.ok(group, `Expected allegiance group ${name}`);
  return group;
}

function allegianceAbility(groupId, name, options = {}) {
  const ability = realCatalog.allegianceAbilities.find((item) => (
    item.allegianceAbilityGroupId === groupId
    && item.name === name
    && (!options.requiredWargear || item.requiresWargearItemId)
  ));
  assert.ok(ability, `Expected allegiance ability ${name}`);
  return {
    ...ability,
    groupId: ability.allegianceAbilityGroupId,
    groupName: realCatalog.allegianceAbilityGroupById.get(ability.allegianceAbilityGroupId)?.name,
  };
}

function allegianceAbilityWithRequiredWargear(groupName, abilityName) {
  const ability = realCatalog.allegianceAbilities.find((item) => (
    item.name === abilityName
    && item.requiresWargearItemId
    && realCatalog.allegianceAbilityGroupById.get(item.allegianceAbilityGroupId)?.name === groupName
  ));
  assert.ok(ability, `Expected ${groupName} / ${abilityName} to require wargear`);
  return {
    group: realCatalog.allegianceAbilityGroupById.get(ability.allegianceAbilityGroupId),
    ability: {
      ...ability,
      groupId: ability.allegianceAbilityGroupId,
      groupName,
    },
  };
}

function allegianceUnit({ id, group, abilities = [] }) {
  return {
    id,
    name: id,
    allegianceAbilityGroupId: group.id,
    allegianceAbilities: abilities,
    wargear: {},
    miniatures: [],
  };
}

function defaultCompositionForDatasheet(datasheetId) {
  const composition = (realCatalog.compositionsByDatasheetId.get(datasheetId) || [])
    .find((item) => item.isDefault)
    || (realCatalog.compositionsByDatasheetId.get(datasheetId) || [])[0];
  assert.ok(composition, `Expected default composition for ${datasheetId}`);
  return composition;
}

function defaultWargearUnit(datasheetName) {
  const datasheet = datasheetNamed(datasheetName);
  const composition = defaultCompositionForDatasheet(datasheet.id);
  const miniatures = defaultMiniatures(datasheet.id, composition.id).map((miniature, index) => ({
    ...miniature,
    id: `${datasheet.id}:${miniature.miniatureId}:${index}`,
    rosterUnitMiniatureId: `${datasheet.id}:${miniature.miniatureId}:${index}`,
    name: realCatalog.miniatureById.get(miniature.miniatureId)?.name || "Model",
  }));
  return {
    id: datasheet.id,
    name: datasheet.name,
    datasheetId: datasheet.id,
    modelCount: miniatures.reduce((total, miniature) => total + (miniature.count || 0), 0),
    wargear: defaultWargear(datasheet.id, composition.id),
    miniatures,
  };
}

function miniatureInUnit(unit, miniatureName) {
  const miniature = unit.miniatures.find((item) => item.name === miniatureName);
  assert.ok(miniature, `Expected miniature ${miniatureName} in ${unit.name}`);
  return miniature;
}

function optionIdForMiniatureItem(datasheetId, miniatureId, itemName) {
  for (const group of realCatalog.wargearGroupsByDatasheetId.get(datasheetId) || []) {
    if (group.miniatureId !== miniatureId) {
      continue;
    }
    for (const option of realCatalog.wargearOptionsByGroupId.get(group.id) || []) {
      const item = realCatalog.wargearItemById.get(option.wargearItemId);
      if (item?.name === itemName) {
        return option.id;
      }
    }
  }
  assert.fail(`Expected option ${itemName} for miniature ${miniatureId}`);
}

function setMiniatureWargear(unit, miniature, itemCounts) {
  miniature.wargear = {};
  for (const [itemName, count] of Object.entries(itemCounts)) {
    miniature.wargear[optionIdForMiniatureItem(unit.datasheetId, miniature.miniatureId, itemName)] = count;
  }
}

function enhancementTargetUnit({ id, datasheetName, miniatureName, factionNames = [], isWarlord = false }) {
  const datasheet = datasheetNamed(datasheetName);
  const miniature = miniatureNamedForDatasheet(datasheetName, miniatureName);
  const rosterUnitMiniatureId = `${id}:${miniature.id}`;
  return {
    id,
    name: datasheet.name,
    datasheetId: datasheet.id,
    allyType: "native",
    factionKeywordIds: factionNames.map((name) => factionNamed(name).id),
    keywordIds: keywordIdsForDatasheet(datasheet.id),
    keywordNames: [],
    isWarlord,
    warlordMiniatureIds: isWarlord ? [miniature.id] : [],
    unitEnhancements: [],
    miniatureEnhancements: [],
    wargear: {},
    miniatures: [{
      ...miniature,
      id: rosterUnitMiniatureId,
      rosterUnitMiniatureId,
      miniatureId: miniature.id,
      name: miniature.name,
      count: 1,
      isWarlord,
      wargear: {},
    }],
  };
}

function withMiniatureEnhancement(unit, enhancement) {
  const targetId = unit.miniatures[0].rosterUnitMiniatureId;
  return {
    ...unit,
    miniatureEnhancements: [{ ...enhancement, targetId }],
  };
}

function datasheetIdForEnhancementBodyguard(enhancement, datasheetName) {
  for (const group of realCatalog.enhancementBodyguardGroupsByEnhancementId.get(enhancement.id) || []) {
    for (const row of realCatalog.enhancementBodyguardGroupDatasheetsByGroupId.get(group.id) || []) {
      const datasheet = realCatalog.datasheetById.get(row.datasheetId);
      if (datasheet?.name === datasheetName) {
        return datasheet.id;
      }
    }
  }
  assert.fail(`Expected bodyguard datasheet ${datasheetName} for ${enhancement.name}`);
}


export {
  state,
  availableCompositions,
  costForDetachment,
  defaultMiniatures,
  defaultWargear,
  conditionalKeywordApplies,
  factionScope,
  enhancementPoints,
  unitSummary,
  validateAllegianceAbilities,
  validateAlliedUnits,
  validateAttachedUnits,
  validateEnhancements,
  validateDetachmentDatasheets,
  validateDetachmentUniqueKeywords,
  validateKeywordRestrictions,
  validateSuccessorChapterEpicHeroes,
  validateUnitCompositions,
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
  canonicalWargearKey,
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
