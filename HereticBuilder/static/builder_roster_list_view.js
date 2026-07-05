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

function renderRosterListView({ onCreate, onExport, onImport, onOpen, rosters, summarizeRoster }) {
  const root = document.createElement("section");
  root.className = "builder-stack";
  const list = document.createElement("div");
  list.className = "builder-list";
  if (rosters.length) {
    for (const roster of rosters) {
      list.appendChild(rosterLine(roster, onOpen, summarizeRoster));
    }
  } else {
    list.appendChild(textNode("p", "empty-list", "No rosters"));
  }
  const transfer = document.createElement("div");
  transfer.className = "builder-transfer-row";
  const input = document.createElement("input");
  input.accept = "application/json,.json";
  input.hidden = true;
  input.type = "file";
  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    input.value = "";
    if (file) {
      await onImport(file);
    }
  });
  transfer.append(
    button("builder-row transfer-button", "Export Rosters", onExport),
    button("builder-row transfer-button", "Import Rosters", () => input.click()),
    input
  );
  root.append(list, button("builder-row create-roster-button", "Create Roster", onCreate), transfer);
  return root;
}

export { renderRosterListView, rosterValidationBadgeClass };
