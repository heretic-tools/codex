import { field, option, textNode } from "./builder_dom.js";
import { labelControl } from "./builder_roster_control_labels.js";

function escapePattern(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function rosterNumberFromName(name, factionName) {
  const pattern = new RegExp(`^${escapePattern(factionName)} roster (\\d+)$`, "i");
  const match = String(name || "").trim().match(pattern);
  return match ? Number(match[1]) : 0;
}

function nextRosterNumberForFaction(rosters, factionKeywordId, factionName) {
  const used = new Set((rosters || [])
    .filter((roster) => roster.factionKeywordId === factionKeywordId)
    .map((roster) => rosterNumberFromName(roster.name, factionName))
    .filter((value) => Number.isInteger(value) && value > 0));
  let number = 1;
  while (used.has(number)) {
    number += 1;
  }
  return number;
}

function defaultRosterName(factionName, options = {}) {
  const name = String(factionName || "").trim() || "New";
  const number = nextRosterNumberForFaction(options.rosters, options.factionKeywordId, name);
  return `${name} roster ${number}`;
}

function renderBattleSizePicker(battleSizes, defaultBattleSizeId) {
  const selectedDefault = defaultBattleSizeId || battleSizes[0]?.id || "";
  let selectedBattleSizeId = selectedDefault;
  const group = document.createElement("fieldset");
  group.className = "battle-size-picker";
  group.appendChild(textNode("legend", "battle-size-picker-title", "Battle Size"));

  const options = document.createElement("div");
  options.className = "battle-size-options";
  const labels = [];

  const refresh = () => {
    for (const { input, label } of labels) {
      const selected = input.value === selectedBattleSizeId;
      input.checked = selected;
      label.className = selected ? "battle-size-option is-selected" : "battle-size-option";
    }
  };

  for (const row of battleSizes) {
    const label = document.createElement("label");
    label.className = "battle-size-option";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "battleSizeId";
    input.value = row.id;
    input.autocomplete = "off";
    input.checked = row.id === selectedBattleSizeId;
    input.addEventListener("change", () => {
      if (input.checked) {
        selectedBattleSizeId = input.value;
        refresh();
      }
    });
    label.append(
      input,
      textNode("span", "battle-size-option-name", row.name),
      textNode("span", "battle-size-option-points", `${row.pointsLimit} pts`)
    );
    labels.push({ input, label });
    options.appendChild(label);
  }

  refresh();
  group.appendChild(options);
  return {
    node: group,
    value: () => selectedBattleSizeId,
  };
}

function renderRosterCreateView({ battleSizes, defaultBattleSizeId, defaultFactionId, factions, onSubmit, rosters = [] }) {
  const form = document.createElement("form");
  form.className = "builder-form roster-create-form";
  form.autocomplete = "off";
  const name = document.createElement("input");
  name.name = "name";
  name.maxLength = 80;
  name.autocomplete = "off";
  name.placeholder = "Roster name";
  name.autofocus = true;
  let nameIsPristine = true;
  name.addEventListener("input", () => {
    nameIsPristine = false;
  });

  const faction = document.createElement("select");
  faction.name = "factionKeywordId";
  for (const row of factions) {
    faction.appendChild(option(row.id, row.name));
  }
  faction.value = defaultFactionId || factions[0]?.id || "";
  const factionName = () => factions.find((row) => row.id === faction.value)?.name || factions[0]?.name || "";
  const generatedRosterName = () => defaultRosterName(factionName(), {
    factionKeywordId: faction.value,
    rosters,
  });
  name.value = generatedRosterName();
  faction.addEventListener("change", () => {
    if (nameIsPristine) {
      name.value = generatedRosterName();
    }
  });

  const battleSize = renderBattleSizePicker(battleSizes, defaultBattleSizeId);

  form.append(
    field("Name", name),
    field("Faction", faction),
    battleSize.node
  );

  const actions = document.createElement("div");
  actions.className = "form-actions";
  const confirm = labelControl(textNode("button", "primary-button", "Confirm"), "Confirm roster setup");
  confirm.type = "submit";
  actions.appendChild(confirm);
  form.appendChild(actions);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await onSubmit({
      battleSizeId: battleSize.value(),
      factionKeywordId: faction.value,
      name: name.value.trim() || generatedRosterName(),
    });
  });
  return form;
}

export {
  defaultRosterName,
  nextRosterNumberForFaction,
  renderBattleSizePicker,
  renderRosterCreateView,
  rosterNumberFromName,
};
