export const minimumParityExtendedCases = [
  {
    "id": "adeptus-astartes-successor-epic-hero-conflict",
    "file": "tests/builder_validation_factions.test.mjs",
    "anchors": [
      "successor chapter Epic Heroes conflict"
    ],
    "codes": [
      "roster.successor_chapter_epic_hero_in_roster"
    ]
  },
  {
    "id": "ynnari-devoted-of-ynnead-warlord",
    "file": "tests/builder_validation_factions.test.mjs",
    "anchors": [
      "Devoted of Ynnead requires Yvraine or the Yncarne as Warlord"
    ],
    "codes": [
      "mandatory_warlord.detachment_not_selected"
    ]
  },
  {
    "id": "live-detachment-warlord-rows",
    "file": "tests/builder_validation_warlord.test.mjs",
    "anchors": [
      "all live detachment warlord rows have valid and invalid coverage",
      "detachmentMandatoryWarlordMiniatures.length, 2",
      "detachmentGrantedWarlordMiniatures.length, 1"
    ],
    "codes": [
      "mandatory_warlord.detachment_not_selected",
      "warlord.invalid_generic"
    ]
  },
  {
    "id": "live-warlord-miniature-flag-rows",
    "file": "tests/builder_validation_warlord.test.mjs",
    "anchors": [
      "all live warlord miniature flags have valid and invalid coverage",
      "supremeCommanders.length, 17",
      "cannotBeWarlords.length, 27",
      "nonCharacterWarlords.length, 8",
      "detachmentGrantedWarlordMiniatures.length, 1",
      "supremeInvalidRows, 17",
      "supremeValidRows, 17",
      "cannotRows, 27",
      "grantedRows, 1",
      "nonCharacterRows, 8"
    ],
    "codes": [
      "mandatory_warlord.supreme_commander_not_selected",
      "warlord.invalid_generic"
    ]
  },
  {
    "id": "live-detachment-faction-cost-disposition-rows",
    "file": "tests/builder_validation_roster_catalog.test.mjs",
    "anchors": [
      "all live detachment faction, cost, and disposition rows are applied",
      "detachments.length, 290",
      "rows.length, 457",
      "detachmentFactionPointCosts.length, 4",
      "detachmentForceDispositions.length, 290",
      "forceDispositions.length, 5",
      "allowedRows, 457",
      "unavailableControlRows, 457",
      "listedRows, 433",
      "combatPatrolHiddenRows, 24",
      "overrideRows, 4",
      "baseCostRows, 453"
    ],
    "codes": [
      "roster.detachment_not_allowed"
    ]
  },
  {
    "id": "live-datasheet-faction-native-availability-rows",
    "file": "tests/builder_validation_roster_catalog.test.mjs",
    "anchors": [
      "all live datasheet faction rows drive native validation and availability",
      "rows.length, 1256",
      "datasheets.length, 1142",
      "datasheetId)).size, 1141",
      "factionKeywordId)).size, 42",
      "factionExcludedDatasheets.length, 23",
      "nativeRows, 1140",
      "descendantBlockedRows, 115",
      "excludedRows, 1",
      "combatPatrolRows, 122",
      "nativeNonCombatListedRows, 1034",
      "unavailableControlRows, 1256",
      "unavailableControlRejectedRows, 1256"
    ],
    "codes": [
      "roster.combat_patrol_datasheet",
      "roster.faction_datasheet_not_allowed",
      "roster.unit_not_native"
    ]
  },
  {
    "id": "live-battle-size-roster-limits",
    "file": "tests/builder_validation_roster_catalog.test.mjs",
    "anchors": [
      "all live battle sizes drive roster points, detachment points, duplicate, and enhancement limits",
      "battleSizes.length, 3",
      "[\"Incursion\", 1000, 2, 2, 2]",
      "[\"Strike Force\", 2000, 3, 3, 4]",
      "[\"Onslaught\", 3000, 3, 3, 4]"
    ],
    "codes": [
      "enhancement.roster_has_too_many_enhancements",
      "roster.detachment_points_limit_exceeded",
      "roster.points_limit_exceeded",
      "roster.unit_limit_exceeded"
    ]
  },
  {
    "id": "data-empty-model-helper-cache-routing",
    "file": "tests/builder_validation_roster_restrictions.test.mjs",
    "anchors": [
      "data-empty model helper edge rows keep cached roster data routable",
      "test-equivalent-specific-default",
      "test-fallback-detachment-default",
      "Allied: Allied",
      "1-2 model"
    ],
    "codes": []
  },
  {
    "id": "live-datasheet-duplicate-limit-and-max-model-rows",
    "file": "tests/builder_validation_compositions.test.mjs",
    "anchors": [
      "all live datasheet duplicate-limit and max-model rows have valid and invalid coverage",
      "datasheetIsCombatPatrol(datasheet)).length, 1035",
      "epicHeroDatasheets.length, 151",
      "battlelineDatasheets.length, 61",
      "dedicatedTransportDatasheets.length, 36",
      "sixLimitDatasheets.length, 97",
      "standardDatasheets.length, 787",
      "maxModelDatasheets.length, 8",
      "validDuplicateRows, 1035",
      "invalidDuplicateRows, 1035",
      "validMaxModelRows, 8",
      "invalidMaxModelRows, 8"
    ],
    "codes": [
      "roster.unit_limit_exceeded",
      "unit.max_model_count_too_many_models"
    ]
  },
  {
    "id": "live-unit-composition-rows",
    "file": "tests/builder_validation_compositions.test.mjs",
    "anchors": [
      "all live unit composition rows have available, unavailable, and miniature-shape coverage",
      "compositions.length, 1516",
      "miniatureRows.length, 2258",
      "requiredFactionRows.length, 51",
      "requiredDetachmentRows.length, 8",
      "availableRows, 1516",
      "factionUnavailableRows, 51",
      "detachmentUnavailableRows, 8",
      "generatedMiniatureRows, 2258",
      "minCountTotal, 4933",
      "maxCountTotal, 5759"
    ],
    "codes": []
  },
  {
    "id": "live-datasheet-points-steps",
    "file": "tests/builder_validation_compositions.test.mjs",
    "anchors": [
      "all live datasheet points steps apply from the configured duplicate position",
      "rows.length, 334",
      "stepAt || 0) === 2).length, 95",
      "stepAt || 0) === 3).length, 234",
      "stepAt || 0) === 4).length, 5",
      "beforeThresholdRows, 578",
      "appliedThresholdRows, 668",
      "appliedStepPointsTotal, 10790"
    ],
    "codes": []
  },
  {
    "id": "asuryani-ynnari-keyword-restrictions",
    "file": "tests/builder_validation_factions.test.mjs",
    "anchors": [
      "Aeldari keyword restriction groups cover Asuryani/Ynnari exclusions and Drukhari limits"
    ],
    "codes": [
      "keyword_restriction_group.limit_zero"
    ]
  },
  {
    "id": "drukhari-harlequin-character-limits",
    "file": "tests/builder_validation_factions.test.mjs",
    "anchors": [
      "Aeldari keyword restriction groups cover Asuryani/Ynnari exclusions and Drukhari limits",
      "Drukhari",
      "Death Jester",
      "death-jester-2"
    ],
    "codes": [
      "keyword_restriction_group.limit_exceeded"
    ]
  },
  {
    "id": "live-top-level-keyword-restriction-limits",
    "file": "tests/builder_validation_factions.test.mjs",
    "anchors": [
      "all live top-level keyword restriction limits have valid and invalid coverage",
      "limitedGroups.length, 15",
      "requiresWarlordMiniatureId).length, 0"
    ],
    "codes": [
      "keyword_restriction_group.limit_zero",
      "keyword_restriction_group.limit_exceeded"
    ]
  },
  {
    "id": "data-empty-warlord-gated-keyword-restriction-groups",
    "file": "tests/builder_validation_factions.test.mjs",
    "anchors": [
      "data-empty warlord-gated keyword restriction groups stay covered",
      "requiresWarlordMiniatureId).length, 0",
      "warlord-gated-keyword-restriction-limit",
      "warlord-gated-keyword-restriction-zero"
    ],
    "codes": [
      "keyword_restriction_group.limit_zero",
      "keyword_restriction_group.limit_exceeded"
    ]
  },
  {
    "id": "data-empty-keywordless-restriction-groups",
    "file": "tests/builder_validation_factions.test.mjs",
    "anchors": [
      "data-empty keyword restriction groups without keywords stay inactive",
      "empty-keyword-restriction-group",
      "empty-keyword-detachment-limit"
    ],
    "codes": []
  },
  {
    "id": "enhancement-roster-limit",
    "file": "tests/builder_validation_enhancement_limits.test.mjs",
    "anchors": [
      "enhancement roster, duplicate, and per-unit limits"
    ],
    "codes": [
      "enhancement.roster_has_too_many_enhancements"
    ]
  },
  {
    "id": "live-combat-patrol-enhancement-defaults",
    "file": "tests/builder_validation_enhancement_limits.test.mjs",
    "anchors": [
      "all live Combat Patrol enhancement defaults require exactly one default and reject alternatives",
      "combatPatrolDetachments.length, 24",
      ")).length, 48",
      "enhancement.isCombatPatrolDefault).length, 24",
      "requiredRows, 24",
      "duplicateRows, 24",
      "alternateRows, 24"
    ],
    "codes": [
      "enhancement.combat_patrol_required",
      "enhancement.combat_patrol_multiple_selected",
      "enhancement.combat_patrol_not_allowed"
    ]
  },
  {
    "id": "enhancement-required-keyword-excluded-keyword-wargear",
    "file": "tests/builder_validation_enhancement_edges.test.mjs",
    "anchors": [
      "enhancements enforce required keywords, excluded keywords, and required wargear"
    ],
    "codes": [
      "enhancement.model_does_not_have_required_keywords",
      "enhancement.model_must_not_have_excluded_keywords",
      "enhancement.model_does_not_have_required_wargear"
    ]
  },
  {
    "id": "enhancement-disciple-of-khorne-warlord-target",
    "file": "tests/builder_validation_enhancement_edges.test.mjs",
    "anchors": [
      "cannotBeWarlord miniature enhancement only blocks the enhanced warlord model"
    ],
    "codes": [
      "warlord.invalid_due_to_enhancement"
    ]
  },
  {
    "id": "attachment-valid-invalid-and-must-attach",
    "file": "tests/builder_validation_attachments.test.mjs",
    "anchors": [
      "attachment groups validate incomplete, duplicate, and invalid pairings",
      "leader-without-bodyguard",
      "support-without-bodyguard",
      "bodyguard-without-attached-model",
      "invalid-support-group",
      "duplicate-a"
    ],
    "codes": [
      "attached_unit.must_be_attached",
      "attached_unit.incomplete",
      "attached_unit.missing_requirements"
    ]
  },
  {
    "id": "live-datasheet-bodyguard-rule-table-inventory",
    "file": "tests/builder_validation_attachments.test.mjs",
    "anchors": [
      "all live datasheet bodyguard rule tables stay pinned to explicit coverage counts",
      "groups.length, 1266",
      "datasheetBodyguardGroupDatasheets.length, 1260",
      "datasheetBodyguardGroupKeywords.length, 14"
    ],
    "codes": []
  },
  {
    "id": "live-datasheet-bodyguard-groups",
    "file": "tests/builder_validation_attachments.test.mjs",
    "anchors": [
      "all live datasheet bodyguard groups accept configured bodyguards and reject invalid bodyguards",
      "groups.length, 1266"
    ],
    "codes": [
      "attached_unit.missing_requirements"
    ]
  },
  {
    "id": "live-datasheet-bodyguard-type-rows",
    "file": "tests/builder_validation_attachments.test.mjs",
    "anchors": [
      "all live datasheet bodyguard groups require their configured leader or support type",
      "groups.length, 1266",
      "bodyguardType === \"leader\").length, 1056",
      "bodyguardType === \"support\").length, 210",
      "leaderRows, 1056",
      "supportRows, 210",
      "validRows, 1266",
      "wrongTypeRows, 1266"
    ],
    "codes": [
      "attached_unit.missing_requirements"
    ]
  },
  {
    "id": "live-datasheet-bodyguard-detachment-keyword-conditions",
    "file": "tests/builder_validation_attachments.test.mjs",
    "anchors": [
      "all live datasheet bodyguard detachment and shared-keyword conditions reject missing states",
      "requiredDetachmentGroups.length, 305",
      "excludedDetachmentGroups.length, 61",
      "sharedKeywordGroups.length, 305",
      "keywordGroups.length, 6"
    ],
    "codes": [
      "attached_unit.missing_requirements"
    ]
  },
  {
    "id": "data-empty-datasheet-bodyguard-faction-gates",
    "file": "tests/builder_validation_attachments.test.mjs",
    "anchors": [
      "data-empty datasheet bodyguard faction gates stay covered",
      "datasheetBodyguardGroups.filter((group) => group.factionKeywordId).length, 0",
      "faction-gated-datasheet-bodyguard"
    ],
    "codes": [
      "attached_unit.missing_requirements"
    ]
  },
  {
    "id": "wargear-high-risk-app-parity-manifest",
    "file": "tests/builder_validation_wargear_parity_cases.test.mjs",
    "anchors": [
      "wargearParityCases.length, 25",
      "cthonian-twin-concussion-gauntlet-limit-valid",
      "cthonian-twin-concussion-gauntlet-over-limit-invalid",
      "officialConcept",
      "manifest.setupCount, 26",
      "T’au Empire / Advanced Acquisition Cadre / Pathfinder Team",
      "Orks / More Dakka! / Tankbustas",
      "manual WH app wargear UI setup doc tracks every manifest setup",
      "wargear manifest export CLI emits JSON and markdown formats"
    ],
    "codes": [
      "wargear_loadout.invalid_miniature_wargear_loadout",
      "wargear_loadout.invalid_wargear_requirement",
      "wargear_loadout.zero_count_model_wargear"
    ]
  },
  {
    "id": "wargear-high-risk-app-parity-json-export",
    "file": "HereticBuilder/tools/export_wargear_parity_manifest.mjs",
    "anchors": [
      "wargearParityManifest",
      "JSON.stringify",
      "--format",
      "markdownOutput",
      "unitWargearSummary",
      "WH app UI setups",
      "WH app state",
      "--check-results",
      "checkResults",
      "resultSummaryStatus"
    ],
    "codes": []
  },
  {
    "id": "live-wargear-rule-table-inventory",
    "file": "tests/builder_validation_wargear.test.mjs",
    "anchors": [
      "all live wargear rule tables stay pinned to explicit coverage counts",
      "wargearItems.length, 3516",
      "loadoutChoiceSets.length, 2445",
      "loadoutChoices.length, 5374",
      "limitedWargearChoiceSets.length, 343",
      "allModelWargearChoiceSets.length, 28"
    ],
    "codes": []
  },
  {
    "id": "live-wargear-option-defaults",
    "file": "tests/builder_validation_wargear.test.mjs",
    "anchors": [
      "all live wargear options generate scoped default selections",
      "unitGroups.length, 19",
      "miniatureGroups.length, 3006",
      "unitOptions.length, 21",
      "miniatureOptions.length, 6301",
      "unitDefaultRows, 5",
      "miniatureDefaultRows, 3690",
      "miniatureDefaultTotal, 6821"
    ],
    "codes": []
  },
  {
    "id": "live-wargear-option-scope-and-points",
    "file": "tests/builder_validation_wargear.test.mjs",
    "anchors": [
      "all live wargear options validate target scope and selected points",
      "wargearOptions.length, 6322",
      "validUnitScopeRows, 21",
      "validMiniatureScopeRows, 6301",
      "invalidUnitScopeRows, 6301",
      "invalidMiniatureScopeRows, 21",
      "paidOptionRows, 83",
      "selectedPointsTotal, 1492"
    ],
    "codes": [
      "wargear_loadout.invalid_unit_wargear",
      "wargear_loadout.invalid_model_wargear"
    ]
  },
  {
    "id": "live-regular-loadout-choice-sets",
    "file": "tests/builder_validation_wargear_regular.test.mjs",
    "anchors": [
      "all live regular loadout choice sets generate valid and invalid coverage",
      "sets.length, 2445",
      "loadoutChoices.length, 5374",
      "loadoutChoiceWargearItems.length, 8325",
      "generatedLoadoutCount, 6209"
    ],
    "codes": []
  },
  {
    "id": "live-base-miniature-loadout-rows",
    "file": "tests/builder_validation_wargear.test.mjs",
    "anchors": [
      "all live base miniature loadout rows generate scoped default wargear",
      "loadouts.length, 1300",
      "rows.length, 3132",
      "emptyLoadouts, 2",
      "directRows, 3115",
      "foreignRows, 17",
      "foreignLoadouts, 8"
    ],
    "codes": []
  },
  {
    "id": "live-limited-wargear-choices-and-limits",
    "file": "tests/builder_validation_wargear_limited.test.mjs",
    "anchors": [
      "all live limited wargear choices and limits accept valid selections and reject over-limit selections",
      "sets.length, 343",
      "choices.length, 569",
      "limitedWargearChoiceWargearItems.length, 676",
      "limits.length, 492",
      "acceptedChoiceRows, 541",
      "disabledChoiceRows, 26",
      "invalidLimitRows, 492"
    ],
    "codes": [
      "wargear_loadout.invalid_wargear_requirement"
    ]
  },
  {
    "id": "live-all-model-wargear-choice-sets",
    "file": "tests/builder_validation_wargear_all_model.test.mjs",
    "anchors": [
      "all live all-model wargear choices and sets accept complete selections and reject incomplete selections",
      "sets.length, 28",
      "choices.length, 63",
      "allModelWargearChoiceWargearItems.length, 69",
      "baseChoices.length, 44",
      "substituteChoices.length, 19",
      "acceptedBaseRows, 44",
      "acceptedSubstituteRows, 16",
      "acceptedStandaloneSubstituteRows, 3",
      "underfilledSetRows, 27",
      "baseConflictSetRows, 16",
      "missingBaseSubstituteRows, 16"
    ],
    "codes": [
      "wargear_loadout.invalid_wargear_requirement"
    ]
  },
  {
    "id": "data-empty-wargear-loadout-math-edges",
    "file": "tests/builder_validation_wargear_edges.test.mjs",
    "anchors": [
      "data-empty wargear loadout math edge rows stay covered",
      "test-zero-limit-loadout-set",
      "test-empty-regular-loadout-set",
      "test-over-limit-loadout-set",
      "name:exact duplicate bridge"
    ],
    "codes": []
  },
  {
    "id": "data-empty-wargear-requirement-edge-rows",
    "file": "tests/builder_validation_wargear_edges.test.mjs",
    "anchors": [
      "data-empty wargear requirement edge rows stay covered",
      "duplicate-vector",
      "test-empty-all-model-set",
      "wargear_loadout.invalid_wargear_requirement"
    ],
    "codes": [
      "wargear_loadout.invalid_wargear_requirement"
    ]
  },
  {
    "id": "allegiance-pactbound-mark-of-chaos",
    "file": "tests/builder_validation_allegiance.test.mjs",
    "anchors": [
      "Pactbound Zealots Mark of Chaos"
    ],
    "codes": [
      "allegiance_ability.not_selected",
      "allegiance_ability.multiple_selected",
      "allegiance_ability.required_detachment_missing"
    ]
  },
  {
    "id": "live-mandatory-allegiance-groups",
    "file": "tests/builder_validation_allegiance.test.mjs",
    "anchors": [
      "all live mandatory allegiance groups require one selection and reject multiples",
      "mandatoryGroups.length, 5"
    ],
    "codes": [
      "allegiance_ability.not_selected",
      "allegiance_ability.multiple_selected"
    ]
  },
  {
    "id": "live-detachment-scoped-allegiance-groups",
    "file": "tests/builder_validation_allegiance.test.mjs",
    "anchors": [
      "all live detachment-scoped allegiance groups require their detachment",
      "detachmentGroups.length, 7"
    ],
    "codes": [
      "allegiance_ability.required_detachment_missing"
    ]
  },
  {
    "id": "allegiance-daemonic-required-wargear",
    "file": "tests/builder_validation_allegiance.test.mjs",
    "anchors": [
      "Daemonic Allegiance abilities enforce required wargear"
    ],
    "codes": [
      "allegiance_ability.missing_wargear_item"
    ]
  },
  {
    "id": "live-required-wargear-allegiance-abilities",
    "file": "tests/builder_validation_allegiance.test.mjs",
    "anchors": [
      "all live allegiance abilities with required wargear require and accept that wargear",
      "abilities.length, 4"
    ],
    "codes": [
      "allegiance_ability.missing_wargear_item"
    ]
  },
  {
    "id": "allegiance-roster-min-max-groups",
    "file": "tests/builder_validation_allegiance.test.mjs",
    "anchors": [
      "detachment allegiance keyword groups enforce roster min and max limits",
      "Houndpack Lance Keyword",
      "Headhunter Task Force Keywords"
    ],
    "codes": [
      "allegiance_ability.group_limit_not_reached",
      "allegiance_ability.group_limit_exceeded"
    ]
  },
  {
    "id": "live-allegiance-roster-min-max-groups",
    "file": "tests/builder_validation_allegiance.test.mjs",
    "anchors": [
      "all live allegiance roster min and max groups have valid and invalid coverage",
      "minGroups.length, 1",
      "maxGroups.length, 4"
    ],
    "codes": [
      "allegiance_ability.group_limit_not_reached",
      "allegiance_ability.group_limit_exceeded"
    ]
  },
  {
    "id": "live-detachment-keyword-restriction-limits",
    "file": "tests/builder_validation_factions.test.mjs",
    "anchors": [
      "all live detachment keyword restriction limits have valid and invalid coverage",
      "limits.length, 7"
    ],
    "codes": [
      "keyword_restriction_group.minimum_not_met",
      "keyword_restriction_group.limit_exceeded"
    ]
  }
];
