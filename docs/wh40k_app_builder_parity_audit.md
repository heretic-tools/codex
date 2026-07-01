# WH 40K app vs Heretic Builder roster validation parity audit

Date: 2026-07-01

Scope: compare the local Heretic Builder thin-client implementation with the
installed official Warhammer 40,000 app Battle Forge validation surface.

This document is intentionally stricter than a simple "missing validator" pass.
It separates:

- validators/errors proven by the official app binary and localization bundles;
- catalog/rule data parity between the official app DB and our DB;
- our JS implementation coverage;
- confirmed gaps, data-version-dependent risks, and golden-test requirements.

No decompilation or protection bypass was used. Evidence comes from local
strings, localized validation keys, SQLite schema/counts, and our source code.

## Executive verdict

It is not "only one issue".

The Builder already covers most top-level Battle Forge rule families, but it is
not yet proven equivalent to the WH 40K app. The highest-risk areas are:

1. Wargear validation parity: our loadout engine uses normalized item names as
   matching keys in several places, while the official app exposes
   `RawWargearItem`, `RawWargearChoice`, `LoadoutKey`, and a dedicated
   `WargearValidation` pipeline. Current data has many duplicate wargear names,
   including a same-datasheet case in Cthonian Beserks.
2. Enhancement/warlord interaction: `cannotBeWarlord` is checked at unit level,
   not target-miniature level.
3. `KeywordAllyRestrictingKeywordValidator`: the new table path is loaded but
   not scoped to the allied faction. It is harmless in v879 only because the
   table is empty.
4. `RosterAttachedUnitValidator.UnitMustBeAttached`: the official app has a
   distinct error case. Our code only validates groups that already exist; it has
   no separately named equivalent for this case.
5. Some parity is currently data-accidental. For example, parent faction scope
   is safe in v879 because there are no hidden parent factions for visible
   children, but the code still relies on a bootstrap-visible map for
   `factionScope`.

The data export itself is not the main problem: key table counts in
`data/heretic_db.sqlite` match the installed WH 40K app runtime DB one-for-one
for the roster validation tables checked below.

Implementation update, 2026-07-01:

- Builder validation messages now include stable `code` values.
- `factionScope` now walks the full `faction_keyword` catalog map.
- Enhancement `cannotBeWarlord` now checks the targeted miniature for miniature
  enhancements.
- New-table ally restricting keyword rows are scoped through the keyword's
  faction restriction when that scope is present.
- Initial `node:test` coverage exists for those fixes and for code emission.

## Evidence baseline

Official app:

- App wrapper: `/Applications/WH 40K.app`
- Main app bundle: `/Applications/WH 40K.app/Wrapper/w40.app`
- Main executable: `/Applications/WH 40K.app/Wrapper/w40.app/w40`
- Bundle id: `com.gamesworkshop.w40k`
- App version: `2.0.3`
- Official app runtime DB:
  `/Users/losikov/Library/Containers/com.gamesworkshop.w40k/Data/Library/Application Support/db.sqlite`
- Official app data version: `879`

Builder:

- Project DB: `data/heretic_db.sqlite`
- Builder data version: `879`
- Main orchestration: `HereticBuilder/static/builder_roster_validation.js`
- Catalog loading: `HereticBuilder/static/builder_catalog.js`
- Export list: `HereticBuilder/tools/export_builder_data.py`

Official validation evidence:

- Validator/error names from the app binary at offsets around
  `0x108b350..0x108c876`.
- Validation localization keys from:
  - `Datasource_BattleForgeDatasource.bundle/en.lproj/Localizable.strings`
  - `UI_BattleForgeUI.bundle/en.lproj/Localizable.strings`

## Data parity check

The following important table counts match between the installed WH 40K app DB
and `data/heretic_db.sqlite`.

| Table | Count |
| --- | ---: |
| `battle_size` | 3 |
| `faction_keyword` | 43 |
| `datasheet` | 1142 |
| `datasheet_faction_keyword` | 1256 |
| `miniature` | 1569 |
| `miniature_keyword` | 8773 |
| `conditional_keyword` | 380 |
| `detachment` | 290 |
| `detachment_faction_keyword` | 457 |
| `detachment_faction_detachment_points_cost` | 4 |
| `detachment_unique_keyword` | 57 |
| `detachment_excluded_datasheet` | 23 |
| `detachment_required_datasheet` | 0 |
| `detachment_linked_datasheet` | 107 |
| `detachment_granted_warlord_miniature` | 1 |
| `detachment_mandatory_warlord_miniature` | 2 |
| `allegiance_ability_group` | 10 |
| `allegiance_ability` | 26 |
| `allied_faction` | 21 |
| `faction_keyword_allied_faction` | 87 |
| `allied_faction_datasheet` | 320 |
| `allied_faction_keyword` | 54 |
| `allied_faction_points_limit` | 39 |
| `allied_faction_required_detachment` | 29 |
| `allied_faction_allowed_warlord_miniature` | 28 |
| `keyword_ally_restricting_keyword` | 0 |
| `keyword_restriction_group` | 16 |
| `keyword_restriction_group_keyword` | 21 |
| `restriction_group_detachment_limit` | 7 |
| `enhancement` | 957 |
| `enhancement_required_keyword_group` | 1027 |
| `enhancement_excluded_keyword` | 32 |
| `enhancement_required_wargear_item` | 1 |
| `unit_composition` | 1516 |
| `unit_composition_miniature` | 2258 |
| `base_miniature_loadout` | 1300 |
| `loadout_choice_set` | 2445 |
| `loadout_choice` | 5374 |
| `limited_wargear_choice_set` | 343 |
| `wargear_limit` | 492 |
| `all_model_wargear_choice_set` | 28 |
| `wargear_item` | 3516 |
| `wargear_option` | 6322 |
| `wargear_option_group` | 3025 |

Current v879 empty rule tables that still need code paths:

- `faction_keyword_mandatory_allegiance_ability`: 0
- `allied_faction_allegiance_ability`: 0
- `detachment_required_datasheet`: 0
- `enhancement_keyword_points_cost`: 0
- `keyword_ally_restricting_keyword`: 0

## Official validator matrix

Status values:

- `Covered`: a matching Builder rule exists and current data confirms the path.
- `Covered, data-empty`: code exists, but v879 has no live rows for that table.
- `Partial`: same rule family exists, but algorithm or scope does not fully
  prove WH app parity.
- `Gap`: no equivalent or a clearly different implementation.

| Official validator/error | Builder location | Status | Notes |
| --- | --- | --- | --- |
| `AllegianceAbilityGroupRosterLimitValidator` | `builder_allegiance_rules.js:46-60` | Covered | Checks min/max group counts. v879 has groups with limits. |
| `MinRosterLimitForAllegianceAbilityGroup` | `builder_allegiance_rules.js:54-56` | Covered | Example: Houndpack Lance Keyword min 3. |
| `ExceededRosterLimitForAllegianceAbilityGroup` | `builder_allegiance_rules.js:57-59` | Covered | Example: Headhunter Task Force Keywords max 3. |
| `AllegianceAbilityValidator` | `builder_allegiance_rules.js:7-45` | Covered | Per-unit group, mandatory group, wrong group, required detachment, required wargear. |
| `MissingRequiredWargearItem` | `builder_allegiance_rules.js:39-43` | Covered | v879 has 4 allegiance abilities with `requiresWargearItemId`. |
| `MissingAllegianceAbility` | `builder_allegiance_rules.js:33-35` | Covered | v879 has 5 mandatory allegiance groups. |
| `TooManyAllegianceAbilities` | `builder_allegiance_rules.js:36-38` | Covered | Blocks more than one selected ability in a unit group. |
| `MissingMandatoryAllegianceAbility` | `builder_allegiance_rules.js:61-73` | Covered, data-empty | Table has 0 rows in v879. |
| `AlliedFactionDetachmentValidator` | `builder_allied_rules.js:162-168` | Covered | Uses required detachment from `allied_faction` plus join table. |
| `InvalidDetachmentError` | `builder_allied_rules.js:162-168` | Covered | Message is custom, semantics present. |
| `AlliedKeywordCountValidator` | `builder_allied_rules.js:47-70` | Covered | Includes battle-size and warlord-gated keyword limits. |
| `InvalidMutuallyExclusiveKeywords` | `builder_allied_rules.js:66-69` | Covered | Active keyword bucket count > 1. |
| `AlliedRequiredWarlordKeywordCountLimitExceeded` | `builder_allied_rules.js:53-64` | Covered | Skips rows until required warlord is selected, then enforces cap. |
| `AlliedKeywordCountLimitExceeded` | `builder_allied_rules.js:61-64` | Covered | Counts ally units with configured keyword, with slotless reduction. |
| `AlliedPointsValidator` | `builder_allied_rules.js:178-184` | Covered | Per battle-size allied points caps. |
| `AlliedPointsLimitExceeded` | `builder_allied_rules.js:180-184` | Covered | Semantics present. |
| `AlliedUnitsRequiredAllegianceValidator` | `builder_allied_rules.js:72-81` | Covered, data-empty | Table has 0 rows in v879. |
| `RequiredAllegianceAbilityMissing` | `builder_allied_rules.js:72-81` | Covered, data-empty | Code path exists. |
| `AlliedUnitsRequiredWarlordValidator` | `builder_allied_rules.js:148-160` | Covered | Handles required warlord and allowed warlord list. |
| `RequiredWarlordMissing` | `builder_allied_rules.js:148-160` | Covered | Semantics present. |
| `DetachmentExcludedDatasheetValidator` | `builder_restriction_rules.js:70-76` | Covered | Uses `detachment_excluded_datasheet`. |
| `DetachmentDatasheetNotAllowed` | `builder_restriction_rules.js:70-76` | Covered | Semantics present. |
| `DetachmentPointsLimitValidator` | `builder_roster_validation.js:32-50` | Covered | Uses battle-size DP limit and detachment point override. |
| `DetachmentPointsBattleSizeLimitExceeded` | `builder_roster_validation.js:47-50` | Covered | Semantics present. |
| `DetachmentRequiredDatasheetValidator` | `builder_restriction_rules.js:78-107` | Partial | `detachment_required_datasheet` is covered but empty; Combat Patrol linked datasheets are also enforced. Need verify this matches official split between required and linked rows. |
| `DetachmentDatasheetsMissing` | `builder_restriction_rules.js:78-99` | Covered, data-empty | Required table empty; linked Combat Patrol path live. |
| `EnhancementValidator` | `builder_enhancement_rules.js:78-163` | Partial | Broad coverage, but `cannotBeWarlord` target scope is wrong. |
| `ModelsHaveSameEnhancements` | `builder_enhancement_rules.js:106-117` | Covered | Per-enhancement limit. |
| `RosterHasTooManyEnhancements` | `builder_enhancement_rules.js:101-105` | Covered | Battle-size enhancement limit. |
| `UnitHasTooManyEnhancements` | `builder_enhancement_rules.js:82-99` | Covered | More than one selected enhancement on a unit. |
| `UnitDoesNotHaveRequiredKeywords` | `builder_enhancement_rules.js:6-34`, `142-144` | Covered | Unit/faction required keyword groups. |
| `ModelDoesNotHaveRequiredWargearItem` | `builder_enhancement_rules.js:149-153` | Covered | v879 has 1 enhancement required-wargear row. |
| `ModelDoesNotHaveRequiredKeywords` | `builder_enhancement_rules.js:87-91`, `142-144` | Covered | Miniature target keywords checked. |
| `ModelHasEnhancementWithExcludedKeyword` | `builder_enhancement_rules.js:36-42`, `145-148` | Covered | v879 has 32 excluded keyword rows. |
| `AttachedModelHasTooManyEnhancements` | `builder_attachment_rules.js:132-147` | Covered | Attached unit group enhancement count > 1. |
| `FactionKeywordExcludedDatasheetValidator` | `builder_model.js:356-360`, `builder_roster_validation.js:78-86` | Covered | Uses faction scope. |
| `FactionDatasheetNotAllowed` | `builder_roster_validation.js:78-86` | Covered | Semantics present. |
| `KeywordAllyRestrictingKeywordValidator` | `builder_allied_rules.js:83-125` | Partial | Legacy `keyword.allyRestrictingKeywordId` path scopes by allied parent. New table path is global and unscoped; harmless only because v879 has 0 rows. |
| `RestrictingKeywordError` | `builder_allied_rules.js:108-123` | Partial | Count logic exists; scope problem above. |
| `KeywordRestrictionGroupValidator` | `builder_restriction_rules.js:110-184` | Partial | Current groups work; exact-roster-faction loading may miss future parent-scope groups. |
| `KeywordRestrictionGroupError` | `builder_restriction_rules.js:141-180` | Covered | Limit, zero-limit, detachment min/max messages are custom. |
| `MandatoryWarlordValidator` | `builder_warlord_rules.js:38-79` | Covered | Faction mandatory rows are empty; detachment mandatory rows live. |
| `MandatoryWarlordNotNotPresentInRoster` | `builder_warlord_rules.js:42-50` | Covered, data-empty for faction | Detachment mandatory uses selected warlord list. |
| `MandatoryWarlordNotSelected` | `builder_warlord_rules.js:48-50`, `73-79` | Covered | Semantics present. |
| `SupremeCommanderNotSelected` | `builder_warlord_rules.js:63-68` | Covered | v879 has 17 supreme commander miniatures. |
| `MaxModelCountValidator` | `builder_restriction_rules.js:26-36` | Covered | Uses datasheet max model count and composition availability. |
| `TooManyModels` | `builder_restriction_rules.js:28-30` | Covered | Semantics present. |
| `RosterAttachedUnitValidator` | `builder_attachment_rules.js:49-88` | Partial | Group validity and leader/support matching exist. `UnitMustBeAttached` has no direct standalone equivalent. |
| `AttachedUnitLeaderOrSupportMissingRequirements` | `builder_attachment_rules.js:82-85` | Covered | Uses datasheet bodyguard groups. |
| `AttachedUnitNoMatchingKeyword` | `builder_attachment_rules.js:26-43` | Covered | Keyword intersection and all-units keyword condition. |
| `AttachedUnitDetachmentNoMatchingKeyword` | `builder_attachment_rules.js:16-20`, `36-43` | Covered | Required/excluded detachment and keyword condition. |
| `BodyguardGroupValidity` | `builder_attachment_rules.js:22-35`, `75-85` | Covered | Datasheet/keyword bodyguard group validity. |
| `UnitMustBeAttached` | `builder_attachment_rules.js:49-53`, `75-80` | Gap or unproven | Official app has a distinct error. Builder returns early when there are no groups and only reports incomplete groups after a group exists. Needs golden test against official app behavior. |
| `RosterDetachmentValidator` | `builder_roster_validation.js:38-45`, `builder_restriction_rules.js:5-24` | Covered | Selection, faction availability, unique keyword. |
| `RosterDetachmentNotSelected` | `builder_roster_validation.js:38-40` | Covered | Semantics present. |
| `RosterDetachmentUniqueKeywordError` | `builder_restriction_rules.js:5-24` | Covered | Current keyword names are unique enough for this path; ID-keying would be safer. |
| `RosterPointsValidator` | `builder_roster_validation.js:35-54` | Covered | Unit points sum versus battle-size points. |
| `RosterPointsLimitExceeded` | `builder_roster_validation.js:51-54` | Covered | Semantics present. |
| `RosterUnitLimitValidator` | `builder_roster_validation.js:66-95` | Covered | Duplicate limit, Epic Hero limit, successor conflict. |
| `RosterHasTooManyOfEpicHero` | `builder_validation_core.js:24-31`, `builder_roster_validation.js:88-93` | Covered | Epic Hero duplicate limit = 1. |
| `RosterHasEpicHeroAndSuccessorChapter` | `builder_restriction_rules.js:39-63` | Partial | Checks direct shared faction keyword IDs. Needs golden tests for parent-faction wording in official message. |
| `RosterHasTooManyOfUnit` | `builder_roster_validation.js:88-93` | Covered | Battleline/Dedicated Transport limit 6, else battle-size duplicate limit. |
| `UnitCompositionValidator` | `builder_model.js:386-408`, `builder_restriction_rules.js:26-36` | Covered | Required faction/detachment composition rows. |
| `InvalidUnitComposition` | `builder_restriction_rules.js:31-35` | Covered | Semantics present. |
| `WargearLoadoutValidator` | `builder_wargear_rules.js:221-248`, `builder_loadout_math.js:81-220` | Partial | Engine exists, but algorithm is simplified and name-keyed. Needs parity tests for official loadout diagnostics. |
| `LoadoutKey` | `builder_loadout_math.js:7-12`, `36-37` | Partial | Our key is normalized name counts, not proven equivalent to official `LoadoutKey`. |
| `InvalidWargearLoadout` | `builder_wargear_rules.js:226-244` | Partial | Miniature/unit loadout failures covered. Name-key matching can mask ID-level differences. |
| `InvalidWargearRequirement` | `builder_wargear_rules.js:130-194` | Partial | Limited and all-model requirements covered, but all-model path is much simpler than official diagnostics. |
| `WarlordValidator` | `builder_warlord_rules.js:34-84` | Covered | Missing/multiple/eligibility/conditional Character. |
| `InvalidWarlordGeneric` | `builder_warlord_rules.js:80-84` | Covered | Message custom. |
| `InvalidWarlordDueToEnhancements` | `builder_enhancement_rules.js:158-160` | Partial | Checks `unit.isWarlord`, not whether the enhanced model is the selected warlord. |
| `MissingWarlord` | `builder_warlord_rules.js:52-56` | Covered | Semantics present. |
| `TooManyWarlords` | `builder_warlord_rules.js:58-60` | Covered | Semantics present. |
| `InvalidWarlordDueToKeywords` | `builder_warlord_rules.js:12-32` | Covered | Conditional Character keyword handled. |

## Confirmed or high-risk discrepancies

### 1. Wargear matching is not proven equivalent

Builder code:

- `builder_loadout_math.js:81-89` converts choice item rows into counts keyed by
  `lowerName(item.name)`.
- `builder_wargear_rules.js:32-48` converts selected wargear into counts keyed by
  `lowerName(item.name)`.
- `builder_model.js:511-520` does the same for default option item counts.

Data facts:

- v879 has 614 duplicated lower-case wargear names across 2149 item IDs.
- Within a single datasheet context, `Cthonian Beserks` has two different
  `Heavy plasma axe` item IDs:
  - base/loadout item: `5a2b0491-c8db-4394-90cc-849d3b7d60ed`
  - all-model item: `95e3c57e-a5bf-4a43-bf6a-12b0605c7d48`
- The second ID has no `wargear_option` row, so name-normalization may be
  intentionally compensating for odd source data. That makes this a parity
  hotspot rather than an immediate "switch all matching to IDs" fix.

Required action:

- Add golden tests for Cthonian Beserks, Eliminator Squad, Termagants, and at
  least one limited-wargear unit.
- Only after those tests decide whether to keep a name-normalized bridge or move
  to a canonical item-id/loadout-key layer.

### 2. Enhancement `cannotBeWarlord` is checked too broadly

Builder code:

- `builder_enhancement_rules.js:158-160`

Current behavior:

- If an enhancement has `cannotBeWarlord`, Builder errors when `unit.isWarlord`
  is true.

Problem:

- Official error is `InvalidWarlordDueToEnhancements`, which is model-level in
  the surrounding enhancement validator names.
- Builder should compare the enhancement target model to the selected warlord
  miniature. A non-warlord model in the same unit should not poison the warlord
  unless the official app explicitly treats unit-level enhancements that way.

Data:

- v879 has 1 such enhancement: `Disciple of Khorne`.

Required action:

- Change the check to target the selected warlord miniature, preserving
  unit-level enhancement behavior only when the enhancement itself is unit-level.

### 3. New-table ally restricting keyword rows are unscoped

Builder code:

- `builder_catalog.js:320` builds
  `keywordAllyRestrictingKeywordsByKeywordId`.
- `builder_allied_rules.js:83-87` ignores that index and pushes every row from
  `keywordAllyRestrictingKeywords`.
- `builder_allied_rules.js:88-100` separately handles the legacy
  `keyword.allyRestrictingKeywordId` path and scopes it by allied parent faction.

Data:

- `keyword_ally_restricting_keyword` has 0 rows in v879.
- Legacy keyword rows have 4 rows: Khorne, Nurgle, Slaanesh, Tzeentch restricted
  by Battleline for Legiones Daemonica.

Problem:

- The bug is dormant in v879, but if Games Workshop populates the new table, our
  validator will apply all rows to all allied factions.

Required action:

- Either scope new table rows by an explicit faction/allied-faction column if it
  exists in a later schema, or derive scope the same way as the legacy path.
- Add a regression fixture with a synthetic new-table row.

### 4. `UnitMustBeAttached` is not directly implemented

Official evidence:

- Binary type: `UnitMustBeAttached`
- Datasource localized message key: `attach_unit_required`

Builder code:

- `builder_attachment_rules.js:49-53` returns immediately if no attached groups.
- `builder_attachment_rules.js:75-80` reports an incomplete attached group only
  after a group exists.

Problem:

- If the official app emits `UnitMustBeAttached` for a unit state that exists
  outside an already-created attached group, Builder has no equivalent.

Required action:

- Create golden cases in WH app:
  - support/leader unit not attached;
  - group with leader but no bodyguard;
  - group with bodyguard but no leader/support.
- Mirror the official distinction between "must be attached" and "group is
  incomplete".

### 5. Keyword restriction scope is currently correct by data, not by proof

Builder code:

- `builder_restriction_rules.js:152-154` starts from exact
  `roster.factionKeywordId`.
- `builder_restriction_rules.js:165-183` pulls detachment-linked groups even if
  they were not in the initial exact-faction map.

Data:

- v879 groups exist for Astra Militarum, Asuryani, Black Templars, Chaos
  Knights, Drukhari, Genestealer Cults, T'au Empire, and Ultramarines.
- Visible child factions only point to visible `Adeptus Astartes`, so
  `factionScope` does not currently lose hidden parents.

Risk:

- If a future data version adds parent-scope restriction groups for a child
  roster faction, exact-faction loading may miss them.

Required action:

- Decide whether official `KeywordRestrictionGroupValidator` is exact roster
  faction or inherited faction scope by golden test. If inherited, load groups
  for all IDs in `factionScope(roster.factionKeywordId)`.

### 6. `factionScope` uses the visible bootstrap faction map

Builder code:

- `builder_model.js:52-61` walks parent IDs using `state.catalog.factionById`.
- `builder_catalog.js:263` builds `factionById` from `bootstrap.factions`, which
  excludes `excludedFromArmyBuilder` factions.
- `builder_catalog.js:266` separately has `factionKeywordById` for all faction
  rows.

Data:

- v879 visible child factions only have visible parent `Adeptus Astartes`.

Risk:

- A future visible faction with a hidden parent would lose parent scope in native
  checks, faction exclusions, enhancement faction requirements, and keyword
  restrictions.

Required action:

- Use `factionKeywordById` for scope walking unless there is a deliberate UI-only
  reason to ignore hidden parents.

### 7. Official messages and Builder messages are not parity-equivalent

Builder returns custom English strings. The official app has named localization
keys for every validator family. This is fine for an internal MVP, but not
equivalent if users compare diagnostics.

Required action:

- Introduce stable validation codes matching our internal concepts, ideally
  mapped to official key names where legal and useful.
- Tests should assert codes first, text second.

## Checked and currently OK

These were suspicious, but the current data/code check did not reveal a live
parity issue:

- Allegiance field names: Builder uses `group.detachmentId`,
  `group.isMandatory`, and `ability.requiresWargearItemId`, matching exported
  v879 columns.
- Generic keyword name checks: `Battleline`, `Character`,
  `Dedicated Transport`, and `Epic Hero` are unique in v879, so duplicate keyword
  names do not break duplicate-limit or generic warlord checks today.
- Hidden parent factions: no visible child faction in v879 points to a hidden
  parent faction.
- Data export coverage: roster-relevant catalog tables are exported; missing
  behavior is not because the tables are absent from `CATALOG_TABLES`.

## Minimum golden parity suite

Static audit cannot prove exact Battle Forge parity. The minimum next suite
should create the same roster cases in WH 40K app and Builder, then compare
valid/invalid state and error categories.

Required cases:

1. Heretic Astartes with Legiones Daemonica allies:
   - Daemon allies under/over points cap.
   - Khorne/Nurgle/Slaanesh/Tzeentch non-Battleline outnumbering Battleline.
   - Chaos Knights / Titanicus Traitoris ally cap cases.
2. Adeptus Astartes child factions:
   - Black Templars detachment DP override.
   - Stormlance override for Blood Angels/Deathwatch/Black Templars.
   - Successor chapter Epic Hero conflict.
3. Ynnari / Asuryani / Drukhari:
   - Devoted of Ynnead mandatory warlord.
   - Asuryani restriction groups excluding Ynnari.
4. Enhancements:
   - Roster enhancement limit by battle size.
   - Required keyword group success/failure.
   - Excluded keyword failure.
   - Required wargear failure.
   - `Disciple of Khorne` and warlord target behavior.
5. Attachments:
   - Valid leader/bodyguard.
   - Invalid leader/bodyguard keyword.
   - Support unit missing required group.
   - Official `UnitMustBeAttached` trigger case.
6. Wargear:
   - Cthonian Beserks heavy plasma axe / concussion maul / twin gauntlet.
   - Eliminator Sergeant substitute-only all-model set.
   - Termagants all-model substitution.
   - A limited-wargear unit with model-count thresholds.
   - A zero-count miniature with selected wargear.
7. Allegiance abilities:
   - Pactbound Zealots Mark of Chaos mandatory selection.
   - Required wargear for Daemonic Allegiance.
   - Headhunter/Houndpack/Solar/Subterranean roster min/max group limits.

## Priority action list

1. Build a validation-code layer so every Builder message has a stable code.
2. Add golden parity fixtures for the cases above.
3. Fix `cannotBeWarlord` to evaluate the enhancement target, not the whole unit.
4. Decide and implement the official behavior for `UnitMustBeAttached`.
5. Harden `KeywordAllyRestrictingKeywordValidator` for future new-table rows.
6. Rework `factionScope` to use the full faction keyword table.
7. Revisit wargear matching after golden tests. Do not blindly switch to IDs
   without handling the Cthonian Beserks all-model duplicate-name case.
