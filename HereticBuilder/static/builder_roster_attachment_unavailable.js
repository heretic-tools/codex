import {
  ATTACHMENT_TYPES,
  unitAttachmentRoles,
} from "./builder_roster_attachment_types.js";
import {
  attachmentFailureMessage,
  attachmentPairFailures,
} from "./builder_roster_attachment_failures.js";
import { bodyguardRows } from "./builder_roster_attachment_candidates.js";

function attachmentUnavailableMessage(roster, units, bodyguards = bodyguardRows(roster, units)) {
  if (units.length < 2) {
    return "Add at least two units";
  }
  if (bodyguards.length) {
    return "No attached units";
  }
  const bodyguardCandidates = units.filter((unit) => {
    const roles = unitAttachmentRoles(roster, unit.id);
    return !roles.includes("leader") && !roles.includes("support");
  });
  const attachedCandidates = units.filter((unit) => !unitAttachmentRoles(roster, unit.id).length);
  const failures = [];
  for (const bodyguardUnit of bodyguardCandidates) {
    for (const attachedUnit of attachedCandidates) {
      if (attachedUnit.id === bodyguardUnit.id) {
        continue;
      }
      for (const attachmentType of ATTACHMENT_TYPES) {
        failures.push(...attachmentPairFailures(roster, attachedUnit, bodyguardUnit, attachmentType.value));
      }
    }
  }

  return attachmentFailureMessage(failures);
}

export { attachmentUnavailableMessage };
