import { loadCatalog } from "./builder_catalog.js";
import { rosterSummary, validateRoster } from "./builder_rules.js";
import { siteHref, state } from "./builder_state.js";
import { getAllRosters, newId, openLocalDb, removeRoster, saveRoster } from "./builder_storage.js?v=rewrite-2";

const el = {
  breadcrumbs: document.getElementById("builder-breadcrumbs"),
  root: document.getElementById("builder-root"),
  status: document.getElementById("data-status"),
  title: document.getElementById("builder-window-title"),
};

function parseRoute() {
  const parts = (window.location.hash.replace(/^#/, "") || "/").split("/").filter(Boolean);
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

function clear(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

function textNode(tagName, className, text) {
  const node = document.createElement(tagName);
  if (className) {
    node.className = className;
  }
  node.textContent = text;
  return node;
}

function button(className, text, onClick) {
  const node = document.createElement("button");
  node.className = className;
  node.type = "button";
  node.textContent = text;
  node.addEventListener("click", onClick);
  return node;
}

function link(className, text, href) {
  const node = document.createElement("a");
  node.className = className;
  node.textContent = text;
  node.href = href;
  return node;
}

function option(value, text) {
  const node = document.createElement("option");
  node.value = value;
  node.textContent = text;
  return node;
}

function setStatus(text) {
  el.status.textContent = text;
}

function baseBreadcrumbs() {
  return [{ label: "HereticTools", href: siteHref("/") }];
}

function builderHref(hashPath = "/") {
  return `${siteHref("/")}${hashPath.startsWith("#") ? hashPath : `#${hashPath}`}`;
}

function builderBreadcrumbs() {
  return [...baseBreadcrumbs(), { label: "Builder", href: builderHref("/") }];
}

function renderBreadcrumbs(items) {
  clear(el.breadcrumbs);
  items.forEach((item, index) => {
    if (index) {
      el.breadcrumbs.appendChild(textNode("span", "breadcrumb-separator", "/"));
    }
    el.breadcrumbs.appendChild(link("breadcrumb-menu-item", item.label, item.href));
  });
}

function setRoute(route) {
  state.route = route;
  render();
}

function currentRoster() {
  return state.rosters.find((roster) => roster.id === state.route.rosterId) || null;
}

async function refreshRosters() {
  state.rosters = (await getAllRosters()).sort((left, right) => (
    String(right.modifiedAt || "").localeCompare(String(left.modifiedAt || ""))
    || String(left.name || "").localeCompare(String(right.name || ""))
  ));
}

function validationCounts(messages) {
  return messages.reduce((counts, message) => {
    counts[message.level] = (counts[message.level] || 0) + 1;
    return counts;
  }, {});
}

function validationSummary(validation) {
  if (!validation.messages.length) {
    return "Valid";
  }
  const counts = validationCounts(validation.messages);
  const parts = [];
  if (counts.error) {
    parts.push(`${counts.error} error${counts.error === 1 ? "" : "s"}`);
  }
  if (counts.warning) {
    parts.push(`${counts.warning} warning${counts.warning === 1 ? "" : "s"}`);
  }
  return `${validation.state === "valid" ? "Valid" : "Invalid"} / ${parts.join(" / ")}`;
}

function groupedMessages(messages) {
  const groups = new Map();
  for (const message of messages) {
    const key = `${message.level || "error"}:${message.code || "unknown"}`;
    if (!groups.has(key)) {
      groups.set(key, { code: message.code || "unknown", level: message.level || "error", count: 0, texts: [] });
    }
    const group = groups.get(key);
    group.count += 1;
    if (!group.texts.includes(message.text)) {
      group.texts.push(message.text);
    }
  }
  return [...groups.values()].sort((left, right) => (
    left.level.localeCompare(right.level) || left.code.localeCompare(right.code)
  ));
}

function renderValidation(validation) {
  const wrap = document.createElement("section");
  wrap.className = "builder-section";
  wrap.appendChild(textNode("h2", "section-title", "Validation"));
  const list = document.createElement("div");
  list.className = "validation-list";
  list.appendChild(textNode(
    "div",
    `validation-item validation-summary ${validation.messages.some((message) => message.level === "error") ? "error" : "ok"}`,
    validationSummary(validation)
  ));
  for (const group of groupedMessages(validation.messages)) {
    const item = textNode("div", `validation-item ${group.level}`, "");
    const head = document.createElement("div");
    head.className = "validation-row-head";
    head.append(
      textNode("strong", "", group.code),
      textNode("span", "validation-count", String(group.count))
    );
    item.appendChild(head);
    for (const text of group.texts) {
      item.appendChild(textNode("p", "", text));
    }
    list.appendChild(item);
  }
  wrap.appendChild(list);
  return wrap;
}

function rosterLine(roster) {
  const summary = rosterSummary(roster);
  const validation = validateRoster(roster);
  const node = button("builder-row roster-row", "", () => navigate(`/roster/${encodeURIComponent(roster.id)}`));
  const text = document.createElement("span");
  text.className = "row-text";
  text.append(
    textNode("strong", "", roster.name || "New Roster"),
    textNode("span", "", `${summary.factionName} / ${summary.battleSizeName}`)
  );
  const meta = document.createElement("span");
  meta.className = "row-meta";
  meta.append(
    textNode("span", "", `${validation.points.total}/${validation.points.limit}`),
    textNode("span", validation.state === "valid" ? "state-ok" : "state-error", validation.state)
  );
  node.append(text, meta);
  return node;
}

function renderList() {
  el.title.textContent = "Builder";
  renderBreadcrumbs(baseBreadcrumbs());
  const root = document.createElement("section");
  root.className = "builder-stack";
  const list = document.createElement("div");
  list.className = "builder-list";
  if (state.rosters.length) {
    for (const roster of state.rosters) {
      list.appendChild(rosterLine(roster));
    }
  } else {
    list.appendChild(textNode("p", "empty-list", "No rosters"));
  }
  root.append(
    list,
    button("builder-row create-roster-button", "Create Roster", () => navigate("/new"))
  );
  el.root.appendChild(root);
}

function renderCreate() {
  el.title.textContent = "Create Roster";
  renderBreadcrumbs(builderBreadcrumbs());

  const form = document.createElement("form");
  form.className = "builder-form";
  const name = document.createElement("input");
  name.name = "name";
  name.maxLength = 80;
  name.autocomplete = "off";
  name.value = "New Roster";

  const faction = document.createElement("select");
  faction.name = "factionKeywordId";
  for (const row of state.catalog.factions) {
    faction.appendChild(option(row.id, row.name));
  }
  faction.value = state.catalog.bootstrap.defaultFactionId || state.catalog.factions[0]?.id || "";

  const battleSize = document.createElement("select");
  battleSize.name = "battleSizeId";
  for (const row of state.catalog.battleSizes) {
    battleSize.appendChild(option(row.id, `${row.name} (${row.pointsLimit})`));
  }
  battleSize.value = state.catalog.bootstrap.defaultBattleSizeId || state.catalog.battleSizes[0]?.id || "";

  form.append(
    field("Name", name),
    field("Faction", faction),
    field("Battle Size", battleSize)
  );

  const actions = document.createElement("div");
  actions.className = "form-actions";
  actions.append(
    button("plain-button", "Back", () => navigate("/")),
    textNode("button", "primary-button", "Confirm")
  );
  actions.lastChild.type = "submit";
  form.appendChild(actions);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const now = new Date().toISOString();
    const roster = {
      id: newId(),
      name: name.value.trim() || "New Roster",
      factionKeywordId: faction.value,
      battleSizeId: battleSize.value,
      detachmentIds: [],
      units: [],
      attachments: [],
      createdAt: now,
      modifiedAt: now,
      dataVersion: state.catalog.bootstrap.dataVersion,
    };
    await saveRoster(roster);
    await refreshRosters();
    navigate(`/roster/${encodeURIComponent(roster.id)}`);
  });
  el.root.appendChild(form);
}

function field(label, control) {
  const node = document.createElement("label");
  node.className = "field";
  node.append(textNode("span", "", label), control);
  return node;
}

function renderRoster() {
  const roster = currentRoster();
  if (!roster) {
    renderNotFound();
    return;
  }
  const summary = rosterSummary(roster);
  const validation = validateRoster(roster);
  el.title.textContent = roster.name || "New Roster";
  renderBreadcrumbs(builderBreadcrumbs());

  const root = document.createElement("section");
  root.className = "builder-grid";
  const overview = document.createElement("section");
  overview.className = "builder-section";
  overview.append(
    textNode("h2", "section-title", `${summary.factionName} / ${summary.battleSizeName}`),
    metricLine("Points", `${validation.points.total} / ${validation.points.limit}`),
    metricLine("Detachments", String((roster.detachmentIds || []).length)),
    metricLine("Units", String((roster.units || []).length)),
    button("plain-button", "Delete Roster", async () => {
      if (window.confirm(`Delete ${roster.name || "this roster"}?`)) {
        await removeRoster(roster.id);
        await refreshRosters();
        navigate("/");
      }
    })
  );
  root.append(overview, renderValidation(validation));
  el.root.appendChild(root);
}

function metricLine(label, value) {
  const node = document.createElement("p");
  node.className = "metric-line";
  node.append(textNode("span", "", label), textNode("strong", "", value));
  return node;
}

function renderNotFound() {
  el.title.textContent = "Builder";
  renderBreadcrumbs(builderBreadcrumbs());
  const root = document.createElement("section");
  root.className = "builder-section";
  root.append(
    textNode("h2", "section-title", "Roster Not Found"),
    button("plain-button", "Back to Builder", () => navigate("/"))
  );
  el.root.appendChild(root);
}

function render() {
  clear(el.root);
  if (state.route.name === "create") {
    renderCreate();
  } else if (state.route.name === "roster") {
    renderRoster();
  } else {
    renderList();
  }
  window.requestAnimationFrame(() => window.setupWinScrollbars?.());
}

async function init() {
  try {
    setStatus("Data");
    state.catalog = await loadCatalog();
    setStatus(`v${state.catalog.bootstrap.dataVersion}`);
    state.db = await openLocalDb();
    await refreshRosters();
    setRoute(parseRoute());
    window.addEventListener("hashchange", () => setRoute(parseRoute()));
  } catch (error) {
    setStatus("Error");
    clear(el.root);
    el.root.appendChild(textNode("div", "validation-item error", error.message || "Failed to start"));
  }
}

init();
