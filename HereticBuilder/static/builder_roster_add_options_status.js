function pluralize(count, singular, plural = singular) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function addOptionsStatus(rowsOrGroups = [], {
  emptyText = "No options available",
  lockedText = "locked",
  optionText = "available",
  searchText = "No matching options",
  searched = false,
} = {}) {
  const rows = rowsOrGroups.flatMap((row) => row.rows || row);
  if (!rows.length) {
    return searched ? searchText : emptyText;
  }
  const available = rows.filter((row) => row.status?.severity !== "error").length;
  const locked = rows.length - available;
  if (!available) {
    return `${pluralize(locked, lockedText)} only`;
  }
  if (!locked) {
    return pluralize(available, optionText);
  }
  return `${pluralize(available, optionText)} / ${pluralize(locked, lockedText)}`;
}

export { addOptionsStatus };
