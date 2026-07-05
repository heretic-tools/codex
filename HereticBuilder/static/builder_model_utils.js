function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function lowerName(value) {
  return String(value || "").trim().toLocaleLowerCase();
}

function idsFromRows(rows, key) {
  return (rows || []).map((row) => row[key]).filter(Boolean);
}

function setIntersects(left, right) {
  for (const value of left) {
    if (right.has(value)) {
      return true;
    }
  }
  return false;
}

function namesForIds(map, ids, fallback = "item") {
  return (ids || []).map((id) => map.get(id)?.name || fallback);
}

export {
  idsFromRows,
  lowerName,
  namesForIds,
  setIntersects,
  unique,
};
