import { defaultMiniatures } from "./builder_model.js";

function defaultRosterMiniatures(unitId, datasheetId, compositionId) {
  return defaultMiniatures(datasheetId, compositionId).map((miniature, index) => ({
    ...miniature,
    id: `${unitId}:${miniature.miniatureId}:${index}`,
    rosterUnitMiniatureId: `${unitId}:${miniature.miniatureId}:${index}`,
  }));
}

export { defaultRosterMiniatures };
