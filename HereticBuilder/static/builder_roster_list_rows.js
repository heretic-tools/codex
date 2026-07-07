import { button, textNode } from "./builder_dom.js";
import { dispositionSlug } from "./builder_roster_editor_dom.js";

let activeRosterActionsClose = null;
let activeRosterActionsMenu = null;

function rosterValidationBadgeClass(validationState) {
  if (validationState === "valid") {
    return "ok";
  }
  if (validationState === "outdated") {
    return "warning";
  }
  return "error";
}

function rosterValidationBadgeLabel(validationState) {
  if (validationState === "valid") {
    return "Valid";
  }
  if (validationState === "outdated") {
    return "Outdated";
  }
  return "Invalid";
}

function rosterPointsLabel(total, limit) {
  return limit ? `${total} / ${limit}` : String(total);
}

function rosterPointsProgressValue(total, limit) {
  const pointsTotal = Math.max(0, Number(total) || 0);
  const pointsLimit = Math.max(0, Number(limit) || 0);
  if (!pointsLimit) {
    return 0;
  }
  return Math.min(100, Math.round((pointsTotal / pointsLimit) * 1000) / 10);
}

function rosterPointsProgressClass(total, limit) {
  const pointsTotal = Math.max(0, Number(total) || 0);
  const pointsLimit = Math.max(0, Number(limit) || 0);
  if (!pointsLimit || pointsTotal <= 0) {
    return "empty";
  }
  if (pointsTotal > pointsLimit) {
    return "error";
  }
  if (pointsTotal / pointsLimit >= 0.9) {
    return "warning";
  }
  return "ok";
}

function rosterPointsProgressLabel(total, limit) {
  return limit ? `${total} of ${limit} points used` : `${total} points`;
}

function rosterUnitCountLabel(count) {
  return `${count} ${count === 1 ? "unit" : "units"}`;
}

function rosterDetachmentCountLabel(count) {
  return `${count} ${count === 1 ? "detachment" : "detachments"}`;
}

function rosterModifiedLabel(value) {
  if (!value) {
    return "Updated unknown";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Updated unknown";
  }
  return `Updated ${date.toISOString().slice(0, 10)}`;
}

function rosterDetachmentBadgeClass(disposition) {
  const slug = dispositionSlug(disposition);
  return slug ? `disposition-badge disposition-${slug}` : "meta-badge";
}

function rosterIdLabel(id) {
  const value = String(id || "").trim();
  return value ? `ID ${value.slice(0, 8).toUpperCase()}` : "";
}

function compactRosterBadgeNames(badges = [], limit = 2) {
  const names = (badges || [])
    .map((badge) => String(badge?.name || "").trim())
    .filter(Boolean);
  if (!names.length) {
    return "";
  }
  if (names.length <= limit) {
    return names.join(", ");
  }
  return `${names.slice(0, limit).join(", ")} +${names.length - limit}`;
}

function rosterOpenLabel(roster, summary = null) {
  const name = roster.name || "New Roster";
  const idLabel = rosterIdLabel(roster.id);
  if (!summary) {
    return `Open roster: ${[name, idLabel].filter(Boolean).join(", ")}`;
  }
  const validationState = summary.validationState || "invalid";
  const badgeNames = compactRosterBadgeNames(summary.detachmentBadges || []);
  const parts = [
    name,
    [summary.factionName, summary.battleSizeName].filter(Boolean).join(" / "),
    rosterValidationBadgeLabel(validationState),
    summary.pointsLimit !== undefined || summary.pointsTotal !== undefined
      ? `${rosterPointsLabel(summary.pointsTotal || 0, summary.pointsLimit)} points`
      : "",
    badgeNames ? `Detachments: ${badgeNames}` : "",
    rosterDetachmentCountLabel(summary.detachmentCount || 0),
    rosterUnitCountLabel(summary.unitCount || 0),
    roster.modifiedAt ? rosterModifiedLabel(roster.modifiedAt) : "",
    idLabel,
  ].filter(Boolean);
  return `Open roster: ${parts.join(", ")}`;
}

function rosterActionLabel(roster, action) {
  return `${action}: ${roster.name || "New Roster"}`;
}

function appendDetachmentBadges(parent, badges) {
  for (const badge of badges || []) {
    const node = textNode("span", rosterDetachmentBadgeClass(badge.disposition), badge.name || "Detachment");
    if (badge.disposition) {
      node.title = badge.disposition;
    }
    parent.appendChild(node);
  }
}

function rosterPointsMeter(summary) {
  const total = summary.pointsTotal || 0;
  const limit = summary.pointsLimit || 0;
  const value = rosterPointsProgressValue(total, limit);
  const state = rosterPointsProgressClass(total, limit);
  const meter = document.createElement("span");
  meter.className = `roster-points-meter points-${state}`;
  meter.title = rosterPointsProgressLabel(total, limit);
  meter.setAttribute("aria-hidden", "true");
  meter.setAttribute("style", `--roster-points-progress: ${value}%`);
  return meter;
}

function rosterActionButton(text, roster, onClick) {
  const node = button("roster-action-button", text, async (event) => {
    event?.stopPropagation?.();
    const menu = node.closest?.(".roster-actions-menu");
    if (typeof menu?.closeRosterActionsMenu === "function") {
      menu.closeRosterActionsMenu();
    } else if (menu) {
      menu.open = false;
    }
    await onClick(roster);
  });
  const label = rosterActionLabel(roster, text);
  node.title = label;
  node.setAttribute("aria-label", label);
  return node;
}

function rosterActionsMenu(roster, { onDelete, onDuplicate, onExport, onExportText, onRename } = {}) {
  if (!onDelete && !onDuplicate && !onExport && !onExportText && !onRename) {
    return null;
  }
  const node = document.createElement("details");
  node.className = "roster-actions-menu";
  const trigger = document.createElement("summary");
  trigger.className = "roster-actions-trigger";
  trigger.textContent = "...";
  trigger.title = rosterActionLabel(roster, "More actions");
  trigger.setAttribute("aria-label", trigger.title);
  trigger.setAttribute("aria-haspopup", "menu");
  trigger.setAttribute("aria-expanded", "false");
  const clearActiveMenu = () => {
    if (activeRosterActionsMenu === node) {
      activeRosterActionsMenu = null;
      activeRosterActionsClose = null;
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
    if (node.open && !node.contains(event.target)) {
      closeMenu();
    }
  };
  node.closeRosterActionsMenu = closeMenu;
  node.addEventListener("toggle", () => {
    if (node.open) {
      if (activeRosterActionsMenu && activeRosterActionsMenu !== node) {
        activeRosterActionsClose?.();
      }
      activeRosterActionsMenu = node;
      activeRosterActionsClose = closeMenu;
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
  panel.className = "roster-actions-panel";
  if (onRename) {
    panel.appendChild(rosterActionButton("Rename", roster, onRename));
  }
  if (onDuplicate) {
    panel.appendChild(rosterActionButton("Duplicate", roster, onDuplicate));
  }
  if (onExport) {
    panel.appendChild(rosterActionButton("Export JSON", roster, onExport));
  }
  if (onExportText) {
    panel.appendChild(rosterActionButton("Export Text", roster, onExportText));
  }
  if (onDelete) {
    panel.appendChild(rosterActionButton("Delete Roster", roster, onDelete));
  }
  node.append(trigger, panel);
  return node;
}

function rosterListItem(roster, onOpen, summarizeRoster, actions = {}) {
  const node = document.createElement("div");
  node.className = "roster-list-item";
  node.appendChild(rosterLine(roster, onOpen, summarizeRoster));
  const menu = rosterActionsMenu(roster, actions);
  if (menu) {
    node.appendChild(menu);
  }
  return node;
}

function rosterLine(roster, onOpen, summarizeRoster) {
  const summary = summarizeRoster(roster);
  const validationState = summary.validationState || "invalid";
  const node = button("builder-row roster-row", "", () => onOpen(roster));
  const openLabel = rosterOpenLabel(roster, summary);
  node.title = openLabel;
  node.setAttribute("aria-label", openLabel);
  const text = document.createElement("span");
  text.className = "row-text";
  text.append(
    textNode("strong", "", roster.name || "New Roster"),
    textNode("span", "", `${summary.factionName} / ${summary.battleSizeName}`)
  );
  appendDetachmentBadges(text, summary.detachmentBadges);
  const meta = document.createElement("span");
  meta.className = "row-meta";
  meta.append(
    textNode("span", `validation-state-badge state-${rosterValidationBadgeClass(validationState)}`, rosterValidationBadgeLabel(validationState)),
    textNode("span", "", rosterPointsLabel(summary.pointsTotal, summary.pointsLimit)),
    textNode("span", "", rosterDetachmentCountLabel(summary.detachmentCount)),
    textNode("span", "", rosterUnitCountLabel(summary.unitCount)),
    textNode("span", "", rosterModifiedLabel(roster.modifiedAt))
  );
  node.append(text, meta, rosterPointsMeter(summary));
  return node;
}

export {
  compactRosterBadgeNames,
  rosterActionLabel,
  rosterActionsMenu,
  rosterDetachmentCountLabel,
  rosterDetachmentBadgeClass,
  rosterLine,
  rosterListItem,
  rosterModifiedLabel,
  rosterOpenLabel,
  rosterPointsLabel,
  rosterPointsProgressClass,
  rosterPointsProgressLabel,
  rosterPointsProgressValue,
  rosterUnitCountLabel,
  rosterValidationBadgeClass,
  rosterValidationBadgeLabel,
};
