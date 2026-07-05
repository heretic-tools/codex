import { option, textNode } from "./builder_dom.js";
import {
  availableCompositions,
  compositionFactionIds,
  compositionLabel,
  rosterUnitSummaries,
} from "./builder_model.js";
import {
  rosterWithUnitAllegianceAbility,
  rosterWithUnitComposition,
  rosterWithWarlord,
} from "./builder_roster_actions.js";
import { allegianceAbilityCandidateStatus } from "./builder_allegiance_rules.js";
import { renderEnhancementsEditor } from "./builder_roster_unit_enhancement_editor.js";
import { state } from "./builder_state.js";

function renderCompositionEditor({ onUpdate, roster, unit }) {
  const factionIds = compositionFactionIds(roster, unit.allyType || "native");
  const compositions = availableCompositions(unit.datasheetId, factionIds, roster.detachmentIds || []);
  const select = document.createElement("select");
  for (const row of compositions) {
    select.appendChild(option(row.id, `${compositionLabel(row)} (${row.points || 0} pts)`));
  }
  select.value = unit.compositionId || compositions[0]?.id || "";
  select.dataset.focusTarget = "true";
  select.addEventListener("change", async () => {
    await onUpdate(rosterWithUnitComposition(roster, unit.id, select.value));
  });
  const wrap = document.createElement("label");
  wrap.className = "field";
  wrap.dataset.unitDetailTarget = "composition";
  wrap.append(textNode("span", "", "Composition"), select);
  return wrap;
}

function currentWarlordTargetId(unit) {
  return (unit.miniatures || []).find((miniature) => miniature.isWarlord)?.rosterUnitMiniatureId || "";
}

function renderWarlordEditor({ onUpdate, roster, unit }) {
  const select = document.createElement("select");
  select.appendChild(option("", "No warlord for this unit"));
  for (const miniature of unit.miniatures || []) {
    const targetId = miniature.rosterUnitMiniatureId || miniature.id;
    select.appendChild(option(targetId, `${miniature.name} (${miniature.count || 0})`));
  }
  select.value = currentWarlordTargetId(unit);
  select.dataset.focusTarget = "true";
  select.addEventListener("change", async () => onUpdate(rosterWithWarlord(roster, {
    rosterUnitMiniatureId: select.value,
    unitId: select.value ? unit.id : "",
  })));

  const wrap = document.createElement("label");
  wrap.className = "field";
  wrap.dataset.unitDetailTarget = "warlord";
  wrap.append(textNode("span", "", "Warlord"), select);
  return wrap;
}

function sortAllegianceAbilities(rows) {
  return [...rows].sort((left, right) => (left.displayOrder || 0) - (right.displayOrder || 0)
    || String(left.name || "").localeCompare(String(right.name || "")));
}

function allegianceAbilityLabel(ability, status = null) {
  const suffix = [];
  if (ability.requiresWargearItemId) {
    const item = state.catalog.wargearItemById.get(ability.requiresWargearItemId);
    const reason = item ? `requires ${item.name}` : "requires wargear";
    if (!status || status.eligible || status.reason !== reason) {
      suffix.push(reason);
    }
  }
  if (status && !status.eligible) {
    suffix.push(status.reason);
  }
  return suffix.length ? `${ability.name} (${suffix.join(" / ")})` : ability.name;
}

function renderAllegianceEditor({ onUpdate, roster, unit }) {
  const group = state.catalog.allegianceAbilityGroupById.get(unit.allegianceAbilityGroupId);
  if (!group) {
    return null;
  }
  const abilities = sortAllegianceAbilities(state.catalog.allegianceAbilitiesByGroupId.get(group.id) || []);
  const currentId = unit.allegianceAbilities?.find((ability) => ability.groupId === group.id)?.id || "";
  const select = document.createElement("select");
  select.appendChild(option("", group.isMandatory ? `Select ${group.name}` : `No ${group.name}`));
  const detachments = (roster.detachmentIds || []).map((id) => ({ id, ...state.catalog.detachmentById.get(id) }));
  const units = rosterUnitSummaries(roster);
  const rows = abilities.map((ability, index) => ({
    ability,
    index,
    status: allegianceAbilityCandidateStatus({ ability, detachments, roster, unit, units }),
  })).sort((left, right) => Number(right.status.eligible) - Number(left.status.eligible) || left.index - right.index);
  for (const row of rows) {
    select.appendChild(option(row.ability.id, allegianceAbilityLabel(row.ability, row.status)));
  }
  select.value = currentId;
  select.dataset.focusTarget = "true";
  select.addEventListener("change", async () => {
    await onUpdate(rosterWithUnitAllegianceAbility(roster, unit.id, select.value));
  });

  const label = group.detachmentId
    ? `${group.name} (${state.catalog.detachmentById.get(group.detachmentId)?.name || "required detachment"})`
    : group.name;
  const wrap = document.createElement("label");
  wrap.className = "field";
  wrap.dataset.unitDetailTarget = "allegiance";
  wrap.append(textNode("span", "", label), select);
  return wrap;
}

export {
  renderAllegianceEditor,
  renderCompositionEditor,
  renderEnhancementsEditor,
  renderWarlordEditor,
};
