import { withModifiedRoster } from "./builder_roster_action_helpers.js";

function rosterWithAddedDetachment(roster, detachmentId) {
  if (!detachmentId || (roster.detachmentIds || []).includes(detachmentId)) {
    return roster;
  }
  return withModifiedRoster(roster, {
    detachmentIds: [...(roster.detachmentIds || []), detachmentId],
  });
}

function rosterWithRemovedDetachment(roster, index) {
  const detachmentIds = [...(roster.detachmentIds || [])];
  if (index < 0 || index >= detachmentIds.length) {
    return roster;
  }
  detachmentIds.splice(index, 1);
  return withModifiedRoster(roster, { detachmentIds });
}

export {
  rosterWithAddedDetachment,
  rosterWithRemovedDetachment,
};
