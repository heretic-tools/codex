import { button, field, option, textNode } from "./builder_dom.js";

function renderRosterCreateView({ battleSizes, defaultBattleSizeId, defaultFactionId, factions, onBack, onSubmit }) {
  const form = document.createElement("form");
  form.className = "builder-form";
  const name = document.createElement("input");
  name.name = "name";
  name.maxLength = 80;
  name.autocomplete = "off";
  name.value = "New Roster";

  const faction = document.createElement("select");
  faction.name = "factionKeywordId";
  for (const row of factions) {
    faction.appendChild(option(row.id, row.name));
  }
  faction.value = defaultFactionId || factions[0]?.id || "";

  const battleSize = document.createElement("select");
  battleSize.name = "battleSizeId";
  for (const row of battleSizes) {
    battleSize.appendChild(option(row.id, `${row.name} (${row.pointsLimit})`));
  }
  battleSize.value = defaultBattleSizeId || battleSizes[0]?.id || "";

  form.append(
    field("Name", name),
    field("Faction", faction),
    field("Battle Size", battleSize)
  );

  const actions = document.createElement("div");
  actions.className = "form-actions";
  actions.append(
    button("plain-button", "Back", onBack),
    textNode("button", "primary-button", "Confirm")
  );
  actions.lastChild.type = "submit";
  form.appendChild(actions);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await onSubmit({
      battleSizeId: battleSize.value,
      factionKeywordId: faction.value,
      name: name.value.trim() || "New Roster",
    });
  });
  return form;
}

export { renderRosterCreateView };
