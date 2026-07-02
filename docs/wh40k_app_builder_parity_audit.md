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

The Builder now covers every current `validationMessage(...)` error code with at
least one `node:test` assertion, but it is still not fully proven equivalent to
the WH 40K app. The highest-risk remaining areas are:

1. Wargear validation parity: Builder now routes loadout matching through
   `canonicalWargearKey`, using item IDs by default and same-context
   duplicate-name aliases only where the catalog needs a bridge. The official
   app still exposes richer `RawWargearItem`, `RawWargearChoice`, `LoadoutKey`,
   and `WargearValidation` concepts, so exact diagnostic parity still needs WH
   app fixture comparison.
2. Some parity remains data-version-sensitive. Empty v879 tables now have
   synthetic coverage for their code paths, but still need live WH app
   comparison once Games Workshop populates those tables.

Resolved during implementation:

- Enhancement/warlord interaction now checks the targeted miniature for
  miniature enhancements.
- Ally restricting keyword rows now respect the allied source parent's faction
  ancestry when a keyword restriction points at a parent faction.
- `factionScope` now walks the full `faction_keyword` table rather than the
  bootstrap-visible faction list.
- `RosterAttachedUnitValidator.UnitMustBeAttached` is implemented for explicit
  attached groups that contain leader/support members without a bodyguard;
  standalone must-attach remains a future-data watch because v879 has no such
  catalog flag.

The data export itself is not the main problem: key table counts in
`data/heretic_db.sqlite` match the installed WH 40K app runtime DB one-for-one
for the roster validation tables checked below.

Implementation updates, 2026-07-01 to 2026-07-02:

- Builder validation messages now include stable `code` values.
- `factionScope` now walks the full `faction_keyword` catalog map.
- Enhancement `cannotBeWarlord` now checks the targeted miniature for miniature
  enhancements.
- Ally restricting keyword rows are scoped through the allied source parent's
  faction ancestry when the keyword restriction points at a parent faction.
- Initial `node:test` coverage exists for those fixes and for code emission.
- Golden validation coverage now includes Heretic Astartes allied exceptions,
  allegiance ability edge cases, Adeptus Astartes/Ynnead/Ynnari faction
  exceptions, Drukhari keyword restriction limits, attachment group paths, and
  high-risk wargear fixtures for
  duplicate-name all-model matching, substitutions, limited thresholds, and
  zero-count miniature wargear.
- Mandatory faction allegiance abilities are read through `factionScope`, so
  future parent-faction rows apply to child roster factions. v879 has no live
  rows in that table.
- Attachment coverage now includes valid leader/bodyguard groups, incomplete
  groups, duplicate membership, invalid leader requirements, and invalid support
  requirements. Explicit leader/support-without-bodyguard groups now emit
  `attached_unit.must_be_attached`, matching the official
  `attach_unit_required` localization. v879 exposes no standalone must-attach
  catalog flag outside roster attachment state groups.
- Enhancement golden coverage now includes roster/per-unit/duplicate limits,
  required detachment, required keyword/faction groups, excluded keywords,
  required wargear, attached bodyguard requirements, and attached-unit
  enhancement limits. Model-targeted enhancement checks now include active
  conditional keywords from the unit summary, covering Character-granting
  allegiance abilities such as Headhunter Task Force vehicle Characters and
  roster-faction-scoped chapter keywords such as Dark Angels `Deathwing`.
- Conditional keyword predicate coverage now walks every live v879
  `conditional_keyword` row. All 380 rows are proven true when requirements are
  satisfied and false when each configured requirement is missing, covering 270
  allegiance-ability rows, 32 roster-faction rows, 77 detachment rows, and 2
  Warlord-miniature rows.
- Unit-level enhancement coverage now explicitly includes
  `enhancementType = upgrade`. Sharp Eyes (Upgrade) proves upgrade required
  datasheet/faction groups, upgrade points, and the per-enhancement duplicate
  limit of 3 are enforced independently from the Strike Force roster
  enhancement limit of 4.
- The data-empty `enhancement_keyword_points_cost` path has synthetic coverage:
  active keyword matching, `displayOrder` precedence, base-cost fallback, and
  unit-summary point totals are all asserted.
- Data-empty allegiance requirement paths are covered in both directions:
  mandatory faction allegiance abilities inherit through `factionScope` and
  allied required allegiance abilities emit only when the required ability is
  absent.
- Live allegiance coverage now walks all current v879 allegiance row shapes:
  all 10 groups, all 26 abilities, all 5 mandatory groups, all 7
  detachment-scoped groups, all 4 required-wargear abilities, the 1 min-limit
  group, and all 4 max-limit groups. The currently empty mandatory-faction and
  allied-required allegiance tables are pinned by inventory coverage.
- The data-empty `detachment_required_datasheet` path has synthetic coverage for
  both missing required units and rosters that include the required datasheet.
- A catalog inventory test guards all currently data-empty rule tables. If a
  future data version adds live rows, the test fails until live roster fixtures
  and this audit are updated.
- Allegiance validators now share the same current-shape selection normalizer as
  unit summaries. Compact selected ability IDs and object rows are equivalent
  for unit allegiance checks, allied required allegiance checks, and conditional
  Warlord keywords.
- Enhancement validators now share the same current-shape selection normalizers
  as unit summaries. Compact `{id}` and `{id,targetId}` rows are equivalent to
  object rows for unit, miniature, and attached-unit enhancement rules.
- Enhancement selection UI also reads through the shared normalizers, but writes
  only compact `{id}` and `{id,targetId}` rows back to local cache. Full catalog
  enhancement objects are not persisted by the client.
- Bare string enhancement rows are no longer treated as selected enhancements.
  The current new-app shape is object rows only for unit/model enhancements.
- Old-roster runtime fallbacks for `attachedUnits`, `allegianceAbilityIds`,
  `unitWargear`, `enhancementIds`, and nested miniature enhancement arrays were
  removed. The static Builder now validates only the current new-app roster
  shape.
- Warlord and top-level roster coverage now includes missing/multiple/invalid
  warlord cases, Supreme Commander enforcement, detachment unique keyword
  collisions by keyword ID, all current live detachment unique-keyword shared
  groups, all current live detachment/faction datasheet exclusions, Combat
  Patrol linked datasheet constraints across all current linked rows,
  conditional Character Warlord eligibility, unit composition diagnostics, and
  duplicate datasheet limits including Epic Heroes.
- Default composition selection now prefers matching detachment-specific rows,
  then faction-specific rows, before generic rows. Saved generic default
  composition IDs are also normalized to the more specific current default, and
  saved generic non-default composition IDs normalize to a more specific
  equivalent when the model-count shape is the same. Live coverage checks
  Pantheon of Woe C'tan points, Blood Angels Bladeguard Veteran Squad points,
  and Blood Angels large Assault Intercessors with Jump Packs points.
- The unit edit screen now exposes a current-roster composition picker. It only
  lists compositions available for the selected roster faction/detachments,
  hides generic/specific duplicates with the same model-count shape, and resets
  model-level wargear/enhancements when switching composition.
- Allied golden coverage now includes all four Heretic Astartes cult-legion
  parent factions, Titanicus Traitoris titan keyword caps, Agents of the
  Imperium allowed-warlord requirements, and slotless Retinue donor/receiver
  counting.
- Allied points-limit coverage now walks every live v879
  `allied_faction_points_limit` row and proves valid-at-cap plus
  invalid-over-cap states for all 39 current rows.
- Allied availability coverage now walks every live v879
  `faction_keyword_allied_faction` row and proves all 87 current
  roster-faction/ally-bucket pairs are available, with unavailable control
  rosters for each ally bucket.
- Allied datasheet coverage now walks every live v879 `allied_faction_datasheet`
  row and proves all 320 current ally-bucket/datasheet pairs are allowed, with
  disallowed control datasheets for each row's ally bucket.
- Allied keyword-limit coverage now walks every live v879
  `allied_faction_keyword` row and proves valid-at-cap plus invalid-over-cap
  states for all 54 current rows. It also covers all 12 current mutually
  exclusive battle-size buckets and all 12 current slotless donor/receiver
  groups.
- Allied required-detachment coverage now walks every live v879
  `allied_faction_required_detachment` row and proves missing-detachment
  invalid plus selected-detachment valid states for all 29 current rows.
- Allied allowed-warlord coverage now walks every live v879
  `allied_faction_allowed_warlord_miniature` row and proves missing-Warlord
  invalid plus selected configured Warlord valid states for all 28 current rows.
- Allied rule-table inventory coverage now pins every current v879 allied table
  count, including the 25 allied parent rows, the empty
  `keyword_ally_restricting_keyword` new table, and the 4 legacy
  `keyword.allyRestrictingKeywordId` rows.
- Allied restricting-keyword coverage now walks every live v879 legacy
  restricting keyword row and proves invalid plus paired-valid states for all 4
  Khorne/Nurgle/Slaanesh/Tzeentch Battleline outnumbering rules.
- Keyword restriction groups are now loaded through `factionScope`, so
  parent-scoped restriction rows are inherited by child roster factions.
- Wargear matching now uses `canonicalWargearKey`: normal rows use item-ID keys,
  while confirmed same-context duplicate-name bridges use explicit `name:`
  aliases.
- Limited wargear validation is option-aware: base/default components embedded
  in upgrade choices do not spend optional limited caps, while default-only
  limited choices still count against `choiceLimit` and `duplicateLimit`.
  Overlapping combo rows are validated by bounded exact cover rather than by
  summing independent occurrences.
- Default miniature wargear is not generated for zero-count optional models.
- Canonical wargear aliases are now precomputed by `export_builder_data.py` into
  `bootstrap.wargearAliases`, keeping the static runtime to a small lookup path.
  The export stores only datasheet-scope alias rows; miniature contexts use the
  existing datasheet fallback.
- Conditional keywords with `requiredRosterFactionKeywordId` now match through
  `factionScope`, so parent-faction requirements can apply to child rosters.
  v879 live rows are Dark Angels scoped; synthetic coverage guards future child
  faction data.
- Faction mandatory warlord lookup also walks `factionScope` from child to
  parent. v879 has no live faction mandatory warlord rows, but synthetic
  coverage guards future parent-faction data.
- Live Warlord coverage now includes `detachment_granted_warlord_miniature`:
  Deathleaper is invalid as Warlord by default but valid in Vanguard Onslaught.
- Live detachment Warlord coverage now walks every v879
  `detachment_mandatory_warlord_miniature` and
  `detachment_granted_warlord_miniature` row, proving invalid and valid states
  for all 3 current rows.
- Duplicate-unit coverage now includes conditional Battleline. Houndpack Lance
  War Dog Brigands use the Battleline duplicate cap of 6 rather than the
  standard Strike Force cap of 3.
- Test coverage now includes a dev-only concept map from Builder validation
  codes to official-like validator/error names. The static Builder runtime does
  not ship this map.
- The dev-only concept map now preserves the official wargear split:
  `InvalidWargearLoadout` for unit/model loadout mismatches and
  `InvalidWargearRequirement` for limited/all-model requirement failures.
- The split `tests/builder_validation_*.test.mjs` suite now asserts every
  current `validationMessage(...)` and `validationWarning(...)` code at least
  once; `npm test` passes 89 validation tests.
- The minimum parity manifest now anchors required subcases, including Heretic
  Astartes daemon allies under/over the points cap, all 4 live legacy
  Battleline outnumbering rows, the allied rule-table inventory guard, and all
  380 live conditional keyword requirement rows. It also carries live
  allegiance inventory, mandatory, detachment, required-wargear, min/max, and
  ability-row coverage plus the Aeldari/Drukhari keyword restriction subcases
  as explicit anchors.
- Live keyword restriction coverage now walks every v879 top-level
  `keyword_restriction_group` with a configured limit and proves valid plus
  invalid states for all 15 current groups.
- Live detachment-linked keyword restriction coverage now walks every v879
  `restriction_group_detachment_limit` row and proves valid plus invalid min/max
  states for all 7 current rows.

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

Current v879 empty rule tables with maintained Builder code paths:

- `faction_keyword_mandatory_allegiance_ability`: 0
- `allied_faction_allegiance_ability`: 0
- `detachment_required_datasheet`: 0
- `enhancement_keyword_points_cost`: 0
- `keyword_ally_restricting_keyword`: 0

`tests/builder_validation_catalog_inventory.test.mjs` asserts these rows remain
empty for data version 879. When any count becomes non-zero, add live roster
fixtures before updating this inventory.

## Official validator matrix

Status values:

- `Covered`: a matching Builder rule exists and current data confirms the path.
- `Covered, data-empty`: code exists, but v879 has no live rows for that table.
- `Partial`: same rule family exists, but algorithm or scope does not fully
  prove WH app parity.
- `Gap`: no equivalent or a clearly different implementation.

| Official validator/error | Builder location | Status | Notes |
| --- | --- | --- | --- |
| `AllegianceAbilityGroupRosterLimitValidator` | `builder_allegiance_rules.js:46-60` | Covered | Checks min/max group counts; the 1 current min-limit group and all 4 current max-limit groups have valid and invalid coverage. |
| `MinRosterLimitForAllegianceAbilityGroup` | `builder_allegiance_rules.js:54-56` | Covered | All current min-limit rows are covered. |
| `ExceededRosterLimitForAllegianceAbilityGroup` | `builder_allegiance_rules.js:57-59` | Covered | All current max-limit rows are covered. |
| `AllegianceAbilityValidator` | `builder_allegiance_rules.js:7-45`, `builder_model.js:143-149` | Covered | Per-unit group, mandatory group, wrong group, required detachment, required wargear. All 26 current abilities are accepted by their configured group; selected ability IDs and object rows are normalized through the same current-shape path. |
| `MissingRequiredWargearItem` | `builder_allegiance_rules.js:39-43` | Covered | All 4 current abilities with `requiresWargearItemId` have missing and equipped coverage. |
| `MissingAllegianceAbility` | `builder_allegiance_rules.js:33-35` | Covered | All 5 current mandatory allegiance groups have missing and selected coverage. |
| `TooManyAllegianceAbilities` | `builder_allegiance_rules.js:36-38` | Covered | All 5 current mandatory groups reject multiple selected abilities. |
| `MissingMandatoryAllegianceAbility` | `builder_allegiance_rules.js:63-84` | Covered, data-empty | Table has 0 rows in v879; synthetic coverage proves parent-faction rows are inherited through `factionScope` and that selecting the mandatory ability satisfies the rule. |
| `ConditionalKeywordPredicate` | `builder_model.js:193-215` | Covered | All 380 current `conditional_keyword` rows have satisfied and missing-requirement coverage, including allegiance ability, roster faction, detachment, and Warlord-miniature requirements. |
| `AlliedFactionValidator` | `builder_allied_rules.js:141-145` | Covered | Uses `faction_keyword_allied_faction`; all 87 current rows have available coverage plus unavailable controls. |
| `AlliedFactionNotAvailable` | `builder_allied_rules.js:141-145` | Covered | Semantics present across every current live ally bucket. |
| `AlliedFactionDatasheetValidator` | `builder_allied_rules.js:170-176` | Covered | Uses `allied_faction_datasheet`; all 320 current rows have allowed coverage plus disallowed controls. |
| `AlliedFactionDatasheetNotAllowed` | `builder_allied_rules.js:172-176` | Covered | Semantics present across every current live ally-bucket/datasheet row. |
| `AlliedFactionDetachmentValidator` | `builder_allied_rules.js:162-168` | Covered | Uses required detachment from `allied_faction` plus join table; all 29 current `allied_faction_required_detachment` rows have missing and selected coverage. |
| `InvalidDetachmentError` | `builder_allied_rules.js:162-168` | Covered | Message is custom; semantics are covered across every current live required-detachment row. |
| `AlliedKeywordCountValidator` | `builder_allied_rules.js:47-70` | Covered | Includes battle-size and warlord-gated keyword limits; all 54 current `allied_faction_keyword` rows have valid-at-cap and invalid-over-cap coverage. |
| `InvalidMutuallyExclusiveKeywords` | `builder_allied_rules.js:66-69` | Covered | Active keyword bucket count > 1; all 12 current mutually exclusive battle-size buckets are covered. |
| `AlliedRequiredWarlordKeywordCountLimitExceeded` | `builder_allied_rules.js:53-64` | Covered | Skips rows until required warlord is selected, then enforces cap. |
| `AlliedKeywordCountLimitExceeded` | `builder_allied_rules.js:61-64` | Covered | Counts ally units with configured keyword, with slotless reduction; all 12 current slotless donor/receiver groups are covered. |
| `AlliedPointsValidator` | `builder_allied_rules.js:178-184` | Covered | Per battle-size allied points caps; all 39 current `allied_faction_points_limit` rows have valid-at-cap and invalid-over-cap coverage. |
| `AlliedPointsLimitExceeded` | `builder_allied_rules.js:180-184` | Covered | Semantics present across every current live points-limit row. |
| `AlliedUnitsRequiredAllegianceValidator` | `builder_allied_rules.js:72-81` | Covered, data-empty | Table has 0 rows in v879; synthetic coverage checks missing and selected required ability states. |
| `RequiredAllegianceAbilityMissing` | `builder_allied_rules.js:72-81` | Covered, data-empty | Synthetic coverage emits only when the required ability is absent. |
| `AlliedUnitsRequiredWarlordValidator` | `builder_allied_rules.js:148-160` | Covered | Handles required warlord and allowed warlord list; all 28 current `allied_faction_allowed_warlord_miniature` rows have missing and selected coverage. |
| `RequiredWarlordMissing` | `builder_allied_rules.js:148-160` | Covered | Semantics present across every current live allowed-warlord row. |
| `DetachmentExcludedDatasheetValidator` | `builder_restriction_rules.js:70-76` | Covered | Uses `detachment_excluded_datasheet`; all 23 current rows have invalid/control-valid coverage. |
| `DetachmentDatasheetNotAllowed` | `builder_restriction_rules.js:70-76` | Covered | Semantics present. |
| `DetachmentPointsLimitValidator` | `builder_roster_validation.js:32-50` | Covered | Uses battle-size DP limit and detachment point override. |
| `DetachmentPointsBattleSizeLimitExceeded` | `builder_roster_validation.js:47-50` | Covered | Semantics present. |
| `DetachmentRequiredDatasheetValidator` | `builder_restriction_rules.js:78-107` | Covered, data-empty for required table | `detachment_required_datasheet` is empty in v879; synthetic coverage checks missing and selected required datasheet states. Combat Patrol linked datasheets are live, and all 107 current linked rows across 24 detachments have exact/missing/extra coverage. |
| `DetachmentDatasheetsMissing` | `builder_restriction_rules.js:78-99` | Covered, data-empty | Synthetic coverage emits only when the required datasheet is absent. |
| `EnhancementValidator` | `builder_enhancement_rules.js:78-163`, `builder_model.js:152-159`, `builder_model.js:264-270` | Covered | Broad code coverage includes limits, target type, `unit` and `upgrade` enhancement types, Combat Patrol defaults, allied-unit rejection, Epic Hero rejection, excluded models, required keywords/wargear, bodyguard requirements, conditional Character and roster-faction keywords on model targets, keyword-specific point overrides, current-shape compact enhancement rows, and `cannotBeWarlord` target scope. |
| `ModelsHaveSameEnhancements` | `builder_enhancement_rules.js:106-117` | Covered | Per-enhancement limit. |
| `RosterHasTooManyEnhancements` | `builder_enhancement_rules.js:101-105` | Covered | Battle-size enhancement limit. |
| `UnitHasTooManyEnhancements` | `builder_enhancement_rules.js:82-99` | Covered | More than one selected enhancement on a unit. |
| `UnitDoesNotHaveRequiredKeywords` | `builder_enhancement_rules.js:6-34`, `142-144` | Covered | Unit/faction required keyword groups. |
| `ModelDoesNotHaveRequiredWargearItem` | `builder_enhancement_rules.js:149-153` | Covered | v879 has 1 enhancement required-wargear row. |
| `ModelDoesNotHaveRequiredKeywords` | `builder_enhancement_rules.js:87-91`, `142-144` | Covered | Miniature target keywords checked. |
| `ModelHasEnhancementWithExcludedKeyword` | `builder_enhancement_rules.js:36-42`, `145-148` | Covered | v879 has 32 excluded keyword rows. |
| `AttachedModelHasTooManyEnhancements` | `builder_attachment_rules.js:132-147` | Covered | Attached unit group enhancement count > 1. |
| `FactionKeywordExcludedDatasheetValidator` | `builder_model.js:356-360`, `builder_roster_validation.js:78-86` | Covered | Uses faction scope; all 23 current rows have invalid/control-valid coverage through `validateRoster`. |
| `FactionDatasheetNotAllowed` | `builder_roster_validation.js:78-86` | Covered | Semantics present. |
| `KeywordAllyRestrictingKeywordValidator` | `builder_allied_rules.js:92-130` | Covered | All 4 current legacy `keyword.allyRestrictingKeywordId` rows have invalid and paired-valid coverage. Synthetic new-table scoping is covered, including child allied parents inheriting parent restrictions. v879 `keyword_ally_restricting_keyword` remains empty and pinned by inventory coverage. |
| `RestrictingKeywordError` | `builder_allied_rules.js:108-123` | Covered | Count logic is covered across every current legacy row, plus faction-scoped new-table behavior. |
| `KeywordRestrictionGroupValidator` | `builder_restriction_rules.js:110-184` | Covered | Faction rows now load through `factionScope`; every current top-level limited group and every current detachment-linked min/max row has valid/invalid coverage. |
| `KeywordRestrictionGroupError` | `builder_restriction_rules.js:141-180` | Covered | Limit, zero-limit, detachment min/max messages are custom. |
| `MandatoryWarlordValidator` | `builder_warlord_rules.js:38-82` | Covered | Faction mandatory rows are empty in v879 but lookup walks child-to-parent `factionScope`; detachment mandatory rows live. |
| `MandatoryWarlordNotNotPresentInRoster` | `builder_warlord_rules.js:42-53` | Covered, data-empty for faction | Detachment mandatory uses selected warlord list; all 2 current detachment mandatory rows are covered, and synthetic coverage guards parent-faction mandatory warlord rows. |
| `MandatoryWarlordNotSelected` | `builder_warlord_rules.js:48-50`, `73-79` | Covered | Semantics present. |
| `SupremeCommanderNotSelected` | `builder_warlord_rules.js:63-68` | Covered | v879 has 17 supreme commander miniatures. |
| `MaxModelCountValidator` | `builder_restriction_rules.js:26-36` | Covered | Uses datasheet max model count and composition availability. |
| `TooManyModels` | `builder_restriction_rules.js:28-30` | Covered | Semantics present. |
| `RosterAttachedUnitValidator` | `builder_attachment_rules.js:49-94` | Covered | Group validity, leader/support matching, duplicate membership, explicit must-attach, and incomplete bodyguard-only groups are covered. No standalone must-attach catalog flag exists in v879. |
| `AttachedUnitLeaderOrSupportMissingRequirements` | `builder_attachment_rules.js:82-85` | Covered | Uses datasheet bodyguard groups. |
| `AttachedUnitNoMatchingKeyword` | `builder_attachment_rules.js:26-43` | Covered | Keyword intersection and all-units keyword condition. |
| `AttachedUnitDetachmentNoMatchingKeyword` | `builder_attachment_rules.js:16-20`, `36-43` | Covered | Required/excluded detachment and keyword condition. |
| `BodyguardGroupValidity` | `builder_attachment_rules.js:22-35`, `75-85` | Covered | Datasheet/keyword bodyguard group validity. |
| `UnitMustBeAttached` | `builder_attachment_rules.js:75-82` | Covered for explicit attached groups | Leader/support members in an attached group with no bodyguard emit `attached_unit.must_be_attached`. Empty roster attachment state still returns no error because v879 has no standalone must-attach flag. |
| `RosterDetachmentValidator` | `builder_roster_validation.js:38-45`, `builder_restriction_rules.js:5-24` | Covered | Selection, faction availability, unique keyword. |
| `RosterDetachmentNotSelected` | `builder_roster_validation.js:38-40` | Covered | Semantics present. |
| `RosterDetachmentUniqueKeywordError` | `builder_restriction_rules.js:5-26` | Covered | Uses `detachment_unique_keyword.keywordId`; same display names on different keyword IDs do not collide, and all 57 current rows / 27 shared groups have valid/invalid coverage. |
| `RosterPointsValidator` | `builder_roster_validation.js:35-54`, `builder_model.js:255-264` | Covered | Unit points sum versus battle-size points, including `datasheet_points_step` duplicate-position costs. |
| `RosterPointsLimitExceeded` | `builder_roster_validation.js:51-54` | Covered | Semantics present. |
| `RosterUnitLimitValidator` | `builder_roster_validation.js:66-95` | Covered | Duplicate limit, Epic Hero limit, successor conflict. |
| `RosterHasTooManyOfEpicHero` | `builder_validation_core.js:24-31`, `builder_roster_validation.js:88-93` | Covered | Epic Hero duplicate limit = 1. |
| `RosterHasEpicHeroAndSuccessorChapter` | `builder_restriction_rules.js:39-78` | Covered | Compares non-root faction scope IDs, so Pedro Kantor conflicts with Imperial Fists Epic Heroes but not unrelated Adeptus Astartes root-share Epic Heroes such as Ultramarines. |
| `RosterHasTooManyOfUnit` | `builder_roster_validation.js:88-93` | Covered | Battleline/Dedicated Transport limit 6, else battle-size duplicate limit. Live coverage includes conditional Battleline from Houndpack Lance War Dog Brigands. |
| `UnitCompositionValidator` | `builder_model.js:386-459`, `builder_restriction_rules.js:26-36` | Covered | Required faction/detachment composition rows; default composition selection now prefers matching detachment-specific rows, then faction-specific rows, before generic rows. Same-shape generic/specific duplicates normalize to the more specific available composition, and the unit edit UI exposes the available current-roster compositions. |
| `InvalidUnitComposition` | `builder_restriction_rules.js:31-35` | Covered | Semantics present. |
| `WargearLoadoutValidator` | `builder_wargear_rules.js:256-282`, `builder_loadout_math.js:81-220` | Partial | Engine now uses canonical item-ID keys with explicit duplicate-name aliases and test-only official concept mapping, but exact valid/invalid parity still needs WH app fixture comparison. |
| `LoadoutKey` | `builder_loadout_math.js:3-29`, `36-37` | Partial | Builder has a canonical key layer, but it is not proven identical to official `LoadoutKey`. |
| `InvalidWargearLoadout` | `builder_wargear_rules.js:231-278`, `tests/builder_validation_concepts.mjs:66-69` | Partial | Miniature/unit loadout failures are covered with canonical keys and mapped to the official error concept. Exact WH app valid/invalid fixture parity still needs comparison. |
| `InvalidWargearRequirement` | `builder_wargear_rules.js:90-245`, `tests/builder_validation_concepts.mjs:70` | Partial | Limited thresholds use total unit model count, option-aware base/upgrade filtering, default-only choices, and duplicate caps. All-model substitutions are grouped by datasheet/miniature context, and requirement failures map to the official error concept. Exact WH app fixture parity still needs comparison. |
| `WarlordValidator` | `builder_warlord_rules.js:34-84` | Covered | Missing/multiple/eligibility/conditional Character and the 1 current detachment-granted Warlord override. |
| `InvalidWarlordGeneric` | `builder_warlord_rules.js:80-84` | Covered | Message custom. |
| `InvalidWarlordDueToEnhancements` | `builder_enhancement_rules.js:158-160` | Covered | Miniature enhancements check the enhanced model against the selected warlord miniature; unit-level enhancements still apply at unit scope. |
| `MissingWarlord` | `builder_warlord_rules.js:52-56` | Covered | Semantics present. |
| `TooManyWarlords` | `builder_warlord_rules.js:58-60` | Covered | Semantics present. |
| `InvalidWarlordDueToKeywords` | `builder_warlord_rules.js:12-32` | Covered | Live coverage verifies Headhunter Task Force Vindicator is invalid as Warlord until its conditional `Character` allegiance ability is selected. |

## Confirmed or high-risk discrepancies

### 1. Wargear matching is safer, but not fully proven equivalent

Builder code:

- `builder_loadout_math.js` provides `canonicalWargearKey`.
- `export_builder_data.py` precomputes canonical `name:` alias rows into
  `bootstrap.wargearAliases`; runtime code does not scan the catalog to discover
  them.
- `builder_loadout_math.js` converts regular loadout choice rows through the
  canonical key layer.
- `builder_wargear_rules.js` converts selected, limited, and all-model wargear
  through the same key layer.
- Limited wargear thresholds use total unit model count, so mixed-model units
  such as 20-model Cadian Shock Troops apply the 20-model `choiceLimit` and
  `duplicateLimit` rows even though the restricted miniature count is 18.
- Limited wargear choice validation filters selected roster options through the
  option context, preventing base wargear such as Pathfinder pulse carbines or
  Tankbusta base rokkit launchas from spending optional upgrade caps.
- Limited wargear selected counts are matched against choice rows by bounded
  exact cover, so overlapping combo rows such as Battle Sisters Squad `Heavy
  bolter + Ministorum flamer` do not self-overcount against `choiceLimit`.
- Default-only limited choices remain countable, so caps such as Hyperadapted
  Raveners' Venom bolt limit are not silently skipped.
- All-model substitution checks are grouped by substitute-family inside each
  datasheet/miniature context, so a substitute weapon requires an active base
  line from the same substitute family. Alternative base sets such as Termagant
  fleshborers/spinefists/devourers still do not create false positives, while
  independent slots such as Einhyr Hearthguard guns and melee weapons cannot
  satisfy one another.
- Alternate loadout sets are treated as replacing regular loadout sets, and
  duplicate-allowed loadout sets can repeat the same choice up to the set limit.
- Unit-scoped limited and all-model rules are validated across selected wargear
  from all model rows in the unit.
- `builder_model.js` uses the same key layer when repairing default miniature
  loadouts and skips default wargear for zero-count optional miniatures.

Data facts:

- v879 has 614 duplicated lower-case wargear names across 2149 item IDs.
- Within a single datasheet context, `Cthonian Beserks` has two different
  `Heavy plasma axe` item IDs:
  - base/loadout item: `5a2b0491-c8db-4394-90cc-849d3b7d60ed`
  - all-model item: `95e3c57e-a5bf-4a43-bf6a-12b0605c7d48`
- The second ID has no `wargear_option` row, so the canonical key layer keeps an
  explicit same-context `name:heavy plasma axe` bridge instead of blindly
  switching all matching to raw item IDs.
- `’Ardmob Boyz` has another same-datasheet duplicate-name bridge for Boss Nob
  `Big Choppa`, where loadout and option rows share the same displayed name but
  do not collapse to one simple item-ID rule in every source row.

Implemented guard rails:

- A canonical-key test now proves normal wargear uses `id:` keys while the
  Cthonian duplicate bridge collapses to the same `name:` alias.
- An alias-inventory test now proves v879 has exactly two canonical `name:`
  contexts: Cthonian Beserks Heavy plasma axe and `’Ardmob Boyz` Big Choppa.
- Golden tests now cover Cthonian Beserks duplicate-name all-model matching,
  Cthonian mixed all-model invalidity, `’Ardmob Boyz` duplicate-name Big Choppa
  loadout bridging, Eliminator Sergeant substitutions, Eliminator mixed
  all-model invalidity, Canoptek Macrocytes substitute-without-base rejection,
  Hernkyn Yaegirs and Termagants base-plus-substitute validity, Einhyr
  Hearthguard independent substitute-family anchoring, Termagant limited
  thresholds, Cadian Shock Troops
  total unit model-count thresholds plus duplicate caps, Battle Sisters Squad
  overlapping limited combo rows, Pathfinder/Tankbustas limited choices that
  include base wargear, Hyperadapted Raveners default-only limited caps,
  Chaos Terminator alternate paired-weapon loadouts, Deff Dread
  duplicate-allowed weapon repetition, Intercessor Squad unit-scoped grenade
  launcher caps, Inceptor Squad unit-scoped all-model base consistency,
  zero-count model wargear, invalid unit/model scope, invalid unit and model
  loadouts, and a full default-catalog sweep proving generated default wargear
  no longer self-validates as invalid.
- `tests/builder_validation_wargear_parity_cases.test.mjs` exports and executes
  a 25-case manifest for the future WH app comparison. Each case records the
  high-risk Builder fixture, expected validation code state, and official-like
  concept category. The Cthonian Beserks required fixture now includes twin
  concussion gauntlet valid and over-limit states, not only heavy plasma axe /
  concussion maul all-model matching.

Remaining action:

- Compare the executable parity manifest against the official app's exact
  valid/invalid state and diagnostics before tightening or expanding canonical
  alias behavior.

### 2. Resolved: Enhancement `cannotBeWarlord` target scope

Builder code:

- `builder_enhancement_rules.js:158-160`

Previous behavior:

- If an enhancement has `cannotBeWarlord`, Builder errors when `unit.isWarlord`
  is true.

Fix:

- Miniature enhancements now compare the enhancement target model to the selected
  warlord miniature. Unit-level enhancements still apply at unit scope.

Data:

- v879 has 1 such enhancement: `Disciple of Khorne`.

Coverage:

- `tests/builder_validation_enhancements.test.mjs` verifies that `Disciple of
  Khorne` on a non-warlord model does not invalidate the warlord, while the same
  enhancement on the warlord model does.

### 3. Resolved: New-table ally restricting keyword row scope

Builder code:

- `builder_allied_rules.js:92-130` handles both new-table
  `keyword_ally_restricting_keyword` rows and the legacy
  `keyword.allyRestrictingKeywordId` path and scopes it by allied parent faction
  ancestry.

Data:

- `keyword_ally_restricting_keyword` has 0 rows in v879.
- Legacy keyword rows have 4 rows: Khorne, Nurgle, Slaanesh, Tzeentch restricted
  by Battleline for Legiones Daemonica.

Fix:

- Restricting keyword rows are only applied when the keyword's faction
  restriction matches the allied source parent or one of that parent faction's
  ancestors.

Coverage:

- Synthetic new-table regression fixtures verify non-matching, exact matching,
  and child-parent ancestry cases.

### 4. Resolved for explicit groups: `UnitMustBeAttached`

Official evidence:

- Binary type: `UnitMustBeAttached`
- Datasource localized message key: `attach_unit_required`

Builder code:

- `builder_attachment_rules.js:49-53` still returns immediately if no attached
  groups exist.
- `builder_attachment_rules.js:75-82` reports
  `attached_unit.must_be_attached` when an explicit attached group contains one
  or more leader/support members but no bodyguard.
- `builder_attachment_rules.js:83-86` keeps `attached_unit.incomplete` for
  bodyguard-only or otherwise empty attached groups.

Decision:

- The official localization says `"%@ must be attached to a bodyguard unit."`
  and takes a unit name, which maps cleanly to a leader/support member inside an
  explicit attached group with no bodyguard.
- v879 exposes no standalone catalog flag saying a datasheet must always be
  attached merely because it can attach. Treating every standalone Leader or
  Support-capable unit as invalid would over-constrain normal rosters.

Coverage:

- `tests/builder_validation_attachments.test.mjs` covers:
  - no attached groups -> no attachment error;
  - leader-only attached group -> `attached_unit.must_be_attached`;
  - support-only attached group -> `attached_unit.must_be_attached`;
  - bodyguard-only attached group -> `attached_unit.incomplete`;
  - invalid leader/support/bodyguard pairings.

Remaining external parity check:

- If a future official DB/app state exposes a standalone must-attach flag outside
  `roster_attached_unit`, add a separate validator path for that flag.

### 5. Resolved: Keyword restriction faction scope

Builder code:

- `builder_restriction_rules.js:152-155` now starts from every faction ID in
  `factionScope(roster.factionKeywordId)`.
- `builder_restriction_rules.js:165-183` pulls detachment-linked groups even if
  they were not in the initial exact-faction map.

Data:

- v879 groups exist for Astra Militarum, Asuryani, Black Templars, Chaos
  Knights, Drukhari, Genestealer Cults, T'au Empire, and Ultramarines.
- Visible child factions only point to visible `Adeptus Astartes`, so
  `factionScope` does not currently lose hidden parents.

Fix:

- Parent-scoped restriction rows are inherited by child roster factions.

Coverage:

- A synthetic parent/child fixture verifies inherited keyword restriction rows.
- Real fixtures cover Asuryani/Ynnari zero-limit exclusions, Drukhari Harlequin
  character limits, every v879 top-level limited keyword restriction group, and
  every v879 detachment min/max restriction row.

### 6. Resolved: `factionScope` full faction keyword lookup

Builder code:

- `builder_model.js:52-61` walks parent IDs using
  `state.catalog.factionKeywordById`.
- `builder_catalog.js:263` builds `factionById` from `bootstrap.factions`, which
  excludes `excludedFromArmyBuilder` factions.
- `builder_catalog.js:266` separately has `factionKeywordById` for all faction
  rows.

Data:

- v879 visible child factions only have visible parent `Adeptus Astartes`.

Fix:

- `factionScope` no longer depends on the bootstrap-visible faction list.

Coverage:

- A synthetic hidden-parent fixture verifies scope walking through
  `faction_keyword`.

### 7. Official messages and Builder messages are not parity-equivalent

Builder returns custom English strings. The official app has named localization
keys for every validator family. This is fine for an internal MVP, but not
equivalent if users compare diagnostics.

Implemented:

- Builder messages now have stable validation codes.
- Tests assert error categories by code.

Remaining action:

- Optionally map internal codes to official localization-key names where legal
  and useful for user-facing diagnostics.

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

Static audit cannot prove exact Battle Forge parity. Builder-side fixtures now
cover every current `validationMessage(...)` and `validationWarning(...)` code
at least once, and every code has a test-only official-like concept mapping.
`tests/builder_validation_minimum_parity_manifest.test.mjs` maps the required
minimum groups below to focused Builder test files, anchors, and expected codes;
`tests/builder_validation_wargear_parity_cases.test.mjs` adds the executable
25-case wargear checklist. Both manifests require their codes/categories to
resolve through the test-only official-like concept map. The minimum manifest
also anchors the required subcases inside those focused tests, instead of only
checking broad test titles.
The remaining parity work is to create the same roster cases in WH 40K app and
Builder, then compare valid/invalid state and error categories.

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
   - Drukhari Harlequin character keyword restriction limits.
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
   - Explicit leader/support-without-bodyguard `UnitMustBeAttached` case.
   - Standalone must-attach case only if future official data exposes a flag.
6. Wargear:
   - Cthonian Beserks heavy plasma axe / concussion maul / twin gauntlet.
   - `’Ardmob Boyz` Boss Nob duplicate-name Big Choppa bridge.
   - Eliminator Sergeant substitute-only all-model set.
   - Termagants all-model substitution.
   - A limited-wargear unit with model-count thresholds.
   - A zero-count miniature with selected wargear.
7. Allegiance abilities:
   - Pactbound Zealots Mark of Chaos mandatory selection.
   - Required wargear for Daemonic Allegiance.
   - Headhunter/Houndpack/Solar/Subterranean roster min/max group limits.

## Priority action list

1. Done: build a validation-code layer so every Builder message has a stable
   code.
2. Done for Builder: add golden fixtures for every current
   `validationMessage(...)` code. Remaining parity step: compare those fixtures
   against WH 40K app behavior.
3. Done: fix `cannotBeWarlord` to evaluate the enhancement target, not the whole
   unit.
4. Done for explicit attached groups: implement `UnitMustBeAttached`.
   Remaining external check: watch for any future standalone must-attach flag.
5. Done: harden `KeywordAllyRestrictingKeywordValidator` for future new-table
   rows and parent-scope allied source matching.
6. Done: rework `factionScope` to use the full faction keyword table.
7. Done for Builder: introduce `canonicalWargearKey` with item-ID default keys
   and duplicate-name bridge aliases. Remaining external check: compare the
   golden wargear fixtures against WH app exact diagnostics before tightening or
   expanding alias behavior.
