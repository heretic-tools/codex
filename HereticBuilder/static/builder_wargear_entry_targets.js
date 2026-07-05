function entryTargetsUnit(entry) {
  return !entry.rosterUnitMiniatureId && !entry.miniatureId;
}

function entryMatchesMiniature(entry, miniature) {
  if (!miniature) {
    return false;
  }
  const targetRosterMiniatureId = miniature.rosterUnitMiniatureId || miniature.id || "";
  if (targetRosterMiniatureId && entry.rosterUnitMiniatureId === targetRosterMiniatureId) {
    return true;
  }
  return Boolean(entry.miniatureId && miniature.miniatureId && entry.miniatureId === miniature.miniatureId);
}

function entryTargetMiniature(unit, entry) {
  return (unit.miniatures || []).find((miniature) => entryMatchesMiniature(entry, miniature)) || null;
}

function targetIdForMiniature(unit, miniatureId) {
  const miniature = (unit.miniatures || []).find((item) => item.miniatureId === miniatureId);
  return miniature?.rosterUnitMiniatureId || miniature?.id || miniature?.miniatureId || miniatureId || "";
}

function scopeModelCount(unit, miniatureId) {
  if (!miniatureId) {
    return unit.modelCount || 0;
  }
  return unit.miniatures.find((miniature) => miniature.miniatureId === miniatureId)?.count || 0;
}

export {
  entryMatchesMiniature,
  entryTargetMiniature,
  entryTargetsUnit,
  scopeModelCount,
  targetIdForMiniature,
};
