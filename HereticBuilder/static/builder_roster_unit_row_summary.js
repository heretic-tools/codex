import { selectedWargearEntries } from "./builder_model.js";
import { state } from "./builder_state.js";
import { unitHasDefaultWargear } from "./builder_roster_unit_wargear_default_actions.js";

function compactNames(names, limit = 2) {
  const values = (names || []).map((name) => String(name || "").trim()).filter(Boolean);
  if (values.length <= limit) {
    return values.join(", ");
  }
  return `${values.slice(0, limit).join(", ")} +${values.length - limit}`;
}

function paidWargearNames(unit, limit = 2) {
  const byId = state.catalog?.wargearOptionById || new Map();
  const itemById = state.catalog?.wargearItemById || new Map();
  const names = selectedWargearEntries(unit)
    .map((entry) => {
      const optionRow = byId.get(entry.optionId);
      if (!optionRow?.points) {
        return "";
      }
      const item = itemById.get(optionRow.wargearItemId);
      const count = entry.count > 1 ? `${entry.count}x ` : "";
      return `${count}${item?.name || "Wargear"}`;
    })
    .filter(Boolean);
  return compactNames(names, limit);
}

function unitWargearChanged(unit) {
  try {
    return !unitHasDefaultWargear(unit);
  } catch {
    return false;
  }
}

function unitRowSummaryParts(unit) {
  const parts = [];
  const enhancements = compactNames([
    ...(unit.unitEnhancements || []).map((enhancement) => enhancement.name),
    ...(unit.miniatureEnhancements || []).map((enhancement) => enhancement.name),
  ]);
  if (enhancements) {
    parts.push(`Enhancements: ${enhancements}`);
  }
  const allegiance = compactNames((unit.allegianceAbilities || []).map((ability) => ability.name));
  if (allegiance) {
    parts.push(`Abilities: ${allegiance}`);
  }
  if (unitWargearChanged(unit)) {
    const paid = paidWargearNames(unit);
    parts.push(paid ? `Wargear: ${paid}` : "Wargear changed");
  }
  return parts;
}

function unitRowSummaryText(unit) {
  return unitRowSummaryParts(unit).join(" / ");
}

export {
  compactNames,
  paidWargearNames,
  unitRowSummaryParts,
  unitRowSummaryText,
  unitWargearChanged,
};
