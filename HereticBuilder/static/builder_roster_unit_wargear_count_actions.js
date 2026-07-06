import { updateRosterUnit } from "./builder_roster_action_helpers.js";
import { state } from "./builder_state.js";

function withWargearCount(wargear, optionId, count) {
  const next = { ...(wargear || {}) };
  const value = Math.max(0, Number(count || 0));
  if (value) {
    next[optionId] = value;
  } else {
    delete next[optionId];
  }
  return next;
}

function wargearCountCanBeWritten(roster, unitId, { count, optionId, rosterUnitMiniatureId = "" }) {
  if (!optionId) {
    return false;
  }
  const unit = (roster.units || []).find((item) => item.id === unitId);
  if (!unit) {
    return false;
  }
  const targetMiniature = rosterUnitMiniatureId
    ? (unit.miniatures || []).find((miniature) => (
      (miniature.rosterUnitMiniatureId || miniature.id) === rosterUnitMiniatureId
    ))
    : null;
  if (rosterUnitMiniatureId && !targetMiniature) {
    return false;
  }
  if (Math.max(0, Number(count || 0)) === 0) {
    return true;
  }
  const option = state.catalog.wargearOptionById.get(optionId);
  const group = option ? state.catalog.wargearGroupById.get(option.wargearOptionGroupId) : null;
  if (!group || group.datasheetId !== unit.datasheetId) {
    return false;
  }
  if (group.miniatureId) {
    return Boolean(targetMiniature) && targetMiniature.miniatureId === group.miniatureId;
  }
  return !rosterUnitMiniatureId;
}

function rosterWithUnitWargearCount(roster, unitId, { optionId, count, rosterUnitMiniatureId = "" }) {
  if (!wargearCountCanBeWritten(roster, unitId, { count, optionId, rosterUnitMiniatureId })) {
    return roster;
  }
  return updateRosterUnit(roster, unitId, (unit) => {
    if (!rosterUnitMiniatureId) {
      return {
        ...unit,
        wargear: withWargearCount(unit.wargear, optionId, count),
      };
    }
    return {
      ...unit,
      miniatures: (unit.miniatures || []).map((miniature) => {
        const targetId = miniature.rosterUnitMiniatureId || miniature.id;
        if (targetId !== rosterUnitMiniatureId) {
          return miniature;
        }
        return {
          ...miniature,
          wargear: withWargearCount(miniature.wargear, optionId, count),
        };
      }),
    };
  });
}

export { rosterWithUnitWargearCount, wargearCountCanBeWritten, withWargearCount };
