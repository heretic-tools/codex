const UNTITLED_ROSTER_NAME = "Untitled Roster";

function rosterDisplayName(roster, summary = null) {
  const explicitName = String(roster?.name || "").trim();
  if (explicitName) {
    return explicitName;
  }
  const factionName = String(summary?.factionName || "").trim();
  if (factionName && factionName.toLowerCase() !== "unknown faction") {
    return `${factionName} roster`;
  }
  return UNTITLED_ROSTER_NAME;
}

function normalizedRosterName(name, fallback = UNTITLED_ROSTER_NAME) {
  return String(name || "").trim() || fallback;
}

function rosterWithName(roster, name) {
  const nextName = normalizedRosterName(name, rosterDisplayName(roster));
  if (nextName === (roster?.name || "")) {
    return roster;
  }
  return {
    ...roster,
    name: nextName,
  };
}

export { UNTITLED_ROSTER_NAME, normalizedRosterName, rosterDisplayName, rosterWithName };
