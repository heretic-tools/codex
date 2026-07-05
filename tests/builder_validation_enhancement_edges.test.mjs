import {
  assert,
  test,
  state,
  costForDetachment,
  defaultMiniatures,
  defaultWargear,
  factionScope,
  enhancementCandidateStatus,
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

function miniatureKeywordIdsFor(miniature) {
  return (realCatalog.miniatureKeywordsByMiniatureId.get(miniature.miniatureId) || [])
    .map((row) => row.keywordId);
}

test("enhancements enforce required keywords, excluded keywords, and required wargear", () => {
  state.catalog = realCatalog;

  const detachmentMessages = [];
  validateEnhancements(
    {
      factionKeywordId: factionNamed("Adeptus Astartes").id,
      battleSizeId: battleSizeNamed("Strike Force").id,
    },
    [],
    [withMiniatureEnhancement(
      enhancementTargetUnit({
        id: "librarian-without-detachment",
        datasheetName: "Librarian",
        miniatureName: "Librarian",
        factionNames: ["Adeptus Astartes"],
      }),
      enhancementNamed("Fusillade", "Librarius Conclave")
    )],
    detachmentMessages
  );
  assert.ok(messageCodes(detachmentMessages).includes("enhancement.required_detachment_missing"));

  const captainMessages = [];
  validateEnhancements(
    {
      factionKeywordId: factionNamed("Adeptus Astartes").id,
      battleSizeId: battleSizeNamed("Strike Force").id,
    },
    [detachmentNamed("Librarius Conclave")],
    [withMiniatureEnhancement(
      enhancementTargetUnit({
        id: "captain-with-fusillade",
        datasheetName: "Captain",
        miniatureName: "Captain",
        factionNames: ["Adeptus Astartes"],
      }),
      enhancementNamed("Fusillade", "Librarius Conclave")
    )],
    captainMessages
  );
  assert.ok(messageCodes(captainMessages).includes("enhancement.model_does_not_have_required_keywords"));

  const jumpPackMessages = [];
  validateEnhancements(
    {
      factionKeywordId: factionNamed("Heretic Astartes").id,
      battleSizeId: battleSizeNamed("Strike Force").id,
    },
    [detachmentNamed("Fellhammer Siege-host")],
    [withMiniatureEnhancement(
      enhancementTargetUnit({
        id: "jump-pack-lord",
        datasheetName: "Chaos Lord with Jump Pack",
        miniatureName: "Chaos Lord with Jump Pack",
        factionNames: ["Heretic Astartes"],
      }),
      enhancementNamed("Bastion Plate", "Fellhammer Siege-host")
    )],
    jumpPackMessages
  );
  assert.ok(messageCodes(jumpPackMessages).includes("enhancement.model_must_not_have_excluded_keywords"));

  const wargearMessages = [];
  validateEnhancements(
    {
      factionKeywordId: factionNamed("Leagues of Votann").id,
      battleSizeId: battleSizeNamed("Strike Force").id,
    },
    [detachmentNamed("Needgaârd Oathband")],
    [withMiniatureEnhancement(
      enhancementTargetUnit({
        id: "kahl-without-combi-bolter",
        datasheetName: "Kâhl",
        miniatureName: "Kâhl",
        factionNames: ["Leagues of Votann"],
      }),
      enhancementNamed("Iron Ambassador", "Needgaârd Oathband")
    )],
    wargearMessages
  );
  assert.ok(messageCodes(wargearMessages).includes("enhancement.model_does_not_have_required_wargear"));
});

test("model enhancements use conditional keywords selected through allegiance abilities", () => {
  state.catalog = realCatalog;
  const detachment = detachmentNamed("Headhunter Task Force");
  const group = allegianceGroup("Headhunter Task Force Keywords", "Headhunter Task Force", ["Character"]);
  const characterAbility = allegianceAbility(group.id, "Character");
  const unit = defaultWargearUnit("Vindicator");
  unit.allegianceAbilities = [characterAbility];
  unit.miniatureEnhancements = [{
    ...enhancementNamed("Gunnery Honours", "Headhunter Task Force"),
    targetId: unit.miniatures[0].rosterUnitMiniatureId,
  }];

  const validation = validateRoster({
    id: "headhunter-vindicator-character",
    name: "Headhunter Vindicator Character",
    factionKeywordId: factionNamed("Adeptus Astartes").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [detachment.id],
    units: [unit],
  });
  const codes = messageCodes(validation.messages);
  assert.ok(!codes.includes("enhancement.unit_does_not_have_required_keywords"));
});

test("model enhancements use conditional keywords selected through roster faction scope", () => {
  state.catalog = realCatalog;
  const detachment = detachmentNamed("Inner Circle Task Force");
  const enhancement = enhancementNamed("Champion of the Deathwing", "Inner Circle Task Force");
  const baseUnit = withMiniatureEnhancement(
    enhancementTargetUnit({
      id: "terminator-captain-deathwing",
      datasheetName: "Captain in Terminator Armour",
      miniatureName: "Captain in Terminator Armour",
      factionNames: ["Adeptus Astartes"],
    }),
    enhancement
  );
  const genericRoster = {
    factionKeywordId: factionNamed("Adeptus Astartes").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    detachmentIds: [detachment.id],
  };
  const darkAngelsRoster = {
    ...genericRoster,
    factionKeywordId: factionNamed("Dark Angels").id,
  };

  const genericMessages = [];
  validateEnhancements(
    genericRoster,
    [detachment],
    [unitSummary(genericRoster, baseUnit)],
    genericMessages
  );
  assert.ok(messageCodes(genericMessages).includes("enhancement.model_does_not_have_required_keywords"));

  const darkAngelsMessages = [];
  validateEnhancements(
    darkAngelsRoster,
    [detachment],
    [unitSummary(darkAngelsRoster, baseUnit)],
    darkAngelsMessages
  );
  assert.ok(!messageCodes(darkAngelsMessages).includes("enhancement.model_does_not_have_required_keywords"));
});

test("enhancements validate target type, zero models, allied units, excluded models, Epic Heroes, and non-Characters", () => {
  state.catalog = realCatalog;
  const fusillade = enhancementNamed("Fusillade", "Librarius Conclave");
  const alacritousAssault = enhancementNamed("Alacritous Assault", "Eldritch Raiders");

  const targetTypeUnit = enhancementTargetUnit({
    id: "farseer-unit-enhancement-on-model",
    datasheetName: "Farseer",
    miniatureName: "Farseer",
    factionNames: ["Asuryani"],
  });
  targetTypeUnit.miniatureEnhancements = [{
    ...alacritousAssault,
    targetId: targetTypeUnit.miniatures[0].rosterUnitMiniatureId,
  }];
  const targetTypeMessages = [];
  validateEnhancements(
    {
      factionKeywordId: factionNamed("Asuryani").id,
      battleSizeId: battleSizeNamed("Strike Force").id,
    },
    [detachmentNamed("Eldritch Raiders")],
    [targetTypeUnit],
    targetTypeMessages
  );
  assert.ok(messageCodes(targetTypeMessages).includes("enhancement.target_type_invalid"));

  const zeroCountUnit = withMiniatureEnhancement(
    enhancementTargetUnit({
      id: "zero-count-captain",
      datasheetName: "Captain",
      miniatureName: "Captain",
      factionNames: ["Adeptus Astartes"],
    }),
    fusillade
  );
  zeroCountUnit.miniatures[0].count = 0;
  const zeroCountMessages = [];
  validateEnhancements(
    {
      factionKeywordId: factionNamed("Adeptus Astartes").id,
      battleSizeId: battleSizeNamed("Strike Force").id,
    },
    [detachmentNamed("Librarius Conclave")],
    [zeroCountUnit],
    zeroCountMessages
  );
  assert.ok(messageCodes(zeroCountMessages).includes("enhancement.model_count_zero"));

  const daemonAllyType = alliedFactionWithParent("Legiones Daemonica");
  const alliedUnitWithEnhancement = {
    ...alliedUnit({ id: "bloodletters-enhanced", datasheetName: "Bloodletters", allyType: daemonAllyType, points: 100 }),
    unitEnhancements: [alacritousAssault],
  };
  const alliedMessages = [];
  validateEnhancements(
    {
      factionKeywordId: factionNamed("Heretic Astartes").id,
      battleSizeId: battleSizeNamed("Strike Force").id,
    },
    [detachmentNamed("Eldritch Raiders")],
    [alliedUnitWithEnhancement],
    alliedMessages
  );
  assert.ok(messageCodes(alliedMessages).includes("enhancement.allied_unit_not_allowed"));

  const excludedModelMessages = [];
  validateEnhancements(
    {
      factionKeywordId: factionNamed("Astra Militarum").id,
      battleSizeId: battleSizeNamed("Strike Force").id,
    },
    [detachmentNamed("Librarius Conclave")],
    [withMiniatureEnhancement(
      enhancementTargetUnit({
        id: "ogryn-enhancement",
        datasheetName: "Ogryn Bodyguard",
        miniatureName: "Ogryn Bodyguard",
        factionNames: ["Astra Militarum"],
      }),
      fusillade
    )],
    excludedModelMessages
  );
  assert.ok(messageCodes(excludedModelMessages).includes("enhancement.model_excluded"));

  const epicHeroMessages = [];
  validateEnhancements(
    {
      factionKeywordId: factionNamed("Adeptus Astartes").id,
      battleSizeId: battleSizeNamed("Strike Force").id,
    },
    [detachmentNamed("Librarius Conclave")],
    [withMiniatureEnhancement(
      enhancementTargetUnit({
        id: "guilliman-enhancement",
        datasheetName: "Roboute Guilliman",
        miniatureName: "Roboute Guilliman",
        factionNames: ["Adeptus Astartes", "Ultramarines"],
      }),
      fusillade
    )],
    epicHeroMessages
  );
  assert.ok(messageCodes(epicHeroMessages).includes("enhancement.epic_hero_not_allowed"));

  const nonCharacterUnit = withMiniatureEnhancement(
    enhancementTargetUnit({
      id: "intercessor-enhancement",
      datasheetName: "Intercessor Squad",
      miniatureName: "Intercessor Sergeant",
      factionNames: ["Adeptus Astartes"],
    }),
    fusillade
  );
  const nonCharacterMessages = [];
  validateEnhancements(
    {
      factionKeywordId: factionNamed("Adeptus Astartes").id,
      battleSizeId: battleSizeNamed("Strike Force").id,
    },
    [detachmentNamed("Librarius Conclave")],
    [nonCharacterUnit],
    nonCharacterMessages
  );
  assert.ok(messageCodes(nonCharacterMessages).includes("enhancement.unit_does_not_have_required_keywords"));
  assert.deepEqual(
    nonCharacterMessages.find((message) => message.code === "enhancement.unit_does_not_have_required_keywords")?.scope?.targetId,
    nonCharacterUnit.miniatures[0].rosterUnitMiniatureId
  );
});

test("enhancement candidate status mirrors target-level eligibility", () => {
  state.catalog = realCatalog;
  const roster = {
    factionKeywordId: factionNamed("Adeptus Astartes").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
  };
  const detachment = detachmentNamed("Librarius Conclave");
  const fusillade = enhancementNamed("Fusillade", "Librarius Conclave");
  const librarian = enhancementTargetUnit({
    id: "librarian-candidate",
    datasheetName: "Librarian",
    miniatureName: "Librarian",
    factionNames: ["Adeptus Astartes"],
  });
  const librarianMiniature = librarian.miniatures[0];
  assert.deepEqual(
    enhancementCandidateStatus({
      roster,
      detachments: [detachment],
      units: [librarian],
      unit: librarian,
      enhancement: fusillade,
      keywordIds: miniatureKeywordIdsFor(librarianMiniature),
      miniature: librarianMiniature,
      targetKind: "miniature",
    }),
    { eligible: true, reason: "" }
  );

  const guilliman = enhancementTargetUnit({
    id: "guilliman-candidate",
    datasheetName: "Roboute Guilliman",
    miniatureName: "Roboute Guilliman",
    factionNames: ["Adeptus Astartes", "Ultramarines"],
  });
  const guillimanMiniature = guilliman.miniatures[0];
  assert.equal(
    enhancementCandidateStatus({
      roster,
      detachments: [detachment],
      units: [guilliman],
      unit: guilliman,
      enhancement: fusillade,
      keywordIds: miniatureKeywordIdsFor(guillimanMiniature),
      miniature: guillimanMiniature,
      targetKind: "miniature",
    }).reason,
    "Epic Hero not allowed"
  );

  const intercessor = enhancementTargetUnit({
    id: "intercessor-candidate",
    datasheetName: "Intercessor Squad",
    miniatureName: "Intercessor Sergeant",
    factionNames: ["Adeptus Astartes"],
  });
  const intercessorMiniature = intercessor.miniatures[0];
  assert.equal(
    enhancementCandidateStatus({
      roster,
      detachments: [detachment],
      units: [intercessor],
      unit: intercessor,
      enhancement: fusillade,
      keywordIds: miniatureKeywordIdsFor(intercessorMiniature),
      miniature: intercessorMiniature,
      targetKind: "miniature",
    }).reason,
    "Character required"
  );
});

test("enhancement attached bodyguard requirements are validated against attachment groups", () => {
  state.catalog = realCatalog;
  const roster = {
    factionKeywordId: factionNamed("World Eaters").id,
    battleSizeId: battleSizeNamed("Strike Force").id,
    attachments: [],
  };
  const khorneDaemonkin = detachmentNamed("Khorne Daemonkin");
  const disciple = enhancementNamed("Disciple of Khorne", "Khorne Daemonkin");
  const leader = withMiniatureEnhancement(
    enhancementTargetUnit({
      id: "juggernaut-lord",
      datasheetName: "Lord on Juggernaut",
      miniatureName: "World Eaters Lord on Juggernaut",
      factionNames: ["World Eaters"],
    }),
    disciple
  );
  const bodyguard = enhancementTargetUnit({
    id: "flesh-hounds",
    datasheetName: "Flesh Hounds",
    miniatureName: "Flesh Hound",
    factionNames: ["Legiones Daemonica"],
  });
  bodyguard.datasheetId = datasheetIdForEnhancementBodyguard(disciple, "Flesh Hounds");

  const missingMessages = [];
  validateEnhancements(roster, [khorneDaemonkin], [leader, bodyguard], missingMessages);
  assert.ok(messageCodes(missingMessages).includes("enhancement.attached_requirement_missing"));

  const attachedMessages = [];
  validateEnhancements({
    ...roster,
    attachments: [{
      id: "khorne-pack",
      members: [
        { rosterUnitId: leader.id, attachmentType: "leader" },
        { rosterUnitId: bodyguard.id, attachmentType: "bodyguard" },
      ],
    }],
  }, [khorneDaemonkin], [leader, bodyguard], attachedMessages);
  assert.ok(!messageCodes(attachedMessages).includes("enhancement.attached_requirement_missing"));

  const extraEnhancement = enhancementNamed("Sharp Eyes (Upgrade)", "Abhuman Auxiliaries");
  const attachedLimitMessages = [];
  validateEnhancements({
    ...roster,
    attachments: [{
      id: "overloaded-pack",
      members: [
        { rosterUnitId: leader.id, attachmentType: "leader" },
        { rosterUnitId: bodyguard.id, attachmentType: "bodyguard" },
      ],
    }],
  }, [khorneDaemonkin], [
    leader,
    { ...bodyguard, unitEnhancements: [{ id: extraEnhancement.id }] },
  ], attachedLimitMessages);
  assert.ok(messageCodes(attachedLimitMessages).includes("enhancement.attached_unit_too_many_enhancements"));
  assert.equal(
    attachedLimitMessages.find((message) => message.code === "enhancement.attached_unit_too_many_enhancements")?.scope?.attachmentId,
    "overloaded-pack"
  );
});

test("cannotBeWarlord miniature enhancement only blocks the enhanced warlord model", () => {
  const enhancement = {
    id: "disciple",
    name: "Disciple of Khorne",
    cannotBeWarlord: true,
    enhancementType: "miniature",
    isIncludedInEnhancementLimit: true,
    isEquipableByEpicHero: true,
    isEquipableByNonCharacterUnit: true,
  };
  const catalog = {
    battleSizeById: new Map([["strike", { enhancementLimit: 4 }]]),
    enhancementById: new Map([[enhancement.id, enhancement]]),
    enhancementRequiredKeywordGroupsByEnhancementId: new Map(),
    enhancementRequiredKeywordGroupKeywordsByGroupId: new Map(),
    enhancementRequiredKeywordGroupFactionsByGroupId: new Map(),
    enhancementExcludedKeywordsByEnhancementId: new Map(),
    enhancementRequiredWargearItemsByEnhancementId: new Map(),
    enhancementBodyguardGroupsByEnhancementId: new Map(),
    enhancementBodyguardGroupDatasheetsByGroupId: new Map(),
    enhancementBodyguardGroupKeywordsByGroupId: new Map(),
    alliedFactionById: new Map(),
    keywordById: new Map(),
    miniatureKeywordsByMiniatureId: new Map(),
    detachmentById: new Map(),
  };
  const roster = { battleSizeId: "strike", attachments: [] };
  const baseUnit = {
    id: "unit",
    name: "Two Model Unit",
    datasheetId: "datasheet",
    allyType: "native",
    isWarlord: true,
    keywordIds: [],
    unitEnhancements: [],
    miniatures: [
      { rosterUnitMiniatureId: "warlord-model", miniatureId: "warlord", count: 1, isWarlord: true, name: "Warlord Model" },
      { rosterUnitMiniatureId: "other-model", miniatureId: "other", count: 1, isWarlord: false, name: "Other Model" },
    ],
  };

  withCatalog(catalog, () => {
    const otherModelMessages = [];
    validateEnhancements(roster, [], [{
      ...baseUnit,
      miniatureEnhancements: [{ ...enhancement, targetId: "other-model" }],
    }], otherModelMessages);
    assert.ok(!messageCodes(otherModelMessages).includes("warlord.invalid_due_to_enhancement"));

    const warlordModelMessages = [];
    validateEnhancements(roster, [], [{
      ...baseUnit,
      miniatureEnhancements: [{ ...enhancement, targetId: "warlord-model" }],
    }], warlordModelMessages);
    assert.ok(messageCodes(warlordModelMessages).includes("warlord.invalid_due_to_enhancement"));
  });
});
