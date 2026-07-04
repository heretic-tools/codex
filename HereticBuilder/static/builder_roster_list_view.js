import { button, textNode } from "./builder_dom.js";

function rosterLine(roster, onOpen, summarizeRoster) {
  const summary = summarizeRoster(roster);
  const pointsLimit = summary.pointsLimit ? `/${summary.pointsLimit}` : "";
  const node = button("builder-row roster-row", "", () => onOpen(roster));
  const text = document.createElement("span");
  text.className = "row-text";
  text.append(
    textNode("strong", "", roster.name || "New Roster"),
    textNode("span", "", `${summary.factionName} / ${summary.battleSizeName}`)
  );
  const meta = document.createElement("span");
  meta.className = "row-meta";
  meta.append(
    textNode("span", "", `${summary.pointsTotal}${pointsLimit}`),
    textNode("span", "", `${summary.detachmentCount} det.`),
    textNode("span", "", `${summary.unitCount} units`)
  );
  node.append(text, meta);
  return node;
}

function renderRosterListView({ rosters, onCreate, onOpen, summarizeRoster }) {
  const root = document.createElement("section");
  root.className = "builder-stack";
  const list = document.createElement("div");
  list.className = "builder-list";
  if (rosters.length) {
    for (const roster of rosters) {
      list.appendChild(rosterLine(roster, onOpen, summarizeRoster));
    }
  } else {
    list.appendChild(textNode("p", "empty-list", "No rosters"));
  }
  root.append(
    list,
    button("builder-row create-roster-button", "Create Roster", onCreate)
  );
  return root;
}

export { renderRosterListView };
