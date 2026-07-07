function normalizedRosterName(name, fallback = "New Roster") {
  return String(name || "").trim() || fallback;
}

function rosterWithName(roster, name) {
  const nextName = normalizedRosterName(name, roster?.name || "New Roster");
  if (nextName === (roster?.name || "")) {
    return roster;
  }
  return {
    ...roster,
    name: nextName,
  };
}

export { normalizedRosterName, rosterWithName };
