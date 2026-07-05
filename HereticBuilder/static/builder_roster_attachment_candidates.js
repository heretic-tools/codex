import {
  ATTACHMENT_TYPES,
  unitAttachmentRoles,
} from "./builder_roster_attachment_types.js";
import { attachmentPairFailures } from "./builder_roster_attachment_failures.js";

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

export {
  attachableUnits,
  availableAttachmentTypes,
  bodyguardRows,
};
