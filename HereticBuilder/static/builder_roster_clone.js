import { rosterDisplayName } from "./builder_roster_name_actions.js";

function duplicateRosterName(name) {
  const base = rosterDisplayName({ name });
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
