import { button, metricLine, textNode } from "./builder_dom.js";
import { rosterSummary, validateRoster } from "./builder_rules.js";
import { renderValidation } from "./builder_validation_view.js";

function renderRosterDetailView({ onDelete, roster }) {
  const summary = rosterSummary(roster);
  const validation = validateRoster(roster);
  const root = document.createElement("section");
  root.className = "builder-grid";
  const overview = document.createElement("section");
  overview.className = "builder-section";
  overview.append(
    textNode("h2", "section-title", `${summary.factionName} / ${summary.battleSizeName}`),
    metricLine("Points", `${validation.points.total} / ${validation.points.limit}`),
    metricLine("Detachments", String((roster.detachmentIds || []).length)),
    metricLine("Units", String((roster.units || []).length)),
    button("plain-button", "Delete Roster", async () => onDelete(roster))
  );
  root.append(overview, renderValidation(validation));
  return root;
}

export { renderRosterDetailView };
