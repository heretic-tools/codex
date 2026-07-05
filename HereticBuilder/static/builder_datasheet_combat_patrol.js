import { state } from "./builder_state.js";

function datasheetIsCombatPatrol(datasheet) {
  return Boolean(state.catalog.publicationById.get(datasheet?.publicationId)?.isCombatPatrol);
}

export { datasheetIsCombatPatrol };
