import { textNode } from "./builder_dom.js";
import { alliedFactionName } from "./builder_model.js";

function compactBadgeLabel(value, maxLength = 28) {
  const text = String(value || "").trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function unitSourceBadgeText(unit) {
  const allyType = unit.allyType || "native";
  if (allyType === "native") {
    return "";
  }
  return `Allied: ${compactBadgeLabel(alliedFactionName(allyType))}`;
}

function unitSourceBadgeNode(unit) {
  const text = unitSourceBadgeText(unit);
  if (!text) {
    return null;
  }
  const badge = textNode("span", "meta-badge", text);
  badge.title = `Allied: ${alliedFactionName(unit.allyType)}`;
  return badge;
}

export { unitSourceBadgeNode, unitSourceBadgeText };
