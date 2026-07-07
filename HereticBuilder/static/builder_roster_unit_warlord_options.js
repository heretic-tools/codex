import { modelCountLabel } from "./builder_count_labels.js";
import { warlordSelectionContext } from "./builder_roster_warlord_options.js";
import { warlordCandidateStatus } from "./builder_warlord_rules.js";

function currentWarlordTargetId(unit) {
  return (unit.miniatures || []).find((miniature) => miniature.isWarlord)?.rosterUnitMiniatureId || "";
}

function unitWarlordOptionLabel(miniature) {
  return `${miniature.name} (${modelCountLabel(miniature.count)})`;
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
