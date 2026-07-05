import { limitedChoiceCoverSearch } from "./builder_wargear_limited_cover_search.js";
import { limitedChoiceCoverVectors } from "./builder_wargear_limited_cover_vectors.js";

function limitedChoiceCoverIsValid(selectedCounts, choices, choiceLimit, duplicateLimit, mandatory = false) {
  const { target, vectors } = limitedChoiceCoverVectors(selectedCounts, choices);
  if (!target.length) {
    return !mandatory;
  }
  if (choiceLimit <= 0) {
    return false;
  }
  if (!vectors.length) {
    return false;
  }
  return limitedChoiceCoverSearch(target, vectors, choiceLimit, duplicateLimit);
}

export { limitedChoiceCoverIsValid };
