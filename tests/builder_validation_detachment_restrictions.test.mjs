import {
  allegianceAbility,
  allegianceAbilityWithRequiredWargear,
  allegianceGroup,
  allegianceUnit,
  alliedFactionForRosterAndParent,
  alliedFactionWithParent,
  alliedUnit,
  alliedUnitWarlord,
  assert,
  availableCompositionIds,
  availableCompositions,
  availableDatasheets,
  availableDetachments,
  battleSizeNamed,
  catalogWithOnlyDatasheetPointsStep,
  combatPatrolDatasheetNamed,
  costForDetachment,
  datasheetFactionIds,
  datasheetIdForEnhancementBodyguard,
  datasheetIsCombatPatrol,
  datasheetIsNativeToFaction,
  datasheetKeywordNameSet,
  datasheetNamed,
  datasheetNamedForAlly,
  defaultCompositionForDatasheet,
  defaultMiniatures,
  defaultMiniaturesForComposition,
  defaultWargear,
  defaultWargearUnit,
  detachmentDispositionName,
  detachmentNamed,
  enhancementNamed,
  enhancementTargetUnit,
  factionExcludesDatasheet,
  factionNamed,
  factionScope,
  keywordIdsForDatasheet,
  keywordNamed,
  messageCodes,
  miniatureInUnit,
  miniatureNamed,
  miniatureNamedForDatasheet,
  modelAvailableDatasheets,
  modelAvailableUnitSources,
  modelCompositionFactionIds,
  modelCompositionLabel,
  modelDetachmentBadgeNode,
  modelDetachmentDispositionBadgeNode,
  modelRosterPoints,
  modelRosterUnitSummaries,
  modelSelectedAllegianceAbilities,
  optionIdForMiniatureItem,
  realCatalog,
  rosterFactionIdForDatasheet,
  rosterUnitFromDatasheetId,
  rosterUnitRef,
  setMiniatureWargear,
  state,
  test,
  unitSummariesForPointsStep,
  unitSummary,
  validateAllegianceAbilities,
  validateAlliedUnits,
  validateAttachedUnits,
  validateDetachmentDatasheets,
  validateDetachmentUniqueKeywords,
  validateEnhancements,
  validateKeywordRestrictions,
  validateRoster,
  validateSuccessorChapterEpicHeroes,
  validateUnitCompositions,
  validateWargearLoadouts,
  validateWarlord,
  warlordUnitForMiniature,
  withCatalog,
  withMiniatureEnhancement,
} from "./builder_validation_roster_restrictions_helpers.mjs";

test("detachment and composition validators cover unique, excluded, linked, and invalid composition cases", () => {
  state.catalog = realCatalog;

  const uniqueMessages = [];
  validateDetachmentUniqueKeywords([
    detachmentNamed("Kabalite Agonysts"),
    detachmentNamed("Kabalite Cartel"),
  ], uniqueMessages);
  assert.ok(messageCodes(uniqueMessages).includes("roster.detachment_unique_keyword_error"));
  assert.deepEqual(
    uniqueMessages.find((message) => message.code === "roster.detachment_unique_keyword_error")?.scope?.detachmentIds,
    [detachmentNamed("Kabalite Agonysts").id, detachmentNamed("Kabalite Cartel").id]
  );

  withCatalog({
    detachmentUniqueKeywordsByDetachmentId: new Map([
      ["detachment-a", [{ keywordId: "keyword-a" }]],
      ["detachment-b", [{ keywordId: "keyword-b" }]],
      ["detachment-c", [{ keywordId: "keyword-a" }]],
    ]),
    keywordById: new Map([
      ["keyword-a", { id: "keyword-a", name: "Shared Display Name" }],
      ["keyword-b", { id: "keyword-b", name: "Shared Display Name" }],
    ]),
  }, () => {
    const sameNameMessages = [];
    validateDetachmentUniqueKeywords([
      { id: "detachment-a", name: "Detachment A" },
      { id: "detachment-b", name: "Detachment B" },
    ], sameNameMessages);
    assert.ok(!messageCodes(sameNameMessages).includes("roster.detachment_unique_keyword_error"));

    const sameIdMessages = [];
    validateDetachmentUniqueKeywords([
      { id: "detachment-a", name: "Detachment A" },
      { id: "detachment-c", name: "Detachment C" },
    ], sameIdMessages);
    assert.ok(messageCodes(sameIdMessages).includes("roster.detachment_unique_keyword_error"));
    assert.deepEqual(
      sameIdMessages.find((message) => message.code === "roster.detachment_unique_keyword_error")?.scope?.detachmentIds,
      ["detachment-a", "detachment-c"]
    );
  });

  const shadowLegion = detachmentNamed("Shadow Legion");
  const excludedRow = realCatalog.detachmentExcludedDatasheets.find((row) => (
    row.detachmentId === shadowLegion.id
    && realCatalog.datasheetById.get(row.datasheetId)?.name === "Kairos Fateweaver"
  ));
  assert.ok(excludedRow, "Expected Shadow Legion to exclude Kairos Fateweaver");
  const excludedMessages = [];
  validateDetachmentDatasheets(
    [shadowLegion],
    [rosterUnitFromDatasheetId(excludedRow.datasheetId, "kairos")],
    excludedMessages
  );
  assert.ok(messageCodes(excludedMessages).includes("detachment.datasheet_not_allowed"));

  const purgeCorps = detachmentNamed("Purge Corps Deltic-9");
  const linkedMessages = [];
  validateDetachmentDatasheets(
    [purgeCorps],
    [enhancementTargetUnit({
      id: "wrong-combat-patrol-unit",
      datasheetName: "Captain",
      miniatureName: "Captain",
      factionNames: ["Adeptus Astartes"],
    })],
    linkedMessages
  );
  assert.ok(messageCodes(linkedMessages).includes("detachment.linked_datasheet_count_mismatch"));
  assert.ok(messageCodes(linkedMessages).includes("detachment.linked_datasheet_not_allowed"));
  assert.equal(
    linkedMessages.find((message) => message.code === "detachment.linked_datasheet_count_mismatch")?.scope?.detachmentId,
    purgeCorps.id
  );
  assert.equal(
    linkedMessages.find((message) => message.code === "detachment.linked_datasheet_not_allowed")?.scope?.detachmentId,
    purgeCorps.id
  );

  const compositionMessages = [];
  validateUnitCompositions([
    { id: "too-many", name: "Too Many", modelCount: 11, maxModelCount: 10, selectedCompositionId: "composition", selectedCompositionAvailable: true },
    { id: "missing-composition", name: "Missing Composition", modelCount: 1, maxModelCount: 10, selectedCompositionId: "", selectedCompositionAvailable: false },
    { id: "unavailable-composition", name: "Unavailable Composition", modelCount: 1, maxModelCount: 10, selectedCompositionId: "composition", selectedCompositionAvailable: false },
  ], compositionMessages);
  assert.ok(messageCodes(compositionMessages).includes("unit.max_model_count_too_many_models"));
  assert.ok(messageCodes(compositionMessages).includes("unit_composition.invalid_unit_composition"));
  assert.ok(messageCodes(compositionMessages).includes("unit_composition.unavailable"));

  withCatalog({
    detachmentExcludedDatasheets: [],
    detachmentRequiredDatasheetsByDetachmentId: new Map([[
      "required-detachment",
      [{ datasheetId: "required-datasheet" }],
    ]]),
    datasheetById: new Map([["required-datasheet", { id: "required-datasheet", name: "Required Datasheet" }]]),
  }, () => {
    const requiredDatasheetMessages = [];
    validateDetachmentDatasheets(
      [{ id: "required-detachment", name: "Required Detachment", isCombatPatrol: false }],
      [],
      requiredDatasheetMessages
    );
    assert.ok(messageCodes(requiredDatasheetMessages).includes("detachment.datasheets_missing"));
    assert.equal(
      requiredDatasheetMessages.find((message) => message.code === "detachment.datasheets_missing")?.scope?.detachmentId,
      "required-detachment"
    );

    const selectedRequiredDatasheetMessages = [];
    validateDetachmentDatasheets(
      [{ id: "required-detachment", name: "Required Detachment", isCombatPatrol: false }],
      [{ id: "required-unit", name: "Required Datasheet", datasheetId: "required-datasheet" }],
      selectedRequiredDatasheetMessages
    );
    assert.ok(!messageCodes(selectedRequiredDatasheetMessages).includes("detachment.datasheets_missing"));
  });
});

test("all live detachment unique keyword groups have valid and invalid coverage", () => {
  state.catalog = realCatalog;
  assert.equal(realCatalog.detachmentUniqueKeywords.length, 57);

  const rowsByKeywordId = new Map();
  for (const row of realCatalog.detachmentUniqueKeywords) {
    if (!rowsByKeywordId.has(row.keywordId)) {
      rowsByKeywordId.set(row.keywordId, []);
    }
    rowsByKeywordId.get(row.keywordId).push(row);
  }
  assert.equal(rowsByKeywordId.size, 27);

  const representatives = [];
  for (const [keywordId, rows] of rowsByKeywordId.entries()) {
    assert.ok(rows.length > 1, `${keywordId} should be a shared unique detachment keyword`);
    const detachments = rows.map((row) => realCatalog.detachmentById.get(row.detachmentId));
    assert.ok(detachments.every(Boolean), `${keywordId} should resolve all detachments`);

    representatives.push(detachments[0]);

    const invalidMessages = [];
    validateDetachmentUniqueKeywords(detachments, invalidMessages);
    assert.ok(
      messageCodes(invalidMessages).includes("roster.detachment_unique_keyword_error"),
      `${keywordId} should reject detachments sharing one unique keyword`
    );
  }

  const validMessages = [];
  validateDetachmentUniqueKeywords(representatives, validMessages);
  assert.ok(!messageCodes(validMessages).includes("roster.detachment_unique_keyword_error"));
});

test("all live datasheet exclusion rows have valid and invalid coverage", () => {
  state.catalog = realCatalog;
  assert.equal(realCatalog.detachmentExcludedDatasheets.length, 23);
  assert.equal(realCatalog.factionExcludedDatasheets.length, 23);

  const detachmentExcludedIds = new Map();
  for (const row of realCatalog.detachmentExcludedDatasheets) {
    if (!detachmentExcludedIds.has(row.detachmentId)) {
      detachmentExcludedIds.set(row.detachmentId, new Set());
    }
    detachmentExcludedIds.get(row.detachmentId).add(row.datasheetId);

    const messages = [];
    validateDetachmentDatasheets(
      [realCatalog.detachmentById.get(row.detachmentId)],
      [rosterUnitFromDatasheetId(row.datasheetId, `${row.detachmentId}:${row.datasheetId}:excluded`)],
      messages
    );
    assert.ok(
      messageCodes(messages).includes("detachment.datasheet_not_allowed"),
      `${row.detachmentId}:${row.datasheetId} should be excluded from its detachment`
    );
  }
  for (const [detachmentId, excludedIds] of detachmentExcludedIds.entries()) {
    const allowedDatasheet = realCatalog.datasheets.find((datasheet) => !excludedIds.has(datasheet.id));
    assert.ok(allowedDatasheet, `${detachmentId} should have a non-excluded control datasheet`);
    const messages = [];
    validateDetachmentDatasheets(
      [realCatalog.detachmentById.get(detachmentId)],
      [rosterUnitFromDatasheetId(allowedDatasheet.id, `${detachmentId}:allowed`)],
      messages
    );
    assert.ok(!messageCodes(messages).includes("detachment.datasheet_not_allowed"));
  }

  const factionExcludedIds = new Map();
  for (const row of realCatalog.factionExcludedDatasheets) {
    if (!factionExcludedIds.has(row.factionKeywordId)) {
      factionExcludedIds.set(row.factionKeywordId, new Set());
    }
    factionExcludedIds.get(row.factionKeywordId).add(row.datasheetId);

    const detachmentRow = realCatalog.detachmentFactionKeywords.find((item) => {
      const detachment = realCatalog.detachmentById.get(item.detachmentId);
      return item.factionKeywordId === row.factionKeywordId && detachment && !detachment.isCombatPatrol;
    });
    assert.ok(detachmentRow, `${row.factionKeywordId} should have a non-Combat Patrol detachment`);
    const validation = validateRoster({
      id: `${row.factionKeywordId}:${row.datasheetId}:excluded`,
      name: "Excluded Datasheet",
      factionKeywordId: row.factionKeywordId,
      battleSizeId: battleSizeNamed("Strike Force").id,
      detachmentIds: [detachmentRow.detachmentId],
      units: [{ id: `${row.datasheetId}:unit`, datasheetId: row.datasheetId }],
    });
    assert.ok(
      messageCodes(validation.messages).includes("roster.faction_datasheet_not_allowed"),
      `${row.factionKeywordId}:${row.datasheetId} should be excluded from its roster faction`
    );
  }
  for (const [factionKeywordId, excludedIds] of factionExcludedIds.entries()) {
    const allowedDatasheet = realCatalog.datasheets.find((datasheet) => (
      !excludedIds.has(datasheet.id)
      && !realCatalog.publicationById.get(datasheet.publicationId)?.isCombatPatrol
      && (realCatalog.datasheetFactionKeywordsByDatasheetId.get(datasheet.id) || [])
        .some((row) => row.factionKeywordId === factionKeywordId)
    ));
    assert.ok(allowedDatasheet, `${factionKeywordId} should have a native non-excluded control datasheet`);
    const detachmentRow = realCatalog.detachmentFactionKeywords.find((item) => {
      const detachment = realCatalog.detachmentById.get(item.detachmentId);
      return item.factionKeywordId === factionKeywordId && detachment && !detachment.isCombatPatrol;
    });
    const validation = validateRoster({
      id: `${factionKeywordId}:${allowedDatasheet.id}:allowed`,
      name: "Allowed Datasheet",
      factionKeywordId,
      battleSizeId: battleSizeNamed("Strike Force").id,
      detachmentIds: [detachmentRow.detachmentId],
      units: [{ id: `${allowedDatasheet.id}:unit`, datasheetId: allowedDatasheet.id }],
    });
    assert.ok(!messageCodes(validation.messages).includes("roster.faction_datasheet_not_allowed"));
  }
});

test("all live Combat Patrol linked datasheet rows have exact roster coverage", () => {
  state.catalog = realCatalog;
  assert.equal(realCatalog.detachmentLinkedDatasheets.length, 107);

  const rowsByDetachmentId = new Map();
  for (const row of realCatalog.detachmentLinkedDatasheets) {
    if (!rowsByDetachmentId.has(row.detachmentId)) {
      rowsByDetachmentId.set(row.detachmentId, []);
    }
    rowsByDetachmentId.get(row.detachmentId).push(row);
  }
  assert.equal(rowsByDetachmentId.size, 24);

  for (const [detachmentId, linkedRows] of rowsByDetachmentId.entries()) {
    const detachment = realCatalog.detachmentById.get(detachmentId);
    assert.ok(detachment?.isCombatPatrol, `${detachmentId} should be a Combat Patrol detachment`);
    const linkedIds = new Set(linkedRows.map((row) => row.datasheetId));
    const exactUnits = linkedRows.flatMap((row) => (
      Array.from({ length: row.count }, (_, index) => (
        rosterUnitFromDatasheetId(row.datasheetId, `${detachmentId}:${row.datasheetId}:exact-${index}`)
      ))
    ));

    const exactMessages = [];
    validateDetachmentDatasheets([detachment], exactUnits, exactMessages);
    assert.ok(
      !messageCodes(exactMessages).some((code) => code.startsWith("detachment.linked_datasheet_")),
      `${detachment.name} exact linked roster should be valid`
    );

    const missingMessages = [];
    validateDetachmentDatasheets([detachment], exactUnits.slice(1), missingMessages);
    assert.ok(
      messageCodes(missingMessages).includes("detachment.linked_datasheet_count_mismatch"),
      `${detachment.name} should reject missing linked datasheets`
    );

    const extraDatasheet = realCatalog.datasheets.find((datasheet) => !linkedIds.has(datasheet.id));
    assert.ok(extraDatasheet, `${detachment.name} should have a non-linked control datasheet`);
    const extraMessages = [];
    validateDetachmentDatasheets(
      [detachment],
      [...exactUnits, rosterUnitFromDatasheetId(extraDatasheet.id, `${detachmentId}:extra`)],
      extraMessages
    );
    assert.ok(
      messageCodes(extraMessages).includes("detachment.linked_datasheet_not_allowed"),
      `${detachment.name} should reject non-linked datasheets`
    );
  }
});

test("validateRoster reports roster-level detachment, points, Combat Patrol, native, and excluded datasheet failures", () => {
  state.catalog = realCatalog;

  const illegalDetachmentValidation = validateRoster({
    id: "illegal-detachment",
    name: "Illegal Detachment",
    factionKeywordId: factionNamed("Adeptus Astartes").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [detachmentNamed("Kabalite Agonysts").id],
    units: [],
  });
  assert.ok(messageCodes(illegalDetachmentValidation.messages).includes("roster.detachment_not_allowed"));
  assert.equal(
    illegalDetachmentValidation.messages.find((message) => message.code === "roster.detachment_not_allowed")?.scope?.detachmentId,
    detachmentNamed("Kabalite Agonysts").id
  );

  const pointsValidation = validateRoster({
    id: "over-points",
    name: "Over Points",
    factionKeywordId: factionNamed("Heretic Astartes").id,
    battleSizeId: battleSizeNamed("Incursion").id,
    detachmentIds: [detachmentNamed("Pactbound Zealots").id],
    units: [rosterUnitRef("Chaos Warlord Titan", "chaos-warlord-titan")],
  });
  assert.ok(messageCodes(pointsValidation.messages).includes("roster.points_limit_exceeded"));

  const steppedDatasheet = datasheetNamed("Eradicator Squad");
  const steppedComposition = defaultCompositionForDatasheet(steppedDatasheet.id);
  const steppedPoints = realCatalog.datasheetPointsStepsByDatasheetId.get(steppedDatasheet.id)?.[0];
  assert.ok(steppedPoints, "Expected Eradicator Squad to have a datasheet points step");
  const steppedPointsValidation = validateRoster({
    id: "stepped-points",
    name: "Stepped Points",
    factionKeywordId: factionNamed("Adeptus Astartes").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [detachmentNamed("Gladius Task Force").id],
    units: [0, 1, 2].map((index) => rosterUnitRef("Eradicator Squad", `eradicator-${index}`)),
  });
  assert.equal(
    steppedPointsValidation.points.total,
    (steppedComposition.points * 3) + steppedPoints.stepPoints
  );

  const combatPatrolDatasheet = combatPatrolDatasheetNamed("Assault Force Intercessor Squad");
  const combatPatrolValidation = validateRoster({
    id: "combat-patrol-unit",
    name: "Combat Patrol Unit",
    factionKeywordId: factionNamed("Adeptus Astartes").id,
    battleSizeId: battleSizeNamed("Incursion").id,
    detachmentIds: [detachmentNamed("Gladius Task Force").id],
    units: [{ id: "assault-force-intercessors", datasheetId: combatPatrolDatasheet.id }],
  });
  assert.ok(messageCodes(combatPatrolValidation.messages).includes("roster.combat_patrol_datasheet"));

  const nonNativeValidation = validateRoster({
    id: "non-native",
    name: "Non Native",
    factionKeywordId: factionNamed("Adeptus Astartes").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [detachmentNamed("Gladius Task Force").id],
    units: [rosterUnitRef("Plague Marines", "plague-marines")],
  });
  assert.ok(messageCodes(nonNativeValidation.messages).includes("roster.unit_not_native"));

  const excludedValidation = validateRoster({
    id: "black-templars-librarian",
    name: "Black Templars Librarian",
    factionKeywordId: factionNamed("Black Templars").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [detachmentNamed("Gladius Task Force").id],
    units: [rosterUnitRef("Librarian", "librarian")],
  });
  assert.ok(messageCodes(excludedValidation.messages).includes("roster.faction_datasheet_not_allowed"));
});

test("default unit composition prefers matching detachment and faction specific rows", () => {
  state.catalog = realCatalog;

  const genericCtanValidation = validateRoster({
    id: "generic-void-dragon",
    name: "Generic Void Dragon",
    factionKeywordId: factionNamed("Necrons").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [detachmentNamed("Hypercrypt Legion").id],
    units: [rosterUnitRef("C’tan Shard of the Void Dragon", "generic-void-dragon")],
  });
  assert.equal(genericCtanValidation.points.total, 345);

  const pantheonCtanValidation = validateRoster({
    id: "pantheon-void-dragon",
    name: "Pantheon Void Dragon",
    factionKeywordId: factionNamed("Necrons").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [detachmentNamed("Pantheon of Woe").id],
    units: [rosterUnitRef("C’tan Shard of the Void Dragon", "pantheon-void-dragon")],
  });
  assert.equal(pantheonCtanValidation.points.total, 380);

  const voidDragon = datasheetNamed("C’tan Shard of the Void Dragon");
  const genericVoidDragonComposition = (realCatalog.compositionsByDatasheetId.get(voidDragon.id) || [])
    .find((composition) => !(realCatalog.requiredDetachmentsByCompositionId.get(composition.id) || []).length);
  assert.ok(genericVoidDragonComposition, "Expected generic Void Dragon composition");
  const savedGenericPantheonValidation = validateRoster({
    id: "saved-generic-pantheon-void-dragon",
    name: "Saved Generic Pantheon Void Dragon",
    factionKeywordId: factionNamed("Necrons").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [detachmentNamed("Pantheon of Woe").id],
    units: [{
      ...rosterUnitRef("C’tan Shard of the Void Dragon", "saved-generic-pantheon-void-dragon"),
      compositionId: genericVoidDragonComposition.id,
    }],
  });
  assert.equal(savedGenericPantheonValidation.points.total, 380);

  const genericBladeguardValidation = validateRoster({
    id: "generic-bladeguard",
    name: "Generic Bladeguard",
    factionKeywordId: factionNamed("Adeptus Astartes").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [detachmentNamed("Gladius Task Force").id],
    units: [rosterUnitRef("Bladeguard Veteran Squad", "generic-bladeguard")],
  });
  assert.equal(genericBladeguardValidation.points.total, 80);

  const bloodAngelsBladeguardValidation = validateRoster({
    id: "blood-angels-bladeguard",
    name: "Blood Angels Bladeguard",
    factionKeywordId: factionNamed("Blood Angels").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [detachmentNamed("Liberator Assault Group").id],
    units: [rosterUnitRef("Bladeguard Veteran Squad", "blood-angels-bladeguard")],
  });
  assert.equal(bloodAngelsBladeguardValidation.points.total, 85);

  const bladeguard = datasheetNamed("Bladeguard Veteran Squad");
  const genericBladeguardComposition = (realCatalog.compositionsByDatasheetId.get(bladeguard.id) || [])
    .find((composition) => !(realCatalog.requiredFactionKeywordsByCompositionId.get(composition.id) || []).length);
  assert.ok(genericBladeguardComposition, "Expected generic Bladeguard composition");
  const savedGenericBloodAngelsValidation = validateRoster({
    id: "saved-generic-blood-angels-bladeguard",
    name: "Saved Generic Blood Angels Bladeguard",
    factionKeywordId: factionNamed("Blood Angels").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [detachmentNamed("Liberator Assault Group").id],
    units: [{
      ...rosterUnitRef("Bladeguard Veteran Squad", "saved-generic-blood-angels-bladeguard"),
      compositionId: genericBladeguardComposition.id,
    }],
  });
  assert.equal(savedGenericBloodAngelsValidation.points.total, 85);

  const assaultJumpPack = datasheetNamed("Assault Intercessors with Jump Packs");
  const genericLargeAssaultJumpPackComposition = (realCatalog.compositionsByDatasheetId.get(assaultJumpPack.id) || [])
    .find((composition) => (
      !composition.isDefault
      && !(realCatalog.requiredFactionKeywordsByCompositionId.get(composition.id) || []).length
      && !(realCatalog.requiredDetachmentsByCompositionId.get(composition.id) || []).length
      && composition.displayOrder === 2
    ));
  assert.ok(genericLargeAssaultJumpPackComposition, "Expected generic large Assault Intercessors with Jump Packs composition");
  assert.equal(genericLargeAssaultJumpPackComposition.points, 160);
  const savedGenericLargeBloodAngelsValidation = validateRoster({
    id: "saved-generic-large-blood-angels-assault-jump-pack",
    name: "Saved Generic Large Blood Angels Assault Intercessors with Jump Packs",
    factionKeywordId: factionNamed("Blood Angels").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [detachmentNamed("Liberator Assault Group").id],
    units: [{
      ...rosterUnitRef("Assault Intercessors with Jump Packs", "saved-generic-large-blood-angels-assault-jump-pack"),
      compositionId: genericLargeAssaultJumpPackComposition.id,
    }],
  });
  assert.equal(savedGenericLargeBloodAngelsValidation.points.total, 180);

  const bloodAngelsAssaultJumpPackOptions = availableCompositions(
    assaultJumpPack.id,
    factionScope(factionNamed("Blood Angels").id),
    [detachmentNamed("Liberator Assault Group").id]
  );
  assert.deepEqual(
    bloodAngelsAssaultJumpPackOptions.map((composition) => composition.points),
    [95, 180]
  );
  assert.ok(bloodAngelsAssaultJumpPackOptions.every((composition) => (
    realCatalog.requiredFactionKeywordsByCompositionId.get(composition.id) || []
  ).some((row) => row.factionKeywordId === factionNamed("Blood Angels").id)));
});

test("validateRoster enforces duplicate datasheet limits for non-Battleline and Epic Heroes", () => {
  state.catalog = realCatalog;
  const rosterBase = {
    factionKeywordId: factionNamed("Adeptus Astartes").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [detachmentNamed("Gladius Task Force").id],
  };

  const captainValidation = validateRoster({
    ...rosterBase,
    id: "captain-duplicates",
    name: "Captain Duplicates",
    units: [0, 1, 2, 3].map((index) => enhancementTargetUnit({
      id: `captain-${index}`,
      datasheetName: "Captain",
      miniatureName: "Captain",
      factionNames: ["Adeptus Astartes"],
      isWarlord: index === 0,
    })),
  });
  assert.ok(messageCodes(captainValidation.messages).includes("roster.unit_limit_exceeded"));

  const guillimanValidation = validateRoster({
    ...rosterBase,
    id: "epic-duplicates",
    name: "Epic Duplicates",
    units: [0, 1].map((index) => enhancementTargetUnit({
      id: `guilliman-${index}`,
      datasheetName: "Roboute Guilliman",
      miniatureName: "Roboute Guilliman",
      factionNames: ["Adeptus Astartes", "Ultramarines"],
      isWarlord: index === 0,
    })),
  });
  assert.ok(messageCodes(guillimanValidation.messages).includes("roster.unit_limit_exceeded"));

  const houndpackBase = {
    factionKeywordId: factionNamed("Chaos Knights").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [detachmentNamed("Houndpack Lance").id],
  };
  const battlelineWarDogValidation = validateRoster({
    ...houndpackBase,
    id: "battleline-war-dog-duplicates",
    name: "Battleline War Dog Duplicates",
    units: [0, 1, 2, 3].map((index) => rosterUnitRef("War Dog Brigand", `war-dog-brigand-${index}`)),
  });
  assert.ok(!messageCodes(battlelineWarDogValidation.messages).includes("roster.unit_limit_exceeded"));

  const tooManyBattlelineWarDogsValidation = validateRoster({
    ...houndpackBase,
    id: "too-many-battleline-war-dog-duplicates",
    name: "Too Many Battleline War Dog Duplicates",
    units: [0, 1, 2, 3, 4, 5, 6].map((index) => rosterUnitRef("War Dog Brigand", `too-many-war-dog-brigand-${index}`)),
  });
  assert.ok(messageCodes(tooManyBattlelineWarDogsValidation.messages).includes("roster.unit_limit_exceeded"));
});

test("keyword restriction groups are inherited through roster faction parent scope", () => {
  const catalog = {
    factionKeywordById: new Map([
      ["child-faction", { id: "child-faction", name: "Child", parentFactionKeywordId: "parent-faction" }],
      ["parent-faction", { id: "parent-faction", name: "Parent", parentFactionKeywordId: "" }],
    ]),
    keywordById: new Map([["restricted-keyword", { id: "restricted-keyword", name: "Restricted" }]]),
    keywordRestrictionGroupsByFactionId: new Map([
      ["parent-faction", [{
        id: "parent-group",
        factionKeywordId: "parent-faction",
        limit: 0,
        excludedFactionKeywordId: "",
        requiresWarlordMiniatureId: "",
      }]],
    ]),
    keywordRestrictionGroups: [],
    keywordRestrictionGroupKeywordsByGroupId: new Map([
      ["parent-group", [{ keywordId: "restricted-keyword" }]],
    ]),
    restrictionGroupDetachmentLimitsByDetachmentId: new Map(),
  };
  withCatalog(catalog, () => {
    const messages = [];
    validateKeywordRestrictions({ factionKeywordId: "child-faction" }, [], [{
      id: "restricted-unit",
      name: "Restricted Unit",
      keywordIds: ["restricted-keyword"],
      factionKeywordIds: ["child-faction"],
      warlordMiniatureIds: [],
    }], messages);
    assert.ok(messageCodes(messages).includes("keyword_restriction_group.limit_zero"));
  });
});
