import { state } from "./builder_state.js";
import {
  factionScope,
  idsFromRows,
  unique,
} from "./builder_model_core.js";

function compositionFactionIds(roster, allyType = "native") {
  if (allyType && allyType !== "native") {
    const parentIds = idsFromRows(
      state.catalog.alliedFactionParentsByAlliedFactionId.get(allyType),
      "factionKeywordId"
    );
    if (parentIds.length) {
      const result = [];
      for (const parentId of parentIds) {
        result.push(...factionScope(parentId));
      }
      return unique(result);
    }
  }
  return factionScope(roster.factionKeywordId);
}

export { compositionFactionIds };
