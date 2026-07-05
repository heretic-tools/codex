import { textNode } from "./builder_dom.js";
import { rosterWithUnitWargearCount } from "./builder_roster_actions.js";
import { state } from "./builder_state.js";
import { renderValidationMessages, validationForTarget } from "./builder_validation_view.js";

function wargearOptionName(row) {
  const item = state.catalog.wargearItemById.get(row.wargearItemId);
  const points = row.points ? ` / ${row.points} pts` : "";
  return `${item?.name || "Wargear"}${points}`;
}

function currentCount(target, optionId) {
  return Number((target.wargear || {})[optionId] || 0);
}

function countControl({ onChange, optionRow, target }) {
  if (optionRow.inputType === "checkbox") {
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = currentCount(target, optionRow.id) > 0;
    input.dataset.focusTarget = "true";
    input.addEventListener("change", () => onChange(input.checked ? 1 : 0));
    return input;
  }
  const input = document.createElement("input");
  input.type = "number";
  input.min = "0";
  input.step = "1";
  input.value = String(currentCount(target, optionRow.id));
  input.dataset.focusTarget = "true";
  input.addEventListener("change", () => onChange(input.value));
  return input;
}

function renderWargearOption({ group, onUpdate, optionRow, roster, target, unit }) {
  const row = document.createElement("label");
  row.className = "wargear-option-row";
  row.append(textNode("span", "", wargearOptionName(optionRow)));
  row.appendChild(countControl({
    optionRow,
    target,
    onChange: async (count) => onUpdate(rosterWithUnitWargearCount(roster, unit.id, {
      count,
      optionId: optionRow.id,
      rosterUnitMiniatureId: target.rosterUnitMiniatureId || "",
    })),
  }));
  if (group.instructionText) {
    row.title = group.instructionText;
  }
  return row;
}

function renderWargearGroup({ group, onUpdate, roster, target, unit }) {
  const rows = state.catalog.wargearOptionsByGroupId.get(group.id) || [];
  const wrap = document.createElement("div");
  wrap.className = "wargear-group";
  wrap.appendChild(textNode("h3", "wargear-group-title", group.instructionText || "Wargear"));
  for (const optionRow of rows) {
    wrap.appendChild(renderWargearOption({ group, onUpdate, optionRow, roster, target, unit }));
  }
  return wrap;
}

function groupsFor(unit, miniatureId = "") {
  return (state.catalog.wargearGroupsByDatasheetId.get(unit.datasheetId) || [])
    .filter((group) => (group.miniatureId || "") === miniatureId)
    .sort((left, right) => (left.displayOrder || 0) - (right.displayOrder || 0));
}

function renderScope({ groups, heading, onUpdate, roster, target, unit }) {
  const wrap = document.createElement("section");
  wrap.className = "builder-section wargear-scope";
  wrap.appendChild(textNode("h2", "section-title", heading));
  if (!groups.length) {
    wrap.appendChild(textNode("p", "empty-list", "No wargear options"));
    return wrap;
  }
  for (const group of groups) {
    wrap.appendChild(renderWargearGroup({ group, onUpdate, roster, target, unit }));
  }
  return wrap;
}

function isWargearMessage(message) {
  return String(message.code || "").startsWith("wargear_loadout.");
}

function validationWithMessages(validation, messages) {
  return {
    ...validation,
    state: messages.some((message) => message.level === "error") ? "invalid" : "valid",
    messages,
  };
}

function validationForWargearScope(validation, targetId = "") {
  const messages = targetId
    ? validationForTarget(validation, targetId).messages.filter(isWargearMessage)
    : (validation.messages || []).filter((message) => (
      isWargearMessage(message)
      && !(message.scope?.targetId)
      && !(message.scope?.targetIds || []).length
    ));
  return validationWithMessages(validation, messages);
}

function renderScopeValidation(validation, context) {
  if (!validation.messages.length) {
    return null;
  }
  const wrap = document.createElement("div");
  wrap.className = "scope-validation";
  wrap.appendChild(renderValidationMessages(validation.messages, { context }));
  return wrap;
}

function targetIdForWargearScope(target) {
  return target.rosterUnitMiniatureId || (target.miniatureId ? target.id || target.miniatureId : "");
}

function renderWargearScope({ groups, heading, onUpdate, roster, target, unit, validation, validationContext }) {
  const scope = renderScope({ groups, heading, onUpdate, roster, target, unit });
  const targetId = targetIdForWargearScope(target);
  if (targetId) {
    scope.dataset.unitDetailTarget = `wargear:${targetId}`;
  }
  const scopeValidation = renderScopeValidation(validationForWargearScope(validation, targetId), validationContext);
  if (scopeValidation) {
    const title = scope.querySelector(".section-title");
    title?.after(scopeValidation);
  }
  return scope;
}

export { groupsFor, renderWargearScope };
