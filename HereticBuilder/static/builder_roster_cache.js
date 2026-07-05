function rosterCachedPointsTotal(roster) {
  const cached = roster.listSummary?.pointsTotal;
  return Number.isFinite(cached) ? cached : 0;
}

function rosterListCacheIsFresh(roster, dataVersion) {
  return Boolean(
    roster
    && roster.dataVersion === dataVersion
    && roster.listSummary
    && Number.isFinite(roster.listSummary.detachmentPoints)
    && Number.isFinite(roster.listSummary.pointsTotal)
    && typeof roster.listSummary.validationState === "string"
  );
}

function rosterWithListCache(roster, validation, dataVersion = roster.dataVersion) {
  return {
    ...roster,
    dataVersion,
    listSummary: {
      detachmentPoints: validation.points.detachmentPoints || 0,
      pointsTotal: validation.points.total || 0,
      validationState: validation.state || "invalid",
    },
  };
}

export { rosterCachedPointsTotal, rosterListCacheIsFresh, rosterWithListCache };
