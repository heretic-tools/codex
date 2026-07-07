import { availableDatasheets, availableDetachments, availableUnitSources } from "./builder_model.js";
import { state } from "./builder_state.js";

function slugifyName(value) {
  const text = String(value || "")
    .replace(/[’'`]/g, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
  return text
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLocaleLowerCase() || "item";
}

function scopedSlugMap(rows, nameKey = "name", idKey = "id") {
  const counts = new Map();
  const result = new Map();
  for (const row of rows || []) {
    const base = slugifyName(row?.[nameKey]);
    const count = (counts.get(base) || 0) + 1;
    counts.set(base, count);
    result.set(row[idKey], count === 1 ? base : `${base}-${count}`);
  }
  return result;
}

function factionCodexHref(factionKeywordId) {
  const faction = state.catalog.factionKeywordById.get(factionKeywordId)
    || state.catalog.factionById.get(factionKeywordId);
  return faction ? `/faction/${slugifyName(faction.name)}` : "";
}

function detachmentCodexHref(factionKeywordId, detachmentId) {
  const factionHref = factionCodexHref(factionKeywordId);
  if (!factionHref || !detachmentId) {
    return "";
  }
  const slugById = scopedSlugMap(availableDetachments(factionKeywordId));
  const slug = slugById.get(detachmentId);
  return slug ? `${factionHref}/detachment/${slug}` : "";
}

function datasheetsForFactionCodex(factionKeywordId) {
  const roster = { detachmentIds: [], factionKeywordId };
  return availableUnitSources(roster)
    .flatMap((source) => availableDatasheets(roster, source.value)
      .map((datasheet) => ({ ...datasheet, allyType: source.value })));
}

function datasheetCodexHref(rosterOrFactionKeywordId, datasheetId) {
  const factionKeywordId = typeof rosterOrFactionKeywordId === "string"
    ? rosterOrFactionKeywordId
    : rosterOrFactionKeywordId?.factionKeywordId;
  const factionHref = factionCodexHref(factionKeywordId);
  const datasheet = state.catalog.datasheetById.get(datasheetId);
  if (!factionHref || !datasheet) {
    return "";
  }
  const datasheets = datasheetsForFactionCodex(factionKeywordId);
  const slugById = scopedSlugMap(datasheets);
  return `${factionHref}/datasheet/${slugById.get(datasheetId) || slugifyName(datasheet.name)}`;
}

export {
  datasheetCodexHref,
  detachmentCodexHref,
  factionCodexHref,
  scopedSlugMap,
  slugifyName,
};
