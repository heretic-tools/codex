import { withModifiedRoster } from "./builder_roster_action_helpers.js";

function rosterWithWarlord(roster, { rosterUnitMiniatureId = "", unitId = "" }) {
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

export { rosterWithWarlord };
