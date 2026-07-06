import { defaultWargear } from "./builder_model.js";
import { updateRosterUnit } from "./builder_roster_action_helpers.js";
import { defaultRosterMiniatures } from "./builder_roster_unit_default_rows.js";

function normalizedWargearEntries(wargear = {}) {
  return Object.entries(wargear || {})
    .map(([optionId, count]) => [optionId, Number(count || 0)])
    .filter(([, count]) => count > 0)
    .sort(([leftId], [rightId]) => leftId.localeCompare(rightId));
}

function wargearMapsMatch(left = {}, right = {}) {
  const leftEntries = normalizedWargearEntries(left);
  const rightEntries = normalizedWargearEntries(right);
  return leftEntries.length === rightEntries.length
    && leftEntries.every(([optionId, count], index) => (
      optionId === rightEntries[index][0] && count === rightEntries[index][1]
    ));
}

function defaultMiniatureFor(defaults, miniature, index) {
  const targetId = miniature.rosterUnitMiniatureId || miniature.id;
  return defaults.find((row) => (
    (row.rosterUnitMiniatureId || row.id) === targetId
  )) || defaults[index] || defaults.find((row) => row.miniatureId === miniature.miniatureId);
}

function unitHasDefaultWargear(unit) {
  const defaults = defaultRosterMiniatures(unit.id, unit.datasheetId, unit.compositionId);
  if (!wargearMapsMatch(unit.wargear, defaultWargear(unit.datasheetId, unit.compositionId))) {
    return false;
  }
  const miniatures = unit.miniatures || [];
  if (miniatures.length !== defaults.length) {
    return false;
  }
  return miniatures.every((miniature, index) => (
    wargearMapsMatch(
      miniature.wargear,
      defaultMiniatureFor(defaults, miniature, index)?.wargear || {}
    )
  ));
}

function rosterWithUnitDefaultWargear(roster, unitId) {
  return updateRosterUnit(roster, unitId, (unit) => {
    const defaults = defaultRosterMiniatures(unit.id, unit.datasheetId, unit.compositionId);
    return {
      ...unit,
      wargear: defaultWargear(unit.datasheetId, unit.compositionId),
      miniatures: (unit.miniatures || defaults).map((miniature, index) => {
        const targetId = miniature.rosterUnitMiniatureId || miniature.id;
        const defaultMiniature = defaults.find((row) => (
          (row.rosterUnitMiniatureId || row.id) === targetId
        )) || defaults[index] || defaults.find((row) => row.miniatureId === miniature.miniatureId);
        return {
          ...miniature,
          wargear: defaultMiniature?.wargear || {},
        };
      }),
    };
  });
}

export { rosterWithUnitDefaultWargear, unitHasDefaultWargear, wargearMapsMatch };
