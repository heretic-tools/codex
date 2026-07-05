function normalizedSelectionRows(rows, { requireTarget = false } = {}) {
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows.map((row) => {
    if (!row || typeof row !== "object" || typeof row.id !== "string" || !row.id) {
      throw new Error("Roster export file contains an invalid selection row");
    }
    const result = { id: row.id };
    if (requireTarget) {
      if (typeof row.targetId !== "string" || !row.targetId) {
        throw new Error("Roster export file contains an invalid targeted selection row");
      }
      result.targetId = row.targetId;
    }
    return result;
  });
}

export { normalizedSelectionRows };
