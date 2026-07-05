function withModifiedRoster(roster, fields) {
  return {
    ...roster,
    ...fields,
  };
}

function updateRosterUnit(roster, unitId, callback) {
  return withModifiedRoster(roster, {
    units: (roster.units || []).map((unit) => (
      unit.id === unitId ? callback(unit) : unit
    )),
  });
}

export {
  updateRosterUnit,
  withModifiedRoster,
};
