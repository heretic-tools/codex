import assert from "node:assert/strict";
import test from "node:test";
import {
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
  datasheetIdForEnhancementBodyguard
} from "./builder_validation_helpers.mjs";

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
    { ...enhancementNamed("Throne Mechanicum of Skulls", "Lords of Dread"), targetId: overloadedUnit.miniatures[0].rosterUnitMiniatureId },
    { ...enhancementNamed("Blade of Celerity", "Lords of Dread"), targetId: overloadedUnit.miniatures[0].rosterUnitMiniatureId },
  ];
  validateEnhancements(roster, [lordsOfDread], [overloadedUnit], unitLimitMessages);
  assert.ok(messageCodes(unitLimitMessages).includes("enhancement.unit_has_too_many_enhancements"));
});

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

  const nonCharacterMessages = [];
  validateEnhancements(
    {
      factionKeywordId: factionNamed("Adeptus Astartes").id,
      battleSizeId: battleSizeNamed("Strike Force").id,
    },
    [detachmentNamed("Librarius Conclave")],
    [withMiniatureEnhancement(
      enhancementTargetUnit({
        id: "intercessor-enhancement",
        datasheetName: "Intercessor Squad",
        miniatureName: "Intercessor Sergeant",
        factionNames: ["Adeptus Astartes"],
      }),
      fusillade
    )],
    nonCharacterMessages
  );
  assert.ok(messageCodes(nonCharacterMessages).includes("enhancement.unit_does_not_have_required_keywords"));
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

  const extraEnhancement = {
    id: "attached-extra-enhancement",
    name: "Attached Extra Enhancement",
    enhancementType: "unit",
    isIncludedInEnhancementLimit: false,
    isEquipableByEpicHero: true,
    isEquipableByNonCharacterUnit: true,
  };
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
    { ...bodyguard, unitEnhancements: [extraEnhancement] },
  ], attachedLimitMessages);
  assert.ok(messageCodes(attachedLimitMessages).includes("enhancement.attached_unit_too_many_enhancements"));
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
