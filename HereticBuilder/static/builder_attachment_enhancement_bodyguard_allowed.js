import { idsFromRows, setIntersects } from "./builder_model.js";
import { state } from "./builder_state.js";

function enhancementBodyguardAllowed(bodyguard, bodyguardGroupId) {
  const allowedDatasheets = new Set(idsFromRows(
    state.catalog.enhancementBodyguardGroupDatasheetsByGroupId.get(bodyguardGroupId),
    "datasheetId"
  ));
  const allowedKeywords = new Set(idsFromRows(
    state.catalog.enhancementBodyguardGroupKeywordsByGroupId.get(bodyguardGroupId),
    "keywordId"
  ));
  if (allowedDatasheets.size && !allowedDatasheets.has(bodyguard.datasheetId)) {
    return false;
  }
  return !allowedKeywords.size || setIntersects(new Set(bodyguard.keywordIds || []), allowedKeywords);
}

export { enhancementBodyguardAllowed };
