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

function availableDatasheets(roster, allyType = "native") {
  const factionIds = compositionFactionIds(roster, allyType);
  const allowedAlliedDatasheets = allyType === "native"
    ? null
    : new Set(idsFromRows(state.catalog.alliedFactionDatasheetsByAlliedFactionId.get(allyType), "datasheetId"));
  return state.catalog.datasheets
    .filter((datasheet) => {
      if (allyType === "native") {
        return datasheetIsNativeToFaction(roster.factionKeywordId, datasheet.id) && !datasheetExcluded(roster, datasheet.id);
      }
      return alliedFactionAllowed(roster.factionKeywordId, allyType)
        && allowedAlliedDatasheets?.has(datasheet.id)
        && !datasheetDetachmentExcluded(roster, datasheet.id);
    })
    .filter((datasheet) => !datasheetIsCombatPatrol(datasheet))
    .filter((datasheet) => defaultComposition(datasheet.id, factionIds, roster.detachmentIds || []))
    .sort((left, right) => String(left.name || "").localeCompare(String(right.name || "")));
}

export {
  availableDatasheets,
  datasheetIsCombatPatrol,
  datasheetIsNativeToFaction,
  factionExcludesDatasheet,
};
