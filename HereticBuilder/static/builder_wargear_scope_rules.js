import { state } from "./builder_state.js";
import { unitValidationMessage } from "./builder_validation_messages.js";
import { entryTargetMiniature, entryTargetsUnit } from "./builder_wargear_selection.js";

function validateWargearEntryScope(unit, entry, messages) {
  const optionRow = state.catalog.wargearOptionById.get(entry.optionId);
  const item = optionRow ? state.catalog.wargearItemById.get(optionRow.wargearItemId) : null;
  const group = optionRow ? state.catalog.wargearGroupById.get(optionRow.wargearOptionGroupId) : null;
  const target = entryTargetMiniature(unit, entry);
  if (!optionRow || !group || group.datasheetId !== unit.datasheetId) {
    if (entryTargetsUnit(entry)) {
      messages.push(unitValidationMessage("wargear_loadout.invalid_unit_wargear", unit, `${unit.name} has invalid unit wargear selected: ${item?.name || "unknown wargear"}.`));
    } else {
      messages.push(unitValidationMessage("wargear_loadout.invalid_model_wargear", unit, `${unit.name} has invalid wargear for ${target?.name || "model"}: ${item?.name || "unknown wargear"}.`, {
        targetId: target?.rosterUnitMiniatureId || target?.id || target?.miniatureId || entry.miniatureId,
      }));
    }
    return;
  }
  if (entryTargetsUnit(entry)) {
    if (group.miniatureId) {
      messages.push(unitValidationMessage("wargear_loadout.invalid_unit_wargear", unit, `${unit.name} has invalid unit wargear selected: ${item?.name || "unknown wargear"}.`));
    }
    return;
  }
  const selectedMiniatureId = target?.miniatureId || entry.miniatureId || "";
  if (!group.miniatureId || group.miniatureId !== selectedMiniatureId) {
    messages.push(unitValidationMessage("wargear_loadout.invalid_model_wargear", unit, `${unit.name} has invalid wargear for ${target?.name || "model"}: ${item?.name || "unknown wargear"}.`, {
      targetId: target?.rosterUnitMiniatureId || target?.id || target?.miniatureId || entry.miniatureId,
    }));
  }
}

export { validateWargearEntryScope };
