import { button, metricLine, textNode } from "./builder_dom.js";
import { unitSummary } from "./builder_model.js";
import { rosterWithUnitDefaultWargear } from "./builder_roster_actions.js";
import { unitImageNode } from "./builder_unit_images.js";
import { validationContextForRoster } from "./builder_validation_context.js";
import { renderValidation, validationForUnit } from "./builder_validation_view.js";
import { renderUnitValidationAction, unitValidationActionTarget } from "./builder_roster_unit_detail_actions.js";
import {
  renderAllegianceEditor,
  renderCompositionEditor,
  renderEnhancementsEditor,
  renderWarlordEditor,
} from "./builder_roster_unit_detail_editors.js";
import { groupsFor, renderWargearScope } from "./builder_roster_unit_wargear_view.js";

function unitDisplayName(roster, unit) {
  return unitSummary(roster, unit).name || "Unit";
}

function renderRosterUnitDetailView({ onBack, onUpdate, roster, unit, validation }) {
  const summary = unitSummary(roster, unit);
  const unitValidation = validationForUnit(validation, summary);
  const validationContext = validationContextForRoster(roster);
  const otherIssueCount = Math.max(0, (validation.messages || []).length - unitValidation.messages.length);
  const root = document.createElement("section");
  root.className = "builder-grid";

  const sidebar = document.createElement("section");
  sidebar.className = "builder-roster-sidebar";

  const overview = document.createElement("section");
  overview.className = "builder-section";
  overview.appendChild(textNode("h2", "section-title", summary.name));
  const image = unitImageNode(summary.datasheetId, "unit-detail-art-frame");
  if (image) {
    overview.appendChild(image);
  }
  overview.append(
    metricLine("Points", String(summary.points || 0)),
    metricLine("Models", String(summary.modelCount || 0)),
    renderCompositionEditor({ onUpdate, roster, unit: summary }),
    renderWarlordEditor({ onUpdate, roster, unit: summary })
  );
  const allegianceEditor = renderAllegianceEditor({ onUpdate, roster, unit: summary });
  if (allegianceEditor) {
    overview.appendChild(allegianceEditor);
  }
  if (otherIssueCount) {
    overview.appendChild(metricLine("Other Issues", String(otherIssueCount)));
  }
  overview.append(
    button("plain-button", "Reset Wargear", async () => onUpdate(rosterWithUnitDefaultWargear(roster, summary.id))),
    button("plain-button", "Back", onBack)
  );

  const wargear = document.createElement("section");
  wargear.className = "builder-section unit-wargear-section";
  wargear.dataset.unitDetailTarget = "wargear";
  wargear.appendChild(renderWargearScope({
    groups: groupsFor(summary),
    heading: "Unit Wargear",
    onUpdate,
    roster,
    target: summary,
    unit: summary,
    validation: unitValidation,
    validationContext,
  }));
  for (const miniature of summary.miniatures) {
    wargear.appendChild(renderWargearScope({
      groups: groupsFor(summary, miniature.miniatureId),
      heading: `${miniature.name} (${miniature.count || 0})`,
      onUpdate,
      roster,
      target: miniature,
      unit: summary,
      validation: unitValidation,
      validationContext,
    }));
  }

  sidebar.append(
    overview,
    renderValidation(unitValidation, {
      context: validationContext,
      groupAction: renderUnitValidationAction,
    }),
    renderEnhancementsEditor({ onUpdate, roster, unit: summary })
  );
  root.append(sidebar, wargear);
  return root;
}

export { renderRosterUnitDetailView, unitDisplayName, unitValidationActionTarget };
