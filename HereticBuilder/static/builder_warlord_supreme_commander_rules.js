function supremeCommanderSelections(units) {
  return units.flatMap((unit) => (
    (unit.miniatures || [])
      .filter((miniature) => miniature.isSupremeCommander && miniature.count > 0)
      .map((miniature) => ({ miniature, unit }))
  ));
}

export { supremeCommanderSelections };
