function normalizedAttachments(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows.map((row) => {
    if (!row || typeof row !== "object" || typeof row.id !== "string" || !row.id || !Array.isArray(row.members)) {
      throw new Error("Roster export file contains an invalid attached unit");
    }
    return {
      id: row.id,
      members: row.members.map((member) => {
        if (
          !member
          || typeof member !== "object"
          || typeof member.rosterUnitId !== "string"
          || !member.rosterUnitId
          || !["bodyguard", "leader", "support"].includes(member.attachmentType)
        ) {
          throw new Error("Roster export file contains an invalid attached unit member");
        }
        return {
          rosterUnitId: member.rosterUnitId,
          attachmentType: member.attachmentType,
        };
      }),
    };
  });
}

export { normalizedAttachments };
