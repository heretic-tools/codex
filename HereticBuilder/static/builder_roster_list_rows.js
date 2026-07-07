import { button, textNode } from "./builder_dom.js";
import { dispositionSlug } from "./builder_roster_editor_dom.js";

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

function rosterDetachmentBadgeClass(disposition) {
  const slug = dispositionSlug(disposition);
  return slug ? `disposition-badge disposition-${slug}` : "meta-badge";
}

function rosterIdLabel(id) {
  const value = String(id || "").trim();
  return value ? `ID ${value.slice(0, 8).toUpperCase()}` : "";
}

function rosterOpenLabel(roster, summary = null) {
  const name = roster.name || "New Roster";
  const idLabel = rosterIdLabel(roster.id);
  if (!summary) {
    return `Open roster: ${[name, idLabel].filter(Boolean).join(", ")}`;
  }
  const validationState = summary.validationState || "invalid";
  const parts = [
    name,
    [summary.factionName, summary.battleSizeName].filter(Boolean).join(" / "),
    rosterValidationBadgeLabel(validationState),
    summary.pointsLimit !== undefined || summary.pointsTotal !== undefined
      ? `${rosterPointsLabel(summary.pointsTotal || 0, summary.pointsLimit)} points`
      : "",
    rosterDetachmentCountLabel(summary.detachmentCount || 0),
    rosterUnitCountLabel(summary.unitCount || 0),
    idLabel,
  ].filter(Boolean);
  return `Open roster: ${parts.join(", ")}`;
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
    textNode("span", "", rosterUnitCountLabel(summary.unitCount))
  );
  node.append(text, meta, rosterPointsMeter(summary));
  return node;
}

export {
  rosterDetachmentCountLabel,
  rosterDetachmentBadgeClass,
  rosterLine,
  rosterOpenLabel,
  rosterPointsLabel,
  rosterPointsProgressClass,
  rosterPointsProgressLabel,
  rosterPointsProgressValue,
  rosterUnitCountLabel,
  rosterValidationBadgeClass,
  rosterValidationBadgeLabel,
};
