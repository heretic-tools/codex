import {
  idsFromRows,
} from "./builder_model_core.js";
import { compositionFactionIds } from "./builder_model_selections.js";
import { defaultComposition } from "./builder_model_compositions.js";
import { alliedFactionAllowed } from "./builder_allied_unit_sources.js";
import { state } from "./builder_state.js";
import { datasheetIsCombatPatrol } from "./builder_datasheet_combat_patrol.js";
import {
  datasheetDetachmentExcluded,
  datasheetExcluded,
  datasheetIsNativeToFaction,
  factionExcludesDatasheet,
} from "./builder_datasheet_faction_filters.js";

function datasheetAvailableToRoster(roster, allyType = "native", datasheetId, allowedAlliedDatasheetIds = null) {
  const datasheet = state.catalog.datasheetById.get(datasheetId);
  if (!datasheet || datasheetIsCombatPatrol(datasheet)) {
    return false;
  }
  const factionIds = compositionFactionIds(roster, allyType);
  if (!defaultComposition(datasheet.id, factionIds, roster.detachmentIds || [])) {
    return false;
  }
  if (allyType === "native") {
    return datasheetIsNativeToFaction(roster.factionKeywordId, datasheet.id)
      && !datasheetExcluded(roster, datasheet.id);
  }
  const allowedIds = allowedAlliedDatasheetIds || new Set(
    idsFromRows(state.catalog.alliedFactionDatasheetsByAlliedFactionId.get(allyType), "datasheetId")
  );
  return alliedFactionAllowed(roster.factionKeywordId, allyType)
    && allowedIds.has(datasheet.id)
    && !datasheetDetachmentExcluded(roster, datasheet.id);
}

function availableDatasheets(roster, allyType = "native") {
  const allowedAlliedDatasheets = allyType === "native"
    ? null
    : new Set(idsFromRows(state.catalog.alliedFactionDatasheetsByAlliedFactionId.get(allyType), "datasheetId"));
  return state.catalog.datasheets
    .filter((datasheet) => datasheetAvailableToRoster(roster, allyType, datasheet.id, allowedAlliedDatasheets))
    .sort((left, right) => String(left.name || "").localeCompare(String(right.name || "")));
}

export {
  availableDatasheets,
  datasheetAvailableToRoster,
  datasheetIsCombatPatrol,
  datasheetIsNativeToFaction,
  factionExcludesDatasheet,
};
