function markdownCell(value) {
  return String(value ?? "")
    .replaceAll("|", "\\|")
    .replaceAll("\n", "<br>");
}

function splitMarkdownRow(row) {
  const trimmed = row.trim().replace(/^\|/, "").replace(/\|$/, "");
  const cells = [];
  let cell = "";
  let escaped = false;
  for (const char of trimmed) {
    if (escaped) {
      cell += char;
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === "|") {
      cells.push(cell.trim());
      cell = "";
      continue;
    }
    cell += char;
  }
  cells.push(cell.trim());
  return cells;
}

function cleanMarkdownCell(value) {
  return String(value || "")
    .trim()
    .replace(/^`|`$/g, "")
    .replaceAll("<br>", "\n");
}

function minimumResultSection(markdown) {
  const marker = "## Minimum manifest parity groups";
  const markerIndex = markdown.indexOf(marker);
  if (markerIndex === -1) {
    return markdown;
  }
  const afterMarker = markdown.slice(markerIndex + marker.length);
  const nextSectionIndex = afterMarker.search(/\n## /);
  return nextSectionIndex === -1 ? afterMarker : afterMarker.slice(0, nextSectionIndex);
}

function markdownSection(markdown, marker) {
  const markerIndex = markdown.indexOf(marker);
  if (markerIndex === -1) {
    return "";
  }
  const afterMarker = markdown.slice(markerIndex + marker.length);
  const nextSectionIndex = afterMarker.search(/\n## /);
  return nextSectionIndex === -1 ? afterMarker : afterMarker.slice(0, nextSectionIndex);
}

function parseMinimumChecklistRows(markdown) {
  const rows = new Map();
  for (const line of minimumResultSection(markdown).split(/\r?\n/)) {
    if (!line.trim().startsWith("|")) {
      continue;
    }
    const cells = splitMarkdownRow(line);
    if (cells.length < 4 || cells[0] === "Case id" || /^-+$/.test(cells[0])) {
      continue;
    }
    const row = {
      caseId: cleanMarkdownCell(cells[0]),
      whAppMethod: cleanMarkdownCell(cells[1]),
      whAppResult: cleanMarkdownCell(cells[2]),
      parity: cleanMarkdownCell(cells[3]),
    };
    rows.set(row.caseId, row);
  }
  return rows;
}

function wargearList(items) {
  if (!items?.length) {
    return "none";
  }
  return items.map((item) => `${item.count} ${item.name}`).join("; ");
}

function unitWargearSummary(unit) {
  const rows = [];
  if (unit.unitWargear?.length) {
    rows.push(`Unit: ${wargearList(unit.unitWargear)}`);
  }
  for (const miniature of unit.miniatures || []) {
    rows.push(`${miniature.name} x${miniature.count}: ${wargearList(miniature.wargear)}`);
  }
  return rows.join("<br>");
}

export {
  markdownCell,
  splitMarkdownRow,
  cleanMarkdownCell,
  minimumResultSection,
  markdownSection,
  parseMinimumChecklistRows,
  wargearList,
  unitWargearSummary,
};
