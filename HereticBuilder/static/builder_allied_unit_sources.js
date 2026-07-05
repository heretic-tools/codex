import { idsFromRows } from "./builder_model_core.js";
import { state } from "./builder_state.js";

function alliedFactionName(alliedFactionId) {
  const names = idsFromRows(
    state.catalog.alliedFactionParentsByAlliedFactionId.get(alliedFactionId),
    "factionKeywordId"
  ).map((id) => state.catalog.factionKeywordById.get(id)?.name).filter(Boolean);
  return names.length ? names.join(", ") : "Allied";
}

function availableUnitSources(roster) {
  const factionName = state.catalog.factionById.get(roster.factionKeywordId)?.name || "Roster Faction";
  const alliedSources = idsFromRows(
    state.catalog.factionAlliedFactionsByFactionId.get(roster.factionKeywordId),
    "alliedFactionId"
  )
    .filter((id, index, values) => values.indexOf(id) === index)
    .filter((id) => (state.catalog.alliedFactionDatasheetsByAlliedFactionId.get(id) || []).length)
    .map((id) => ({ value: id, label: `Allied: ${alliedFactionName(id)}` }))
    .sort((left, right) => left.label.localeCompare(right.label));
  return [
    { value: "native", label: factionName },
    ...alliedSources,
  ];
}

function alliedFactionAllowed(factionKeywordId, alliedFactionId) {
  return (state.catalog.factionAlliedFactionsByFactionId.get(factionKeywordId) || [])
    .some((row) => row.alliedFactionId === alliedFactionId);
}

export {
  alliedFactionAllowed,
  alliedFactionName,
  availableUnitSources,
};
