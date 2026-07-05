import { validateAlliedFactionAvailability } from "./builder_allied_faction_availability_rules.js";
import { validateAlliedFactionDatasheets } from "./builder_allied_faction_datasheet_rules.js";
import { validateAlliedFactionDetachments } from "./builder_allied_faction_detachment_rules.js";
import { validateAlliedFactionPoints } from "./builder_allied_faction_points_rules.js";
import { validateAlliedFactionWarlords } from "./builder_allied_faction_warlord_rules.js";

function validateAlliedFactionRules(roster, alliedFactionId, label, items, detachmentIds, warlordIds, messages) {
  validateAlliedFactionAvailability(roster, alliedFactionId, label, items, messages);
  validateAlliedFactionWarlords(alliedFactionId, label, items, warlordIds, messages);
  validateAlliedFactionDetachments(alliedFactionId, label, items, detachmentIds, messages);
  validateAlliedFactionDatasheets(alliedFactionId, label, items, messages);
  validateAlliedFactionPoints(roster, alliedFactionId, label, items, messages);
}

export { validateAlliedFactionRules };
