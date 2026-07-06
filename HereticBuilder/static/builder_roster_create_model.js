function newRosterDocument(values, { dataVersion, id, now }) {
  return {
    id,
    name: values.name,
    factionKeywordId: values.factionKeywordId,
    battleSizeId: values.battleSizeId,
    detachmentIds: [],
    units: [],
    attachments: [],
    createdAt: now,
    modifiedAt: now,
    dataVersion,
    listSummary: {
      detachmentPoints: 0,
      pointsTotal: 0,
      validationState: "invalid",
    },
  };
}

export { newRosterDocument };
