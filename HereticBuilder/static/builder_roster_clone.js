function duplicateRosterName(name) {
  const base = String(name || "").trim() || "New Roster";
  return `Copy of ${base}`;
}

function duplicateRosterDocument(roster, { id, now }) {
  const copy = JSON.parse(JSON.stringify(roster || {}));
  return {
    ...copy,
    id,
    name: duplicateRosterName(copy.name),
    createdAt: now,
    modifiedAt: now,
  };
}

export { duplicateRosterDocument, duplicateRosterName };
