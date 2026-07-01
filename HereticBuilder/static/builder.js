import { loadCatalog } from "./builder_catalog.js";
import { siteHref, state } from "./builder_state.js";
import { getAllRosters, newId, openLocalDb, removeRoster, saveRoster } from "./builder_storage.js";
import {
  alliedFactionName,
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
  rosterSummary,
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
  },
  rosterList: document.getElementById("roster-list"),
  newRosterButton: document.getElementById("new-roster-button"),
  createBackButton: document.getElementById("create-back-button"),
  form: document.getElementById("roster-form"),
  rosterName: document.getElementById("roster-name"),
  factionSelect: document.getElementById("faction-select"),
  battleSizeSelect: document.getElementById("battle-size-select"),
  detachmentSelect: document.getElementById("detachment-select"),
  addDetachmentButton: document.getElementById("add-detachment-button"),
  detachmentList: document.getElementById("detachment-list"),
  unitSearch: document.getElementById("unit-search"),
  unitSourceSelect: document.getElementById("unit-source-select"),
  unitSelect: document.getElementById("unit-select"),
  addUnitButton: document.getElementById("add-unit-button"),
  unitList: document.getElementById("unit-list"),
  detailName: document.getElementById("detail-name"),
  detailMeta: document.getElementById("detail-meta"),
  deleteRosterButton: document.getElementById("delete-roster-button"),
  pointsMetric: document.getElementById("points-metric"),
  detachmentsMetric: document.getElementById("detachments-metric"),
  unitsMetric: document.getElementById("units-metric"),
  validationList: document.getElementById("validation-list"),
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
    renderBreadcrumbs([
      ...baseBreadcrumbs(),
      { label: "Rosters", href: builderHref("/") },
    ]);
    return;
  }
  if (state.route.name === "roster" && roster) {
    const title = roster.name || "New Roster";
    el.windowTitle.textContent = title;
    renderBreadcrumbs([
      ...baseBreadcrumbs(),
      { label: "Rosters", href: builderHref("/") },
    ]);
    return;
  }
  el.windowTitle.textContent = "Rosters";
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
    const cost = costForDetachment(detachment.id, roster.factionKeywordId);
    el.detachmentSelect.appendChild(option(detachment.id, `${detachment.name} (${cost})`));
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
    card.className = "detachment-card";

    const head = document.createElement("div");
    head.className = "detachment-card-head";
    const title = document.createElement("div");
    const name = document.createElement("h3");
    name.textContent = detachment.name;

    const meta = document.createElement("p");
    meta.textContent = `${costForDetachment(detachment.id, roster.factionKeywordId)} detachment pts`;
    title.append(name, meta);

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
    head.append(title, remove);
    card.appendChild(head);
    el.detachmentList.appendChild(card);
  }
}

function currentUnitSource(roster) {
  const values = new Set(availableUnitSources(roster).map((source) => source.value));
  const selected = el.unitSourceSelect.value || "native";
  return values.has(selected) ? selected : "native";
}

function renderUnitSourcePicker(roster) {
  const selected = currentUnitSource(roster);
  clearChildren(el.unitSourceSelect);
  for (const source of availableUnitSources(roster)) {
    el.unitSourceSelect.appendChild(option(source.value, source.label));
  }
  el.unitSourceSelect.value = selected;
}

function renderUnitPicker(roster) {
  clearChildren(el.unitSelect);
  const allyType = currentUnitSource(roster);
  const query = el.unitSearch.value.trim().toLocaleLowerCase();
  const datasheets = availableDatasheets(roster, allyType)
    .filter((datasheet) => !query || String(datasheet.name || "").toLocaleLowerCase().includes(query));
  if (!datasheets.length) {
    el.unitSelect.appendChild(option("", query ? "No matching units" : "No units available"));
    el.addUnitButton.disabled = true;
    return;
  }
  const factionIds = compositionFactionIds(roster, allyType);
  for (const datasheet of datasheets) {
    const composition = defaultComposition(datasheet.id, factionIds, roster.detachmentIds || []);
    el.unitSelect.appendChild(option(datasheet.id, `${datasheet.name} (${composition?.points || 0})`));
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

function renderWargearOptions(roster, unit, container) {
  const groups = state.catalog.wargearGroupsByDatasheetId.get(unit.datasheetId) || [];
  if (!groups.length) {
    const empty = document.createElement("p");
    empty.className = "empty-list compact";
    empty.textContent = "No wargear options";
    container.appendChild(empty);
    return;
  }
  for (const group of groups) {
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
    container.appendChild(groupNode);
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
    card.className = "unit-card";

    const head = document.createElement("div");
    head.className = "unit-card-head";
    const title = document.createElement("div");
    const name = document.createElement("h3");
    name.textContent = datasheet?.name || "Unit";
    const meta = document.createElement("p");
    const source = summary.allyType === "native" ? "" : `Allied: ${alliedFactionName(summary.allyType)} / `;
    meta.textContent = `${source}${compositionLabel(composition)} / ${summary.points} pts`;
    title.append(name, meta);

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
    head.append(title, remove);
    card.appendChild(head);

    const wargear = document.createElement("div");
    wargear.className = "wargear-list";
    renderWargearOptions(roster, unit, wargear);
    card.appendChild(wargear);
    el.unitList.appendChild(card);
  }
}

function renderValidation(roster, validation) {
  clearChildren(el.validationList);
  if (!validation.messages.length) {
    const item = document.createElement("div");
    item.className = "validation-item ok";
    item.textContent = "Valid";
    el.validationList.appendChild(item);
    return;
  }
  for (const message of validation.messages) {
    const item = document.createElement("div");
    item.className = `validation-item ${message.level}`;
    item.textContent = message.text;
    el.validationList.appendChild(item);
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
  el.detailName.textContent = roster.name || "New Roster";
  el.detailMeta.textContent = `${summary.factionName} / ${summary.battleSizeName}`;
  el.pointsMetric.textContent = `${validation.points.total} / ${validation.points.limit}`;
  el.detachmentsMetric.textContent = String((roster.detachmentIds || []).length);
  el.unitsMetric.textContent = String((roster.units || []).length);
  renderValidation(roster, validation);
  renderDetachmentPicker(roster);
  renderDetachmentList(roster);
  renderUnitSourcePicker(roster);
  renderUnitPicker(roster);
  renderUnitList(roster);
}

function render() {
  const route = state.route;
  setScreen(route.name);
  if (route.name === "list") {
    renderRosterList();
  } else if (route.name === "roster") {
    renderRosterScreen();
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

async function handleAddDetachment() {
  const roster = currentRoster();
  if (!roster || !el.detachmentSelect.value) {
    return;
  }
  if ((roster.detachmentIds || []).includes(el.detachmentSelect.value)) {
    return;
  }
  await saveRoster({
    ...roster,
    detachmentIds: [...(roster.detachmentIds || []), el.detachmentSelect.value],
  });
  await refreshRosters();
}

async function handleAddUnit() {
  const roster = currentRoster();
  if (!roster || !el.unitSelect.value) {
    return;
  }
  const allyType = currentUnitSource(roster);
  const factionIds = compositionFactionIds(roster, allyType);
  const composition = defaultComposition(el.unitSelect.value, factionIds, roster.detachmentIds || []);
  if (!composition) {
    return;
  }
  const unit = {
    id: newId(),
    datasheetId: el.unitSelect.value,
    allyType,
    compositionId: composition.id,
    wargear: defaultWargear(el.unitSelect.value, composition.id),
    miniatures: defaultMiniatures(el.unitSelect.value, composition.id),
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
    el.form.addEventListener("submit", handleCreate);
    el.deleteRosterButton.addEventListener("click", handleDelete);
    el.addDetachmentButton.addEventListener("click", handleAddDetachment);
    el.unitSearch.addEventListener("input", () => {
      const roster = currentRoster();
      if (roster) {
        renderUnitPicker(roster);
      }
    });
    el.unitSourceSelect.addEventListener("change", () => {
      const roster = currentRoster();
      if (roster) {
        renderUnitPicker(roster);
      }
    });
    el.addUnitButton.addEventListener("click", handleAddUnit);
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
