import { button, metricLine, textNode } from "./builder_dom.js";
import { renderWarlordPicker } from "./builder_roster_warlord_picker.js";

function renderRosterOverview({ onDelete, onUpdate, roster, summary, validation }) {
  const overview = document.createElement("section");
  overview.className = "builder-section";
  overview.append(
    textNode("h2", "section-title", `${summary.factionName} / ${summary.battleSizeName}`),
    metricLine("Points", `${validation.points.total} / ${validation.points.limit}`),
    renderWarlordPicker({ onUpdate, roster }),
    button("plain-button", "Delete Roster", async () => onDelete(roster))
  );
  return overview;
}

export { renderRosterOverview };
