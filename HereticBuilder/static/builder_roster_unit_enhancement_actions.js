import { enhancementCandidateStatus } from "./builder_enhancement_rules.js";
import {
  miniatureKeywordIds,
  rosterUnitSummaries,
  unique,
} from "./builder_model.js";
import { updateRosterUnit } from "./builder_roster_action_helpers.js";
import { state } from "./builder_state.js";

function miniatureEnhancementKeywordIds(unit, miniature) {
  if (!miniature) {
    return [];
  }
  return unique([
    ...miniatureKeywordIds(miniature.miniatureId),
    ...(unit?.conditionalKeywordIds || []),
  ]);
}

function enhancementActionContext(roster, {
  detachments = null,
  keywordIds = null,
  miniature = null,
  rosterUnitMiniatureId = "",
  targetKind = "unit",
  unit = null,
  unitId = "",
  units = null,
} = {}) {
  const resolvedUnits = units ?? rosterUnitSummaries(roster);
  const resolvedUnit = unit?.id === unitId
    ? unit
    : resolvedUnits.find((item) => item.id === unitId);
  const resolvedMiniature = miniature ?? (targetKind === "miniature"
    ? (resolvedUnit?.miniatures || []).find((item) => (
      (item.rosterUnitMiniatureId || item.id) === rosterUnitMiniatureId
    ))
    : null);
  const resolvedKeywordIds = keywordIds ?? (targetKind === "miniature"
    ? miniatureEnhancementKeywordIds(resolvedUnit, resolvedMiniature)
    : (resolvedUnit?.keywordIds || []));
  return {
    detachments: detachments ?? (roster.detachmentIds || [])
      .map((id) => state.catalog.detachmentById.get(id))
      .filter(Boolean),
    keywordIds: resolvedKeywordIds,
    miniature: resolvedMiniature,
    unit: resolvedUnit,
    units: resolvedUnits,
  };
}

function enhancementCanBeSelected(roster, {
  detachments = null,
  enhancementId = "",
  keywordIds = null,
  miniature = null,
  rosterUnitMiniatureId = "",
  targetKind = "unit",
  unit = null,
  unitId = "",
  units = null,
}) {
  if (!enhancementId) {
    return true;
  }
  const context = enhancementActionContext(roster, {
    detachments,
    keywordIds,
    miniature,
    rosterUnitMiniatureId,
    targetKind,
    unit,
    unitId,
    units,
  });
  const enhancement = state.catalog.enhancementById.get(enhancementId);
  if (!context.unit || !enhancement || (targetKind === "miniature" && !context.miniature)) {
    return false;
  }
  return enhancementCandidateStatus({
    roster,
    detachments: context.detachments,
    units: context.units,
    unit: context.unit,
    enhancement,
    keywordIds: context.keywordIds,
    miniature: context.miniature,
    targetKind,
  }).eligible;
}

function rosterWithUnitEnhancement(roster, unitId, enhancementId, context = {}) {
  if (!enhancementCanBeSelected(roster, {
    ...context,
    enhancementId,
    targetKind: "unit",
    unitId,
  })) {
    return roster;
  }
  return updateRosterUnit(roster, unitId, (unit) => ({
    ...unit,
    unitEnhancements: enhancementId ? [{ id: enhancementId }] : [],
  }));
}

function rosterWithMiniatureEnhancement(roster, unitId, {
  enhancementId,
  rosterUnitMiniatureId,
  ...context
}) {
  if (!rosterUnitMiniatureId) {
    return roster;
  }
  if (!enhancementCanBeSelected(roster, {
    ...context,
    enhancementId,
    rosterUnitMiniatureId,
    targetKind: "miniature",
    unitId,
  })) {
    return roster;
  }
  return updateRosterUnit(roster, unitId, (unit) => {
    const miniatureEnhancements = (unit.miniatureEnhancements || []).filter((enhancement) => (
      enhancement.targetId !== rosterUnitMiniatureId
    ));
    if (enhancementId) {
      miniatureEnhancements.push({ id: enhancementId, targetId: rosterUnitMiniatureId });
    }
    return {
      ...unit,
      miniatureEnhancements,
    };
  });
}

export {
  enhancementCanBeSelected,
  rosterWithMiniatureEnhancement,
  rosterWithUnitEnhancement,
};
