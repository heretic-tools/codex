import { button, metricLine, textNode } from "./builder_dom.js";
import { renderRosterEditor } from "./builder_roster_editor_view.js";
import { renderValidation } from "./builder_validation_view.js";

function renderRosterDetailView({ newId, onDelete, onUpdate, roster, summarizeRoster, validateRoster }) {
  const summary = summarizeRoster(roster);
  const validation = validateRoster(roster);
  const root = document.createElement("section");
  root.className = "builder-grid";
  const overview = document.createElement("section");
  overview.className = "builder-section";
  overview.append(
    textNode("h2", "section-title", `${summary.factionName} / ${summary.battleSizeName}`),
    metricLine("Points", `${validation.points.total} / ${validation.points.limit}`),
    button("plain-button", "Delete Roster", async () => onDelete(roster))
  );
  const editor = renderRosterEditor({ newId, onUpdate, roster, validation });
  const validationView = renderValidation(validation);
  validationView.classList.add("validation-section");
  root.append(overview, editor, validationView);
  return root;
}

export { renderRosterDetailView };
