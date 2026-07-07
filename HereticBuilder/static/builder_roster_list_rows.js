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

function appendDetachmentBadges(parent, badges) {
  for (const badge of badges || []) {
    const node = textNode("span", rosterDetachmentBadgeClass(badge.disposition), badge.name || "Detachment");
    if (badge.disposition) {
      node.title = badge.disposition;
    }
    parent.appendChild(node);
  }
}

function rosterLine(roster, onOpen, summarizeRoster) {
  const summary = summarizeRoster(roster);
  const validationState = summary.validationState || "invalid";
  const node = button("builder-row roster-row", "", () => onOpen(roster));
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
  node.append(text, meta);
  return node;
}

export {
  rosterDetachmentCountLabel,
  rosterDetachmentBadgeClass,
  rosterLine,
  rosterPointsLabel,
  rosterUnitCountLabel,
  rosterValidationBadgeClass,
  rosterValidationBadgeLabel,
};
