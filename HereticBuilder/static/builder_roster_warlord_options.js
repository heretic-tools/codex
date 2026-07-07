import { modelCountLabel } from "./builder_count_labels.js";
import { rosterUnitSummaries } from "./builder_model.js";
import { state } from "./builder_state.js";
import { warlordCandidateStatus } from "./builder_warlord_rules.js";

function warlordOptionValue(unit, miniature) {
  return JSON.stringify({
    rosterUnitMiniatureId: miniature.rosterUnitMiniatureId || miniature.id,
    unitId: unit.id,
  });
}

function warlordOptionLabel(unit, miniature) {
  const unitName = unit.name || "Unit";
  const miniatureName = miniature.name || "Model";
  const name = unitName === miniatureName ? unitName : `${unitName} / ${miniatureName}`;
  return `${name} (${modelCountLabel(miniature.count)})`;
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

function warlordSelectionContext(roster) {
  const units = rosterUnitSummaries(roster);
  const detachments = (roster.detachmentIds || []).map((id) => ({ id, ...state.catalog.detachmentById.get(id) }));
  return { detachments, units };
}

function warlordPickerModel(roster) {
  const { detachments, units } = warlordSelectionContext(roster);
  const currentValue = selectedWarlordValue(units);
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
    currentValue,
    detachments,
    disabled: !units.length,
    options: [
      { label: units.length ? "No Warlord selected" : "Add units first", value: "" },
      ...rows.map((row) => {
        const value = warlordOptionValue(row.unit, row.miniature);
        const suffix = row.status.eligible ? "" : ` / ${row.status.reason}`;
        return {
          disabled: !row.status.eligible && value !== currentValue,
          label: `${warlordOptionLabel(row.unit, row.miniature)}${suffix}`,
          value,
        };
      }),
    ],
    units,
  };
}

function warlordPickerHasSelectableTarget(model) {
  return (model?.options || []).some((row) => row.value && !row.disabled);
}

export {
  warlordOptionLabel,
  warlordPickerHasSelectableTarget,
  warlordPickerModel,
  warlordSelectionContext,
};
