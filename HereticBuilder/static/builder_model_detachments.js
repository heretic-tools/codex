import { state } from "./builder_state.js";

function costForDetachment(detachmentId, factionKeywordId) {
  const override = state.catalog.detachmentFactionPointCosts.find((row) => (
    row.detachmentId === detachmentId && row.factionKeywordId === factionKeywordId
  ));
  const detachment = state.catalog.detachmentById.get(detachmentId);
  return override?.detachmentPointsCost ?? detachment?.detachmentPointsCost ?? 0;
}

function dispositionSlug(name) {
  return String(name || "").toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function forceDispositionForDetachment(detachmentId) {
  const link = state.catalog.forceDispositionsByDetachmentId.get(detachmentId)?.[0];
  return link ? state.catalog.forceDispositionById.get(link.forceDispositionId) : null;
}

function detachmentBadgeNode(detachment) {
  const badge = document.createElement("span");
  const disposition = forceDispositionForDetachment(detachment.id);
  const slug = dispositionSlug(disposition?.name);
  badge.className = slug ? `disposition-badge disposition-${slug}` : "meta-badge";
  badge.textContent = detachment.name || "Detachment";
  return badge;
}

function detachmentDispositionBadgeNode(detachment) {
  const disposition = forceDispositionForDetachment(detachment.id);
  if (!disposition?.name) {
    return null;
  }
  const badge = document.createElement("span");
  const slug = dispositionSlug(disposition.name);
  badge.className = slug ? `disposition-badge disposition-${slug}` : "meta-badge";
  badge.textContent = disposition.name;
  return badge;
}

function detachmentDispositionName(detachment) {
  return forceDispositionForDetachment(detachment.id)?.name || "";
}

export {
  costForDetachment,
  detachmentBadgeNode,
  detachmentDispositionBadgeNode,
  detachmentDispositionName,
};
