# Builder roster validation fix plan

Date: 2026-07-01

Goal: bring Heretic Builder roster validation closer to the official WH 40K app
Battle Forge behavior, without breaking already covered rules.

Related audits:

- `docs/wh40k_app_roster_validation_audit.md`
- `docs/wh40k_app_builder_parity_audit.md`

## Progress

- 2026-07-01: Added stable validation message codes across Builder validators.
- 2026-07-01: Added Node `node:test` runner with initial targeted validation
  tests.
- 2026-07-01: Fixed `factionScope` to use the full `faction_keyword` catalog
  map.
- 2026-07-01: Fixed enhancement `cannotBeWarlord` validation to check the
  targeted miniature for miniature enhancements.
- 2026-07-01: Scoped new-table ally restricting keyword rows through the
  keyword's faction scope when present.
- 2026-07-02: Tightened ally restricting keyword faction matching to compare
  the restriction against each allied source parent's faction ancestry. Synthetic
  coverage now proves child allied parents inherit parent restrictions, while
  parent allied sources do not match child-only restrictions.
- 2026-07-01: Added golden tests for Heretic Astartes allied points, keyword
  caps, mutually exclusive ally buckets, required CSM detachment allies, and
  Khorne/Nurgle/Slaanesh/Tzeentch outnumbering restrictions.
- 2026-07-01: Added golden tests for allegiance ability mandatory selection,
  single-choice enforcement, required detachment scope, required wargear, and
  roster min/max keyword groups.
- 2026-07-02: Added live allegiance rule coverage for every current v879
  allegiance row shape: 10 groups, 26 abilities, 5 mandatory groups, 7
  detachment-scoped groups, 4 required-wargear abilities, 1 min-limit group,
  and 4 max-limit groups. The inventory also pins the currently empty
  `faction_keyword_mandatory_allegiance_ability` and
  `allied_faction_allegiance_ability` tables.
- 2026-07-02: Added a live enhancement rule-table inventory guard. It pins all
  current v879 enhancement table counts, the `miniature` / `unit` / `upgrade`
  type split, combat-patrol defaults, Epic Hero / non-Character flags,
  `cannotBeWarlord`, required keyword group references, excluded keywords,
  required wargear, and enhancement bodyguard datasheet links. `npm test` now
  passes 90 validation tests.
- 2026-07-02: Added live semantic coverage for all 1,027 current
  `enhancement_required_keyword_group` rows. Each group is proven satisfiable in
  isolation, and missing-requirement checks cover all 578 keyword groups, all
  639 faction-keyword groups, and all 83 datasheet-scoped groups. `npm test`
  now passes 91 validation tests.
- 2026-07-02: Added live semantic coverage for the remaining current
  enhancement join-rule rows: all 32 `enhancement_excluded_keyword` rows reject
  and accept the target keyword state, the 1 `enhancement_required_wargear_item`
  row requires and accepts the configured wargear, and all 19
  `enhancement_bodyguard_group` rows cover missing attachment, wrong bodyguard
  datasheet, and configured attached bodyguard. `npm test` now passes 94
  validation tests.
- 2026-07-02: Added live datasheet attachment/bodyguard coverage for all 1,266
  current `datasheet_bodyguard_group` rows. The tests pin the 1,260 datasheet
  rows, 14 keyword rows, 1,056 leader groups, 210 support groups, 305 required
  detachment gates, 61 excluded detachment gates, and 305 shared-keyword gates,
  then prove configured bodyguards pass and invalid bodyguards fail for every
  live group. `npm test` now passes 97 validation tests.
- 2026-07-02: Added a live wargear rule-table inventory guard. It pins all
  current v879 wargear/loadout table counts and shape splits, including 3,516
  wargear items, 6,322 options, 2,445 regular loadout sets, 343 limited sets,
  492 wargear limits, 28 all-model sets, and the 4 precomputed canonical alias
  rows. The guard also checks referential integrity across datasheets,
  miniatures, option groups, choices, items, limits, and aliases. `npm test`
  now passes 98 validation tests.
- 2026-07-02: Added live semantic coverage for all 2,445 current regular
  `loadout_choice_set` rows, all 5,374 `loadout_choice` rows, and all 8,325
  regular choice item rows. Each isolated set generates valid loadouts, every
  choice is represented by at least one generated loadout, generated loadouts
  validate for one model and partition across two models, and impossible
  loadouts are rejected. `npm test` now passes 99 validation tests.
- 2026-07-02: Added live semantic coverage for all 343 current
  `limited_wargear_choice_set` rows, all 569 `limited_wargear_choice` rows, all
  676 limited choice item rows, and all 492 `wargear_limit` rows. The test
  proves every non-empty live choice is accepted when enabled by its configured
  limit, every currently disabled Tactical Squad limited choice is rejected, and
  every live limit row accepts valid selections while rejecting over-limit
  selections. `npm test` now passes 100 validation tests.
- 2026-07-02: Added live semantic coverage for all 28 current
  `all_model_wargear_choice_set` rows, all 63 `all_model_wargear_choice` rows,
  and all 69 all-model choice item rows. The test proves every base choice can
  cover all models, substitute choices with bases are accepted only alongside
  an active base, the standalone Eliminator Sergeant substitute set remains
  accepted, and every live set rejects underfilled or mixed-base selections
  where those invalid states apply. `npm test` now passes 101 validation tests.
- 2026-07-02: Added live semantic coverage for all 1,300 current
  `base_miniature_loadout` rows and all 3,132
  `base_miniature_loadout_wargear_option` rows through the public
  `defaultMiniatures` path. The test proves all 3,115 scoped base option rows
  are applied with model-count multiplication, and pins the 17 current foreign
  option rows across 8 loadouts as non-leaking source-data rows rather than
  silently letting another datasheet's option id enter a roster. `npm test` now
  passes 102 validation tests.
- 2026-07-02: Added live semantic coverage for all 3,025 current
  `wargear_group` rows and all 6,322 `wargear_option` rows. Defaults now prove
  the 21 unit-scoped options and 6,301 model-scoped options stay in their
  scopes, including 3,695 positive default selections. Scope validation now
  proves all options are valid in their configured target scope, rejected in the
  opposite scope, and the 83 paid options sum to the expected selected wargear
  points. `npm test` now passes 104 validation tests.
- 2026-07-02: Added live semantic coverage for all 1,516 current
  `unit_composition` rows, all 2,258 `unit_composition_miniature` rows, all 51
  required-faction rows, and all 8 required-detachment rows. Each isolated
  composition is available when its requirements are satisfied, unavailable when
  each configured requirement is missing, and produces the expected miniature
  shape through `defaultMiniatures`. `npm test` now passes 105 validation tests.
- 2026-07-02: Expanded `datasheet_points_step` coverage from the representative
  Eradicator fixture to all 334 current live rows. The test proves all 95
  `stepAt = 2`, 234 `stepAt = 3`, and 5 `stepAt = 4` rows add no points before
  the configured duplicate position and add the configured `stepPoints` at and
  after that position. `npm test` now passes 106 validation tests.
- 2026-07-02: Added live semantic coverage for all 457 current
  `detachment_faction_keyword` rows, all 4 `detachment_faction_point_cost`
  overrides, and all 290 `detachment_force_disposition` rows. The test proves
  configured faction/detachment pairs avoid `roster.detachment_not_allowed`,
  control factions reject each detachment, non-Combat Patrol detachments appear
  in `availableDetachments`, Combat Patrol detachments stay hidden from the
  standard Builder list, point overrides/base costs apply, and disposition names
  resolve. `npm test` now passes 107 validation tests.
- 2026-07-02: Added live semantic coverage for all 1,256 current
  `datasheet_faction_keyword` rows. The test proves native datasheets validate
  for their faction, unavailable control factions reject every row as
  `roster.unit_not_native`, non-Combat Patrol native datasheets appear in
  `availableDatasheets`, Combat Patrol datasheets stay hidden and emit
  `roster.combat_patrol_datasheet`, 115 parent-faction rows defer to child
  factions, and the 1 direct excluded row emits
  `roster.faction_datasheet_not_allowed`. `npm test` now passes 108 validation
  tests.
- 2026-07-02: Added live semantic coverage for all 3 current `battle_size`
  rows. Incursion, Strike Force, and Onslaught now each prove the configured
  points limit, detachment points limit, duplicate unit limit, and enhancement
  limit emit the expected roster/enhancement diagnostics. `npm test` now passes
  109 validation tests.
- 2026-07-02: Added live semantic coverage for all current Warlord-related
  miniature flags: 17 `isSupremeCommander` rows, 27 `cannotBeWarlord` rows, 8
  `canBeNonCharacterWarlord` rows, and the 1 detachment-granted Warlord row.
  The test proves Supreme Commanders must be selected when present,
  cannot-be-Warlord models reject by default, Deathleaper's Vanguard Onslaught
  grant overrides that rejection, and Titan non-Character Warlords remain valid.
  `npm test` now passes 110 validation tests.
- 2026-07-02: Added live semantic coverage for duplicate-unit and max-model
  roster limits across every current non-Combat Patrol datasheet. The test
  proves all 151 Epic Hero datasheets enforce a 1-copy cap, all 97 Battleline /
  Dedicated Transport datasheets enforce the 6-copy cap, all 787 remaining
  datasheets enforce the Strike Force 3-copy cap, and all 8 `maxModelCount`
  datasheets accept their cap while rejecting one extra model. `npm test` now
  passes 111 validation tests.
- 2026-07-02: Added live semantic coverage for all 92 current datasheets with
  `allegianceAbilityGroupId`. Each row is summarized through `unitSummary`, so
  the test proves the datasheet's configured allegiance group allows its own
  abilities, rejects abilities from other groups, enforces all 48 mandatory
  datasheet/group rows, enforces all 87 detachment-scoped datasheet/group rows,
  and carries the 1 required-wargear datasheet/group row. `npm test` now passes
  112 validation tests.
- 2026-07-02: Added live semantic coverage for all 24 current Combat Patrol
  enhancement defaults and their 24 configured alternatives. Every Combat
  Patrol detachment now proves the default enhancement is required, duplicate
  default selections are rejected, and the non-default enhancement is rejected
  by the Combat Patrol validator. `npm test` now passes 113 validation tests.
- 2026-07-02: Added live semantic coverage for all 957 current enhancement core
  flag rows. The sweep proves target-type validation for every enhancement, Epic
  Hero allow/block flags across 8 allowed and 949 blocked rows, non-Character
  allow/block flags across 78 allowed and 879 blocked rows, per-enhancement
  selection limits for all 886 limit-1 and 71 limit-3 rows, and roster
  enhancement-limit inclusion for 948 included and 9 excluded rows. `npm test`
  now passes 114 validation tests.
- 2026-07-02: Added live semantic coverage for `datasheet_bodyguard_group`
  `bodyguardType` across all 1,266 current rows. Every group now proves its
  configured `leader` or `support` member type is accepted and the opposite type
  is rejected, pinning all 1,056 leader rows and 210 support rows. `npm test`
  now passes 115 validation tests.
- 2026-07-02: Added a static-export inventory guard for the thin Builder
  catalog. It proves all 73 Builder-loaded roster rule tables match the 102-table
  export counts in `bootstrap.tableCounts`, proves the static export audit has
  no unexpected unexported roster tables, proves the static manifest lists every
  exported file with matching byte counts, hashes, and table row counts, pins
  the column lists for those 73 rule tables, and proves `battle_size` keeps
  points, detachment-points, enhancement, and duplicate-unit limits in the
  static bootstrap payload. `npm test` now passes 120 validation tests.
- 2026-07-02: Added live semantic coverage for `enhancement_bodyguard_group`
  `bodyguardType` across all 19 current rows. Every group is currently a
  `leader` requirement, and the test proves configured leader attachments pass
  while opposite `support` attachments fail. `npm test` now passes 121
  validation tests.
- 2026-07-02: Added live semantic coverage for `allied_faction`
  `canTakeEnhancements` through enhancement validation. All 21 current allied
  buckets now prove that the 5 enhancement-enabled buckets allow allied
  enhancement selections and the 16 disabled buckets emit
  `enhancement.allied_unit_not_allowed`. `npm test` now passes 122 validation
  tests.
- 2026-07-02: Added synthetic coverage for the currently data-empty top-level
  `allied_faction.requiredDetachmentId` and
  `allied_faction.requiredWarlordMiniatureId` fields. The test pins that all 21
  current allied buckets have no top-level required detachment/Warlord fields,
  while proving missing and selected states for both validator paths. `npm test`
  now passes 123 validation tests.
- 2026-07-02: Added synthetic coverage for the currently data-empty
  `allied_faction_keyword.requiredWarlordMiniatureId` field. The test pins that
  all 54 current allied keyword cap rows have no Warlord gate, then proves
  over-limit rows are ignored without the required Warlord, allowed at cap with
  that Warlord, and rejected over cap with that Warlord. `npm test` now passes
  124 validation tests.
- 2026-07-02: Added synthetic coverage for the currently data-empty
  `keyword_restriction_group.requiresWarlordMiniatureId` field. The test pins
  that all 16 current keyword restriction groups have no Warlord gate, then
  proves both non-zero and zero-limit groups are skipped without the required
  Warlord and enforced once that Warlord is present. `npm test` now passes 125
  validation tests.
- 2026-07-02: Added synthetic coverage for currently data-empty bodyguard
  faction gates: `datasheet_bodyguard_group.factionKeywordId` and
  `enhancement_bodyguard_group.factionKeywordId`. The tests pin that both live
  tables currently have no faction-gated rows, then prove matching roster
  factions satisfy the attachment/bodyguard requirement while mismatched roster
  factions reject it. `npm test` now passes 127 validation tests.
- 2026-07-02: Added synthetic coverage for allied edge data shapes that are
  currently absent from v879: globally-scoped new-table restricting keyword
  rows, duplicate restricting rows, and malformed slotless keyword groups
  missing either donor or receiver keywords. The test proves global restrictions
  still apply, duplicates emit one diagnostic, and malformed slotless groups do
  not subtract from keyword caps. `npm test` now passes 128 validation tests.
- 2026-07-02: Added explicit coverage for the allied validator no-op path when
  a roster contains no allied units. The focused coverage run now shows
  `builder_allied_rules.js` at 100% line coverage. `npm test` now passes 129
  validation tests.
- 2026-07-02: Added synthetic coverage for keyword restriction groups that have
  no linked keyword rows. The test proves such groups stay inactive even when
  they carry a top-level zero limit and detachment min/max rows. `npm test` now
  passes 130 validation tests.
- 2026-07-02: Added synthetic wargear/loadout edge coverage for exact
  context-specific canonical aliases, zero-limit regular loadout sets,
  empty regular loadout sets, over-limit regular choice sets, limited wargear
  sets with no exported limit rows, duplicate limited choice vectors, partial
  multi-item limited choices, skipped oversized limited vectors, null-safe
  miniature target matching, and all-model choice rows with no item rows.
  `npm test` now passes 132 validation tests.
- 2026-07-02: Added synthetic model-helper/cache-routing coverage for
  mixed-shape selected allegiance abilities, detachment/disposition badge
  fallbacks, allied composition faction scope fallbacks, allied source labels,
  native/allied datasheet availability with missing compositions and detachment
  exclusions, composition label fallbacks, saved-composition replacement by more
  specific equivalents, fallback default composition replacement, zero-model
  saved composition summaries, and roster point totals. `npm test` now passes
  133 validation tests.
- 2026-07-02: Added core required-wargear matcher edge coverage for missing
  selected option rows, selected options that point at the wrong wargear item,
  and selected model wargear targeted at a different miniature. `npm test` now
  passes 134 validation tests.
- 2026-07-02: Added thin-client catalog infrastructure coverage for `siteHref`
  pass-through paths and explicit `loadCatalog` failure behavior when a cached
  Builder data fetch returns a non-OK response. `npm test` now passes 135
  validation tests.
- 2026-07-02: Added cache-compat coverage for saved allegiance selections whose
  old ability group is no longer present in the current catalog. The validator
  now has an explicit regression test proving it skips the missing group without
  false diagnostics. `npm test` now passes 146 validation tests.
- 2026-07-01: Added faction-specific golden tests for Adeptus Astartes
  detachment point overrides, successor chapter Epic Hero conflicts, Devoted of
  Ynnead mandatory warlords, Asuryani/Ynnari keyword restriction exclusions,
  and Drukhari Harlequin character limits.
- 2026-07-01: Fixed keyword restriction groups to load through the roster
  faction parent scope, matching the rest of the Builder faction-scope model.
- 2026-07-01: Added attachment group tests for incomplete, duplicate, invalid,
  and valid leader/bodyguard group paths.
- 2026-07-01: Added attachment support-unit missing-requirements coverage and
  split explicit leader/support-without-bodyguard groups into
  `attached_unit.must_be_attached`, matching the official `attach_unit_required`
  localization. v879 still exposes no standalone must-attach catalog flag beyond
  attachment state groups and `datasheet_bodyguard_group.bodyguardType`.
- 2026-07-01: Added wargear golden tests for Cthonian Beserks duplicate-name
  all-model matching, `’Ardmob Boyz` duplicate-name Big Choppa loadout bridging,
  Eliminator Squad all-model/substitute behavior, Termagant limited wargear
  thresholds, and zero-count miniature wargear.
- 2026-07-01: Added enhancement golden tests for roster enhancement limits,
  duplicate enhancement limits, per-unit enhancement limits, required
  detachment, required keyword/faction groups, excluded keywords, required
  wargear, attached bodyguard requirements, and attached-unit enhancement
  limits.
- 2026-07-01: Added warlord and top-level roster golden tests for missing
  warlord, multiple warlords, invalid non-Character warlord, Supreme Commander
  enforcement, detachment unique keywords, detachment excluded datasheets,
  Combat Patrol linked datasheet constraints, unit composition errors, and
  duplicate datasheet limits including Epic Heroes.
- 2026-07-02: Added live catalog coverage for `datasheet_points_step`, proving
  duplicate-position points are added starting at the configured `stepAt` copy.
- 2026-07-02: Default unit composition selection now prefers matching
  detachment-specific rows, then faction-specific rows, before generic rows.
  Saved generic default composition IDs are also normalized to the more
  specific current default. Live coverage checks Pantheon of Woe C'tan points
  and Blood Angels Bladeguard Veteran Squad points.
- 2026-07-02: Saved generic non-default composition IDs are normalized to a
  more specific faction/detachment composition when the model-count shape is the
  same. This keeps selected unit compositions aligned with the current roster
  faction/detachment context, such as Blood Angels Assault Intercessors with
  Jump Packs using their faction-specific points row.
- 2026-07-02: Model-targeted enhancements now include active conditional
  keywords from the unit summary when checking the target model. Live coverage
  verifies a Headhunter Task Force Vindicator that selects the `Character`
  allegiance ability can take a Character-only enhancement without a false
  missing-keyword error, and a Dark Angels Captain in Terminator Armour can
  use the roster-faction-scoped `Deathwing` keyword for Inner Circle Task Force
  enhancements.
- 2026-07-02: Added live Warlord coverage for conditional `Character` keywords.
  A Headhunter Task Force Vindicator is still an invalid Warlord without the
  selected `Character` allegiance ability, and becomes eligible once that
  conditional keyword is active.
- 2026-07-02: Added real-catalog predicate coverage for every live v879
  `conditional_keyword` row. The test proves all 380 current rows apply when
  their requirements are satisfied and fail when each configured requirement is
  missing, covering the 270 allegiance-ability rows, 32 roster-faction rows, 77
  detachment rows, and 2 Warlord-miniature rows.
- 2026-07-02: Added live coverage for `enhancementType = upgrade`. Sharp Eyes
  (Upgrade) is validated as a unit-level upgrade with its own required
  datasheet/faction group, contributes points, and enforces its per-enhancement
  limit of 3 separately from the Strike Force roster enhancement limit of 4.
- 2026-07-02: Added synthetic coverage for the data-empty
  `enhancement_keyword_points_cost` table. Keyword-specific enhancement point
  overrides now have a regression test for active keyword matching, display
  order precedence, base-cost fallback, and unit-summary point totals.
- 2026-07-02: Added a catalog inventory guard for the currently data-empty rule
  tables. If a future data version adds live rows to those tables, tests fail
  with an instruction to add live roster fixtures before updating the audit.
- 2026-07-02: Allegiance validators now use the shared current-shape selection
  normalizer, so selected allegiance abilities saved as compact IDs satisfy
  unit, allied required allegiance, and conditional Warlord keyword rules the
  same way object rows do.
- 2026-07-02: Enhancement validators now use the shared current-shape selection
  normalizers, so compact `{id}` and `{id,targetId}` enhancement rows satisfy
  unit, miniature, and attached-unit enhancement rules the same way object rows
  do.
- 2026-07-02: Enhancement selection UI now reads through the same shared
  current-shape normalizers, while writes stay compact as `{id}` and
  `{id,targetId}` rows. The local cache does not persist full catalog
  enhancement objects.
- 2026-07-02: Enhancement selection normalization no longer accepts bare string
  rows. Current Builder enhancement selections must use object rows, which keeps
  old enhancement ID arrays out of the new app data shape.
- 2026-07-02: Removed old-roster runtime fallbacks for `attachedUnits`,
  `allegianceAbilityIds`, `unitWargear`, `enhancementIds`, and nested miniature
  enhancement arrays. The new Builder data shape is now the only shape accepted
  by the static client.
- 2026-07-02: Conditional keywords that require a roster faction now compare the
  required faction through `factionScope`, so parent-faction requirements apply
  to child rosters. v879 live rows are Dark Angels scoped; synthetic coverage
  guards future child-faction data.
- 2026-07-02: Faction mandatory warlord lookup now walks `factionScope` from
  child to parent, so future parent-faction mandatory warlord rows apply to
  child rosters unless the child defines its own row. v879 has no live faction
  mandatory warlord rows.
- 2026-07-02: Added live coverage for `detachment_granted_warlord_miniature`.
  Deathleaper remains blocked as Warlord outside Vanguard Onslaught, but the
  detachment grant correctly overrides `cannotBeWarlord`.
- 2026-07-02: Added real-catalog coverage for every live v879 detachment
  warlord row. The test proves invalid and valid states for all 2
  `detachment_mandatory_warlord_miniature` rows and the 1
  `detachment_granted_warlord_miniature` row.
- 2026-07-02: Added live duplicate-limit coverage for conditional Battleline.
  Houndpack Lance War Dog Brigands use the Battleline duplicate cap of 6 rather
  than the standard Strike Force cap of 3.
- 2026-07-02: Added the current-roster unit composition selector to the unit
  edit screen. The picker lists only compositions available for the roster's
  faction/detachments, hides generic/specific duplicates with the same model
  shape, and resets model-level wargear/enhancements when the selected
  composition changes.
- 2026-07-02: Tightened detachment unique keyword validation to compare
  `detachment_unique_keyword.keywordId` rather than display names, with
  synthetic coverage for same-name/different-ID keywords.
- 2026-07-02: Added real-catalog coverage for every live v879
  `detachment_unique_keyword` shared group. The test proves valid and invalid
  states across all 57 current rows and 27 current shared unique-keyword groups.
- 2026-07-02: Added real-catalog coverage for every live v879 datasheet
  exclusion row. The test proves invalid and control-valid states for all 23
  `detachment_excluded_datasheet` rows and all 23
  `faction_keyword_excluded_datasheet` rows.
- 2026-07-02: Added real-catalog coverage for every live v879
  `detachment_linked_datasheet` row. The test proves exact valid, missing-row
  invalid, and extra-not-linked invalid states for all 107 current rows across
  all 24 current Combat Patrol detachments.
- 2026-07-02: Added real-catalog coverage for every live v879
  `allied_faction_points_limit` row. The test proves valid-at-cap and
  invalid-over-cap states for all 39 current allied points-limit rows.
- 2026-07-02: Added real-catalog coverage for every live v879
  `faction_keyword_allied_faction` row. The test proves each of the 87 current
  allowed roster-faction/ally-bucket pairs avoids `allied_faction.not_available`
  and each ally bucket still rejects a control roster faction without that row.
- 2026-07-02: Added real-catalog coverage for every live v879
  `allied_faction_datasheet` row. The test proves all 320 current allowed
  ally-bucket/datasheet pairs avoid `allied_faction.datasheet_not_allowed` and
  each row's ally bucket still rejects a control datasheet outside that bucket.
- 2026-07-02: Added real-catalog coverage for every live v879
  `allied_faction_keyword` row. The tests prove valid-at-cap and
  invalid-over-cap states for all 54 current keyword-limit rows, mixed-keyword
  rejection for all 12 current mutually exclusive battle-size buckets, and
  slotless donor/receiver reduction for all 12 current slotless groups. The
  currently empty Warlord-gated keyword cap field path has synthetic coverage.
- 2026-07-02: Added real-catalog coverage for every live v879
  `allied_faction_required_detachment` row. The test proves missing-detachment
  invalid and selected-detachment valid states for all 29 current rows.
- 2026-07-02: Added real-catalog coverage for every live v879
  `allied_faction_allowed_warlord_miniature` row. The test proves
  missing-Warlord invalid and each configured Warlord miniature valid for all 28
  current rows.
- 2026-07-02: Added an allied rule-table inventory guard pinning every current
  v879 allied table count, including the 25 parent rows, the 0-row
  `keyword_ally_restricting_keyword` new table, and the 4 legacy
  `keyword.allyRestrictingKeywordId` rows.
- 2026-07-02: Added real-catalog coverage for every live v879 legacy allied
  restricting keyword row. The test proves invalid and paired-valid states for
  all 4 Khorne/Nurgle/Slaanesh/Tzeentch Battleline outnumbering rules.
- 2026-07-01: Expanded allied golden coverage for all four Heretic Astartes
  cult-legion parent factions, Titanicus Traitoris titan caps, Agents of the
  Imperium allowed-warlord requirements, and slotless Retinue donor/receiver
  pairs.
- 2026-07-01: Added coverage for previously unasserted validation codes:
  unavailable/disallowed allies, required allied allegiance abilities,
  wrong-group/mandatory allegiance choices, Combat Patrol enhancements,
  enhancement target type and target eligibility failures, top-level roster
  illegal datasheets, detachment required datasheets including missing and
  satisfied states, detachment keyword min/max restrictions, faction mandatory
  warlords, and invalid wargear scope and loadout paths.
- 2026-07-02: Mandatory faction allegiance abilities now read inherited
  parent-faction rows through `factionScope`, with synthetic coverage for a
  child roster inheriting a parent mandatory ability and for the required
  ability satisfying that rule. v879 has no live rows in
  `faction_keyword_mandatory_allegiance_ability`.
- 2026-07-01: Audited all current `validationMessage(...)` and
  `validationWarning(...)` codes in Builder validators against the split
  `tests/builder_validation_*.test.mjs` suite; uncovered list is now empty and
  `npm test` passes 43 validation tests.
- 2026-07-01: Added an automated validation-code coverage test so new
  validation message or warning codes cannot be added without a focused test.
- 2026-07-02: Introduced `canonicalWargearKey` for loadout validation/default
  repair. Normal wargear now matches by item ID, while confirmed same-context
  duplicate-name bridges such as Cthonian Beserks Heavy plasma axe and
  `’Ardmob Boyz` Big Choppa use explicit `name:` aliases.
- 2026-07-02: Moved canonical wargear alias discovery to build/export time.
  Runtime Builder now receives the tiny precomputed `bootstrap.wargearAliases`
  list and only performs map lookups. Alias rows are stored at datasheet scope
  only, relying on runtime fallback for miniature-specific contexts.
- 2026-07-02: Added an inventory test proving v879 has exactly two canonical
  `name:` alias contexts: Cthonian Beserks Heavy plasma axe and `’Ardmob Boyz`
  Big Choppa.
- 2026-07-02: Added test-only concept mapping for every Builder
  validation/warning code. The runtime client keeps validation messages thin:
  `{ level, code, text }`.
- 2026-07-02: Refined the test-only wargear concept mapping so loadout mismatch
  codes map to the official `InvalidWargearLoadout` concept and limited/all-model
  requirement failures map to `InvalidWargearRequirement`.
- 2026-07-02: Tightened successor chapter Epic Hero validation to compare
  non-root faction scope IDs. Pedro Kantor now conflicts with Imperial Fists
  Epic Heroes while unrelated Adeptus Astartes root-share Epic Heroes such as
  Ultramarines are allowed.
- 2026-07-02: Fixed limited wargear threshold evaluation to use total unit
  model count and added Cadian Shock Troops coverage for 20-model choice limits
  and duplicate caps. `npm test` now passes 44 validation tests.
- 2026-07-02: Made limited wargear validation option-aware, so base/default
  wargear embedded in upgrade choices does not spend upgrade caps, while
  default-only limited choices still count. Pathfinder Team and Tankbustas
  default loadouts now stay valid, and Hyperadapted Raveners still enforce the
  Venom bolt cap.
- 2026-07-02: Stopped generating default wargear for zero-count optional
  miniatures and added a full default-catalog wargear sweep. `npm test` now
  passes 48 validation tests.
- 2026-07-02: Tightened all-model substitution validation by grouping checks by
  datasheet/miniature context. Canoptek Macrocytes substitute-only loadouts now
  fail, while Hernkyn Yaegirs and Termagants valid base-plus-substitute
  alternatives remain valid. `npm test` now passes 49 validation tests.
- 2026-07-02: Split all-model substitute anchoring by substitute family inside
  each datasheet/miniature context, so independent all-model slots cannot
  satisfy one another. Added Einhyr Hearthguard coverage for a valid gun line
  plus unanchored melee substitute. `npm test` now passes 50 validation tests.
- 2026-07-02: Reworked limited wargear choice coverage from independent
  occurrence summing to bounded exact-cover matching. Overlapping combo rows
  such as Battle Sisters Squad `Heavy bolter + Ministorum flamer` no longer
  self-overcount against `choiceLimit`. `npm test` now passes 89 validation
  tests.
- 2026-07-02: Added live wargear coverage for additional v879 loadout shapes:
  alternate loadout rows replacing regular sets, duplicate-allowed loadout
  choices, unit-scoped limited wargear caps across model rows, and unit-scoped
  all-model base choices.
- 2026-07-02: Added an executable WH app wargear parity manifest with 25
  high-risk Builder cases and expected validation codes/concepts. The manifest
  is test-only. `docs/wh40k_app_manual_parity_checklist.md` now mirrors every
  executable wargear case for official app UI comparison, and a manifest test
  fails if a case is missing from the checklist. The manifest also pins 26 WH
  app UI setups for those 25 cases so multi-faction cases cannot collapse into a
  single unbuildable official-app roster setup. `docs/wh40k_app_wargear_ui_setups.md`
  mirrors those setup rows and is checked against the manifest.
- 2026-07-02: Added an executable minimum WH app parity manifest that maps the
  non-wargear required audit groups to focused Builder test files, anchors, and
  expected validation codes/concepts. The manual WH app checklist now has a
  tracked row for all 90 minimum parity groups, guarded by a manifest test.
- 2026-07-02: Added an optional local official WH 40K app DB fingerprint guard.
  When the installed app DB is present, the test compares all 73 loaded
  roster-rule tables in `/Users/losikov/Library/Containers/com.gamesworkshop.w40k/Data/Library/Application Support/db.sqlite`
  against `data/heretic_db.sqlite` by row count and ordered row hash; it skips
  cleanly on machines without the official app DB or `sqlite3`.
- 2026-07-02: Added
  `HereticBuilder/tools/compare_wh40k_saved_rosters.mjs`, a read-only local
  script that converts saved WH app `roster_*` rows into Builder roster shape
  and compares aggregate `valid`/`invalid` state. The current local `CSM` saved
  roster matches: official `invalid`, Builder `invalid`, Builder code
  `warlord.not_selected`. A local optional test now runs this script when the
  official WH app DB is present and fails on any saved-roster aggregate mismatch.
- 2026-07-02: Added an optional official DB schema guard proving that local WH
  app validation storage is aggregate-only in v879: the only validation-like
  table is `roster_validation_state`, with `id`, `rosterId`, and
  `validationState` columns.
- 2026-07-02: Added a test-only official validation localization key map. It
  pins 56 roster-validation keys from the installed WH app localization bundles
  to Builder validation codes and fails locally if a future app bundle exposes a
  new unmapped validation key.
- 2026-07-02: Added `HereticBuilder/tools/export_wargear_parity_manifest.mjs`.
  It exports the executable 25-case wargear parity checklist as JSON, including
  `comparisonScope: "wargear-only"`, expected Builder state/codes,
  official-like concept, `setupCount`, per-unit UI setup hints, units,
  miniatures, and selected wargear option/item IDs, names, and counts.
  Multi-unit wargear cases can split into several WH app UI setups when the
  units belong to different factions; v879 currently exports 26 setups for 25
  cases. The tool also supports `--format markdown` for a human-readable WH app
  result table with expected state, Builder codes, selected wargear grouped by
  model, and pending WH app result columns. It also supports `--check-results`
  for filled markdown worksheets, returning `pending`, `match`, `incomplete`,
  or `mismatch` and failing on missing, duplicate, unexpected, state-mismatched,
  or parity-mismatched rows. A CLI guard verifies JSON export, markdown export,
  pending-result, match-result, and mismatch-result modes.
- 2026-07-02: Added `HereticBuilder/tools/export_minimum_parity_manifest.mjs`.
  It reuses the executable 90-case minimum parity manifest and exports JSON or a
  markdown WH app result worksheet. Its `--check-results` mode validates the
  `## Minimum manifest parity groups` section of the manual checklist, catching
  missing, duplicate, unexpected, pending, and invalid-parity rows. The existing
  minimum manifest test now verifies JSON export, markdown export, current
  checklist parsing, pending-result, match-result, and mismatch-result modes.
- 2026-07-02: Converted the manual checklist's machine-verifiable minimum
  evidence rows from `Pending` to guard-backed `match`. The minimum checklist
  now has 73 of 90 rows matched by local DB/bundle/export guards or focused
  evidence tests, with 17 manual UI/golden-case rows still pending. The 25
  wargear UI parity rows remain pending until the generated WH app worksheet is
  filled from the official app UI.
- 2026-07-02: Tightened the minimum checklist checker with
  `--allow-manual-pending-only`. This keeps the 17 manual WH app UI/golden-case
  rows allowed during the in-progress pass, but fails if any guard-backed
  evidence row accidentally returns to `Pending`.
- 2026-07-02: Filled the `WH app method` column for all 17 remaining manual
  minimum parity rows. They still intentionally have pending result/parity
  fields, but each row now names the official app scenario to recreate and the
  Builder fixture state to compare.
- 2026-07-02: Added `HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs`
  and the generated `docs/wh40k_app_manual_pass_pack.md`. The pack contains only
  the 17 manual minimum UI/golden cases and the 26 wargear UI setups, so the
  remaining official app pass can be worked without scanning the full audit.
  The minimum manifest test now verifies the checked-in pack matches the
  generator output.
- 2026-07-02: Added `--check-results` to the manual pass-pack exporter. The
  focused pack now validates both its minimum-case and wargear-setup sections,
  reports `incomplete` unless pending rows are explicitly allowed, and fails on
  missing, duplicate, unexpected, state-mismatched, or parity-mismatched rows.
- 2026-07-02: Added pass-pack result extraction. A filled focused pack can now
  emit a full minimum checklist with the 17 manual rows merged back in, and a
  standalone wargear results worksheet that is accepted by the existing wargear
  manifest checker. This keeps the official app UI pass as a single manual data
  entry surface.
- 2026-07-03: Added a generated manual WH app runbook. It groups the 17
  remaining minimum UI/golden rows by rule family and the 26 wargear UI setup
  rows by roster faction/detachment, so the official app pass can be executed in
  batches without scanning the raw pass-pack table.
- 2026-07-03: Added a generated manual pass-pack status view. It reports total
  match/pending/mismatch/blocked/invalid counts, structural status, and the next
  pending runbook batch, so partial official app passes can be resumed without
  recounting the markdown tables by hand.
- 2026-07-03: Added structured manual triage actions to the focused pass pack.
  The checker now enforces `match -> none`, `mismatch -> logic|builder-ui`, and
  `blocked -> official-ui-blocked|builder-ui`, making the logic-vs-UI follow-up
  decision explicit instead of relying on prose notes.
- 2026-07-03: Added generated manual action backlog extraction. Once a row is
  triaged, `--extract action-backlog` lists only the resulting `logic`,
  `builder-ui`, and `official-ui-blocked` follow-ups while still failing on
  malformed or action-inconsistent pass-pack rows.
- 2026-07-03: Added generated next-pending-batch extraction. The pass-pack tool
  can now emit only the current resumable WH app UI batch, so the next official
  app pass starts from the status-selected rows instead of re-scanning the full
  43-row table.
- 2026-07-03: Added checked next-batch merge support. A filled
  `docs/wh40k_app_manual_next_batch.md` can be merged back into a pass-pack
  candidate with `--merge-batch`, and the command rejects malformed or
  action-inconsistent results before the candidate replaces the working pack.
- 2026-07-03: Added standalone next-batch checking. `--check-batch` reports
  current-batch status/action counts and rejects malformed or action-inconsistent
  rows before a merge candidate is produced.
- 2026-07-03: Added generated next-action output. `--next-action` summarizes
  the current manual pass state and emits the command bundle for the next
  workflow step, keeping the batch loop resumable without re-reading the full
  status document.
- 2026-07-03: Split manual pass workflow helpers out of the CLI exporter into
  `HereticBuilder/tools/manual_wh40k_pass_pack_workflow.mjs`, keeping the
  pass-pack parser/exporter smaller without touching the Builder static client.
- 2026-07-02: Tightened the minimum parity manifest and allied tests so the
  Heretic Astartes daemon ally fixture explicitly covers under-cap and over-cap
  points, plus Khorne, Nurgle, Slaanesh, and Tzeentch Battleline outnumbering
  invalid/valid pairs.
- 2026-07-02: Expanded the Aeldari parity fixture and minimum manifest to cover
  Drukhari keyword restriction limits for Harlequin characters, not only the
  Asuryani/Ynnari zero-limit exception.
- 2026-07-02: Added real-catalog coverage for every live v879 top-level
  `keyword_restriction_group` with a configured limit. The test proves valid and
  invalid states for all 15 current top-level groups. The currently empty
  Warlord-gated restriction field path has synthetic coverage for non-zero and
  zero-limit groups.
- 2026-07-02: Added real-catalog coverage for every live v879
  `restriction_group_detachment_limit` row. The test proves min and max valid /
  invalid states for all 7 current detachment-linked keyword restriction rows.
- 2026-07-01: Split the oversized validation test file into focused suites by
  rule family plus a shared catalog/helper module.

## Order of work

### 1. Add stable validation codes - done

Current state:

- Builder validation messages are plain text only.
- Tests cannot reliably compare rule categories with WH 40K app validators.

Fix:

- Add a `code` field to every validation message.
- Prefer names that map closely to official validator/error concepts, for
  example:
  - `roster.detachment_missing`
  - `roster.points_limit_exceeded`
  - `allies.points_limit_exceeded`
  - `allies.required_warlord_missing`
  - `enhancement.invalid_warlord`
  - `attachment.unit_must_be_attached`
  - `wargear.invalid_loadout`
- Keep existing text initially, so UI impact stays small.

Done when:

- Every `messages.push({ level, text })` in validation code also has `code`.
- Tests assert validation codes first and human text second.

### 2. Add golden parity fixtures - done for Builder, WH app comparison remains

Before rewriting risky logic, lock down representative cases.

Required fixture groups:

- Heretic Astartes allies:
  - Legiones Daemonica points cap.
  - Daemon Khorne/Nurgle/Slaanesh/Tzeentch non-Battleline outnumbering
    Battleline.
  - Chaos Knights / Titanicus Traitoris ally keyword caps.
  - Cult-legion allies for Death Guard, Thousand Sons, World Eaters, and
    Emperor's Children.
- Adeptus Astartes:
  - Black Templars detachment DP override.
  - Stormlance Task Force override for Black Templars, Blood Angels, and
    Deathwatch.
  - Successor chapter Epic Hero conflict.
- Ynnari / Asuryani / Drukhari:
  - Devoted of Ynnead mandatory warlord.
  - Asuryani keyword restriction groups excluding Ynnari.
  - Drukhari Harlequin character keyword restriction limits.
- Enhancements:
  - Battle-size enhancement limit.
  - Required keyword groups.
  - Excluded keyword failure.
  - Required wargear failure.
  - `Disciple of Khorne` cannot-be-warlord behavior.
- Attachments:
  - Valid leader/bodyguard.
  - Invalid leader/bodyguard keyword.
  - Support unit missing required group.
  - Explicit leader/support-without-bodyguard `UnitMustBeAttached` case.
  - Future standalone must-attach case only if official data exposes a flag.
- Wargear:
  - Cthonian Beserks heavy plasma axe / concussion maul / twin gauntlet.
  - `’Ardmob Boyz` Boss Nob duplicate-name Big Choppa bridge.
  - Eliminator Sergeant substitute all-model set.
  - Termagants all-model substitutions.
  - Limited-wargear model-count thresholds.
  - Zero-count miniature with selected wargear.
- Allegiance abilities:
  - Pactbound Zealots Mark of Chaos mandatory selection.
  - Daemonic Allegiance required wargear.
  - Headhunter/Houndpack/Solar/Subterranean roster min/max group limits.

Done when:

- Each fixture records the expected Builder validation codes/concepts.
- The minimum parity fixture groups are mapped by
  `tests/builder_validation_minimum_parity_manifest.test.mjs`.
- The manifest anchors the required subcases, not only the surrounding test
  names.
- Manual WH app comparison is documented for each fixture group.

### 3. Apply safe rule fixes - done for first batch

These fixes are low-risk and should happen before the wargear rewrite.

Fixes:

- Change `factionScope` to walk `state.catalog.factionKeywordById`, not only
  bootstrap-visible `factionById`.
- Change enhancement `cannotBeWarlord` validation to check the target model
  against the selected warlord miniature, not the whole unit.
- Harden `keyword_ally_restricting_keyword` handling so new-table rows are not
  applied globally to every allied faction.
- Preserve existing validation text while adding codes.

Done when:

- Existing validation behavior stays stable except for confirmed fixes.
- New targeted tests cover each fixed rule.

### 4. Implement attachment parity - done for v879

Problem:

- Official app has a distinct `UnitMustBeAttached` error.
- v879 exposes that error text as `attach_unit_required`, but has no standalone
  catalog flag saying a datasheet must always be attached outside an explicit
  attached group.

Fix:

- Emit `attached_unit.must_be_attached` when an explicit attached group contains
  leader/support members without a bodyguard.
- Keep incomplete-group validation separate from must-be-attached validation.
- Keep standalone leader/support-capable units valid unless a future official
  data version adds a separate must-attach flag.

Done when:

- Builder distinguishes:
  - a leader/support member in an attached group that must be attached to a
    bodyguard;
  - a bodyguard-only or empty manually-created attachment group;
  - an invalid leader/support/bodyguard pairing.

### 5. Verify keyword restriction scope - done for Builder, WH app comparison remains

Problem:

- Builder starts keyword restriction groups from exact roster faction.
- Future or hidden parent-scope data could require inherited faction scope.

Fix:

- Use golden cases to decide whether WH app applies restriction groups through
  `factionScope(roster.factionKeywordId)`.
- If yes, load groups for every faction ID in scope.
- Keep detachment-linked restriction groups as a separate path.

Done when:

- Parent/child faction cases match WH app.
- Asuryani/Ynnari, Drukhari, and named chapter cases are covered by tests.
- Every current top-level live keyword restriction group with a configured limit
  is covered by valid and invalid real-catalog regression paths.
- Every current detachment-linked keyword restriction min/max row is covered by
  valid and invalid real-catalog regression paths.
- Every current detachment unique-keyword shared group is covered by valid and
  invalid real-catalog regression paths.
- Every current detachment-level and faction-level datasheet exclusion row is
  covered by invalid and control-valid real-catalog regression paths.
- Every current Combat Patrol linked-datasheet row is covered by exact-valid,
  missing-required invalid, and extra-not-linked invalid real-catalog regression
  paths.

### 6. Rework wargear parity carefully - done for Builder, WH app comparison remains

Problem:

- Builder's old loadout matching was keyed by normalized wargear names.
- Official app exposes dedicated `RawWargearChoice`, `RawWargearItem`,
  `LoadoutKey`, and `WargearValidation` concepts.
- v879 has duplicate wargear names, including same-datasheet edge cases.

Rules:

- Do not blindly switch everything to `wargear_item.id`.
- Do not keep name-keying without golden tests.

Fix:

- Introduce a `canonicalWargearKey` layer. Done.
- Use item IDs for normal cases. Done.
- Support explicit alias/group keys only where GW data requires equivalence,
  such as confirmed duplicate-name loadout bridges.
- Precompute alias rows during static data export, so the GitHub Pages client
  does not scan the full wargear catalog at runtime. Done.
- Re-check:
  - regular `loadout_choice_set`;
  - `limited_wargear_choice_set`, including total unit model-count thresholds
    duplicate caps, and base-option versus upgrade-option context;
  - `all_model_wargear_choice_set`;
  - base loadouts;
  - zero-count miniature behavior.

Done when:

- Golden wargear fixtures match WH app valid/invalid results.
- Cthonian Beserks, `’Ardmob Boyz`, and Eliminator Squad are covered by
  regression tests.
- Cadian Shock Troops total model-count threshold and duplicate-cap behavior is
  covered by regression tests.
- Battle Sisters Squad overlapping limited combo rows are covered by an
  exact-cover regression test.
- Pathfinder Team and Tankbustas limited choices with embedded base wargear are
  covered by regression tests.
- Hyperadapted Raveners default-only limited caps are covered by regression
  tests.
- Canoptek Macrocytes substitute-without-base and Hernkyn Yaegirs
  base-plus-substitute all-model behavior are covered by regression tests.
- Einhyr Hearthguard independent all-model substitute families are covered by a
  regression test.
- Full default-catalog generated wargear is covered by a regression test.
- A 25-case executable WH app parity manifest covers the high-risk wargear
  shapes and expected Builder codes/concepts, including Cthonian Beserks twin
  concussion gauntlet valid and over-limit states.

### 7. Improve message parity - done for Builder, WH app comparison remains

After logic parity is stable:

- Map Builder codes to official-like validation concepts. Done through the
  test-only `tests/builder_validation_concepts.mjs` parity map.
- Keep text concise for the UI.
- Avoid depending on exact official copyrighted phrasing.

Done when:

- UI shows useful errors.
- Tests assert stable codes and test-only concept coverage.
- Audit can map each official validator/error to a Builder code/concept without
  shipping that map in the static Builder runtime.

### 8. Final verification and audit update

Run:

- Unit/golden validation tests.
- Local Builder smoke test.
- Manual WH app comparison for remaining high-risk fixture groups.

Update:

- `docs/wh40k_app_builder_parity_audit.md`
- This plan, marking completed items and remaining unproven areas.

## Suggested commit sequence

1. `validation-codes-and-fixtures`
2. `safe-rule-fixes`
3. `attachment-parity`
4. `keyword-restriction-parity`
5. `wargear-parity-engine`
6. `final-validation-audit-update`
