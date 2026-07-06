import { button, textNode } from "./builder_dom.js";
import { unitSummary } from "./builder_model.js";
import { rosterWithUnitDefaultWargear } from "./builder_roster_actions.js";
import { ensurePrecomputedLoadoutsForDatasheets } from "./builder_precomputed_loadouts_runtime.js";
import { applyRosterUpdate } from "./builder_roster_undoable_update.js";
import {
  renderAllegianceEditor,
  renderCompositionEditor,
  renderWarlordEditor,
} from "./builder_roster_unit_detail_editors.js";
import { wargearGroupsFor } from "./builder_roster_unit_wargear_groups.js";
import { unitImageNode } from "./builder_unit_images.js";

function unitDisplayName(roster, unit) {
  return unitSummary(roster, unit).name || "Unit";
}

function resetWargearFromOverview(roster, unit, onUpdate, onUndoableUpdate = null) {
  return applyRosterUpdate({
    message: `Wargear reset for ${unit.name || "Unit"}`,
    nextRoster: rosterWithUnitDefaultWargear(roster, unit.id),
    onUndoableUpdate,
    onUpdate,
    previousRoster: roster,
  });
}

function unitOverviewMetric(label, value) {
  const metric = document.createElement("span");
  metric.className = "unit-overview-metric";
  metric.append(
    textNode("span", "unit-overview-metric-label", label),
    textNode("strong", "", value)
  );
  return metric;
}

function unitHasWargearControls(unit) {
  if (wargearGroupsFor(unit).length) {
    return true;
  }
  return (unit.miniatures || []).some((miniature) => (
    wargearGroupsFor(unit, miniature.miniatureId).length
  ));
}

function renderRosterUnitOverview({ onUndoableUpdate = null, onUpdate, roster, unit, validation, validationContext }) {
  const overview = document.createElement("section");
  overview.className = "builder-section unit-overview-card";
  const image = unitImageNode(unit.datasheetId, "unit-detail-art-frame");
  if (image) {
    overview.appendChild(image);
  }
  const metrics = document.createElement("div");
  metrics.className = "unit-overview-summary";
  metrics.append(
    unitOverviewMetric("Points", String(unit.points || 0)),
    unitOverviewMetric("Models", String(unit.modelCount || 0))
  );
  const compositionEditor = renderCompositionEditor({ onUndoableUpdate, onUpdate, roster, unit, validation, validationContext });
  overview.appendChild(metrics);
  if (compositionEditor) {
    overview.appendChild(compositionEditor);
  }
  const warlordEditor = renderWarlordEditor({ onUndoableUpdate, onUpdate, roster, unit, validation, validationContext });
  if (warlordEditor) {
    overview.appendChild(warlordEditor);
  }
  const allegianceEditor = renderAllegianceEditor({ onUndoableUpdate, onUpdate, roster, unit, validation, validationContext });
  if (allegianceEditor) {
    overview.appendChild(allegianceEditor);
  }
  if (unitHasWargearControls(unit)) {
    const actions = document.createElement("div");
    actions.className = "unit-overview-actions";
    actions.append(
      button("plain-button", "Reset Wargear", async () => {
        await ensurePrecomputedLoadoutsForDatasheets([unit.datasheetId]);
        await resetWargearFromOverview(roster, unit, onUpdate, onUndoableUpdate);
      })
    );
    overview.appendChild(actions);
  }
  return overview;
}

export {
  renderRosterUnitOverview,
  resetWargearFromOverview,
  unitDisplayName,
  unitHasWargearControls,
  unitOverviewMetric,
};
