import { button, link, textNode } from "./builder_dom.js";
import { datasheetCodexHref } from "./builder_codex_links.js";
import { rosterWithRemovedUnit } from "./builder_roster_actions.js";
import { applyRosterUpdate } from "./builder_roster_undoable_update.js";
import { unitSourceBadgeNode, unitSourceBadgeText } from "./builder_roster_unit_badges.js";
import { unitValidationStatus } from "./builder_roster_unit_validation_status.js";
import { unitRowSummaryText } from "./builder_roster_unit_row_summary.js";
import { enableSwipeAction } from "./builder_swipe_action.js";
import { applyUnitBackgroundArt } from "./builder_unit_images.js";
import { unitOpenLabel } from "./builder_unit_open_labels.js";

let activeUnitActionsClose = null;
let activeUnitActionsMenu = null;

function removeUnitFromRow(roster, summary, onUpdate, onUndoableUpdate = null) {
  return applyRosterUpdate({
    message: `${summary.name || "Unit"} removed`,
    nextRoster: rosterWithRemovedUnitFromSummary(roster, summary),
    onUndoableUpdate,
    onUpdate,
    previousRoster: roster,
  });
}

function fallbackUnitId() {
  return `LOCAL-UNIT-${Date.now()}-${Math.random().toString(16).slice(2)}`.toUpperCase();
}

function duplicatedUnitMiniatures(unit, unitId, targetIds) {
  return (unit.miniatures || []).map((miniature, index) => {
    const oldIds = [
      miniature.id,
      miniature.rosterUnitMiniatureId,
      miniature.miniatureId,
    ].filter(Boolean);
    const nextTargetId = `${unitId}:${miniature.miniatureId || miniature.id || "model"}:${index}`;
    for (const oldId of oldIds) {
      targetIds.set(oldId, nextTargetId);
    }
    return {
      ...JSON.parse(JSON.stringify(miniature || {})),
      id: nextTargetId,
      isWarlord: false,
      rosterUnitMiniatureId: nextTargetId,
      wargear: duplicatedWargear(miniature.wargear, targetIds),
    };
  });
}

function remapRosterMiniatureId(value, targetIds) {
  return value && targetIds.has(value) ? targetIds.get(value) : value;
}

function duplicatedWargear(wargear, targetIds) {
  if (Array.isArray(wargear)) {
    return wargear.map((entry) => ({
      ...entry,
      rosterUnitMiniatureId: remapRosterMiniatureId(entry.rosterUnitMiniatureId, targetIds),
    }));
  }
  if (wargear && typeof wargear === "object") {
    return { ...wargear };
  }
  return {};
}

function summaryUnitIndex(summary) {
  const index = Number(summary?.rosterUnitIndex);
  return Number.isInteger(index) && index >= 0 ? index : -1;
}

function unitForSummary(roster, summary) {
  const units = roster.units || [];
  const unitById = summary?.id ? units.find((item) => item.id === summary.id) : null;
  if (unitById) {
    return unitById;
  }
  const index = summaryUnitIndex(summary);
  return index >= 0 ? units[index] : null;
}

function rosterWithRemovedUnitFromSummary(roster, summary) {
  if (summary?.id) {
    return rosterWithRemovedUnit(roster, summary.id);
  }
  const index = summaryUnitIndex(summary);
  const units = roster.units || [];
  if (index < 0 || index >= units.length) {
    return roster;
  }
  return {
    ...roster,
    units: units.filter((_, unitIndex) => unitIndex !== index),
  };
}

function duplicatedUnit(unit, unitId) {
  const targetIds = new Map();
  const miniatures = duplicatedUnitMiniatures(unit, unitId, targetIds);
  return {
    ...JSON.parse(JSON.stringify(unit || {})),
    id: unitId,
    miniatureEnhancements: (unit.miniatureEnhancements || []).map((enhancement) => ({
      ...enhancement,
      targetId: remapRosterMiniatureId(enhancement.targetId, targetIds),
    })),
    miniatures,
    wargear: duplicatedWargear(unit.wargear, targetIds),
    warlordMiniatureIds: [],
  };
}

function rosterWithCopiedUnit(roster, summary, unitId) {
  const unit = unitForSummary(roster, summary);
  if (!unit || !unitId) {
    return roster;
  }
  return {
    ...roster,
    units: [
      ...(roster.units || []),
      duplicatedUnit(unit, unitId),
    ],
  };
}

function copyUnitFromRow(roster, summary, newId, onUpdate, onUndoableUpdate = null) {
  const unitId = typeof newId === "function" ? newId() : (newId || fallbackUnitId());
  return applyRosterUpdate({
    message: `${summary.name || "Unit"} copied`,
    nextRoster: rosterWithCopiedUnit(roster, summary, unitId),
    onUndoableUpdate,
    onUpdate,
    previousRoster: roster,
  });
}

function unitModelCountLabel(count) {
  return `${count} ${count === 1 ? "model" : "models"}`;
}

function unitActionLabel(summary, action) {
  return `${action}: ${summary.name || "Unit"}`;
}

function unitDatasheetHref(roster, summary) {
  try {
    return datasheetCodexHref(roster, summary.datasheetId);
  } catch {
    return "";
  }
}

function closeUnitActionMenuFrom(node) {
  const menu = node.closest?.(".unit-actions-menu");
  if (typeof menu?.closeUnitActionsMenu === "function") {
    menu.closeUnitActionsMenu();
  } else if (menu) {
    menu.open = false;
  }
}

function unitActionButton(text, summary, onClick) {
  const node = button("roster-action-button unit-action-button", text, async (event) => {
    event?.stopPropagation?.();
    await onClick();
    closeUnitActionMenuFrom(node);
  });
  const label = unitActionLabel(summary, text);
  node.title = label;
  node.setAttribute("aria-label", label);
  return node;
}

function unitActionLink(text, summary, href) {
  const node = link("roster-action-button unit-action-button", text, href);
  const label = unitActionLabel(summary, text);
  node.title = label;
  node.setAttribute("aria-label", label);
  node.addEventListener("click", (event) => {
    event.stopPropagation?.();
    closeUnitActionMenuFrom(node);
  });
  return node;
}

function unitActionsMenu({ newId, onUndoableUpdate, onUpdate, roster, summary }) {
  const node = document.createElement("details");
  node.className = "roster-actions-menu unit-actions-menu";
  const trigger = document.createElement("summary");
  trigger.className = "roster-actions-trigger unit-actions-trigger";
  trigger.textContent = "...";
  trigger.title = unitActionLabel(summary, "More actions");
  trigger.setAttribute("aria-label", trigger.title);
  trigger.setAttribute("aria-haspopup", "menu");
  trigger.setAttribute("aria-expanded", "false");
  const clearActiveMenu = () => {
    if (activeUnitActionsMenu === node) {
      activeUnitActionsMenu = null;
      activeUnitActionsClose = null;
    }
  };
  const syncOpenState = () => {
    trigger.setAttribute("aria-expanded", node.open ? "true" : "false");
    if (node.open) {
      document.addEventListener?.("pointerdown", closeOutside, true);
    } else {
      document.removeEventListener?.("pointerdown", closeOutside, true);
      clearActiveMenu();
    }
  };
  const closeMenu = ({ focusTrigger = false } = {}) => {
    node.open = false;
    syncOpenState();
    if (focusTrigger) {
      trigger.focus?.();
    }
  };
  const closeOutside = (event) => {
    if (event.target?.closest?.(".unit-actions-menu")) {
      return;
    }
    if (node.open && !node.contains(event.target)) {
      closeMenu();
    }
  };
  node.closeUnitActionsMenu = closeMenu;
  node.addEventListener("toggle", () => {
    if (node.open) {
      if (activeUnitActionsMenu && activeUnitActionsMenu !== node) {
        activeUnitActionsClose?.();
      }
      activeUnitActionsMenu = node;
      activeUnitActionsClose = closeMenu;
    }
    syncOpenState();
  });
  node.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && node.open) {
      event.preventDefault?.();
      event.stopPropagation?.();
      closeMenu({ focusTrigger: true });
    }
  });
  const panel = document.createElement("div");
  panel.className = "roster-actions-panel unit-actions-panel";
  const href = unitDatasheetHref(roster, summary);
  if (href) {
    panel.appendChild(unitActionLink("Open Datasheet", summary, href));
  }
  panel.appendChild(unitActionButton("Copy", summary, () => (
    copyUnitFromRow(roster, summary, newId, onUpdate, onUndoableUpdate)
  )));
  panel.appendChild(unitActionButton("Delete", summary, () => (
    removeUnitFromRow(roster, summary, onUpdate, onUndoableUpdate)
  )));
  node.append(trigger, panel);
  return node;
}

function renderUnitRow(roster, summary, validation, onUpdate, onUnitOpen, onUndoableUpdate = null, newId = fallbackUnitId) {
  const node = document.createElement("div");
  node.className = "unit-list-item editor-row";
  const row = document.createElement("div");
  row.className = "builder-row unit-editor-row";
  const removeUnit = () => removeUnitFromRow(roster, summary, onUpdate, onUndoableUpdate);
  enableSwipeAction(row, removeUnit);
  const validationStatus = unitValidationStatus(validation, summary);
  if (validationStatus) {
    row.classList.add(`has-validation-${validationStatus.className}`);
  }
  applyUnitBackgroundArt(node, summary.datasheetId);
  const text = button("unit-open-button", "", () => onUnitOpen(summary));
  text.className = "unit-open-button row-text";
  const sourceLabel = unitSourceBadgeText(summary);
  const summaryText = unitRowSummaryText(summary);
  const openLabel = unitOpenLabel(summary, { sourceLabel, summaryText });
  text.title = openLabel;
  text.setAttribute("aria-label", openLabel);
  const meta = document.createElement("span");
  meta.className = "unit-row-top";
  meta.append(
    textNode("span", "", unitModelCountLabel(summary.modelCount || 0)),
    textNode("span", "meta-badge", `${summary.points || 0} pts`)
  );
  if (summaryText) {
    meta.append(textNode("span", "unit-row-summary", summaryText));
  }
  if (summary.isWarlord) {
    meta.append(textNode("span", "meta-badge", "Warlord"));
  }
  const sourceBadge = sourceLabel ? unitSourceBadgeNode(summary) : null;
  if (sourceBadge) {
    meta.append(sourceBadge);
  }
  if (validationStatus) {
    meta.append(textNode("span", `validation-state-badge state-${validationStatus.className}`, validationStatus.text));
  }
  text.append(
    meta,
    textNode("strong", "unit-row-name", summary.name || "Unit")
  );
  row.append(text);
  node.append(row, unitActionsMenu({ newId, onUndoableUpdate, onUpdate, roster, summary }));
  return node;
}

export {
  copyUnitFromRow,
  duplicatedUnit,
  removeUnitFromRow,
  renderUnitRow,
  rosterWithCopiedUnit,
  unitModelCountLabel,
  unitOpenLabel,
  unitSourceBadgeText,
};
