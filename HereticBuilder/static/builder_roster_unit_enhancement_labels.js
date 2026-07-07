import { enhancementPoints } from "./builder_model.js";
import { state } from "./builder_state.js";

function enhancementKind(enhancement) {
  return enhancement?.enhancementType === "upgrade" ? "upgrade" : "enhancement";
}

function enhancementKindSummary(enhancements = []) {
  const kinds = new Set(enhancements.map(enhancementKind));
  if (kinds.size > 1) {
    return "mixed";
  }
  return kinds.has("upgrade") ? "upgrade" : "enhancement";
}

function enhancementKindLabel(enhancements = [], { plural = false } = {}) {
  const kind = enhancementKindSummary(enhancements);
  if (kind === "mixed") {
    return plural ? "enhancements or upgrades" : "enhancement or upgrade";
  }
  if (kind === "upgrade") {
    return plural ? "upgrades" : "upgrade";
  }
  return plural ? "enhancements" : "enhancement";
}

function enhancementSectionTitle(enhancements = []) {
  const kind = enhancementKindSummary(enhancements);
  if (kind === "mixed") {
    return "Enhancements & Upgrades";
  }
  return kind === "upgrade" ? "Upgrades" : "Enhancements";
}

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

export {
  enhancementKind,
  enhancementKindLabel,
  enhancementKindSummary,
  enhancementLabel,
  enhancementSectionTitle,
};
