function safeDomId(value) {
  return String(value || "target").replace(/[^a-z0-9_-]+/gi, "-");
}

function compactReasons(reasons = [], limit = 2) {
  const values = [...new Set(reasons.map((reason) => String(reason || "").trim()).filter(Boolean))];
  if (!values.length) {
    return "";
  }
  if (values.length <= limit) {
    return values.join(", ");
  }
  return `${values.slice(0, limit).join(", ")} +${values.length - limit}`;
}

function controlAvailabilitySummary(rows = []) {
  if (!rows.length) {
    return "";
  }
  const available = rows.filter((row) => row.status?.eligible).length;
  const lockedRows = rows.filter((row) => !row.status?.eligible);
  const parts = [`${available} available`];
  if (lockedRows.length) {
    const reasons = compactReasons(lockedRows.map((row) => row.status?.reason));
    parts.push(`${lockedRows.length} locked${reasons ? `: ${reasons}` : ""}`);
  }
  return parts.join(" / ");
}

export { compactReasons, controlAvailabilitySummary, safeDomId };
