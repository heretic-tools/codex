export const minimumParityCoreCases = [
  {
    "id": "builder-rule-table-export-counts",
    "file": "tests/builder_validation_catalog_inventory.test.mjs",
    "anchors": [
      "loaded Builder rule tables match exported table counts",
      "Object.keys(tableCounts).length, 102",
      "LOADED_BUILDER_RULE_TABLES.length, 73",
      "static Builder data export audit has no unexpected roster tables",
      "audit.excludedTables.length, 43",
      "static Builder data manifest lists every exported rule file with matching rows and hashes",
      "precomputedEntries.length > 1 || legacyPrecomputedEntryCount === 1",
      "tableEntries.length, Object.keys(tableCounts).length",
      "entry.sha256",
      "static Builder rule table column lists stay pinned",
      "Object.keys(BUILDER_RULE_TABLE_COLUMNS).length, 73",
      "\"requiresAllUnitsHaveKeywordId\"",
      "\"isCombatPatrolDefault\"",
      "\"duplicateLimit\"",
      "battle size export keeps all roster-limit fields in the thin catalog",
      "[\"Strike Force\", 2000, 3, 4, 3]"
    ],
    "codes": []
  },
  {
    "id": "local-official-wh40k-db-roster-rule-table-fingerprints",
    "file": "tests/builder_validation_catalog_inventory.test.mjs",
    "anchors": [
      "local official WH 40K app DB matches Builder DB for loaded roster rule tables",
      "OFFICIAL_WH40K_APP_DB_PATH",
      "sqliteTableFingerprint",
      "officialFingerprint",
      "builderFingerprint"
    ],
    "codes": []
  },
  {
    "id": "local-official-wh40k-seed-dump-table-inventory",
    "file": "tests/builder_validation_catalog_inventory.test.mjs",
    "anchors": [
      "local official WH 40K app seed dump table inventory stays classified",
      "OFFICIAL_SEED_DUMP_PATH",
      "OFFICIAL_SEED_DUMP_REFERENCE_OR_GAME_TABLES",
      "seedDump.metadata.data_version",
      "keyword_ally_restricting_keyword"
    ],
    "codes": []
  },
  {
    "id": "saved-wh40k-roster-aggregate-comparison-tool",
    "file": "HereticBuilder/tools/compare_wh40k_saved_rosters.mjs",
    "anchors": [
      "Read-only comparison of saved WH 40K app roster aggregate validation state",
      "roster_validation_state.validationState as officialState",
      "validateRoster(roster)",
      "builderCodes"
    ],
    "codes": []
  },
  {
    "id": "official-validation-storage-aggregate-only",
    "file": "tests/builder_validation_catalog_inventory.test.mjs",
    "anchors": [
      "local official WH 40K app DB stores only aggregate roster validation state",
      "roster_validation_state",
      "validationStateColumns",
      "%diagnostic%"
    ],
    "codes": []
  },
  {
    "id": "saved-wh40k-roster-aggregate-comparison-guard",
    "file": "tests/builder_validation_catalog_inventory.test.mjs",
    "anchors": [
      "local saved WH 40K app rosters match Builder aggregate validation state",
      "compare_wh40k_saved_rosters.mjs",
      "comparison.match !== true",
      "builderCodes"
    ],
    "codes": []
  },
  {
    "id": "official-validation-localization-key-map",
    "file": "tests/builder_validation_coverage.test.mjs",
    "anchors": [
      "official WH app validation localization keys map to Builder codes",
      "local official WH app validation localization keys stay mapped",
      "local official WH app Battle Forge validator symbols stay mapped",
      "OFFICIAL_VALIDATION_KEY_TO_CODE",
      "OFFICIAL_DATASOURCE_VALIDATION_KEY_PATTERN",
      "OFFICIAL_BATTLEFORGE_VALIDATOR_SYMBOLS",
      "officialBattleForgeValidatorSymbols"
    ],
    "codes": []
  },
  {
    "id": "thin-client-catalog-path-and-fetch-failure",
    "file": "tests/builder_validation_catalog_inventory.test.mjs",
    "anchors": [
      "thin client catalog loading keeps path and fetch failure behavior explicit",
      "relative/path",
      "//cdn.example/builder-data/bootstrap.json",
      "\\/builder-data\\/(bootstrap|unit-images|tables\\/[^/]+)\\.json: 503"
    ],
    "codes": []
  },
  {
    "id": "live-allied-rule-table-inventory",
    "file": "tests/builder_validation_allied.test.mjs",
    "anchors": [
      "all live allied rule tables stay pinned to explicit coverage counts",
      "alliedFactionParentFactionKeywords.length, 25",
      "keywordAllyRestrictingKeywords.length, 0",
      "allyRestrictingKeywordId).length, 4"
    ],
    "codes": []
  },
  {
    "id": "native-roster-has-no-allied-diagnostics",
    "file": "tests/builder_validation_allied.test.mjs",
    "anchors": [
      "allied validation ignores rosters without allied units",
      "native-captain",
      "assert.deepEqual(messages, [])"
    ],
    "codes": []
  },
  {
    "id": "live-conditional-keyword-requirements",
    "file": "tests/builder_validation_core.test.mjs",
    "anchors": [
      "all live conditional keyword rows have satisfied and missing requirement coverage",
      "conditionalKeywords.length, 380",
      "requiredAllegianceAbilityId: 270",
      "requiredRosterFactionKeywordId: 32",
      "requiredDetachmentId: 77",
      "requiredWarlordMiniatureId: 2"
    ],
    "codes": []
  },
  {
    "id": "core-required-wargear-item-matcher-edges",
    "file": "tests/builder_validation_core.test.mjs",
    "anchors": [
      "core wargear item matcher rejects missing options, wrong items, and wrong model targets",
      "missing-option",
      "not-a-wargear-item",
      "wrong-target"
    ],
    "codes": []
  },
  {
    "id": "live-allegiance-rule-table-inventory",
    "file": "tests/builder_validation_allegiance.test.mjs",
    "anchors": [
      "all live allegiance rule tables stay pinned to explicit coverage counts",
      "allegianceAbilityGroups.length, 10",
      "allegianceAbilities.length, 26",
      "factionKeywordMandatoryAllegianceAbilities.length, 0",
      "alliedFactionAllegianceAbilities.length, 0"
    ],
    "codes": []
  },
  {
    "id": "live-allegiance-ability-rows",
    "file": "tests/builder_validation_allegiance.test.mjs",
    "anchors": [
      "all live allegiance ability rows are accepted by their configured group",
      "allegianceAbilities.length, 26"
    ],
    "codes": []
  },
  {
    "id": "data-empty-missing-allegiance-group",
    "file": "tests/builder_validation_allegiance.test.mjs",
    "anchors": [
      "missing allegiance ability groups without catalog rows are ignored",
      "missing-allegiance-group-unit",
      "missing-allegiance-group",
      "assert.deepEqual(messages, [])"
    ],
    "codes": []
  },
  {
    "id": "live-datasheet-allegiance-group-rows",
    "file": "tests/builder_validation_allegiance.test.mjs",
    "anchors": [
      "all live datasheet allegiance group rows drive allowed, mandatory, and detachment checks",
      "datasheets.length, 92",
      "allegianceAbilityGroupId)).size, 10",
      "isMandatory).length, 48",
      "detachmentId).length, 87",
      "requiresWargearItemId)).length, 1",
      "validRows, 92",
      "wrongGroupRows, 92",
      "mandatoryRows, 48",
      "detachmentRows, 87",
      "requiredWargearRows, 1"
    ],
    "codes": [
      "allegiance_ability.not_allowed",
      "allegiance_ability.not_selected",
      "allegiance_ability.required_detachment_missing"
    ]
  },
  {
    "id": "live-enhancement-rule-table-inventory",
    "file": "tests/builder_validation_enhancements.test.mjs",
    "anchors": [
      "all live enhancement rule tables stay pinned to explicit coverage counts",
      "enhancements.length, 957",
      "enhancementRequiredKeywordGroups.length, 1027",
      "enhancementExcludedKeywords.length, 32",
      "enhancementBodyguardGroups.length, 19"
    ],
    "codes": []
  },
  {
    "id": "live-enhancement-core-flag-rows",
    "file": "tests/builder_validation_enhancements.test.mjs",
    "anchors": [
      "all live enhancement core flag rows have target, eligibility, limit, and roster-limit coverage",
      "enhancements.length, 957",
      "targetTypeInvalidRows, 957",
      "epicAllowedRows, 8",
      "epicBlockedRows, 949",
      "nonCharacterAllowedRows, 78",
      "nonCharacterBlockedRows, 879",
      "limitOneRows, 886",
      "limitThreeRows, 71",
      "validLimitRows, 957",
      "invalidLimitRows, 957",
      "rosterIncludedRows, 948",
      "rosterExcludedRows, 9"
    ],
    "codes": [
      "enhancement.target_type_invalid",
      "enhancement.epic_hero_not_allowed",
      "enhancement.unit_does_not_have_required_keywords",
      "enhancement.models_have_same_enhancements",
      "enhancement.roster_has_too_many_enhancements"
    ]
  },
  {
    "id": "live-allied-faction-enhancement-permission-rows",
    "file": "tests/builder_validation_enhancements.test.mjs",
    "anchors": [
      "all live allied faction enhancement permissions allow or reject allied enhancement selections",
      "alliedFactions.length, 21",
      "canTakeEnhancements).length, 5",
      "canTakeEnhancements === false).length, 16",
      "allowedRows, 5",
      "blockedRows, 16"
    ],
    "codes": [
      "enhancement.allied_unit_not_allowed"
    ]
  },
  {
    "id": "live-enhancement-excluded-keyword-rows",
    "file": "tests/builder_validation_enhancement_requirements.test.mjs",
    "anchors": [
      "all live enhancement excluded keyword rows reject and accept target keywords",
      "rows.length, 32"
    ],
    "codes": [
      "enhancement.model_must_not_have_excluded_keywords"
    ]
  },
  {
    "id": "live-enhancement-required-wargear-rows",
    "file": "tests/builder_validation_enhancement_requirements.test.mjs",
    "anchors": [
      "all live enhancement required wargear rows require and accept configured items",
      "rows.length, 1"
    ],
    "codes": [
      "enhancement.model_does_not_have_required_wargear"
    ]
  },
  {
    "id": "live-enhancement-bodyguard-groups",
    "file": "tests/builder_validation_enhancement_requirements.test.mjs",
    "anchors": [
      "all live enhancement bodyguard groups have missing, wrong, and attached coverage",
      "groups.length, 19",
      "enhancementBodyguardGroupDatasheets.length, 19",
      "enhancementBodyguardGroupKeywords.length, 0"
    ],
    "codes": [
      "enhancement.attached_requirement_missing"
    ]
  },
  {
    "id": "live-enhancement-bodyguard-type-rows",
    "file": "tests/builder_validation_enhancement_requirements.test.mjs",
    "anchors": [
      "all live enhancement bodyguard groups require their configured leader or support type",
      "groups.length, 19",
      "bodyguardType === \"leader\").length, 19",
      "bodyguardType === \"support\").length, 0",
      "leaderRows, 19",
      "supportRows, 0",
      "validRows, 19",
      "wrongTypeRows, 19"
    ],
    "codes": [
      "enhancement.attached_requirement_missing"
    ]
  },
  {
    "id": "data-empty-enhancement-bodyguard-faction-gates",
    "file": "tests/builder_validation_enhancement_requirements.test.mjs",
    "anchors": [
      "data-empty enhancement bodyguard faction gates stay covered",
      "enhancementBodyguardGroups.filter((group) => group.factionKeywordId).length, 0",
      "wrongFaction: true"
    ],
    "codes": [
      "enhancement.attached_requirement_missing"
    ]
  },
  {
    "id": "live-enhancement-required-keyword-groups",
    "file": "tests/builder_validation_enhancement_requirements.test.mjs",
    "anchors": [
      "all live enhancement required keyword groups have valid and missing requirement coverage",
      "groups.length, 1027",
      "groupsWithKeywords.length, 578",
      "groupsWithFactions.length, 639",
      "groupsWithDatasheets.length, 83"
    ],
    "codes": [
      "enhancement.model_does_not_have_required_keywords"
    ]
  },
  {
    "id": "heretic-astartes-daemon-allies-points",
    "file": "tests/builder_validation_allied.test.mjs",
    "anchors": [
      "Heretic Astartes Legiones Daemonica allies",
      "daemon-points-under-cap",
      "daemon-points-over-cap"
    ],
    "codes": [
      "allied_points.limit_exceeded"
    ]
  },
  {
    "id": "live-allied-points-limits",
    "file": "tests/builder_validation_allied_availability.test.mjs",
    "anchors": [
      "all live allied faction points limits have valid and invalid coverage",
      "alliedFactionPointsLimits.length, 39"
    ],
    "codes": [
      "allied_points.limit_exceeded"
    ]
  },
  {
    "id": "live-faction-allied-faction-rows",
    "file": "tests/builder_validation_allied_availability.test.mjs",
    "anchors": [
      "all live faction allied faction rows have available and unavailable coverage",
      "factionKeywordAlliedFactions.length, 87"
    ],
    "codes": [
      "allied_faction.not_available"
    ]
  },
  {
    "id": "live-allied-faction-datasheet-rows",
    "file": "tests/builder_validation_allied_availability.test.mjs",
    "anchors": [
      "all live allied faction datasheet rows have allowed and disallowed coverage",
      "alliedFactionDatasheets.length, 320"
    ],
    "codes": [
      "allied_faction.datasheet_not_allowed"
    ]
  },
  {
    "id": "live-allied-keyword-limits",
    "file": "tests/builder_validation_allied_keywords.test.mjs",
    "anchors": [
      "all live allied faction keyword limits have valid and invalid coverage",
      "alliedFactionKeywords.length, 54",
      "requiredWarlordMiniatureId).length, 0"
    ],
    "codes": [
      "allied_keyword_count.limit_exceeded"
    ]
  },
  {
    "id": "data-empty-allied-keyword-required-warlord-limits",
    "file": "tests/builder_validation_allied_keywords.test.mjs",
    "anchors": [
      "data-empty allied faction keyword required warlord limits stay covered",
      "requiredWarlordMiniatureId).length, 0",
      "requiredWarlordMiniatureId: \"required-warlord\"",
      "warlord-gated-keyword-limit"
    ],
    "codes": [
      "allied_keyword_count.limit_exceeded"
    ]
  },
  {
    "id": "live-allied-mutually-exclusive-keyword-buckets",
    "file": "tests/builder_validation_allied_keywords.test.mjs",
    "anchors": [
      "all live mutually exclusive allied keyword buckets reject mixed active keyword groups",
      "mutuallyExclusiveBuckets.length, 12"
    ],
    "codes": [
      "allied_keyword_count.invalid_mutually_exclusive_keywords"
    ]
  },
  {
    "id": "live-allied-slotless-keyword-groups",
    "file": "tests/builder_validation_allied_keywords.test.mjs",
    "anchors": [
      "all live allied slotless keyword groups reduce receiver keyword counts",
      "alliedFactionKeywordSlotlessKeywordGroups.length, 12"
    ],
    "codes": [
      "allied_keyword_count.limit_exceeded"
    ]
  },
  {
    "id": "data-empty-allied-edge-rows",
    "file": "tests/builder_validation_allied_edges.test.mjs",
    "anchors": [
      "data-empty allied edge rows cover global restrictions, duplicate restrictions, and malformed slotless groups",
      "keywordAllyRestrictingKeywords.length, 0",
      "slotless-no-donor",
      "slotless-no-receiver",
      "allyRestrictingFactionKeywordId: \"\""
    ],
    "codes": [
      "allied_keyword_count.limit_exceeded",
      "allied_keyword_restricting_keyword.outnumbered_keywords"
    ]
  },
  {
    "id": "heretic-astartes-daemon-outnumbering",
    "file": "tests/builder_validation_allied.test.mjs",
    "anchors": [
      "Heretic Astartes Legiones Daemonica allies",
      "khorne-daemon-outnumbering",
      "nurgle-daemon-outnumbering",
      "slaanesh-daemon-outnumbering",
      "tzeentch-daemon-outnumbering"
    ],
    "codes": [
      "allied_keyword_restricting_keyword.outnumbered_keywords"
    ]
  },
  {
    "id": "live-allied-restricting-keyword-rows",
    "file": "tests/builder_validation_allied_keywords.test.mjs",
    "anchors": [
      "all live allied restricting keyword rows have invalid and paired coverage",
      "restrictingKeywords.length, 4"
    ],
    "codes": [
      "allied_keyword_restricting_keyword.outnumbered_keywords"
    ]
  },
  {
    "id": "heretic-astartes-chaos-knights-cap",
    "file": "tests/builder_validation_allied.test.mjs",
    "anchors": [
      "Heretic Astartes Chaos Knights allies"
    ],
    "codes": [
      "allied_keyword_count.limit_exceeded",
      "allied_keyword_count.invalid_mutually_exclusive_keywords"
    ]
  },
  {
    "id": "heretic-astartes-cult-legion-detachment",
    "file": "tests/builder_validation_allied_availability.test.mjs",
    "anchors": [
      "Heretic Astartes cult legion allies require one configured detachment",
      "Death Guard",
      "Thousand Sons",
      "World Eaters",
      "Emperor’s Children"
    ],
    "codes": [
      "allied_unit.required_detachment_not_selected"
    ]
  },
  {
    "id": "live-allied-required-detachment-rows",
    "file": "tests/builder_validation_allied_availability.test.mjs",
    "anchors": [
      "all live allied required detachment rows have missing and selected coverage",
      "alliedFactionRequiredDetachments.length, 29"
    ],
    "codes": [
      "allied_unit.required_detachment_not_selected"
    ]
  },
  {
    "id": "live-allied-allowed-warlord-rows",
    "file": "tests/builder_validation_allied_availability.test.mjs",
    "anchors": [
      "all live allied allowed warlord rows have missing and selected coverage",
      "alliedFactionAllowedWarlordMiniatures.length, 28"
    ],
    "codes": [
      "allied_units.required_warlord_missing"
    ]
  },
  {
    "id": "data-empty-allied-faction-top-level-requirement-fields",
    "file": "tests/builder_validation_allied_edges.test.mjs",
    "anchors": [
      "data-empty allied faction top-level required detachment and warlord fields stay covered",
      "requiredDetachmentId).length, 0",
      "requiredWarlordMiniatureId).length, 0",
      "requiredDetachmentId: \"required-detachment\"",
      "requiredWarlordMiniatureId: \"required-warlord\""
    ],
    "codes": [
      "allied_unit.required_detachment_not_selected",
      "allied_units.required_warlord_missing"
    ]
  },
  {
    "id": "heretic-astartes-titanicus-traitoris-cap",
    "file": "tests/builder_validation_allied.test.mjs",
    "anchors": [
      "Heretic Astartes Titanicus Traitoris allies"
    ],
    "codes": [
      "allied_keyword_count.limit_exceeded"
    ]
  },
  {
    "id": "adeptus-astartes-detachment-dp-overrides",
    "file": "tests/builder_validation_factions.test.mjs",
    "anchors": [
      "Adeptus Astartes chapter detachment point overrides",
      "Black Templars",
      "Blood Angels",
      "Deathwatch",
      "Stormlance Task Force",
      "Bastion Task Force"
    ],
    "codes": [
      "roster.detachment_points_limit_exceeded"
    ]
  },
  {
    "id": "live-detachment-unique-keyword-groups",
    "file": "tests/builder_validation_detachment_restrictions.test.mjs",
    "anchors": [
      "all live detachment unique keyword groups have valid and invalid coverage",
      "detachmentUniqueKeywords.length, 57",
      "rowsByKeywordId.size, 27"
    ],
    "codes": [
      "roster.detachment_unique_keyword_error"
    ]
  },
  {
    "id": "live-datasheet-exclusion-rows",
    "file": "tests/builder_validation_detachment_restrictions.test.mjs",
    "anchors": [
      "all live datasheet exclusion rows have valid and invalid coverage",
      "detachmentExcludedDatasheets.length, 23",
      "factionExcludedDatasheets.length, 23"
    ],
    "codes": [
      "detachment.datasheet_not_allowed",
      "roster.faction_datasheet_not_allowed"
    ]
  },
  {
    "id": "live-combat-patrol-linked-datasheets",
    "file": "tests/builder_validation_detachment_restrictions.test.mjs",
    "anchors": [
      "all live Combat Patrol linked datasheet rows have exact roster coverage",
      "detachmentLinkedDatasheets.length, 107",
      "rowsByDetachmentId.size, 24"
    ],
    "codes": [
      "detachment.linked_datasheet_count_mismatch",
      "detachment.linked_datasheet_not_allowed"
    ]
  }
];
