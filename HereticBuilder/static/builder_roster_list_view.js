import { button, textNode } from "./builder_dom.js";
import { labelControl } from "./builder_roster_control_labels.js";
import {
  rosterDetachmentBadgeClass,
  rosterListItem,
  rosterValidationBadgeClass,
  rosterValidationBadgeLabel,
} from "./builder_roster_list_rows.js";

function renderRosterListView({
  onCreate,
  onDelete,
  onDuplicate,
  onExport,
  onImport,
  onOpen,
  onRename,
  rosters,
  summarizeRoster,
}) {
  const root = document.createElement("section");
  root.className = "builder-stack";
  const list = document.createElement("div");
  list.className = "builder-list";
  if (rosters.length) {
    for (const roster of rosters) {
      list.appendChild(rosterListItem(roster, onOpen, summarizeRoster, {
        onDelete,
        onDuplicate,
        onRename,
      }));
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
  const exportButton = labelControl(
    button("builder-row transfer-button", "Export Rosters", onExport),
    "Export rosters"
  );
  exportButton.disabled = !rosters.length;
  const importButton = labelControl(
    button("builder-row transfer-button", "Import Rosters", () => input.click()),
    "Import rosters"
  );
  const createButton = labelControl(
    button("builder-row create-roster-button", "Create Roster", onCreate),
    "Create roster"
  );
  transfer.append(
    exportButton,
    importButton,
    input
  );
  root.append(list, createButton, transfer);
  return root;
}

export {
  renderRosterListView,
  rosterDetachmentBadgeClass,
  rosterValidationBadgeClass,
  rosterValidationBadgeLabel,
};
