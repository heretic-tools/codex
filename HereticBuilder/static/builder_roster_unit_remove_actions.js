import { attachmentHasUnit } from "./builder_roster_attachment_members.js";
import { withModifiedRoster } from "./builder_roster_action_helpers.js";

function rosterWithRemovedUnit(roster, unitId) {
  if (!unitId) {
    return roster;
  }
  return withModifiedRoster(roster, {
    attachments: (roster.attachments || []).filter((attachment) => (
      !attachmentHasUnit(attachment, unitId)
    )),
    units: (roster.units || []).filter((unit) => unit.id !== unitId),
  });
}

export { rosterWithRemovedUnit };
