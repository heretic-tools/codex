import {
  costForDetachment,
  detachmentDispositionName,
  rosterUnitSummaries,
} from "./builder_model.js";
import { unitRowSummaryText } from "./builder_roster_unit_row_summary.js";
import { state } from "./builder_state.js";

function battleSizeForRoster(roster) {
  return state.catalog.battleSizeById.get(roster.battleSizeId) || {};
}

function factionNameForRoster(roster) {
  return state.catalog.factionById.get(roster.factionKeywordId)?.name || "Unknown faction";
}

function detachmentPointsTotal(roster) {
  return (roster.detachmentIds || []).reduce(
    (total, id) => total + costForDetachment(id, roster.factionKeywordId),
    0
  );
}

function unitSourceText(unit) {
  if (!unit.allyType || unit.allyType === "native") {
    return "";
  }
  const parents = state.catalog.alliedFactionParentsByAlliedFactionId?.get(unit.allyType) || [];
  const names = parents
    .map((row) => state.catalog.factionKeywordById?.get(row.factionKeywordId)?.name)
    .filter(Boolean);
  return names.length ? `, Allied: ${names.join(", ")}` : ", Allied";
}

function detachmentLine(roster, detachmentId) {
  const detachment = state.catalog.detachmentById.get(detachmentId) || {};
  const cost = costForDetachment(detachmentId, roster.factionKeywordId);
  const disposition = detachmentDispositionName(detachment);
  const parts = [`${cost} DP`];
  if (disposition) {
    parts.push(disposition);
  }
  return `- ${detachment.name || "Detachment"} (${parts.join(", ")})`;
}

function unitLine(unit) {
  const modelText = `${unit.modelCount || 0} ${(unit.modelCount || 0) === 1 ? "model" : "models"}`;
  const warlord = unit.isWarlord ? ", Warlord" : "";
  return `- ${unit.name || "Unit"} (${modelText}, ${unit.points || 0} pts${warlord}${unitSourceText(unit)})`;
}

function rosterTextExport(roster, validation = null) {
  const size = battleSizeForRoster(roster);
  const units = rosterUnitSummaries(roster);
  const pointsTotal = validation?.points?.total ?? units.reduce((total, unit) => total + (unit.points || 0), 0);
  const pointsLimit = validation?.points?.limit ?? size.pointsLimit ?? 0;
  const dpTotal = validation?.points?.detachmentPoints ?? detachmentPointsTotal(roster);
  const dpLimit = validation?.points?.detachmentLimit ?? size.detachmentPointsLimit ?? 0;
  const lines = [
    roster.name || "Roster",
    `${factionNameForRoster(roster)} / ${size.name || "Unknown size"}`,
    `Points: ${pointsTotal}${pointsLimit ? ` / ${pointsLimit}` : ""}`,
    `Detachments: ${dpTotal}${dpLimit ? ` / ${dpLimit}` : ""} DP`,
    "",
    `Detachments (${(roster.detachmentIds || []).length})`,
  ];

  const detachmentIds = roster.detachmentIds || [];
  if (detachmentIds.length) {
    lines.push(...detachmentIds.map((id) => detachmentLine(roster, id)));
  } else {
    lines.push("- None");
  }

  lines.push("", `Units (${units.length})`);
  if (units.length) {
    for (const unit of units) {
      lines.push(unitLine(unit));
      const summary = unitRowSummaryText(unit);
      if (summary) {
        lines.push(`  ${summary}`);
      }
    }
  } else {
    lines.push("- None");
  }

  return `${lines.join("\n")}\n`;
}

export {
  detachmentLine,
  rosterTextExport,
  unitLine,
};
