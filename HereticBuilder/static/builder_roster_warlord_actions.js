import { rosterUnitSummaries } from "./builder_model.js";
import { withModifiedRoster } from "./builder_roster_action_helpers.js";
import { state } from "./builder_state.js";
import { warlordCandidateStatus } from "./builder_warlord_rules.js";

function warlordActionContext(roster, { detachments = null, units = null } = {}) {
  return {
    detachments: detachments ?? (roster.detachmentIds || [])
      .map((id) => state.catalog.detachmentById.get(id))
      .filter(Boolean),
    units: units ?? rosterUnitSummaries(roster),
  };
}

function warlordCanBeSelected(roster, {
  detachments = null,
  rosterUnitMiniatureId = "",
  unitId = "",
  units = null,
}) {
  if (!unitId || !rosterUnitMiniatureId) {
    return true;
  }
  const context = warlordActionContext(roster, { detachments, units });
  const unit = context.units.find((item) => item.id === unitId);
  const miniature = (unit?.miniatures || [])
    .find((item) => (item.rosterUnitMiniatureId || item.id) === rosterUnitMiniatureId);
  if (!unit || !miniature) {
    return false;
  }
  return warlordCandidateStatus(roster, context.detachments, context.units, unit, miniature).eligible;
}

function rosterWithWarlord(roster, {
  detachments = null,
  rosterUnitMiniatureId = "",
  unitId = "",
  units = null,
}) {
  if (!warlordCanBeSelected(roster, { detachments, rosterUnitMiniatureId, unitId, units })) {
    return roster;
  }
  return withModifiedRoster(roster, {
    units: (roster.units || []).map((unit) => ({
      ...unit,
      miniatures: (unit.miniatures || []).map((miniature) => {
        const targetId = miniature.rosterUnitMiniatureId || miniature.id;
        return {
          ...miniature,
          isWarlord: Boolean(unitId && rosterUnitMiniatureId && unit.id === unitId && targetId === rosterUnitMiniatureId),
        };
      }),
    })),
  });
}

export { rosterWithWarlord, warlordCanBeSelected };
