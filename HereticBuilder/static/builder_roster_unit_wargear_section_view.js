import { groupsFor, renderWargearScope } from "./builder_roster_unit_wargear_view.js";

function renderRosterUnitWargearSection({ onUpdate, roster, unit, validation, validationContext }) {
  const wargear = document.createElement("section");
  wargear.className = "builder-section unit-wargear-section";
  wargear.dataset.unitDetailTarget = "wargear";
  wargear.appendChild(renderWargearScope({
    groups: groupsFor(unit),
    heading: "Unit Wargear",
    onUpdate,
    roster,
    target: unit,
    unit,
    validation,
    validationContext,
  }));
  for (const miniature of unit.miniatures) {
    wargear.appendChild(renderWargearScope({
      groups: groupsFor(unit, miniature.miniatureId),
      heading: `${miniature.name} (${miniature.count || 0})`,
      onUpdate,
      roster,
      target: miniature,
      unit,
      validation,
      validationContext,
    }));
  }
  return wargear;
}

export { renderRosterUnitWargearSection };
