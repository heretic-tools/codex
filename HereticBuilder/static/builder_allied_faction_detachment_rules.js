import { idsFromRows, unique } from "./builder_model.js";
import { state } from "./builder_state.js";
import { validationMessage } from "./builder_validation_messages.js";
import { detachmentNames, unitIdsScope } from "./builder_allied_rule_helpers.js";

function validateAlliedFactionDetachments(alliedFactionId, label, items, detachmentIds, messages) {
  const alliedFaction = state.catalog.alliedFactionById.get(alliedFactionId);
  const requiredDetachments = unique([
    alliedFaction?.requiredDetachmentId,
    ...idsFromRows(state.catalog.alliedFactionRequiredDetachmentsByAlliedFactionId.get(alliedFactionId), "detachmentId"),
  ]);
  if (requiredDetachments.length && !requiredDetachments.some((id) => detachmentIds.has(id))) {
    messages.push(validationMessage(
      "allied_unit.required_detachment_not_selected",
      `${label} allies require one of these detachments: ${detachmentNames(requiredDetachments).join(", ")}.`,
      "error",
      unitIdsScope(items)
    ));
  }
}

export { validateAlliedFactionDetachments };
