import { button, metricLine, textNode } from "./builder_dom.js";
import { labelControl } from "./builder_roster_control_labels.js";
import { renderWarlordPicker } from "./builder_roster_warlord_picker.js";

function renderRosterOverview({ onDelete, onUpdate, roster, summary, validation }) {
  const overview = document.createElement("section");
  overview.className = "builder-section";
  overview.append(
    textNode("h2", "section-title", `${summary.factionName} / ${summary.battleSizeName}`),
    metricLine("Points", `${validation.points.total} / ${validation.points.limit}`),
    renderWarlordPicker({ onUpdate, roster }),
    labelControl(button("plain-button", "Delete Roster", async () => onDelete(roster)), "Delete roster")
  );
  return overview;
}

export { renderRosterOverview };
