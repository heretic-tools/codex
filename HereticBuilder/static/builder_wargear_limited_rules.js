import { canonicalWargearKey } from "./builder_loadout_math.js";
import { state } from "./builder_state.js";
import { unitValidationMessage } from "./builder_validation_messages.js";
import { entryTargetsUnit, selectedWargearCounts, targetIdForMiniature } from "./builder_wargear_selection.js";
import { effectiveWargearLimit, limitedUpgradeKeys, limitedWargearChoices } from "./builder_wargear_limited_choices.js";
import { limitedChoiceCoverIsValid } from "./builder_wargear_limited_cover.js";

function validateLimitedWargearChoiceSets(unit, messages) {
  for (const row of state.catalog.limitedWargearChoiceSetsByDatasheetId.get(unit.datasheetId) || []) {
    const limit = effectiveWargearLimit(row.id, unit.modelCount || 0);
    if (!limit) {
      continue;
    }
    const upgradeKeys = limitedUpgradeKeys(row);
    const { choices, defaultAllowedKeys } = limitedWargearChoices(row, upgradeKeys);
    const includeLimitedOption = (optionRow) => {
      const group = state.catalog.wargearGroupById.get(optionRow.wargearOptionGroupId);
      const key = canonicalWargearKey(optionRow.wargearItemId, {
        datasheetId: group?.datasheetId || row.datasheetId,
        miniatureId: group?.miniatureId,
      });
      return defaultAllowedKeys.has(key) || (Number(optionRow.defaultValue || 0) <= 0 && upgradeKeys.has(key));
    };
    const selected = row.miniatureId
      ? selectedWargearCounts(unit, (entry) => !entryTargetsUnit(entry) && entry.miniatureId === row.miniatureId, includeLimitedOption)
      : selectedWargearCounts(unit, () => true, includeLimitedOption);
    if (!limitedChoiceCoverIsValid(selected, choices, limit.choiceLimit, limit.duplicateLimit, row.mandatory && limit.choiceLimit > 0)) {
      messages.push(unitValidationMessage("wargear_loadout.invalid_wargear_requirement", unit, `Invalid wargear configuration for ${unit.name}.`, {
        targetId: targetIdForMiniature(unit, row.miniatureId),
      }));
    }
  }
}

export { validateLimitedWargearChoiceSets };
