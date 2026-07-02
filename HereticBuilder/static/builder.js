import { loadCatalog } from "./builder_catalog.js";
import { siteHref, state } from "./builder_state.js";
import { getAllRosters, newId, openLocalDb, removeRoster, saveRoster } from "./builder_storage.js";
import {
  alliedFactionName,
  availableCompositions,
  availableDatasheets,
  availableDetachments,
  availableUnitSources,
  compositionFactionIds,
  compositionLabel,
  costForDetachment,
  defaultComposition,
  defaultMiniatures,
  defaultWargear,
  detachmentBadgeNode,
  detachmentDispositionBadgeNode,
  detachmentDispositionName,
  enhancementPoints,
  miniatureKeywordIds,
  rosterSummary,
  selectedMiniatureEnhancements,
  selectedUnitEnhancements,
  unitSummary,
  validateRoster,
} from "./builder_rules.js";

const selectedRosterStorageKey = "hereticBuilderSelectedRosterId";

const el = {
  status: document.getElementById("data-status"),
  windowTitle: document.getElementById("builder-window-title"),
  breadcrumbs: document.getElementById("builder-breadcrumbs"),
  screens: {
    list: document.getElementById("list-screen"),
    create: document.getElementById("create-screen"),
    roster: document.getElementById("roster-screen"),
    unit: document.getElementById("unit-screen"),
  },
  rosterList: document.getElementById("roster-list"),
  newRosterButton: document.getElementById("new-roster-button"),
  createBackButton: document.getElementById("create-back-button"),
  form: document.getElementById("roster-form"),
  rosterName: document.getElementById("roster-name"),
  factionSelect: document.getElementById("faction-select"),
  battleSizeSelect: document.getElementById("battle-size-select"),
  detachmentHeading: document.getElementById("detachment-heading"),
  detachmentPointsMetric: document.getElementById("detachment-points-metric"),
  detachmentSelect: document.getElementById("detachment-select"),
  addDetachmentButton: document.getElementById("add-detachment-button"),
  detachmentList: document.getElementById("detachment-list"),
  unitSearch: document.getElementById("unit-search"),
  unitSearchClear: document.getElementById("unit-search-clear"),
  unitHeading: document.getElementById("unit-heading"),
  unitPointsMetric: document.getElementById("unit-points-metric"),
  unitSelect: document.getElementById("unit-select"),
  addUnitButton: document.getElementById("add-unit-button"),
  unitList: document.getElementById("unit-list"),
  detailMeta: document.getElementById("detail-meta"),
  deleteRosterButton: document.getElementById("delete-roster-button"),
  validationList: document.getElementById("validation-list"),
  unitBackButton: document.getElementById("unit-back-button"),
  unitDetailMeta: document.getElementById("unit-detail-meta"),
  unitDetailHeading: document.getElementById("unit-detail-heading"),
  unitDetailPoints: document.getElementById("unit-detail-points"),
  unitDetailOptions: document.getElementById("unit-detail-options"),
  unitValidationList: document.getElementById("unit-validation-list"),
};

function setStatus(text) {
  el.status.textContent = text;
}

function parseRoute() {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const parts = raw.split("/").filter(Boolean);
  if (parts[0] === "new") {
    return { name: "create", rosterId: "" };
  }
  if (parts[0] === "roster" && parts[1] && parts[2] === "unit" && parts[3]) {
    return { name: "unit", rosterId: decodeURIComponent(parts[1]), unitId: decodeURIComponent(parts[3]) };
  }
  if (parts[0] === "roster" && parts[1]) {
    return { name: "roster", rosterId: decodeURIComponent(parts[1]) };
  }
  return { name: "list", rosterId: "" };
}

function navigate(path) {
  window.location.hash = path;
}

function setRoute(route) {
  state.route = route;
  if (route.rosterId) {
    window.localStorage.setItem(selectedRosterStorageKey, route.rosterId);
  }
  render();
}

function sortRosters(rosters) {
  return [...rosters].sort((left, right) => {
    const modified = String(right.modifiedAt || "").localeCompare(String(left.modifiedAt || ""));
    return modified || String(left.name || "").localeCompare(String(right.name || ""));
  });
}

async function refreshRosters() {
  state.rosters = sortRosters(await getAllRosters());
  render();
}

function currentRoster() {
  return state.rosters.find((item) => item.id === state.route.rosterId) || null;
}

function currentUnit(roster = currentRoster()) {
  return (roster?.units || []).find((item) => item.id === state.route.unitId) || null;
}

function clearChildren(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

function option(value, text) {
  const item = document.createElement("option");
  item.value = value;
  item.textContent = text;
  return item;
}

function optionGroup(label) {
  const group = document.createElement("optgroup");
  group.label = label;
  return group;
}

function slugifyName(value) {
  return String(value || "")
    .replace(/[’'`]/g, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLocaleLowerCase() || "item";
}

function scopedSlugById(rows) {
  const counts = new Map();
  const result = new Map();
  for (const row of rows) {
    const base = slugifyName(row.name || row.id);
    const index = (counts.get(base) || 0) + 1;
    counts.set(base, index);
    result.set(row.id, index === 1 ? base : `${base}-${index}`);
  }
  return result;
}

function factionSlug(factionKeywordId) {
  const faction = state.catalog.factionById.get(factionKeywordId)
    || state.catalog.factionKeywordById.get(factionKeywordId)
    || {};
  return slugifyName(faction.name || factionKeywordId);
}

function detachmentSlug(factionKeywordId, detachmentId) {
  const allowedIds = new Set(
    state.catalog.detachmentFactionKeywords
      .filter((row) => row.factionKeywordId === factionKeywordId)
      .map((row) => row.detachmentId)
  );
  const rows = state.catalog.detachments
    .filter((detachment) => allowedIds.has(detachment.id) && !detachment.isCombatPatrol)
    .sort((left, right) => (
      (left.displayOrder || 0) - (right.displayOrder || 0)
      || String(left.name || "").localeCompare(String(right.name || ""))
      || String(left.id || "").localeCompare(String(right.id || ""))
    ));
  return scopedSlugById(rows).get(detachmentId) || slugifyName(state.catalog.detachmentById.get(detachmentId)?.name || detachmentId);
}

function codexDetachmentHref(roster, detachment) {
  return `/codex/faction/${factionSlug(roster.factionKeywordId)}/detachment/${detachmentSlug(roster.factionKeywordId, detachment.id)}`;
}

function unitImageSrc(datasheet) {
  if (!datasheet?.id || !datasheet?.name) {
    return "";
  }
  return siteHref(`/assets/unit-images/${slugifyName(datasheet.name)}__${String(datasheet.id).slice(0, 8)}__banner.png`);
}

function metaBadgeNode(text) {
  const badge = document.createElement("span");
  badge.className = "meta-badge";
  badge.textContent = text;
  return badge;
}

function pointsBadgeNode(points) {
  return metaBadgeNode(`${Number(points || 0)} pts`);
}

function detachmentCostBadgeNode(detachment, factionKeywordId) {
  return metaBadgeNode(`${costForDetachment(detachment.id, factionKeywordId)} DP`);
}

function appendIfPresent(parent, node) {
  if (node) {
    parent.appendChild(node);
  }
}

function detachmentBadgesNode(detachment, roster) {
  const badges = document.createElement("span");
  badges.className = "choice-badges detachment-badge-row";
  badges.appendChild(detachmentCostBadgeNode(detachment, roster.factionKeywordId));
  appendIfPresent(badges, detachmentDispositionBadgeNode(detachment));
  return badges;
}

function populateCreateForm() {
  clearChildren(el.factionSelect);
  clearChildren(el.battleSizeSelect);
  for (const faction of state.catalog.factions) {
    el.factionSelect.appendChild(option(faction.id, faction.name));
  }
  for (const size of state.catalog.battleSizes) {
    el.battleSizeSelect.appendChild(option(size.id, `${size.name} (${size.pointsLimit})`));
  }
  el.factionSelect.value = state.catalog.bootstrap.defaultFactionId || state.catalog.factions[0]?.id || "";
  el.battleSizeSelect.value = state.catalog.bootstrap.defaultBattleSizeId || state.catalog.battleSizes[0]?.id || "";
}

function setScreen(name) {
  for (const [key, screen] of Object.entries(el.screens)) {
    screen.hidden = key !== name;
  }
}

function refreshChrome() {
  window.requestAnimationFrame(() => window.setupWinScrollbars?.());
}

function renderBreadcrumbs(items) {
  clearChildren(el.breadcrumbs);
  items.forEach((item, index) => {
    if (index) {
      const separator = document.createElement("span");
      separator.className = "breadcrumb-separator";
      separator.textContent = "/";
      el.breadcrumbs.appendChild(separator);
    }

    const node = document.createElement("a");
    node.className = "breadcrumb-menu-item";
    node.textContent = item.label;
    node.href = item.href;
    el.breadcrumbs.appendChild(node);
  });
}

function builderHref(hashPath = "/") {
  return `${siteHref("/")}${hashPath.startsWith("#") ? hashPath : `#${hashPath}`}`;
}

function baseBreadcrumbs() {
  return [
    { label: "HereticTools", href: "/" },
  ];
}

function builderBreadcrumbs() {
  return [
    ...baseBreadcrumbs(),
    { label: "Builder", href: builderHref("/") },
  ];
}

function renderAppChrome() {
  const roster = currentRoster();
  el.deleteRosterButton.hidden = !(state.route.name === "roster" && roster);
  if (roster) {
    const rosterName = roster.name || "this roster";
    el.deleteRosterButton.setAttribute("aria-label", `Delete ${rosterName}`);
    el.deleteRosterButton.title = `Delete ${rosterName}`;
  }
  if (state.route.name === "create") {
    el.windowTitle.textContent = "Create Roster";
    renderBreadcrumbs(builderBreadcrumbs());
    return;
  }
  if (state.route.name === "roster" && roster) {
    const title = roster.name || "New Roster";
    el.windowTitle.textContent = title;
    renderBreadcrumbs(builderBreadcrumbs());
    return;
  }
  if (state.route.name === "unit" && roster) {
    const unit = currentUnit(roster);
    const datasheet = state.catalog.datasheetById.get(unit?.datasheetId);
    el.windowTitle.textContent = datasheet?.name || "Unit";
    renderBreadcrumbs([
      ...builderBreadcrumbs(),
      { label: roster.name || "New Roster", href: builderHref(`/roster/${encodeURIComponent(roster.id)}`) },
    ]);
    return;
  }
  el.windowTitle.textContent = "Builder";
  renderBreadcrumbs([
    ...baseBreadcrumbs(),
  ]);
}

function renderRosterList() {
  clearChildren(el.rosterList);
  if (!state.rosters.length) {
    const empty = document.createElement("p");
    empty.className = "empty-list";
    empty.textContent = "No rosters";
    el.rosterList.appendChild(empty);
    return;
  }
  for (const roster of state.rosters) {
    const summary = rosterSummary(roster);
    const validation = validateRoster(roster);
    const button = document.createElement("button");
    button.className = "roster-row";
    button.type = "button";
    button.setAttribute("role", "listitem");

    const text = document.createElement("span");
    text.className = "roster-row-text";
    const name = document.createElement("strong");
    name.textContent = roster.name || "New Roster";
    const meta = document.createElement("span");
    meta.textContent = `${summary.factionName} / ${summary.battleSizeName}`;
    const badges = document.createElement("span");
    badges.className = "roster-detachment-badges";
    for (const detachmentId of roster.detachmentIds || []) {
      const detachment = state.catalog.detachmentById.get(detachmentId);
      if (detachment) {
        badges.appendChild(detachmentBadgeNode(detachment));
      }
    }
    text.append(name, meta, badges);

    const points = document.createElement("strong");
    points.textContent = `${validation.points.total}/${validation.points.limit}`;

    button.append(text, points);
    button.addEventListener("click", () => navigate(`/roster/${encodeURIComponent(roster.id)}`));
    el.rosterList.appendChild(button);
  }
}

function renderDetachmentPicker(roster) {
  clearChildren(el.detachmentSelect);
  const selected = new Set(roster.detachmentIds || []);
  const detachments = availableDetachments(roster.factionKeywordId)
    .filter((detachment) => !selected.has(detachment.id));
  if (!detachments.length) {
    el.detachmentSelect.appendChild(option("", "No detachments available"));
    el.addDetachmentButton.disabled = true;
    return;
  }
  for (const detachment of detachments) {
    const disposition = detachmentDispositionName(detachment);
    const cost = `${costForDetachment(detachment.id, roster.factionKeywordId)} DP`;
    const label = `${detachment.name} (${[disposition, cost].filter(Boolean).join(" / ")})`;
    el.detachmentSelect.appendChild(option(detachment.id, label));
  }
  el.addDetachmentButton.disabled = false;
}

function renderDetachmentList(roster) {
  clearChildren(el.detachmentList);
  const detachments = (roster.detachmentIds || [])
    .map((id) => state.catalog.detachmentById.get(id) || { id, name: "Unknown detachment" });
  if (!detachments.length) {
    const empty = document.createElement("p");
    empty.className = "empty-list";
    empty.textContent = "No detachments";
    el.detachmentList.appendChild(empty);
    return;
  }
  for (const detachment of detachments) {
    const card = document.createElement("article");
    card.className = "choice-row selected-choice-row detachment-card";

    const open = document.createElement("a");
    open.className = "detachment-rule-link";
    open.href = codexDetachmentHref(roster, detachment);
    open.title = `Open ${detachment.name} rules`;

    const name = document.createElement("h3");
    name.textContent = detachment.name;
    const badges = detachmentBadgesNode(detachment, roster);
    open.append(name, badges);

    const remove = document.createElement("button");
    remove.className = "danger-button";
    remove.type = "button";
    remove.textContent = "x";
    remove.setAttribute("aria-label", `Remove ${detachment.name}`);
    remove.title = `Remove ${detachment.name}`;
    remove.addEventListener("click", async () => {
      await saveRoster({
        ...roster,
        detachmentIds: (roster.detachmentIds || []).filter((id) => id !== detachment.id),
      });
      await refreshRosters();
    });
    card.append(open, remove);
    el.detachmentList.appendChild(card);
  }
}

function renderUnitPicker(roster) {
  clearChildren(el.unitSelect);
  const query = el.unitSearch.value.trim().toLocaleLowerCase();
  let count = 0;
  for (const source of availableUnitSources(roster)) {
    const allyType = source.value;
    const factionIds = compositionFactionIds(roster, allyType);
    const datasheets = availableDatasheets(roster, allyType)
      .filter((datasheet) => !query || String(datasheet.name || "").toLocaleLowerCase().includes(query));
    if (!datasheets.length) {
      continue;
    }
    const group = optionGroup(allyType === "native" ? "Main" : source.label);
    for (const datasheet of datasheets) {
      const composition = defaultComposition(datasheet.id, factionIds, roster.detachmentIds || []);
      const item = option(`${allyType}::${datasheet.id}`, `${datasheet.name} (${composition?.points || 0} pts)`);
      item.dataset.allyType = allyType;
      item.dataset.datasheetId = datasheet.id;
      group.appendChild(item);
      count += 1;
    }
    el.unitSelect.appendChild(group);
  }
  if (!count) {
    el.unitSelect.appendChild(option("", query ? "No matching units" : "No units available"));
    el.addUnitButton.disabled = true;
    return;
  }
  el.addUnitButton.disabled = false;
}

function miniaturesForEdit(unit) {
  return Array.isArray(unit.miniatures) ? unit.miniatures : [];
}

function optionWargearValue(unit, group, optionId) {
  if (!group.miniatureId) {
    return unit.wargear?.[optionId] || 0;
  }
  const miniature = miniaturesForEdit(unit).find((item) => item.miniatureId === group.miniatureId);
  return miniature?.wargear?.[optionId] || 0;
}

function withUpdatedWargear(candidate, group, optionId, count) {
  if (!group.miniatureId) {
    const wargear = { ...(candidate.wargear || {}) };
    if (count) {
      wargear[optionId] = count;
    } else {
      delete wargear[optionId];
    }
    return { ...candidate, wargear };
  }
  const miniatures = miniaturesForEdit(candidate).map((miniature) => {
    if (miniature.miniatureId !== group.miniatureId) {
      return miniature;
    }
    const wargear = { ...(miniature.wargear || {}) };
    if (count) {
      wargear[optionId] = count;
    } else {
      delete wargear[optionId];
    }
    return { ...miniature, wargear };
  });
  return { ...candidate, miniatures };
}

function withSelectedWarlord(candidate, selectedUnitId, selectedTargetId) {
  const miniatures = miniaturesForEdit(candidate).map((miniature) => {
    const targetId = miniature.rosterUnitMiniatureId || miniature.id || `${candidate.id}:${miniature.miniatureId || miniature.id}`;
    return {
      ...miniature,
      isWarlord: candidate.id === selectedUnitId && targetId === selectedTargetId,
    };
  });
  return { ...candidate, miniatures };
}

async function setWarlord(roster, unitId, targetId) {
  const units = (roster.units || []).map((candidate) => withSelectedWarlord(candidate, unitId, targetId));
  await saveRoster({ ...roster, units });
  await refreshRosters();
}

function compactStoredEnhancementRows(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows
    .filter((row) => row && typeof row === "object" && row.id)
    .map((row) => {
      const result = { id: row.id };
      if (row.targetId) {
        result.targetId = row.targetId;
      }
      return result;
    });
}

function selectedUnitEnhancementIds(unit) {
  return new Set(selectedUnitEnhancements(unit).map((row) => row.id));
}

function miniatureTargetId(unit, miniature) {
  return miniature.rosterUnitMiniatureId || miniature.id || `${unit.id}:${miniature.miniatureId}`;
}

function miniatureTargetIds(unit, miniature) {
  return new Set([
    miniature.rosterUnitMiniatureId,
    miniature.id,
    miniatureTargetId(unit, miniature),
  ].filter(Boolean));
}

function selectedMiniatureEnhancementIds(unit, miniature) {
  const targetIds = miniatureTargetIds(unit, miniature);
  const direct = selectedMiniatureEnhancements(unit)
    .filter((row) => targetIds.has(row.targetId))
    .map((row) => row.id);
  return new Set(direct);
}

function withComposition(candidate, compositionId) {
  const composition = state.catalog.compositionById.get(compositionId);
  if (!composition) {
    return candidate;
  }
  return {
    ...candidate,
    compositionId: composition.id,
    wargear: defaultWargear(candidate.datasheetId, composition.id),
    miniatures: defaultMiniatures(candidate.datasheetId, composition.id),
    miniatureEnhancements: [],
  };
}

function renderCompositionOptions(roster, unit, summary, container) {
  const factionIds = compositionFactionIds(roster, summary.allyType || unit.allyType || "native");
  const options = availableCompositions(unit.datasheetId, factionIds, roster.detachmentIds || []);
  if (options.length <= 1) {
    return;
  }
  const group = document.createElement("section");
  group.className = "wargear-group composition-group";
  const title = document.createElement("h4");
  title.textContent = "Composition";
  const row = document.createElement("label");
  row.className = "composition-row";
  const select = document.createElement("select");
  select.value = summary.selectedCompositionId || summary.compositionId || unit.compositionId || "";
  for (const composition of options) {
    const item = option(
      composition.id,
      `${compositionLabel(composition)} / ${composition.points || 0} pts`
    );
    select.appendChild(item);
  }
  select.addEventListener("change", async () => {
    const nextUnits = (roster.units || []).map((candidate) => (
      candidate.id === unit.id ? withComposition(candidate, select.value) : candidate
    ));
    await saveRoster({ ...roster, units: nextUnits });
    await refreshRosters();
  });
  row.appendChild(select);
  group.append(title, row);
  container.appendChild(group);
}

function compareEnhancements(left, right) {
  const leftDetachment = state.catalog.detachmentById.get(left.detachmentId) || {};
  const rightDetachment = state.catalog.detachmentById.get(right.detachmentId) || {};
  return (
    (leftDetachment.displayOrder || 0) - (rightDetachment.displayOrder || 0)
    || String(leftDetachment.name || "").localeCompare(String(rightDetachment.name || ""))
    || (left.displayOrder || 0) - (right.displayOrder || 0)
    || String(left.name || "").localeCompare(String(right.name || ""))
  );
}

function enhancementOptions(roster, predicate, selectedIds = new Set()) {
  const detachmentIds = new Set(roster.detachmentIds || []);
  return state.catalog.enhancements
    .filter((enhancement) => predicate(enhancement))
    .filter((enhancement) => (
      selectedIds.has(enhancement.id)
      || !enhancement.detachmentId
      || detachmentIds.has(enhancement.detachmentId)
    ))
    .sort(compareEnhancements);
}

function enhancementCanBeOffered(unit, selectedIds) {
  if ((unit.allyType || "native") === "native") {
    return true;
  }
  const alliedFaction = state.catalog.alliedFactionById.get(unit.allyType);
  return alliedFaction?.canTakeEnhancements !== false || selectedIds.size > 0;
}

function withUnitEnhancement(candidate, enhancementId, checked) {
  const rows = compactStoredEnhancementRows(candidate.unitEnhancements)
    .filter((row) => row.id !== enhancementId);
  if (checked) {
    rows.push({ id: enhancementId });
  }
  return { ...candidate, unitEnhancements: rows };
}

function withMiniatureEnhancement(candidate, targetIds, targetId, enhancementId, checked) {
  const directRows = compactStoredEnhancementRows(candidate.miniatureEnhancements)
    .filter((row) => !(row.id === enhancementId && targetIds.has(row.targetId)));
  if (checked) {
    directRows.push({ id: enhancementId, targetId });
  }
  return { ...candidate, miniatureEnhancements: directRows };
}

function renderEnhancementRow(roster, unit, enhancement, keywordIds, checked, onChange) {
  const row = document.createElement("label");
  row.className = "wargear-row enhancement-row";
  row.title = enhancement.rules || enhancement.name || "";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = checked;
  input.addEventListener("change", async () => {
    const nextUnits = (roster.units || []).map((candidate) => (
      candidate.id === unit.id ? onChange(candidate, input.checked) : candidate
    ));
    await saveRoster({ ...roster, units: nextUnits });
    await refreshRosters();
  });
  const label = document.createElement("span");
  label.textContent = enhancement.name || "Enhancement";
  const badges = document.createElement("span");
  badges.className = "choice-badges";
  badges.appendChild(pointsBadgeNode(enhancementPoints(enhancement.id, keywordIds)));
  row.append(input, label, badges);
  return row;
}

function renderUnitEnhancements(roster, unit, summary, container) {
  const selectedIds = selectedUnitEnhancementIds(unit);
  const options = enhancementOptions(roster, (enhancement) => enhancement.enhancementType !== "miniature", selectedIds);
  if (!options.length || !enhancementCanBeOffered(summary, selectedIds)) {
    return;
  }
  const group = document.createElement("section");
  group.className = "wargear-group enhancement-group";
  const title = document.createElement("h4");
  title.textContent = "Upgrades";
  group.appendChild(title);
  for (const enhancement of options) {
    group.appendChild(renderEnhancementRow(
      roster,
      unit,
      enhancement,
      summary.keywordIds,
      selectedIds.has(enhancement.id),
      (candidate, checked) => withUnitEnhancement(candidate, enhancement.id, checked)
    ));
  }
  container.appendChild(group);
}

function renderMiniatureEnhancements(roster, unit, summary, container) {
  const group = document.createElement("section");
  group.className = "wargear-group enhancement-group";
  const title = document.createElement("h4");
  title.textContent = "Enhancements";
  group.appendChild(title);
  let rendered = false;
  for (const miniature of summary.miniatures || []) {
    const selectedIds = selectedMiniatureEnhancementIds(unit, miniature);
    if (!enhancementCanBeOffered(summary, selectedIds)) {
      continue;
    }
    if ((miniature.count || 0) <= 0 && !selectedIds.size) {
      continue;
    }
    if (miniature.excludedFromEnhancements && !selectedIds.size) {
      continue;
    }
    const options = enhancementOptions(roster, (enhancement) => enhancement.enhancementType === "miniature", selectedIds);
    if (!options.length) {
      continue;
    }
    const targetId = miniatureTargetId(unit, miniature);
    const targetIds = miniatureTargetIds(unit, miniature);
    const target = document.createElement("div");
    target.className = "enhancement-target-title";
    target.textContent = `${miniature.name}${miniature.count > 1 ? ` x${miniature.count}` : ""}`;
    group.appendChild(target);
    for (const enhancement of options) {
      group.appendChild(renderEnhancementRow(
        roster,
        unit,
        enhancement,
        miniatureKeywordIds(miniature.miniatureId),
        selectedIds.has(enhancement.id),
        (candidate, checked) => withMiniatureEnhancement(candidate, targetIds, targetId, enhancement.id, checked)
      ));
    }
    rendered = true;
  }
  if (rendered) {
    container.appendChild(group);
  }
}

function renderEnhancementOptions(roster, unit, summary, container) {
  renderUnitEnhancements(roster, unit, summary, container);
  renderMiniatureEnhancements(roster, unit, summary, container);
}

function renderWarlordOptions(roster, unit, summary, container) {
  const candidates = (summary.miniatures || []).filter((miniature) => (miniature.count || 0) > 0);
  if (!candidates.length) {
    return;
  }
  const group = document.createElement("section");
  group.className = "wargear-group warlord-group";
  const title = document.createElement("h4");
  title.textContent = "Warlord";
  group.appendChild(title);

  for (const miniature of candidates) {
    const row = document.createElement("label");
    row.className = "wargear-row warlord-row";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "builder-warlord";
    input.checked = Boolean(miniature.isWarlord);
    const targetId = miniatureTargetId(unit, miniature);
    input.addEventListener("change", async () => {
      if (input.checked) {
        await setWarlord(roster, unit.id, targetId);
      }
    });
    const label = document.createElement("span");
    label.textContent = `${miniature.name}${miniature.count > 1 ? ` x${miniature.count}` : ""}`;
    row.append(input, label);
    group.appendChild(row);
  }
  container.appendChild(group);
}

function sortedWargearGroups(groups) {
  return [...groups].sort((left, right) => (
    (left.displayOrder || 0) - (right.displayOrder || 0)
    || String(left.instructionText || "").localeCompare(String(right.instructionText || ""))
    || String(left.id || "").localeCompare(String(right.id || ""))
  ));
}

function renderWargearGroup(roster, unit, group) {
  const groupNode = document.createElement("section");
  groupNode.className = "wargear-group";
  const title = document.createElement("h4");
  title.textContent = group.instructionText || "Wargear";
  groupNode.appendChild(title);

  for (const optionRow of state.catalog.wargearOptionsByGroupId.get(group.id) || []) {
    const item = state.catalog.wargearItemById.get(optionRow.wargearItemId);
    const row = document.createElement("label");
    row.className = "wargear-row";
    const input = document.createElement("input");
    input.type = optionRow.inputType === "stepper" ? "number" : "checkbox";
    input.min = "0";
    const currentValue = optionWargearValue(unit, group, optionRow.id);
    input.value = currentValue;
    input.checked = Boolean(currentValue);
    input.addEventListener("change", async () => {
      const nextUnits = (roster.units || []).map((candidate) => {
        if (candidate.id !== unit.id) {
          return candidate;
        }
        const count = input.type === "checkbox" ? (input.checked ? 1 : 0) : Math.max(0, Number(input.value || 0));
        return withUpdatedWargear(candidate, group, optionRow.id, count);
      });
      await saveRoster({ ...roster, units: nextUnits });
      await refreshRosters();
    });
    const label = document.createElement("span");
    label.textContent = `${item?.name || "Wargear"}${optionRow.points ? ` +${optionRow.points}` : ""}`;
    row.append(input, label);
    groupNode.appendChild(row);
  }
  return groupNode;
}

function appendWargearModelSection(roster, unit, titleText, groups, container) {
  if (!groups.length) {
    return false;
  }
  const section = document.createElement("section");
  section.className = "wargear-model-section";
  const title = document.createElement("h3");
  title.textContent = titleText;
  section.appendChild(title);
  for (const group of sortedWargearGroups(groups)) {
    section.appendChild(renderWargearGroup(roster, unit, group));
  }
  container.appendChild(section);
  return true;
}

function renderWargearOptions(roster, unit, summary, container) {
  const groups = state.catalog.wargearGroupsByDatasheetId.get(unit.datasheetId) || [];
  let rendered = appendWargearModelSection(
    roster,
    unit,
    "Unit",
    groups.filter((group) => !group.miniatureId),
    container
  );
  for (const miniature of summary.miniatures || []) {
    if ((miniature.count || 0) <= 0) {
      continue;
    }
    rendered = appendWargearModelSection(
      roster,
      unit,
      `${miniature.name}${miniature.count > 1 ? ` x${miniature.count}` : ""}`,
      groups.filter((group) => group.miniatureId === miniature.miniatureId),
      container
    ) || rendered;
  }
  if (!rendered) {
    const empty = document.createElement("p");
    empty.className = "empty-list compact";
    empty.textContent = "No wargear options";
    container.appendChild(empty);
  }
}

function renderUnitList(roster) {
  clearChildren(el.unitList);
  const units = roster.units || [];
  if (!units.length) {
    const empty = document.createElement("p");
    empty.className = "empty-list";
    empty.textContent = "No units";
    el.unitList.appendChild(empty);
    return;
  }
  for (const unit of units) {
    const summary = unitSummary(roster, unit);
    const datasheet = state.catalog.datasheetById.get(unit.datasheetId);
    const composition = state.catalog.compositionById.get(summary.compositionId);
    const card = document.createElement("article");
    card.className = "unit-card builder-unit-card";

    const open = document.createElement("button");
    open.className = "list-item datasheet-tile builder-unit-tile";
    open.type = "button";
    open.addEventListener("click", () => navigate(`/roster/${encodeURIComponent(roster.id)}/unit/${encodeURIComponent(unit.id)}`));

    const imageSrc = unitImageSrc(datasheet);
    if (imageSrc) {
      open.classList.add("has-unit-image");
      const frame = document.createElement("span");
      frame.className = "unit-art-frame";
      const image = document.createElement("img");
      image.className = "unit-art";
      image.src = imageSrc;
      image.alt = "";
      image.loading = "lazy";
      image.addEventListener("error", () => {
        open.classList.remove("has-unit-image");
        frame.remove();
      });
      frame.appendChild(image);
      open.appendChild(frame);
    }

    const text = document.createElement("span");
    text.className = "datasheet-tile-text";
    const name = document.createElement("span");
    name.className = "list-item-title";
    name.textContent = datasheet?.name || "Unit";
    const meta = document.createElement("span");
    meta.className = "list-item-meta";
    const source = summary.allyType === "native" ? "" : `Allied: ${alliedFactionName(summary.allyType)} / `;
    meta.textContent = `${source}${compositionLabel(composition)} / ${summary.points} pts`;
    text.append(meta, name);
    open.appendChild(text);

    const remove = document.createElement("button");
    remove.className = "danger-button";
    remove.type = "button";
    remove.textContent = "x";
    remove.setAttribute("aria-label", `Remove ${datasheet?.name || "unit"}`);
    remove.title = `Remove ${datasheet?.name || "unit"}`;
    remove.addEventListener("click", async () => {
      await saveRoster({
        ...roster,
        units: units.filter((candidate) => candidate.id !== unit.id),
      });
      await refreshRosters();
    });
    card.append(open, remove);
    el.unitList.appendChild(card);
  }
}

function renderValidation(roster, validation, target = el.validationList) {
  clearChildren(target);
  if (!validation.messages.length) {
    const item = document.createElement("div");
    item.className = "validation-item ok";
    item.textContent = "Valid";
    target.appendChild(item);
    return;
  }
  for (const message of validation.messages) {
    const item = document.createElement("div");
    item.className = `validation-item ${message.level}`;
    item.textContent = message.text;
    target.appendChild(item);
  }
}

function renderRosterScreen() {
  const roster = currentRoster();
  if (!roster) {
    navigate("/");
    return;
  }
  const summary = rosterSummary(roster);
  const validation = validateRoster(roster);
  const battleSize = state.catalog.battleSizeById.get(roster.battleSizeId) || {};
  el.detailMeta.textContent = `${summary.factionName} / ${summary.battleSizeName}`;
  el.detachmentHeading.textContent = `Detachments (${(roster.detachmentIds || []).length})`;
  el.detachmentPointsMetric.textContent = `${validation.points.detachmentPoints} / ${battleSize.detachmentPointsLimit || 0} DP`;
  el.unitHeading.textContent = `Units (${(roster.units || []).length})`;
  el.unitPointsMetric.textContent = `Points ${validation.points.total} / ${validation.points.limit}`;
  renderValidation(roster, validation);
  renderDetachmentPicker(roster);
  renderDetachmentList(roster);
  renderUnitPicker(roster);
  renderUnitList(roster);
}

function renderUnitScreen() {
  const roster = currentRoster();
  if (!roster) {
    navigate("/");
    return;
  }
  const unit = currentUnit(roster);
  if (!unit) {
    navigate(`/roster/${encodeURIComponent(roster.id)}`);
    return;
  }
  const validation = validateRoster(roster);
  const summary = unitSummary(roster, unit);
  const datasheet = state.catalog.datasheetById.get(unit.datasheetId);
  const composition = state.catalog.compositionById.get(summary.compositionId);
  const rosterInfo = rosterSummary(roster);

  el.unitDetailMeta.textContent = `${roster.name || "New Roster"} / ${rosterInfo.factionName} / ${compositionLabel(composition)}`;
  el.unitDetailHeading.textContent = "Wargear";
  el.unitDetailPoints.textContent = `${summary.points} pts`;
  renderValidation(roster, validation, el.unitValidationList);

  clearChildren(el.unitDetailOptions);
  renderCompositionOptions(roster, unit, summary, el.unitDetailOptions);
  renderWarlordOptions(roster, unit, summary, el.unitDetailOptions);
  renderEnhancementOptions(roster, unit, summary, el.unitDetailOptions);
  renderWargearOptions(roster, unit, summary, el.unitDetailOptions);
  el.unitDetailHeading.setAttribute("aria-label", `${datasheet?.name || "Unit"} wargear`);
}

function render() {
  const route = state.route;
  setScreen(route.name);
  if (route.name === "list") {
    renderRosterList();
  } else if (route.name === "roster") {
    renderRosterScreen();
  } else if (route.name === "unit") {
    renderUnitScreen();
  }
  renderAppChrome();
  refreshChrome();
}

async function handleCreate(event) {
  event.preventDefault();
  const now = new Date().toISOString();
  const roster = {
    id: newId(),
    name: el.rosterName.value.trim() || "New Roster",
    factionKeywordId: el.factionSelect.value,
    battleSizeId: el.battleSizeSelect.value,
    detachmentIds: [],
    units: [],
    createdAt: now,
    modifiedAt: now,
    dataVersion: state.catalog.bootstrap.dataVersion,
  };
  await saveRoster(roster);
  await refreshRosters();
  navigate(`/roster/${encodeURIComponent(roster.id)}`);
}

async function handleDelete() {
  const roster = currentRoster();
  if (!roster) {
    return;
  }
  if (!window.confirm(`Delete ${roster.name || "this roster"}?`)) {
    return;
  }
  await removeRoster(roster.id);
  await refreshRosters();
  navigate("/");
}

async function addDetachment(detachmentId) {
  const roster = currentRoster();
  if (!roster || !detachmentId) {
    return;
  }
  if ((roster.detachmentIds || []).includes(detachmentId)) {
    return;
  }
  await saveRoster({
    ...roster,
    detachmentIds: [...(roster.detachmentIds || []), detachmentId],
  });
  await refreshRosters();
}

async function addUnit(datasheetId, allyType = "native") {
  const roster = currentRoster();
  if (!roster || !datasheetId) {
    return;
  }
  const factionIds = compositionFactionIds(roster, allyType);
  const composition = defaultComposition(datasheetId, factionIds, roster.detachmentIds || []);
  if (!composition) {
    return;
  }
  const unit = {
    id: newId(),
    datasheetId,
    allyType,
    compositionId: composition.id,
    wargear: defaultWargear(datasheetId, composition.id),
    miniatures: defaultMiniatures(datasheetId, composition.id),
  };
  await saveRoster({
    ...roster,
    units: [...(roster.units || []), unit],
  });
  await refreshRosters();
}

async function init() {
  try {
    setStatus("Data");
    state.catalog = await loadCatalog();
    populateCreateForm();
    setStatus(`v${state.catalog.bootstrap.dataVersion}`);

    state.db = await openLocalDb();
    await refreshRosters();
    setRoute(parseRoute());

    window.addEventListener("hashchange", () => setRoute(parseRoute()));
    el.newRosterButton.addEventListener("click", () => navigate("/new"));
    el.createBackButton.addEventListener("click", () => navigate("/"));
    el.unitBackButton.addEventListener("click", () => {
      const roster = currentRoster();
      navigate(roster ? `/roster/${encodeURIComponent(roster.id)}` : "/");
    });
    el.form.addEventListener("submit", handleCreate);
    el.deleteRosterButton.addEventListener("click", handleDelete);
    el.addDetachmentButton.addEventListener("click", () => addDetachment(el.detachmentSelect.value));
    el.unitSearch.addEventListener("input", () => {
      const roster = currentRoster();
      el.unitSearch.closest(".builder-search")?.classList.toggle("has-value", Boolean(el.unitSearch.value));
      if (roster) {
        renderUnitPicker(roster);
      }
    });
    el.unitSearchClear.addEventListener("click", () => {
      el.unitSearch.value = "";
      el.unitSearch.closest(".builder-search")?.classList.remove("has-value");
      const roster = currentRoster();
      if (roster) {
        renderUnitPicker(roster);
      }
      el.unitSearch.focus();
    });
    el.addUnitButton.addEventListener("click", () => {
      const selected = el.unitSelect.selectedOptions[0];
      addUnit(selected?.dataset.datasheetId || "", selected?.dataset.allyType || "native");
    });
  } catch (error) {
    setStatus("Error");
    setScreen("list");
    clearChildren(el.rosterList);
    const item = document.createElement("div");
    item.className = "validation-item error";
    item.textContent = error.message || "Failed to start";
    el.rosterList.appendChild(item);
  }
}

init();
