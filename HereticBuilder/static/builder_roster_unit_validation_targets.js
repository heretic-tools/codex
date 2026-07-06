function unitValidationActionTarget(group) {
  const code = group.code || "";
  if (code.startsWith("wargear_loadout.")) {
    if ((group.targetIds || []).length === 1) {
      return { target: `wargear:${group.targetIds[0]}`, text: "Wargear" };
    }
    return { target: "wargear", text: "Wargear" };
  }
  if (code.startsWith("enhancement.") || code === "warlord.invalid_due_to_enhancement") {
    if ((group.targetIds || []).length === 1) {
      return { target: `enhancement:${group.targetIds[0]}`, text: "Enhancements" };
    }
    return { target: "enhancements", text: "Enhancements" };
  }
  if (code.startsWith("allegiance_ability.")) {
    return { target: "allegiance", text: "Ability" };
  }
  if (code.startsWith("warlord.") || code.startsWith("mandatory_warlord.")) {
    return { target: "warlord", text: "Warlord" };
  }
  if (code.startsWith("unit_composition.") || code === "unit.max_model_count_too_many_models") {
    return { target: "composition", text: "Composition" };
  }
  return null;
}

export { unitValidationActionTarget };
