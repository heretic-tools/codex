function safeExportStem(value, fallback = "roster") {
  const stem = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return stem || fallback;
}

function downloadText(payload, { filename, type }) {
  const blob = new Blob([payload], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadRosterExport(payload, exportedAt = new Date()) {
  downloadText(payload, {
    filename: `heretic-builder-rosters-${exportedAt.toISOString().slice(0, 10)}.json`,
    type: "application/json",
  });
}

function downloadRosterTextExport(payload, roster, exportedAt = new Date()) {
  downloadText(payload, {
    filename: `heretic-builder-${safeExportStem(roster?.name)}-${exportedAt.toISOString().slice(0, 10)}.txt`,
    type: "text/plain;charset=utf-8",
  });
}

export {
  downloadRosterExport,
  downloadRosterTextExport,
  safeExportStem,
};
