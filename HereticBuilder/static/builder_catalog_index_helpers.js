function byId(rows) {
  const map = new Map();
  for (const row of rows) {
    map.set(row.id, row);
  }
  return map;
}

function groupBy(rows, key) {
  const map = new Map();
  for (const row of rows) {
    const value = row[key];
    if (!map.has(value)) {
      map.set(value, []);
    }
    map.get(value).push(row);
  }
  return map;
}

export {
  byId,
  groupBy,
};
