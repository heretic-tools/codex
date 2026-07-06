import { button, metricLine, textNode } from "./builder_dom.js";
import { unitSummary } from "./builder_model.js";
import { rosterWithUnitDefaultWargear } from "./builder_roster_actions.js";
import {
  renderAllegianceEditor,
  renderCompositionEditor,
  renderWarlordEditor,
} from "./builder_roster_unit_detail_editors.js";
import { unitImageNode } from "./builder_unit_images.js";

function unitDisplayName(roster, unit) {
  return unitSummary(roster, unit).name || "Unit";
}

function renderRosterUnitOverview({ onBack, onUpdate, roster, unit, validation, validationContext }) {
  const overview = document.createElement("section");
  overview.className = "builder-section";
  overview.appendChild(textNode("h2", "section-title", unit.name));
  const image = unitImageNode(unit.datasheetId, "unit-detail-art-frame");
  if (image) {
    overview.appendChild(image);
  }
  overview.append(
    metricLine("Points", String(unit.points || 0)),
    metricLine("Models", String(unit.modelCount || 0)),
    renderCompositionEditor({ onUpdate, roster, unit, validation, validationContext }),
    renderWarlordEditor({ onUpdate, roster, unit, validation, validationContext })
  );
  const allegianceEditor = renderAllegianceEditor({ onUpdate, roster, unit, validation, validationContext });
  if (allegianceEditor) {
    overview.appendChild(allegianceEditor);
  }
  overview.append(
    button("plain-button", "Reset Wargear", async () => onUpdate(rosterWithUnitDefaultWargear(roster, unit.id))),
    button("plain-button", "Back", onBack)
  );
  return overview;
}

export { renderRosterUnitOverview, unitDisplayName };
