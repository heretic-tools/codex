import {
  ATTACHMENT_TYPES,
  attachmentTypeLabel,
  unitAttachmentRoles,
  unitLabel,
} from "./builder_roster_attachment_types.js";
import {
  attachmentFailureMessage,
  attachmentPairFailures,
} from "./builder_roster_attachment_failures.js";

function unitCanAttachToBodyguard(roster, attachedUnit, bodyguardUnit, attachmentType) {
  return !attachmentPairFailures(roster, attachedUnit, bodyguardUnit, attachmentType).length;
}

function attachableUnits(roster, units, bodyguardUnit, attachmentType) {
  return units.filter((unit) => {
    if (unit.id === bodyguardUnit.id) {
      return false;
    }
    if (unitAttachmentRoles(roster, unit.id).length) {
      return false;
    }
    return unitCanAttachToBodyguard(roster, unit, bodyguardUnit, attachmentType);
  });
}

function availableAttachmentTypes(roster, units, bodyguardUnit) {
  return ATTACHMENT_TYPES.filter((item) => (
    attachableUnits(roster, units, bodyguardUnit, item.value).length
  ));
}

function bodyguardRows(roster, units) {
  return units.filter((unit) => {
    const roles = unitAttachmentRoles(roster, unit.id);
    if (roles.includes("leader") || roles.includes("support")) {
      return false;
    }
    return availableAttachmentTypes(roster, units, unit).length;
  });
}

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

export {
  ATTACHMENT_TYPES,
  attachableUnits,
  attachmentTypeLabel,
  attachmentUnavailableMessage,
  availableAttachmentTypes,
  bodyguardRows,
  unitLabel,
};
