import { button, textNode } from "./builder_dom.js";

function rosterValidationBadgeClass(validationState) {
  if (validationState === "valid") {
    return "ok";
  }
  if (validationState === "outdated") {
    return "warning";
  }
  return "error";
}

function rosterLine(roster, onOpen, summarizeRoster) {
  const summary = summarizeRoster(roster);
  const pointsLimit = summary.pointsLimit ? `/${summary.pointsLimit}` : "";
  const validationState = summary.validationState || "invalid";
  const node = button("builder-row roster-row", "", () => onOpen(roster));
  const text = document.createElement("span");
  text.className = "row-text";
  text.append(
    textNode("strong", "", roster.name || "New Roster"),
    textNode("span", "", `${summary.factionName} / ${summary.battleSizeName}`)
  );
  const meta = document.createElement("span");
  meta.className = "row-meta";
  meta.append(
    textNode("span", `validation-state-badge state-${rosterValidationBadgeClass(validationState)}`, validationState),
    textNode("span", "", `${summary.pointsTotal}${pointsLimit}`),
    textNode("span", "", `${summary.detachmentCount} det.`),
    textNode("span", "", `${summary.unitCount} units`)
  );
  node.append(text, meta);
  return node;
}

export { rosterLine, rosterValidationBadgeClass };
