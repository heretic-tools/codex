import { option, textNode } from "./builder_dom.js";
import {
  availableCompositions,
  compositionFactionIds,
  compositionLabel,
  enhancementPoints,
  miniatureKeywordIds,
  rosterUnitSummaries,
  unique,
} from "./builder_model.js";
import {
  rosterWithMiniatureEnhancement,
  rosterWithUnitAllegianceAbility,
  rosterWithUnitComposition,
  rosterWithUnitEnhancement,
  rosterWithWarlord,
} from "./builder_roster_actions.js";
import { allegianceAbilityCandidateStatus } from "./builder_allegiance_rules.js";
import { enhancementCandidateStatus } from "./builder_enhancement_rules.js";
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

function sortEnhancements(rows) {
  return [...rows].sort((left, right) => {
    const leftDetachment = state.catalog.detachmentById.get(left.detachmentId)?.name || "";
    const rightDetachment = state.catalog.detachmentById.get(right.detachmentId)?.name || "";
    return leftDetachment.localeCompare(rightDetachment)
      || String(left.name || "").localeCompare(String(right.name || ""));
  });
}

function enhancementOptionsFor(roster, targetKind, currentId = "") {
  const detachmentIds = new Set(roster.detachmentIds || []);
  const rows = (state.catalog.enhancements || []).filter((enhancement) => (
    (!enhancement.detachmentId || detachmentIds.has(enhancement.detachmentId))
    && (targetKind === "miniature"
      ? enhancement.enhancementType === "miniature"
      : enhancement.enhancementType !== "miniature")
  ));
  const current = state.catalog.enhancementById.get(currentId);
  if (current && !rows.some((enhancement) => enhancement.id === current.id)) {
    rows.push(current);
  }
  return sortEnhancements(rows);
}

function enhancementLabel(enhancement, keywordIds, status = null) {
  const detachment = state.catalog.detachmentById.get(enhancement.detachmentId);
  const points = enhancementPoints(enhancement.id, keywordIds);
  const suffix = [
    detachment?.name,
    `${points || 0} pts`,
    status && !status.eligible ? status.reason : "",
  ].filter(Boolean).join(" / ");
  return suffix ? `${enhancement.name} (${suffix})` : enhancement.name;
}

function currentMiniatureEnhancementId(unit, rosterUnitMiniatureId) {
  return (unit.miniatureEnhancements || []).find((enhancement) => (
    enhancement.targetId === rosterUnitMiniatureId
  ))?.id || "";
}

function renderEnhancementSelect({ currentId, enhancements, keywordIds, label, miniature = null, onChange, roster, targetKind, unit, units }) {
  const select = document.createElement("select");
  select.appendChild(option("", "No enhancement"));
  const detachments = (roster.detachmentIds || []).map((id) => ({ id, ...state.catalog.detachmentById.get(id) }));
  const rows = enhancements.map((enhancement, index) => ({
    enhancement,
    index,
    status: enhancementCandidateStatus({
      roster,
      detachments,
      units,
      unit,
      enhancement,
      keywordIds,
      miniature,
      targetKind,
    }),
  })).sort((left, right) => Number(right.status.eligible) - Number(left.status.eligible) || left.index - right.index);
  for (const row of rows) {
    select.appendChild(option(row.enhancement.id, enhancementLabel(row.enhancement, keywordIds, row.status)));
  }
  select.value = currentId || "";
  select.dataset.focusTarget = "true";
  select.addEventListener("change", async () => onChange(select.value));

  const wrap = document.createElement("label");
  wrap.className = "field enhancement-field";
  const targetId = miniature?.rosterUnitMiniatureId || miniature?.id || "";
  if (targetId) {
    wrap.dataset.unitDetailTarget = `enhancement:${targetId}`;
  }
  wrap.append(textNode("span", "", label), select);
  return wrap;
}

function miniatureEnhancementKeywordIds(unit, miniature) {
  return unique([
    ...miniatureKeywordIds(miniature.miniatureId),
    ...(unit.conditionalKeywordIds || []),
  ]);
}

function renderEnhancementsEditor({ onUpdate, roster, unit }) {
  const wrap = document.createElement("section");
  wrap.className = "builder-section unit-enhancements-section";
  wrap.dataset.unitDetailTarget = "enhancements";
  wrap.appendChild(textNode("h2", "section-title", "Enhancements"));

  const units = rosterUnitSummaries(roster);
  const currentUnitEnhancementId = unit.unitEnhancements?.[0]?.id || "";
  const unitOptions = enhancementOptionsFor(roster, "unit", currentUnitEnhancementId);
  const miniatureTargets = unit.miniatures || [];
  const hasOptions = unitOptions.length || miniatureTargets.some((miniature) => (
    enhancementOptionsFor(roster, "miniature", currentMiniatureEnhancementId(unit, miniature.rosterUnitMiniatureId || miniature.id)).length
  ));
  if (!hasOptions) {
    wrap.appendChild(textNode("p", "empty-list", "No enhancements available for selected detachments"));
    return wrap;
  }

  if (unitOptions.length || currentUnitEnhancementId) {
    wrap.appendChild(renderEnhancementSelect({
      currentId: currentUnitEnhancementId,
      enhancements: unitOptions,
      keywordIds: unit.keywordIds || [],
      label: "Unit",
      onChange: async (enhancementId) => onUpdate(rosterWithUnitEnhancement(roster, unit.id, enhancementId)),
      roster,
      targetKind: "unit",
      unit,
      units,
    }));
  }

  for (const miniature of miniatureTargets) {
    const targetId = miniature.rosterUnitMiniatureId || miniature.id;
    const currentId = currentMiniatureEnhancementId(unit, targetId);
    const options = enhancementOptionsFor(roster, "miniature", currentId);
    if (!options.length && !currentId) {
      continue;
    }
    wrap.appendChild(renderEnhancementSelect({
      currentId,
      enhancements: options,
      keywordIds: miniatureEnhancementKeywordIds(unit, miniature),
      label: `${miniature.name} (${miniature.count || 0})`,
      miniature,
      onChange: async (enhancementId) => onUpdate(rosterWithMiniatureEnhancement(roster, unit.id, {
        enhancementId,
        rosterUnitMiniatureId: targetId,
      })),
      roster,
      targetKind: "miniature",
      unit,
      units,
    }));
  }
  return wrap;
}

export {
  renderAllegianceEditor,
  renderCompositionEditor,
  renderEnhancementsEditor,
  renderWarlordEditor,
};
