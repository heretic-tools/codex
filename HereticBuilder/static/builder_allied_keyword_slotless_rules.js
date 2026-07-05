import { idsFromRows } from "./builder_model.js";
import { state } from "./builder_state.js";

function unitHasEveryKeyword(unit, keywordIds) {
  const ids = new Set(unit.keywordIds || []);
  return [...keywordIds].every((id) => ids.has(id));
}

function slotlessAlliedKeywordCount(alliedFactionKeywordId, units) {
  let slotless = 0;
  for (const group of state.catalog.alliedFactionKeywordSlotlessGroupsByKeywordId.get(alliedFactionKeywordId) || []) {
    const donorKeywords = new Set(idsFromRows(
      state.catalog.alliedFactionKeywordSlotlessDonorsByGroupId.get(group.id),
      "keywordId"
    ));
    const receiverKeywords = new Set(idsFromRows(
      state.catalog.alliedFactionKeywordSlotlessReceiversByGroupId.get(group.id),
      "keywordId"
    ));
    if (!donorKeywords.size || !receiverKeywords.size) {
      continue;
    }
    const donorCount = units.filter((unit) => unitHasEveryKeyword(unit, donorKeywords)).length;
    const receiverCount = units.filter((unit) => unitHasEveryKeyword(unit, receiverKeywords)).length;
    slotless += Math.min(donorCount, receiverCount);
  }
  return slotless;
}

export { slotlessAlliedKeywordCount };
