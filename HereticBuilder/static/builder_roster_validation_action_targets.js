function rosterValidationActionTarget(group) {
  const attachmentIds = group.attachmentIds || [];
  const datasheetIds = group.datasheetIds || [];
  const detachmentIds = group.detachmentIds || [];
  const unitIds = group.unitIds || [];
  if (datasheetIds.length === 1 && [
    "detachment.datasheets_missing",
    "detachment.linked_datasheet_count_mismatch",
    "mandatory_warlord.not_present_in_roster",
  ].includes(group.code)) {
    return { datasheetId: datasheetIds[0], kind: "unitSearch", text: "Find" };
  }
  const codeTarget = rosterValidationCodeActionTarget(group.code);
  if (codeTarget) {
    return codeTarget;
  }
  if (unitIds.length === 1) {
    return { kind: "unit", text: "Open", unitId: unitIds[0] };
  }
  if (attachmentIds.length === 1) {
    return { attribute: "attachment-id", kind: "row", text: "Show", value: attachmentIds[0] };
  }
  if (detachmentIds.length === 1) {
    return { detachmentId: detachmentIds[0], kind: "detachmentCodex", text: "Codex" };
  }
  if (unitIds.length > 1) {
    return { kind: "target", target: "units", text: "Units" };
  }
  if (detachmentIds.length > 1) {
    return { kind: "target", target: "detachments", text: "Detachments" };
  }
  if (attachmentIds.length > 1) {
    return { kind: "target", target: "attachments", text: "Attached" };
  }
  return null;
}

function rosterValidationCodeActionTarget(code) {
  switch (code) {
    case "mandatory_warlord.not_selected":
    case "mandatory_warlord.detachment_not_selected":
    case "mandatory_warlord.supreme_commander_not_selected":
    case "allied_units.required_warlord_missing":
    case "warlord.invalid_generic":
    case "warlord.multiple_selected":
    case "warlord.not_selected":
      return { kind: "target", target: "warlord", text: "Pick" };
    case "allied_unit.required_detachment_not_selected":
    case "roster.detachment_missing":
    case "roster.detachment_not_selected":
    case "roster.detachment_points_limit_exceeded":
      return { kind: "target", target: "detachments", text: "Detachments" };
    case "allegiance_ability.group_limit_exceeded":
    case "allegiance_ability.group_limit_not_reached":
    case "allied_faction.datasheet_not_allowed":
    case "allied_faction.not_available":
    case "allied_keyword_count.invalid_mutually_exclusive_keywords":
    case "allied_keyword_count.limit_exceeded":
    case "allied_keyword_restricting_keyword.outnumbered_keywords":
    case "allied_points.limit_exceeded":
    case "allied_unit.required_allegiance_ability_missing":
    case "enhancement.combat_patrol_multiple_selected":
    case "enhancement.combat_patrol_not_allowed":
    case "enhancement.combat_patrol_required":
    case "enhancement.models_have_same_enhancements":
    case "enhancement.roster_has_too_many_enhancements":
    case "detachment.datasheets_missing":
    case "detachment.linked_datasheet_count_mismatch":
    case "keyword_restriction_group.limit_exceeded":
    case "keyword_restriction_group.minimum_not_met":
    case "keyword_restriction_group.limit_zero":
    case "mandatory_warlord.not_present_in_roster":
    case "roster.empty":
    case "roster.points_limit_exceeded":
      return { kind: "target", target: "units", text: "Units" };
    default:
      return null;
  }
}

export { rosterValidationActionTarget };
