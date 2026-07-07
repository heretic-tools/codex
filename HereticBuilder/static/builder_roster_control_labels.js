const SEARCH_CLEAR_LABEL = "Clear search";
const ADD_ATTACHED_UNIT_LABEL = "Add attached unit";
const ADD_DETACHMENT_LABEL = "Add detachment";
const ADD_UNIT_LABEL = "Add unit";
const ATTACHED_UNIT_SELECT_LABEL = "Choose attached unit";
const ATTACHMENT_BODYGUARD_SELECT_LABEL = "Choose bodyguard unit";
const ATTACHMENT_TYPE_SELECT_LABEL = "Choose attachment type";
const DETACHMENT_SELECT_LABEL = "Choose detachment";
const UNIT_SELECT_LABEL = "Choose unit";
const WARLORD_SELECT_LABEL = "Choose Warlord";

function labelControl(node, label) {
  node.title = label;
  node.setAttribute("aria-label", label);
  return node;
}

function searchControlLabel(target) {
  return `Search ${target}`;
}

export {
  ADD_ATTACHED_UNIT_LABEL,
  ADD_DETACHMENT_LABEL,
  ADD_UNIT_LABEL,
  ATTACHED_UNIT_SELECT_LABEL,
  ATTACHMENT_BODYGUARD_SELECT_LABEL,
  ATTACHMENT_TYPE_SELECT_LABEL,
  DETACHMENT_SELECT_LABEL,
  SEARCH_CLEAR_LABEL,
  UNIT_SELECT_LABEL,
  WARLORD_SELECT_LABEL,
  labelControl,
  searchControlLabel,
};
