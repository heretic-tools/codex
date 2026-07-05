const LEGACY_ROSTER_FIELDS = ["attachedUnits"];
const LEGACY_UNIT_FIELDS = ["allegianceAbilityIds", "enhancementIds", "unitWargear"];
const LEGACY_MINIATURE_FIELDS = ["enhancementIds"];

function requireNoLegacyFields(row, fieldNames, label) {
  const found = fieldNames.filter((fieldName) => Object.hasOwn(row || {}, fieldName));
  if (found.length) {
    throw new Error(`${label} uses legacy roster fields: ${found.join(", ")}`);
  }
}

export {
  LEGACY_MINIATURE_FIELDS,
  LEGACY_ROSTER_FIELDS,
  LEGACY_UNIT_FIELDS,
  requireNoLegacyFields,
};
