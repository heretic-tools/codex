import { button, textNode } from "./builder_dom.js";
import {
  rosterDetachmentBadgeClass,
  rosterLine,
  rosterValidationBadgeClass,
  rosterValidationBadgeLabel,
} from "./builder_roster_list_rows.js";

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
    list.appendChild(textNode("p", "empty-list", "No rosters yet"));
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
  const exportButton = button("builder-row transfer-button", "Export Rosters", onExport);
  exportButton.disabled = !rosters.length;
  transfer.append(
    exportButton,
    button("builder-row transfer-button", "Import Rosters", () => input.click()),
    input
  );
  root.append(list, button("builder-row create-roster-button", "Create Roster", onCreate), transfer);
  return root;
}

export {
  renderRosterListView,
  rosterDetachmentBadgeClass,
  rosterValidationBadgeClass,
  rosterValidationBadgeLabel,
};
