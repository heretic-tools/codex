const UNSUPPORTED_ROSTER_FIELDS = ["attachedUnits"];
const UNSUPPORTED_UNIT_FIELDS = ["allegianceAbilityIds", "enhancementIds", "unitWargear"];
const UNSUPPORTED_MINIATURE_FIELDS = ["enhancementIds"];

function requireNoUnsupportedFields(row, fieldNames, label) {
  const found = fieldNames.filter((fieldName) => Object.hasOwn(row || {}, fieldName));
  if (found.length) {
    throw new Error(`Old roster format is not supported: ${label} contains ${found.join(", ")}.`);
  }
}

export {
  UNSUPPORTED_MINIATURE_FIELDS,
  UNSUPPORTED_ROSTER_FIELDS,
  UNSUPPORTED_UNIT_FIELDS,
  requireNoUnsupportedFields,
};
