import { warlordSelectionContext } from "./builder_roster_warlord_options.js";
import { warlordCandidateStatus } from "./builder_warlord_rules.js";

function currentWarlordTargetId(unit) {
  return (unit.miniatures || []).find((miniature) => miniature.isWarlord)?.rosterUnitMiniatureId || "";
}

function unitWarlordOptionLabel(miniature) {
  const count = miniature.count || 0;
  return `${miniature.name} (${count} ${count === 1 ? "model" : "models"})`;
}

function unitWarlordSelectModel(roster, unit) {
  const context = warlordSelectionContext(roster);
  const currentId = currentWarlordTargetId(unit);
  return {
    context,
    currentId,
    options: [
      { label: "Not Warlord", value: "" },
      ...(unit.miniatures || []).map((miniature) => {
        const targetId = miniature.rosterUnitMiniatureId || miniature.id;
        const status = warlordCandidateStatus(roster, context.detachments, context.units, unit, miniature);
        const suffix = status.eligible ? "" : ` / ${status.reason}`;
        return {
          disabled: !status.eligible && targetId !== currentId,
          label: `${unitWarlordOptionLabel(miniature)}${suffix}`,
          status,
          value: targetId,
        };
      }),
    ],
  };
}

export {
  currentWarlordTargetId,
  unitWarlordOptionLabel,
  unitWarlordSelectModel,
};
