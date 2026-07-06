import { wargearGroupsFor } from "./builder_roster_unit_wargear_groups.js";
import { renderWargearScope } from "./builder_roster_unit_wargear_view.js";
import {
  targetIdForWargearScope,
  validationForWargearScope,
} from "./builder_roster_unit_wargear_validation_view.js";

function wargearScopeHasContent(groups, target, validation) {
  if ((groups || []).length) {
    return true;
  }
  const targetId = targetIdForWargearScope(target);
  return Boolean(validationForWargearScope(validation, targetId).messages.length);
}

function appendWargearScope(wargear, {
  groups,
  heading,
  onUndoableUpdate,
  onUpdate,
  roster,
  target,
  unit,
  validation,
  validationContext,
}) {
  if (!wargearScopeHasContent(groups, target, validation)) {
    return false;
  }
  wargear.appendChild(renderWargearScope({
    groups,
    heading,
    onUndoableUpdate,
    onUpdate,
    roster,
    target,
    unit,
    validation,
    validationContext,
  }));
  return true;
}

function renderRosterUnitWargearSection({ onUndoableUpdate = null, onUpdate, roster, unit, validation, validationContext }) {
  const wargear = document.createElement("section");
  wargear.className = "builder-section unit-wargear-section";
  wargear.dataset.unitDetailTarget = "wargear";
  let renderedScopes = 0;
  renderedScopes += appendWargearScope(wargear, {
    groups: wargearGroupsFor(unit),
    heading: "Unit Wargear",
    onUndoableUpdate,
    onUpdate,
    roster,
    target: unit,
    unit,
    validation,
    validationContext,
  }) ? 1 : 0;
  for (const miniature of unit.miniatures) {
    renderedScopes += appendWargearScope(wargear, {
      groups: wargearGroupsFor(unit, miniature.miniatureId),
      heading: `${miniature.name} (${miniature.count || 0})`,
      onUndoableUpdate,
      onUpdate,
      roster,
      target: miniature,
      unit,
      validation,
      validationContext,
    }) ? 1 : 0;
  }
  if (!renderedScopes) {
    const empty = document.createElement("p");
    empty.className = "empty-list";
    empty.textContent = "No wargear options";
    wargear.appendChild(empty);
  }
  return wargear;
}

export { renderRosterUnitWargearSection, wargearScopeHasContent };
