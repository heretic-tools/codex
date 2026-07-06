import { rosterUnitSummaries } from "./builder_model.js";
import { state } from "./builder_state.js";
import { warlordCandidateStatus } from "./builder_warlord_rules.js";

function warlordOptionValue(unit, miniature) {
  return JSON.stringify({
    rosterUnitMiniatureId: miniature.rosterUnitMiniatureId || miniature.id,
    unitId: unit.id,
  });
}

function selectedWarlordValue(units) {
  for (const unit of units) {
    const miniature = (unit.miniatures || []).find((item) => item.isWarlord && item.count > 0);
    if (miniature) {
      return warlordOptionValue(unit, miniature);
    }
  }
  return "";
}

function warlordPickerModel(roster) {
  const units = rosterUnitSummaries(roster);
  const detachments = (roster.detachmentIds || []).map((id) => ({ id, ...state.catalog.detachmentById.get(id) }));
  const rows = units.flatMap((unit) => (unit.miniatures || [])
    .filter((miniature) => (miniature.count || 0) > 0)
    .map((miniature) => ({
      miniature,
      status: warlordCandidateStatus(roster, detachments, units, unit, miniature),
      unit,
    })))
    .sort((left, right) => Number(right.status.eligible) - Number(left.status.eligible)
      || String(left.unit.name || "").localeCompare(String(right.unit.name || ""))
      || String(left.miniature.name || "").localeCompare(String(right.miniature.name || "")));
  return {
    currentValue: selectedWarlordValue(units),
    disabled: !units.length,
    options: [
      { label: units.length ? "No Warlord selected" : "Add units first", value: "" },
      ...rows.map((row) => {
        const suffix = row.status.eligible ? "" : ` / ${row.status.reason}`;
        return {
          label: `${row.unit.name || "Unit"} / ${row.miniature.name || "Model"} (${row.miniature.count || 0})${suffix}`,
          value: warlordOptionValue(row.unit, row.miniature),
        };
      }),
    ],
  };
}

export { warlordPickerModel };
