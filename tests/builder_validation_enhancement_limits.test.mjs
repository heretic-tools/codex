import {
  assert,
  test,
  state,
  costForDetachment,
  defaultMiniatures,
  defaultWargear,
  factionScope,
  validateAllegianceAbilities,
  validateAlliedUnits,
  validateAttachedUnits,
  validateEnhancements,
  validateDetachmentDatasheets,
  validateDetachmentUniqueKeywords,
  validateKeywordRestrictions,
  validateSuccessorChapterEpicHeroes,
  validateUnitCompositions,
  unitSummary,
  validateRoster,
  validateWargearLoadouts,
  validateWarlord,
  realCatalog,
  withCatalog,
  messageCodes,
  rowNamed,
  factionNamed,
  battleSizeNamed,
  detachmentNamed,
  keywordNamed,
  miniatureNamed,
  datasheetNamed,
  combatPatrolDatasheetNamed,
  rosterUnitRef,
  rosterUnitFromDatasheetId,
  enhancementNamed,
  miniatureNamedForDatasheet,
  datasheetNamedForAlly,
  keywordIdsForDatasheet,
  alliedFactionWithParent,
  alliedFactionForRosterAndParent,
  alliedUnit,
  alliedUnitWarlord,
  allegianceGroup,
  allegianceAbility,
  allegianceAbilityWithRequiredWargear,
  allegianceUnit,
  defaultCompositionForDatasheet,
  defaultWargearUnit,
  miniatureInUnit,
  optionIdForMiniatureItem,
  setMiniatureWargear,
  enhancementTargetUnit,
  withMiniatureEnhancement,
  datasheetIdForEnhancementBodyguard,
  ENHANCEMENT_FLAG_SIZE_ID,
  countBy,
  outsideFactionId,
  outsideDatasheetId,
  catalogWithOnlyEnhancementRequiredGroup,
  enhancementRequiredGroupFixture,
  validateEnhancementRequiredGroup,
  catalogWithOnlyEnhancementExcludedKeyword,
  catalogWithOnlyEnhancementRequiredWargear,
  catalogWithOnlyEnhancementBodyguardGroup,
  enhancementFixture,
  validateEnhancementExcludedKeyword,
  optionForWargearItem,
  validateEnhancementRequiredWargear,
  bodyguardFixture,
  validateEnhancementBodyguardGroup,
  catalogWithOnlyEnhancementFlags,
  correctTargetKindForEnhancement,
  enhancementFlagUnit,
  validateEnhancementFlagRows,
} from "./builder_validation_enhancements_helpers.mjs";

test("enhancement roster, duplicate, and per-unit limits use official battle-size caps", () => {
  state.catalog = realCatalog;
  const roster = {
    factionKeywordId: factionNamed("Chaos Knights").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
  };
  const lordsOfDread = detachmentNamed("Lords of Dread");
  const names = [
    "Throne Mechanicum of Skulls",
    "Blade of Celerity",
    "Putrid Carapace",
    "Warp-borne Stalker",
    "Mirror of Fates",
  ];
  const units = names.map((name, index) => withMiniatureEnhancement(
    enhancementTargetUnit({
      id: `knight-${index}`,
      datasheetName: "Knight Desecrator",
      miniatureName: "Knight Desecrator",
      factionNames: ["Chaos Knights"],
    }),
    enhancementNamed(name, "Lords of Dread")
  ));

  const rosterLimitMessages = [];
  validateEnhancements(roster, [lordsOfDread], units, rosterLimitMessages);
  assert.ok(messageCodes(rosterLimitMessages).includes("enhancement.roster_has_too_many_enhancements"));

  const duplicateMessages = [];
  validateEnhancements(roster, [lordsOfDread], [
    withMiniatureEnhancement(
      enhancementTargetUnit({
        id: "duplicate-knight-1",
        datasheetName: "Knight Desecrator",
        miniatureName: "Knight Desecrator",
        factionNames: ["Chaos Knights"],
      }),
      enhancementNamed("Throne Mechanicum of Skulls", "Lords of Dread")
    ),
    withMiniatureEnhancement(
      enhancementTargetUnit({
        id: "duplicate-knight-2",
        datasheetName: "Knight Desecrator",
        miniatureName: "Knight Desecrator",
        factionNames: ["Chaos Knights"],
      }),
      enhancementNamed("Throne Mechanicum of Skulls", "Lords of Dread")
    ),
  ], duplicateMessages);
  assert.ok(messageCodes(duplicateMessages).includes("enhancement.models_have_same_enhancements"));

  const unitLimitMessages = [];
  const overloadedUnit = enhancementTargetUnit({
    id: "overloaded-knight",
    datasheetName: "Knight Desecrator",
    miniatureName: "Knight Desecrator",
    factionNames: ["Chaos Knights"],
  });
  overloadedUnit.miniatureEnhancements = [
    { id: enhancementNamed("Throne Mechanicum of Skulls", "Lords of Dread").id, targetId: overloadedUnit.miniatures[0].rosterUnitMiniatureId },
    { id: enhancementNamed("Blade of Celerity", "Lords of Dread").id, targetId: overloadedUnit.miniatures[0].rosterUnitMiniatureId },
  ];
  validateEnhancements(roster, [lordsOfDread], [overloadedUnit], unitLimitMessages);
  assert.ok(messageCodes(unitLimitMessages).includes("enhancement.unit_has_too_many_enhancements"));
});

test("upgrade enhancements are unit-level options with their own required groups", () => {
  state.catalog = realCatalog;
  const detachment = detachmentNamed("Abhuman Auxiliaries");
  const roster = {
    factionKeywordId: factionNamed("Astra Militarum").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
  };
  const sharpEyes = enhancementNamed("Sharp Eyes (Upgrade)", "Abhuman Auxiliaries");

  assert.equal(sharpEyes.enhancementType, "upgrade");
  assert.equal(sharpEyes.isEquipableByNonCharacterUnit, true);

  const ratlings = {
    ...rosterUnitFromDatasheetId(datasheetNamed("Ratlings").id, "ratlings-upgrade"),
    unitEnhancements: [sharpEyes],
  };
  const validMessages = [];
  validateEnhancements(roster, [detachment], [ratlings], validMessages);
  assert.ok(!messageCodes(validMessages).includes("enhancement.unit_does_not_have_required_keywords"));
  assert.ok(!messageCodes(validMessages).includes("enhancement.model_does_not_have_required_keywords"));
  assert.equal(unitSummary({ ...roster, detachmentIds: [detachment.id] }, ratlings).unitEnhancements[0].points, 10);

  const shockTroops = {
    ...rosterUnitFromDatasheetId(datasheetNamed("Cadian Shock Troops").id, "shock-troops-upgrade"),
    unitEnhancements: [sharpEyes],
  };
  const invalidMessages = [];
  validateEnhancements(roster, [detachment], [shockTroops], invalidMessages);
  assert.ok(messageCodes(invalidMessages).includes("enhancement.model_does_not_have_required_keywords"));

  const duplicateMessages = [];
  validateEnhancements(roster, [detachment], [0, 1, 2, 3].map((index) => ({
    ...rosterUnitFromDatasheetId(datasheetNamed("Ratlings").id, `ratlings-upgrade-${index}`),
    unitEnhancements: [sharpEyes],
  })), duplicateMessages);
  assert.ok(messageCodes(duplicateMessages).includes("enhancement.models_have_same_enhancements"));
  assert.ok(!messageCodes(duplicateMessages).includes("enhancement.roster_has_too_many_enhancements"));
});

test("Combat Patrol enhancements enforce the configured default and reject alternatives", () => {
  state.catalog = realCatalog;
  const roster = {
    factionKeywordId: factionNamed("Adeptus Mechanicus").id,
    battleSizeId: battleSizeNamed("Incursion").id,
  };
  const purgeCorps = detachmentNamed("Purge Corps Deltic-9");
  const defaultEnhancement = enhancementNamed("Empowered Mechanisms", "Purge Corps Deltic-9");
  const alternateEnhancement = enhancementNamed("Miniaturised Autosimulacra", "Purge Corps Deltic-9");

  const requiredMessages = [];
  validateEnhancements(roster, [purgeCorps], [], requiredMessages);
  assert.ok(messageCodes(requiredMessages).includes("enhancement.combat_patrol_required"));

  const duplicateMessages = [];
  validateEnhancements(roster, [purgeCorps], [
    withMiniatureEnhancement(
      enhancementTargetUnit({
        id: "cp-captain-1",
        datasheetName: "Captain",
        miniatureName: "Captain",
        factionNames: ["Adeptus Astartes"],
      }),
      defaultEnhancement
    ),
    withMiniatureEnhancement(
      enhancementTargetUnit({
        id: "cp-captain-2",
        datasheetName: "Captain",
        miniatureName: "Captain",
        factionNames: ["Adeptus Astartes"],
      }),
      defaultEnhancement
    ),
  ], duplicateMessages);
  assert.ok(messageCodes(duplicateMessages).includes("enhancement.combat_patrol_multiple_selected"));

  const alternateMessages = [];
  validateEnhancements(roster, [purgeCorps], [
    withMiniatureEnhancement(
      enhancementTargetUnit({
        id: "cp-captain-alt",
        datasheetName: "Captain",
        miniatureName: "Captain",
        factionNames: ["Adeptus Astartes"],
      }),
      alternateEnhancement
    ),
  ], alternateMessages);
  assert.ok(messageCodes(alternateMessages).includes("enhancement.combat_patrol_not_allowed"));
});

test("all live Combat Patrol enhancement defaults require exactly one default and reject alternatives", () => {
  state.catalog = realCatalog;
  const combatPatrolDetachments = realCatalog.detachments.filter((detachment) => detachment.isCombatPatrol);
  let requiredRows = 0;
  let duplicateRows = 0;
  let alternateRows = 0;

  assert.equal(combatPatrolDetachments.length, 24);
  assert.equal(realCatalog.enhancements.filter((enhancement) => (
    realCatalog.detachmentById.get(enhancement.detachmentId)?.isCombatPatrol
  )).length, 48);
  assert.equal(realCatalog.enhancements.filter((enhancement) => enhancement.isCombatPatrolDefault).length, 24);

  for (const detachment of combatPatrolDetachments) {
    const enhancements = realCatalog.enhancements.filter((enhancement) => enhancement.detachmentId === detachment.id);
    const defaults = enhancements.filter((enhancement) => enhancement.isCombatPatrolDefault);
    const alternatives = enhancements.filter((enhancement) => !enhancement.isCombatPatrolDefault);
    assert.equal(defaults.length, 1, `${detachment.name} should have exactly one Combat Patrol default enhancement`);
    assert.equal(alternatives.length, 1, `${detachment.name} should have exactly one Combat Patrol alternate enhancement`);
    const [defaultEnhancement] = defaults;
    const [alternateEnhancement] = alternatives;
    assert.equal(defaultEnhancement.enhancementType, "miniature");
    assert.equal(alternateEnhancement.enhancementType, "miniature");

    const roster = {
      factionKeywordId: realCatalog.detachmentFactionKeywords.find((row) => row.detachmentId === detachment.id)?.factionKeywordId,
      battleSizeId: battleSizeNamed("Incursion").id,
    };
    assert.ok(roster.factionKeywordId, `${detachment.name} should have a roster faction`);

    const requiredMessages = [];
    validateEnhancements(roster, [detachment], [], requiredMessages);
    assert.ok(
      messageCodes(requiredMessages).includes("enhancement.combat_patrol_required"),
      `${detachment.name} should require ${defaultEnhancement.name}`
    );
    requiredRows += 1;

    const duplicateMessages = [];
    validateEnhancements(roster, [detachment], [0, 1].map((index) => (
      withMiniatureEnhancement(
        enhancementTargetUnit({
          id: `${detachment.id}:default:${index}`,
          datasheetName: "Captain",
          miniatureName: "Captain",
          factionNames: ["Adeptus Astartes"],
        }),
        defaultEnhancement
      )
    )), duplicateMessages);
    assert.ok(
      messageCodes(duplicateMessages).includes("enhancement.combat_patrol_multiple_selected"),
      `${detachment.name} should reject duplicate ${defaultEnhancement.name}`
    );
    duplicateRows += 1;

    const alternateMessages = [];
    validateEnhancements(roster, [detachment], [
      withMiniatureEnhancement(
        enhancementTargetUnit({
          id: `${detachment.id}:alternate`,
          datasheetName: "Captain",
          miniatureName: "Captain",
          factionNames: ["Adeptus Astartes"],
        }),
        alternateEnhancement
      ),
    ], alternateMessages);
    assert.ok(
      messageCodes(alternateMessages).includes("enhancement.combat_patrol_not_allowed"),
      `${detachment.name} should reject alternate ${alternateEnhancement.name}`
    );
    alternateRows += 1;
  }

  assert.equal(requiredRows, 24);
  assert.equal(duplicateRows, 24);
  assert.equal(alternateRows, 24);
});
