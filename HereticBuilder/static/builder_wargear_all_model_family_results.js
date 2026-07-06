function hasInvalidAllModelFamilies(checksByFamily) {
  return [...checksByFamily.values()].some((family) => (
    family.hasHardInvalid || (family.hasSubstituteWithoutBase && !family.hasValidBaseLine)
  ));
}

function allModelFamilyTargetIds(checksByFamily) {
  return [...checksByFamily.values()]
    .flatMap((family) => family.targetIds || [])
    .filter(Boolean);
}

export { allModelFamilyTargetIds, hasInvalidAllModelFamilies };
