# WH 40K app roster validation audit

Date: 2026-07-01

Installed app: `Warhammer 40,000: The App`

Bundle:

- App wrapper: `/Applications/WH 40K.app`
- Main app bundle: `/Applications/WH 40K.app/Wrapper/w40.app`
- Bundle id: `com.gamesworkshop.w40k`
- App version: `2.0.3`
- Data version: `879`
- Platform marker: `iphoneos`

This audit is intentionally evidence-based. The installed app does not ship Swift
source files for the Battle Forge validators. The closest post-line evidence
available locally is:

- binary string offsets in `w40`;
- localized validation keys in `.strings` bundles;
- migrated SQLite schema and row counts in the app container;
- seed data table names and counts in `dump.json`.

No source decompilation or protection bypass was used.

## Source map

| Source | Path | What it proves |
| --- | --- | --- |
| Main executable | `/Applications/WH 40K.app/Wrapper/w40.app/w40` | Validator class/type names, error enum case names, diagnostic strings, some embedded SQL and Swift file path strings. |
| Seed data | `/Applications/WH 40K.app/Wrapper/w40.app/Datasource_SeedDatasource.bundle/dump.json` | Data version 879 and seeded catalog/rule rows. The file is minified into one physical line. |
| Runtime DB | `/Users/losikov/Library/Containers/com.gamesworkshop.w40k/Data/Library/Application Support/db.sqlite` | Migrated GRDB schema, catalog rows, roster state tables, trigger definitions. |
| Datasource strings | `/Applications/WH 40K.app/Wrapper/w40.app/Datasource_BattleForgeDatasource.bundle/en.lproj/Localizable.strings` | Most user-facing validation error keys/templates. |
| UI strings | `/Applications/WH 40K.app/Wrapper/w40.app/UI_BattleForgeUI.bundle/en.lproj/Localizable.strings` | UI validation strings, including `invalid_warlord_generic`, validation headings and valid-roster copy. |

Runtime DB facts:

- `metadata.dataVersion`: `879`
- DB tables: `145`
- Seed tables: `129`
- App migrations recorded through `release-11.0.1`
- Current local rosters in app container: `1`
- `roster_validation_state` stores only aggregate status, for example `invalid`; detailed messages are computed by validators.

Seed vs runtime DB difference:

- Runtime-only validation/state tables include `roster`, `roster_unit`, `roster_detachment`, `roster_attached_unit`, `roster_validation_state`, `keyword_ally_restricting_keyword`, `metadata`, `grdb_migrations`, battle and favourite/entitlement tables.
- Seed-only tables include several empty/unused mission-pack agenda/location/briefing/amendment tables.

## Validator trace from binary

Evidence source: `strings -a -t x .../w40`, offsets `0x108b350..0x108c876`.

| Offset | Validator / error type | Meaning for Builder |
| --- | --- | --- |
| `108b350` | `AllegianceAbilityGroupRosterLimitValidator` | Roster-level min/max choices for allegiance ability groups. |
| `108b380` | `MinRosterLimitForAllegianceAbilityGroup` | Too few selected allegiance abilities in a group. |
| `108b3b0` | `ExceededRosterLimitForAllegianceAbilityGroup` | Too many selected allegiance abilities in a group. |
| `108b420` | `AllegianceAbilityValidator` | Per-unit allegiance ability eligibility. |
| `108b460` | `MissingRequiredWargearItem` | Selected allegiance ability requires wargear. |
| `108b480` | `MissingAllegianceAbility` | Mandatory unit allegiance ability missing. |
| `108b4a0` | `TooManyAllegianceAbilities` | More than one choice where only one is allowed. |
| `108b4c0` | `MissingMandatoryAllegianceAbility` | Mandatory faction-level allegiance ability missing. |
| `108b550` | `AlliedFactionDetachmentValidator` | Allies that require a specific detachment. |
| `108b590` | `InvalidDetachmentError` | Required detachment not selected for allied units. |
| `108b5e0` | `AlliedKeywordCountValidator` | Allied keyword unit caps and mutually exclusive keyword limits. |
| `108b600` | `InvalidMutuallyExclusiveKeywords` | More than one mutually exclusive allied keyword bucket used. |
| `108b630` | `AlliedRequiredWarlordKeywordCountLimitExceeded` | Allied keyword cap active only while a warlord is selected. |
| `108b660` | `AlliedKeywordCountLimitExceeded` | Allied keyword count above limit. |
| `108b6d0` | `AlliedPointsValidator` | Allied points caps by battle size. |
| `108b6f0` | `AlliedPointsLimitExceeded` | Allied points above cap. |
| `108b740` | `AlliedUnitsRequiredAllegianceValidator` | Allied unit requires selected allegiance ability. |
| `108b7b0` | `RequiredAllegianceAbilityMissing` | Required allied allegiance ability missing. |
| `108b810` | `AlliedUnitsRequiredWarlordValidator` | Allied units require a specific/allowed warlord. |
| `108b840` | `RequiredWarlordMissing` | Required allied warlord not selected. |
| `108b9a0` | `DetachmentExcludedDatasheetValidator` | Datasheet cannot be used with selected detachment. |
| `108b9d0` | `DetachmentDatasheetNotAllowed` | Detachment exclusion error. |
| `108ba20` | `DetachmentPointsLimitValidator` | Total detachment points versus battle-size DP limit. |
| `108ba40` | `DetachmentPointsBattleSizeLimitExceeded` | DP limit exceeded. |
| `108baa0` | `DetachmentRequiredDatasheetValidator` | Detachment required/linked datasheets. |
| `108bad0` | `DetachmentDatasheetsMissing` | Required datasheet missing. |
| `108bb20` | `EnhancementValidator` | Full enhancement eligibility and limits. |
| `108bb60` | `ModelsHaveSameEnhancements` | Same enhancement selected too many times. |
| `108bb80` | `RosterHasTooManyEnhancements` | Roster enhancement limit exceeded. |
| `108bba0` | `UnitHasTooManyEnhancements` | More than one enhancement on a unit. |
| `108bbc0` | `UnitDoesNotHaveRequiredKeywords` | Unit-level enhancement target lacks required keywords. |
| `108bbe0` | `ModelDoesNotHaveRequiredWargearItem` | Enhancement required wargear missing. |
| `108bc10` | `ModelDoesNotHaveRequiredKeywords` | Model-level enhancement target lacks required keywords. |
| `108bc40` | `ModelHasEnhancementWithExcludedKeyword` | Enhancement excluded keyword present. |
| `108bc70` | `AttachedModelHasTooManyEnhancements` | Attached unit has too many enhancements. |
| `108bd40` | `FactionKeywordExcludedDatasheetValidator` | Faction-level datasheet exclusion. |
| `108bd70` | `FactionDatasheetNotAllowed` | Faction exclusion error. |
| `108bdc0` | `KeywordAllyRestrictingKeywordValidator` | Allied keyword outnumbering restriction. |
| `108bdf0` | `RestrictingKeywordError` | Non-restricting allied units outnumber restricting allied units. |
| `108be40` | `KeywordRestrictionGroupValidator` | Faction/detachment keyword restriction groups. |
| `108be70` | `KeywordRestrictionGroupError` | Keyword restriction min/max/zero limit violation. |
| `108bec0` | `MandatoryWarlordValidator` | Faction/detachment mandatory warlord rules. |
| `108bee0` | `MandatoryWarlordNotNotPresentInRoster` | Required model not present. |
| `108bf10` | `MandatoryWarlordNotSelected` | Required model present but not warlord. |
| `108bf30` | `SupremeCommanderNotSelected` | Supreme Commander must be warlord. |
| `108bfa0` | `MaxModelCountValidator` | Datasheet maximum model count. |
| `108bfc0` | `TooManyModels` | Unit model count above max. |
| `108c000` | `RosterAttachedUnitValidator` | Attached unit group validity. |
| `108c050` | `AttachedUnitLeaderOrSupportMissingRequirements` | Leader/support/bodyguard combination invalid. |
| `108c080` | `AttachedUnitNoMatchingKeyword` | Attached unit missing shared required keyword. |
| `108c0a0` | `AttachedUnitDetachmentNoMatchingKeyword` | Detachment-specific attached unit keyword requirement missing. |
| `108c0d0` | `BodyguardGroupValidity` | Datasheet bodyguard group matching. |
| `108c0f0` | `UnitMustBeAttached` | A unit requiring attachment is not attached. |
| `108c170` | `RosterDetachmentValidator` | Detachment selected and unique keyword rules. |
| `108c190` | `RosterDetachmentNotSelected` | No detachment selected. |
| `108c1b0` | `RosterDetachmentUniqueKeywordError` | Selected detachments share unique keyword. |
| `108c220` | `RosterPointsValidator` | Total roster points. |
| `108c240` | `RosterPointsLimitExceeded` | Points above battle size cap. |
| `108c290` | `RosterUnitLimitValidator` | Duplicate unit limits and Epic Hero/successor checks. |
| `108c2f0` | `RosterHasTooManyOfEpicHero` | Same Epic Hero more than once. |
| `108c310` | `RosterHasEpicHeroAndSuccessorChapter` | Successor chapter Epic Hero conflict. |
| `108c340` | `RosterHasTooManyOfUnit` | Datasheet duplicate limit exceeded. |
| `108c3b0` | `UnitCompositionValidator` | Unit composition row validity. |
| `108c3d0` | `InvalidUnitComposition` | Model counts do not match a valid composition. |
| `108c4c0` | `WargearLoadoutValidator` | Unit/model wargear loadout engine. |
| `108c5a8` | `LoadoutKey` | Internal loadout matching key. |
| `108c5c0` | `InvalidWargearLoadout` | Loadout choice sets do not match selected wargear. |
| `108c5e0` | `InvalidWargearRequirement` | Limited/all-model wargear requirement failed. |
| `108c6b0` | `WarlordValidator` | Generic warlord count and eligibility. |
| `108c6d0` | `InvalidWarlordGeneric` | Selected warlord fails generic eligibility. |
| `108c6f0` | `InvalidWarlordDueToEnhancements` | Enhancement prevents model from being warlord. |
| `108c710` | `MissingWarlord` | No warlord selected. |
| `108c71f` | `TooManyWarlords` | More than one warlord selected. |
| `108c730` | `InvalidWarlordDueToKeywords` | Conditional keyword requirement for warlord not met. |

## Validation message keys

Evidence source: `Datasource_BattleForgeDatasource.bundle/en.lproj/Localizable.strings`,
plus UI-only `invalid_warlord_generic` in `UI_BattleForgeUI.bundle`.

Do not audit only the datasource bundle, because that misses the generic warlord
message.

Allegiance:

- `allegiance_ability_group_limit_exceeded`
- `allegiance_ability_group_limit_not_reached`
- `allegiance_ability_missing_wargear_item`
- `allegiance_ability_multiple_selected`
- `allegiance_ability_not_selected`
- `mandatory_allegiance_ability_not_selected`

Allies:

- `allied_keyword_count_invalid_mutually_exclusive_keywords`
- `allied_keyword_count_limit_exceeded`
- `allied_keyword_count_warlord_keyword_count_limit_exceeded`
- `allied_keyword_restricting_keyword_outnumbered_keywords`
- `allied_keyword_restricting_keyword_outnumbered_keywords_no_faction`
- `allied_points_limit_exceeded`
- `allied_unit_required_allegiance_ability_missing`
- `allied_unit_required_detachment_not_selected`
- `allied_units_required_warlord_missing`

Attached units:

- `attach_unit_required`
- `attached_unit_detachment_no_matching_keyword`
- `attached_unit_leader_missing_requirements`
- `attached_unit_no_matching_keyword`
- `attached_unit_support_missing_requirements`

Detachment and faction restrictions:

- `detachment_datasheet_not_allowed`
- `detachment_datasheets_missing`
- `detachment_not_selected`
- `detachment_points_limit_exceeded`
- `detachment_unique_keyword_error`
- `faction_keyword_datasheet_not_allowed`

Enhancements:

- `enhancement_attached_unit_too_many_enhancements`
- `enhancement_model_does_not_have_required_keywords`
- `enhancement_model_must_not_have_excluded_keywords`
- `enhancement_models_have_same_enhancements`
- `enhancement_roster_has_too_many_enhancements`
- `enhancementModelDoesNotHaveRequiredWargear`
- `invalid_warlord_due_to_enhancement`

Keyword restrictions:

- `keyword_restriction_group_error`
- `keyword_restriction_group_error_excluded_faction`
- `keyword_restriction_group_error_excluded_faction_limit_zero`
- `keyword_restriction_group_error_limit_zero`
- `keyword_restriction_group_error_minimum_not_met`
- `keyword_restriction_group_error_roster_warlord`
- `keyword_restriction_group_error_roster_warlord_limit_zero`

Warlord:

- `conditional_keyword_missing_keyword_to_be_warlord`
- `invalid_warlord_generic` - UI bundle, not datasource bundle
- `mandatory_warlord_not_present_in_roster`
- `mandatory_warlord_not_selected_multiple`
- `mandatory_warlord_not_selected_single`
- `mandatory_warlord_supreme_command_not_selected`
- `warlord_validator_multiple_warlords_selected`
- `warlord_validator_warlord_not_selected`

Units and wargear:

- `max_model_count_too_many_models`
- `roster_points_points_limit_exceeded`
- `roster_unit_limit_datasheet_limit_exceeded`
- `roster_unit_limit_epic_hero_exceeded`
- `successor_chapter_epic_hero_in_roster`
- `unit_composition_invalid_unit_composition`
- `wargear_loadout_invalid_miniature_wargear_loadout`
- `wargear_loadout_invalid_miniature_wargear_loadout_single_model`
- `wargear_loadout_invalid_unit_wargear_loadout`
- `wargear_loadout_invalid_wargear_requirement`

## Rule data tables

The app validation is data-driven. These counts are from the migrated runtime DB.

| Area | Tables | Count summary |
| --- | --- | ---: |
| Battle size limits | `battle_size` | 3 |
| Roster state | `roster`, `roster_detachment`, `roster_unit`, `roster_unit_miniature`, `roster_validation_state` | local state, currently 1 roster |
| Points/duplicate limits | `battle_size`, `datasheet_points_step`, `keyword`, `miniature_keyword` | 3 battle sizes, 334 points steps |
| Faction availability | `faction_keyword`, `datasheet_faction_keyword`, `faction_keyword_excluded_datasheet` | 43 factions, 1,256 datasheet faction rows, 23 exclusions |
| Detachments | `detachment`, `detachment_faction_keyword`, `detachment_faction_detachment_points_cost`, `detachment_unique_keyword` | 290 detachments, 457 faction links, 4 DP overrides, 57 unique keyword rows |
| Detachment datasheet requirements | `detachment_excluded_datasheet`, `detachment_required_datasheet`, `detachment_linked_datasheet` | 23 exclusions, 0 required rows, 107 linked rows |
| Warlord | `miniature`, `conditional_keyword`, `detachment_granted_warlord_miniature`, `detachment_mandatory_warlord_miniature`, `faction_keyword.mandatoryWarlordId` | 1,569 miniatures, 380 conditional keywords, 1 granted row, 2 detachment mandatory rows |
| Allegiance | `allegiance_ability_group`, `allegiance_ability`, `faction_keyword_mandatory_allegiance_ability` | 10 groups, 26 abilities, 0 faction mandatory rows |
| Allies | `allied_faction*`, `faction_keyword_allied_faction`, `keyword_ally_restricting_keyword`, `keyword.allyRestricting*` | 21 allied factions, 87 faction links, 320 allied datasheet rows, 54 keyword caps |
| Enhancements | `enhancement*` | 957 enhancements, 1,027 required keyword groups, 32 excluded keyword rows |
| Attached units | `datasheet_bodyguard_group*`, `roster_attached_unit*`, `enhancement_bodyguard_group*` | 1,266 datasheet bodyguard groups, 19 enhancement bodyguard groups |
| Unit composition | `unit_composition*`, `datasheet.maxModelCount` | 1,516 compositions, 2,258 miniature composition rows |
| Wargear | `base_miniature_loadout*`, `wargear_option*`, `loadout_choice*`, `limited_wargear_choice*`, `wargear_limit`, `all_model_wargear_choice*` | 1,300 base loadouts, 6,322 options, 2,445 choice sets, 492 wargear limits |

Battle size rows:

| Name | Points | Detachment points | Enhancements | Duplicate unit limit |
| --- | ---: | ---: | ---: | ---: |
| Incursion | 1000 | 2 | 2 | 2 |
| Strike Force | 2000 | 3 | 4 | 3 |
| Onslaught | 3000 | 3 | 4 | 3 |

Enhancement shape:

- `enhancementType = miniature`: 880 active rows across limit/default variants.
- `enhancementType = upgrade`: 71 rows.
- `enhancementType = unit`: 6 rows.
- `cannotBeWarlord`: 1 active enhancement row.
- `isCombatPatrolDefault`: 24 rows.
- `isIncludedInEnhancementLimit = 0`: 9 rows.

Allied factions summary:

- `allied_faction`: 21 rows.
- `faction_keyword_allied_faction`: 87 rows.
- `allied_faction_datasheet`: 320 whitelisted datasheets.
- `allied_faction_points_limit`: 39 battle-size point caps.
- `allied_faction_keyword`: 54 keyword caps.
- `allied_faction_required_detachment`: 29 required detachment links.
- `allied_faction_allowed_warlord_miniature`: 28 allowed warlord rows.
- `allied_faction_keyword_slotless_keyword_group`: 12 slotless groups.
- `allied_faction_allegiance_ability`: 0 rows in data version 879, but the validator exists and table must stay loaded.

Attached unit summary:

- `datasheet_bodyguard_group.bodyguardType = leader`: 1,056 rows.
- `datasheet_bodyguard_group.bodyguardType = support`: 210 rows.
- Rows with `requiredDetachmentId`: 305 total.
- Rows with `excludedDetachmentId`: 61 total.
- Rows with `requiresAllUnitsHaveKeywordId`: 305 total.

## Wargear algorithm evidence

Evidence source: `w40` offsets `0x12880e3..0x1288a44`.

The app does not just compare selected wargear against a text rule. It generates
valid loadouts from data, trims impossible loadout sizes, validates single
miniatures, non-added miniatures, groups of miniatures and unit-level wargear,
then checks limited and all-model requirements.

Observed diagnostic checkpoints:

- generate valid loadouts from choice set data;
- prioritize loadouts with potentially required size;
- pre-check before valid match search;
- reject invalid number of total equipped items;
- reject combinations over limited choice set caps;
- reject duplicate limited choices;
- allow empty loadout for non-added miniatures or no available wargear;
- validate individual model, group of models and unit scopes separately;
- validate mandatory limited choice sets;
- validate all-model choice sets;
- guard against choice sets linked to missing datasheet miniatures.

Also observed at `117bb70`: `BattleForgeDatasource/LoadoutChoiceSet+Conversion.swift`,
and at `117bbb0`: `Too many sets, only 5 supported`.

Builder implication: wargear needs its own engine and tests over all exported
loadout rows. A pair of hand-written wargear checks is not equivalent to the app.

## Builder comparison

Current static Builder already has modules corresponding to the app taxonomy:

- `builder_roster_validation.js`
- `builder_allegiance_rules.js`
- `builder_allied_rules.js`
- `builder_attachment_rules.js`
- `builder_enhancement_rules.js`
- `builder_restriction_rules.js`
- `builder_wargear_rules.js`
- `builder_warlord_rules.js`
- `builder_loadout_math.js`

Important app-audit deltas to track:

1. The previous `docs/builder_rules_final_audit.md` was based on the removed
   local Python baseline. The installed app confirms a very similar taxonomy,
   but the source of truth should now be this app-derived validator list.
2. `UnitMustBeAttached` / `attach_unit_required` exists in the app binary and
   strings. Builder now emits `attached_unit.must_be_attached` for explicit
   attached groups that contain leader/support members without a bodyguard. The
   exact standalone data flag is not present as a simple DB column in v879;
   evidence points to compiled logic around `RosterAttachedUnitValidator`,
   `hasAttachedUnit`, `datasheet_bodyguard_group` and Combat Patrol
   attached-unit aggregates.
3. `invalid_warlord_generic` lives in `UI_BattleForgeUI.bundle`, not in the
   datasource validation strings. Any error-string extractor that only reads
   `Datasource_BattleForgeDatasource.bundle` is incomplete.
4. `keyword_ally_restricting_keyword` exists in the migrated DB even though it
   currently has 0 rows. The app also supports legacy keyword-column restricting
   fields on `keyword`. Keep both paths.
5. `allied_faction_allegiance_ability` currently has 0 rows, but the app has
   `AlliedUnitsRequiredAllegianceValidator`; the rule path must remain live for
   future data versions.
6. `enhancement_keyword_points_cost` currently has 0 rows, but the schema and
   aggregates still exist; do not hard-code enhancement cost as only base cost.
7. `detachment_required_datasheet` currently has 0 rows, but the validator exists
   and `detachment_linked_datasheet` has 107 rows for exact linked rosters.
8. `roster_validation_state` is not a message source. It is only aggregate
   valid/invalid cache/state.

## Required implementation checklist

A Builder implementation that wants parity with app Battle Forge needs all of:

- total points limit;
- detachment selected;
- detachment points limit, including faction-specific DP overrides;
- detachment availability by faction;
- detachment unique keyword collision;
- detachment excluded datasheets;
- detachment required/linked datasheets;
- faction excluded datasheets;
- native faction membership through parent faction hierarchy;
- duplicate datasheet limits with Epic Hero, Battleline and Dedicated Transport overrides;
- successor chapter Epic Hero conflict;
- mandatory faction warlord;
- mandatory detachment warlord;
- Supreme Commander warlord;
- generic warlord count and eligibility;
- conditional keywords required for warlord eligibility;
- enhancement that prevents being warlord;
- allegiance ability group min/max;
- unit-level allegiance ability group/mandatory/wargear requirements;
- faction mandatory allegiance ability path;
- allied faction availability by parent faction;
- allied datasheet whitelist;
- allied points caps by battle size;
- allied required detachment;
- allied required/allowed warlord;
- allied keyword count caps;
- allied keyword caps gated by warlord;
- allied mutually exclusive keyword buckets;
- allied slotless donor/receiver keyword groups;
- allied restricting-keyword outnumbering rule;
- allied required allegiance ability path;
- enhancement roster limit;
- one enhancement per unit;
- one enhancement per attached unit;
- per-enhancement `limit`;
- enhancement detachment requirement;
- enhancement target type: model/unit/upgrade;
- enhancement permission for allied units;
- enhancement Epic Hero/non-Character exceptions;
- enhancement required keyword groups;
- enhancement excluded keywords;
- enhancement required wargear item;
- enhancement bodyguard requirements;
- Combat Patrol default enhancement path;
- unit maximum model count;
- unit composition min/max validity;
- composition required faction/detachment availability;
- attached unit group completeness;
- attached leader/support/bodyguard legality;
- attached unit detachment-specific shared keyword requirements;
- unit-must-be-attached validator path;
- unit-level wargear scope validation;
- model-level wargear scope validation;
- loadout choice-set exact matching;
- multi-model loadout partitioning;
- alternate loadout choice sets;
- duplicate/empty loadout choices;
- limited wargear choice sets;
- mandatory limited wargear choice sets;
- limited choice `choiceLimit` and `duplicateLimit`;
- all-model wargear choice sets and substitutes;
- selected wargear on count-0 miniature invalid;
- aggregate valid/invalid state based on presence of any error.

## Bottom line

The installed app confirms that Battle Forge roster validation is a compiled
validator pipeline backed by a large migrated SQLite rule catalog. The validator
taxonomy is recoverable from binary offsets and localized error keys, but the
exact Swift control flow is not shipped as source.

The largest rule surfaces remain allies, enhancements, attachments and wargear.
The explicit attached-group `UnitMustBeAttached` path is now covered in Builder;
the remaining attachment watch item is whether future app data exposes a
standalone must-attach flag that is not represented as an obvious DB field in
v879.
