function unitIdsScope(items) {
  const unitIds = [...new Set(items.map((item) => item.unit?.id).filter(Boolean))];
  return unitIds.length ? { unitIds } : null;
}

export { unitIdsScope };
