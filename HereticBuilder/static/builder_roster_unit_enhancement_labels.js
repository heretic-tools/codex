import { enhancementPoints } from "./builder_model.js";
import { state } from "./builder_state.js";

function enhancementLabel(enhancement, keywordIds, status = null) {
  const detachment = state.catalog.detachmentById.get(enhancement.detachmentId);
  const points = enhancementPoints(enhancement.id, keywordIds);
  const suffix = [
    detachment?.name,
    `${points || 0} pts`,
    status && !status.eligible ? status.reason : "",
  ].filter(Boolean).join(" / ");
  return suffix ? `${enhancement.name} (${suffix})` : enhancement.name;
}

export { enhancementLabel };
