# Builder roster validation fix plan

Date: 2026-07-01

Goal: bring Heretic Builder roster validation closer to the official WH 40K app
Battle Forge behavior, without breaking already covered rules.

Related audits:

- `docs/wh40k_app_roster_validation_audit.md`
- `docs/wh40k_app_builder_parity_audit.md`

## Current checkpoint

As of 2026-07-03, the official WH 40K app manual comparison is intentionally
parked as a tracked manual tail, not a blocker for thin-client Builder UX work.
The minimum parity manifest has 91 rows: 74 guard-backed rows are matched by
automated evidence, and 17 minimum UI/golden rows still need official app UI
observations. The focused pass pack has 43 pending manual rows, with the next
atomic worksheet at `docs/wh40k_app_manual_minimum_subcheck_batch.md`.

The active implementation focus is now thin-client UX on top of the static
catalog and local roster cache. The client remains a static GitHub Pages app:
no Python/API runtime, no server-side roster state, and no shipped official app
manual-result dependency in the runtime bundle.

Next thin-client UX slices should keep using the existing static JSON catalog,
pure local validation, and browser storage only. Prefer small presentation and
message-contract improvements, then verify with a local static build and
browser smoke test.

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
- 2026-07-02: Added coverage for selected allegiance abilities whose ability
  group is not present in the current catalog. The validator now has an
  explicit regression test proving it skips the missing group without false
  diagnostics. `npm test` now passes 146 validation tests.
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
  `keyword_ally_restricting_keyword` new table, and the 4
  `keyword.allyRestrictingKeywordId` rows.
- 2026-07-02: Added real-catalog coverage for every live v879 allied
  restricting-keyword row. The test proves invalid and paired-valid states for
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
  tracked row for all 91 minimum parity groups, guarded by a manifest test.
- 2026-07-02: Added an optional local official WH 40K app DB fingerprint guard.
  When the installed app DB is present, the test compares all 73 loaded
  roster-rule tables in `/Users/losikov/Library/Containers/com.gamesworkshop.w40k/Data/Library/Application Support/db.sqlite`
  against `data/heretic_db.sqlite` by row count and ordered row hash; it skips
  cleanly on machines without the official app DB or `sqlite3`.
- 2026-07-03: Added an optional official WH 40K app seed dump inventory guard.
  When `/Applications/WH 40K.app` is installed, the test reads
  `Datasource_SeedDatasource.bundle/dump.json`, pins the v879 129-section
  inventory, verifies every exported Builder table present in the seed dump has
  matching row counts, and classifies the remaining seed sections as reference,
  mission/game, FAQ, stratagem, profile, or rule-container data. The only
  Builder-loaded rule table absent from the seed dump is
  `keyword_ally_restricting_keyword`, which remains covered as a runtime
  data-empty table in the migrated app DB.
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
  It reuses the executable 91-case minimum parity manifest and exports JSON or a
  markdown WH app result worksheet. Its `--check-results` mode validates the
  `## Minimum manifest parity groups` section of the manual checklist, catching
  missing, duplicate, unexpected, pending, and invalid-parity rows. The existing
  minimum manifest test now verifies JSON export, markdown export, current
  checklist parsing, pending-result, match-result, and mismatch-result modes.
- 2026-07-02: Converted the manual checklist's machine-verifiable minimum
  evidence rows from `Pending` to guard-backed `match`. The minimum checklist
  now has 74 of 91 rows matched by local DB/bundle/export guards or focused
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
- 2026-07-03: Added an `Evidence note` gate to the manual pass pack and
  next-batch workflow. Any `match`, `mismatch`, or `blocked` row must now record
  the concrete WH app observation that justifies the parity/action choice;
  pending rows may stay pending. Wargear `blocked` rows are now accepted as
  official-UI-blocked follow-ups instead of being misclassified as expected-state
  mismatches.
- 2026-07-03: Added read-only `Builder expectation` and `Official concepts`
  columns to the manual pass pack and next-batch sheets. The current batch now
  carries the expected Builder valid/invalid diagnostic family and the mapped WH
  app validator concept in the row being filled.
- 2026-07-03: Added 54 explicit `Subchecks` for all 17 minimum manual UI rows.
  Broad rows now enumerate the individual states to recreate in WH app, such as
  all four Chaos daemon outnumbering gods, cult-legion ally buckets, Ynnari
  Warlord controls, enhancement target controls, attachment invalid states, and
  allegiance min/max controls.
- 2026-07-03: Tightened the Heretic Astartes ally subchecks so valid controls
  and invalid states are separate rows. Chaos daemon outnumbering, cult-legion
  required-detachment checks, Chaos Knights keyword caps/mutual exclusion, and
  Titanicus Traitoris caps now cannot be marked `match` by observing only one
  side of the rule.
- 2026-07-03: Split manual pass expectation/subcheck text out of
  `export_manual_wh40k_pass_pack.mjs` into
  `HereticBuilder/tools/manual_wh40k_pass_pack_expectations.mjs`, reducing the
  CLI exporter while keeping generated pass-pack output unchanged.
- 2026-07-03: Added generated minimum subcheck batch extraction and checking.
  `--extract minimum-subcheck-batch` writes the current pending Minimum UI batch
  as one row per subcheck, and `--check-subcheck-batch` rejects missing,
  duplicate, action-inconsistent, or evidence-less filled subchecks. The current
  Heretic Astartes batch expands from 5 pass-pack rows into 24 concrete WH app
  observations without changing the thin Builder client.
- 2026-07-03: Added read-only `Setup hint` guidance to the minimum subcheck
  worksheet. All 54 minimum subchecks now have a concrete roster setup hint,
  with the current Heretic Astartes batch spelling out the Strike Force roster,
  ally caps, daemon Battleline controls, Chaos Knights/Titanicus keyword caps,
  and Pactbound Zealots control detachment. The generated next-action output now
  points Minimum UI work at
  `docs/wh40k_app_manual_minimum_subcheck_batch.md` first, because that worksheet
  is the atomic official-app observation path.
- 2026-07-03: Added generated `Expected state` and `Expected diagnostic`
  columns to the minimum subcheck worksheet. These columns derive from the
  pinned Builder subcheck text and codes, so future WH app UI observations can
  be compared against a concrete `valid`/`invalid` plus diagnostic-present/
  diagnostic-absent expectation instead of free prose.
- 2026-07-03: Added an optional official WH 40K app binary-symbol guard to
  `tests/builder_validation_coverage.test.mjs`. When
  `/Applications/WH 40K.app` is installed, the test extracts Battle Forge
  validator class names from the Swift binary, pins the current 23-symbol set,
  and verifies that every symbol maps to a Builder validation concept. This
  catches newly introduced official validator classes independently from the
  localization-key guard.
- 2026-07-03: Added `--merge-subcheck-batch`, which converts a filled Minimum
  UI subcheck worksheet back into a pass-pack candidate. The merge refuses
  pending or malformed subchecks, then aggregates each pass-pack row's
  subchecks into a single parity/action/evidence result so broad rows cannot be
  marked complete while their concrete WH app observations are still pending.
- 2026-07-03: Split the minimum subcheck worksheet generator/checker into
  `HereticBuilder/tools/manual_wh40k_pass_pack_subchecks.mjs`, keeping
  `export_manual_wh40k_pass_pack.mjs` focused on CLI orchestration after adding
  the subcheck batch workflow.
- 2026-07-03: Split next-batch extraction, standalone batch checking, merge
  support, and action-backlog blocking checks into
  `HereticBuilder/tools/manual_wh40k_pass_pack_batches.mjs`. The CLI exporter is
  now down to roughly 1,100 lines while preserving generated pass-pack,
  next-batch, and subcheck-batch output.
- 2026-07-03: Added direct module-level tests for the manual pass-pack batch and
  subcheck helpers. The tests now exercise pending/ready summaries, subcheck
  merge aggregation, next-batch merge behavior, and action-backlog blocking
  counts without going only through the CLI subprocess.
- 2026-07-03: Resumed thin-client UX after parking the manual WH app tail.
  Builder validation UI now shows a compact summary, groups diagnostics by
  stable validation code, and filters the unit screen to diagnostics scoped to
  the current unit while separately showing the count of other roster issues.
  Validation messages now support optional lightweight `scope` metadata
  (`unitId`, `datasheetId`, `unitIds`, `datasheetIds`, and target ids) so the
  UI no longer has to rely only on message text for unit diagnostics. This
  remains a runtime-local presentation contract and does not add a backend or
  extra catalog chunks.
- 2026-07-03: Deleted the pre-research Builder UI monolith and replaced it with
  a small rewrite shell. The new `builder.js` only loads the static catalog,
  opens the local roster cache, creates/list/deletes roster records, and renders
  read-only roster summary plus `validateRoster` diagnostics. The old
  detachment/unit/wargear editor DOM and CSS hooks were removed from
  `builder.html`, `builder.css`, and `builder.js` so the next editor can be
  rebuilt from the researched rule contracts instead of inherited UI state. The
  browser cache store name is reset to `heretic-builder-thin-v1`, so old local
  rosters are not read by the new client.
- 2026-07-04: Added the first thin-client unit detail editor slice on top of
  the researched rule contracts: roster units open into their own local route,
  warlord/enhancement/wargear changes write compact roster state, and selected
  roster/unit summaries are refreshed through the same static validator used by
  the diagnostics view. The route stays GitHub Pages compatible and does not add
  a server roster API.
- 2026-07-04: Tightened browser-local storage for the static Builder. IndexedDB
  writes now resolve only after the enclosing transaction completes, list rows
  use a compact `listSummary` cache instead of recalculating full validation on
  the roster list, and export/import moves roster JSON through user-selected
  files while revalidating imported rosters locally before saving them.
- 2026-07-04: Added standalone Builder asset cache-busting for GitHub Pages.
  The static build computes a content hash for Builder CSS/JS/template assets,
  injects it into `builder.html`, and rewrites local Builder module imports in
  the output directory so browsers do not keep stale modules after a Pages
  deploy.
- 2026-07-04: Removed the remaining list-summary fallback that recomputed
  points from stored unit rows. The new Builder data shape now requires cached
  list totals to be written by create/update/import flows, keeping the roster
  list thin and avoiding compatibility paths for old local roster shapes.
- 2026-07-04: Added a thin-client attachment editor for current-shape
  `roster.attachments[].members[]` data. The roster screen can now create local
  bodyguard plus leader/support groups, append additional attached members to an
  existing bodyguard group, and remove attachment groups without adding any
  server API. Unit deletion now removes any current-shape attachment group that
  referenced the deleted unit.
- 2026-07-04: Versioned the cached roster-list summary with the current Builder
  data version. Create/update/import flows now write `roster.dataVersion`
  alongside `listSummary`, startup refreshes stale summaries after a data
  update, and the roster list can display cached valid/invalid state without
  loading the full rule catalog on normal visits.
- 2026-07-04: Added unit-detail allegiance ability selection. Datasheets with
  an `allegianceAbilityGroupId` now show the relevant group and its static
  catalog abilities, writes stay compact as `{id}` rows, and the existing
  allegiance validators continue to own detachment, mandatory, roster-limit,
  and required-wargear diagnostics.
- 2026-07-04: Fixed roster-screen visibility for the thin-client editor.
  Roster diagnostics now render in the top sidebar next to the points summary,
  and selected detachments, units, and attached units render before their
  add-controls. This keeps validation errors and already-added roster contents
  visible without adding runtime state or a server API.
- 2026-07-04: Added scoped validation to the unit detail editor. The unit route
  now filters the existing roster diagnostics by `unitId`, `unitIds`,
  `datasheetId`, and `datasheetIds`, shows those messages next to the unit
  controls, and keeps a compact count of unrelated roster issues in the
  overview. This is presentation-only and does not add cached validation state.
- 2026-07-04: Added scoped validation badges to roster unit rows. The roster
  unit list now reuses the same unit-scoped diagnostics to show error/warning
  counts and a subtle row edge highlight, so users can see which unit needs
  attention before opening the unit detail route.
- 2026-07-04: Added detachment-scoped validation for Builder presentation.
  Detachment availability, detachment-points, unique-keyword, required/linked
  datasheet, and detachment keyword-restriction diagnostics now carry
  `detachmentId` or `detachmentIds` where applicable. The roster detachment
  list reuses that scope to show row-level error/warning badges without
  parsing diagnostic text or storing extra client state.
- 2026-07-04: Added attachment-scoped validation for Builder presentation.
  Attached-unit duplicate membership, incomplete groups, missing bodyguard
  groups, invalid leader/support plus bodyguard pairings, and attached-unit
  enhancement-limit diagnostics now carry `attachmentId` or `attachmentIds`
  where applicable. The roster attached-unit list can use that contract, plus
  member `unitIds`, to show row-level badges without text parsing or extra
  cache state.
- 2026-07-05: Made the attached-unit empty state explain the first useful
  catalog rule blocker when no legal leader/support plus bodyguard pair can be
  created. Pactbound-style shared-keyword gates now surface as a concise
  message on the roster screen while the client still stores no validation
  results and adds no server dependency.
- 2026-07-05: Added Warlord presentation scope for the thin-client roster UI.
  Selected Warlord units now show a compact row badge, and selected invalid or
  duplicate Warlord diagnostics carry unit-scoped metadata so row-level
  validation badges can point at the responsible unit without parsing message
  text or storing validation results.
- 2026-07-05: Added validation context labels and a roster-level Warlord picker
  to reduce dead-end diagnostics. The validation panel can now render compact
  Unit/Detachment/Attached/Datasheet badges from existing scope metadata, and
  the roster overview can set or clear the Warlord using the same compact
  roster action as the unit-detail screen.
- 2026-07-05: Tightened the roster-level Warlord picker so it reuses the
  Warlord eligibility rules before the user commits a selection. Eligible
  candidates sort first, while invalid candidates remain visible with a compact
  reason such as `not eligible`, `Supreme Commander required`, or required
  detachment/faction Warlord hints.
- 2026-07-05: Added target-level eligibility hints to unit-detail enhancement
  selects. Enhancement options still remain visible, but invalid target choices
  now carry compact reasons such as `Character required`, `Epic Hero not
  allowed`, `requires wargear`, `attached unit required`, or `cannot be
  Warlord`, all derived from the same rule helpers used by validation.
- 2026-07-05: Added pre-selection eligibility hints to unit-detail allegiance
  ability selects. Mark/allegiance options now stay visible while invalid
  choices explain required detachments, required wargear, mandatory faction
  choices, or reached group limits through the same rule helper used by
  validation.
- 2026-07-05: Added model-target validation context for the unit detail UX.
  Validation labels can now show `Model` scope, model-target enhancement and
  Warlord diagnostics carry target IDs when the target is known, and the
  wargear editor shows compact scoped wargear issues inside the affected unit
  or model section without caching validation results.
- 2026-07-05: Added a unit-detail `Reset Wargear` action. It restores
  unit-level and model-level wargear from the current static-catalog
  composition defaults while preserving the roster unit, model IDs, Warlord
  flag, enhancements, and attachment state.
- 2026-07-05: Added roster-screen validation navigation. Unit-scoped validation
  groups can open the affected unit detail, detachment rows link to the matching
  static Codex detachment route, and attachment-scoped validation groups can
  scroll to the affected attached-unit row.
- 2026-07-05: Added add-unit candidate hints for duplicate caps and point
  pressure. The unit picker still permits intentionally invalid intermediate
  rosters, but options now surface `limit reached` and `pts over` reasons using
  the same static-catalog duplicate and points data as validation.
- 2026-07-05: Added add-detachment candidate hints for detachment-point
  pressure. Detachment options still remain selectable, but adding a detachment
  that would exceed the battle-size DP limit now carries a compact `DP over`
  reason before the roster is changed.
- 2026-07-05: Added roster-level validation actions for global diagnostics.
  Missing-Warlord, missing-detachment, over-points, and multi-scope validation
  groups can now jump to the relevant thin-client editor section, while
  single-unit, single-detachment, and single-attachment diagnostics keep their
  direct Open/Codex/Show actions.
- 2026-07-05: Added presentation scope metadata to allied validation
  diagnostics. Allied bucket availability, required Warlord/detachment,
  datasheet, points, keyword cap, mutually-exclusive keyword, required
  allegiance, and outnumbering messages now identify affected roster unit ids
  so the thin-client unit list can badge responsible rows without parsing text
  or storing validation output.
- 2026-07-05: Added presentation scope metadata to enhancement limit
  diagnostics. Roster enhancement caps, per-enhancement duplicate caps, and
  Combat Patrol duplicate/alternate enhancement messages now identify affected
  roster unit ids, while missing Combat Patrol default enhancements remain a
  global Units action because no concrete unit has selected the missing default.
- 2026-07-05: Added presentation scope metadata to allegiance roster min/max
  diagnostics. Group limit messages now identify the roster units with that
  allegiance group, including detachment-scoped Houndpack/Headhunter cases, so
  the unit list can point users at the relevant selectors.
- 2026-07-05: Added presentation scope metadata to keyword restriction
  diagnostics and tightened validation action priority. Top-level and
  detachment-scoped keyword min/max/zero-limit messages now identify affected
  roster unit ids when present, and detachment-scoped missing-datasheet or
  keyword-minimum diagnostics now jump to Units instead of opening Codex.
- 2026-07-05: Added explicit focus targets for validation navigation. Warlord
  actions focus the Warlord select, Detachments actions focus the add-detachment
  select, Units actions focus unit Search, and Attached actions focus the
  bodyguard select instead of landing on the first existing row.
- 2026-07-05: Added datasheet-aware validation actions. Grouped diagnostics now
  carry `datasheetIds`, and single-datasheet missing/linked-datasheet
  detachment errors can use a `Find` action that focuses Units Search and
  pre-fills the required datasheet name.
- 2026-07-05: Added richer Warlord presentation scope. Missing mandatory
  Warlord diagnostics now carry the required datasheet id so validation can use
  the Units `Find` action, mandatory-Warlord-present diagnostics scope the
  required unit, and Supreme Commander diagnostics scope both the selected
  Warlord and the Supreme Commander units.
- 2026-07-05: Tightened validation-action priority after adding more scopes.
  Datasheet `Find` actions still win first, then code-specific actions like
  Warlord `Pick` and required-detachment `Detachments`, and only then generic
  single-unit `Open`; this keeps new unit scope metadata from turning global
  fix actions into less useful unit-detail navigation.
- 2026-07-05: Added unit-detail validation actions and focus targets. Unit
  diagnostics can now jump to local Wargear, Enhancements, Allegiance Ability,
  Warlord, or Composition controls, and those targets focus the relevant select
  or wargear input without adding cached validation state.
- 2026-07-06: Added local unit-detail validation blocks for Composition,
  Warlord, Allegiance Ability, and Enhancement controls. The unit page now
  reuses the existing unit-scoped diagnostics beside the relevant editor fields,
  while Wargear keeps its existing model/unit scoped messages and no validation
  result is cached in roster storage.
- 2026-07-06: Added optional unit-detail focus targets to roster validation
  actions. Single-unit diagnostics can now navigate to `/unit/<id>/focus/<target>`
  and immediately highlight the matching Wargear, Enhancement, Warlord,
  Allegiance, or Composition control without adding route state outside the hash.
- 2026-07-06: Added a read-only `Roster Issues` block to the unit-detail page.
  Unit-scoped diagnostics still render under `Unit Validation`, while unrelated
  roster/global diagnostics are visible without returning to the roster editor or
  caching any extra validation state. Local unit-detail actions are reused when a
  roster issue can be resolved by a control already present on the unit page.
- 2026-07-05: Added target-aware unit-detail Wargear navigation. Grouped
  diagnostics now carry `targetIds`, and model-scoped wargear messages can jump
  directly to the affected model's Wargear section instead of only the broad
  unit Wargear area.
- 2026-07-05: Added target-aware unit-detail Enhancement navigation.
  Model-scoped enhancement diagnostics now jump to the affected model's
  enhancement select when the diagnostic carries exactly one target id, while
  broader enhancement diagnostics still jump to the main Enhancements section.
- 2026-07-05: Added an inline clear button to the roster unit Search control.
  The unit add row keeps Add immediately to the right of the datasheet select,
  while Search now has the same compact `x` affordance as the Codex search
  pattern and continues to act as the Units validation focus target.
- 2026-07-05: Added detachment scope to missing Combat Patrol default
  enhancement diagnostics. The action remains Units because the missing
  enhancement must be selected on a unit, but the validation row can now show
  which Combat Patrol detachment requires it.
- 2026-07-05: Removed the separate add-unit Source select. The unit picker now
  uses one searchable dropdown grouped by available source, with native
  datasheets first and allied datasheets after them, while option values still
  carry `allyType` plus `datasheetId` for thin-client roster updates.
- 2026-07-05: Added compact roster unit thumbnails from local Codex unit-image
  assets. The static exporter now writes `unit-images.json` as a datasheet-id to
  filename map, full catalog load indexes it as `unitImagesByDatasheetId`, and
  bootstrap/list startup remains image-free.
- 2026-07-05: Reused the same local unit thumbnail helper in attached-unit rows,
  so bodyguard and attached leader/support entries now share the roster unit
  list's visual language without adding runtime fetches or cached UI state.
- 2026-07-05: Split attached-unit row rendering out of
  `builder_roster_attachment_editor_view.js` into
  `builder_roster_attachment_rows.js`. The attachment editor now owns only the
  picker controls and list composition, while row validation badges, member
  removal, and unit thumbnail rendering stay in a focused module.
- 2026-07-05: Split attached-unit row metadata out of
  `builder_roster_attachment_rows.js` into
  `builder_roster_attachment_row_model.js`. The row renderer now keeps DOM and
  remove actions, while member ordering, title text, and validation badge status
  are computed in a small model helper.
- 2026-07-05: Split attached-unit member/title DOM out of
  `builder_roster_attachment_rows.js` into
  `builder_roster_attachment_member_view.js`. The row renderer now composes the
  row frame, validation badge, bodyguard thumbnail, and remove-attached-unit
  action while member removal links stay isolated.
- 2026-07-05: Split attached-unit candidate discovery and unavailable-message
  diagnostics out of `builder_roster_attachment_options.js` into
  `builder_roster_attachment_candidates.js` and
  `builder_roster_attachment_unavailable.js`. The options facade still exports
  the same picker helpers while no-match explanations are isolated.
- 2026-07-05: Added the local unit image helper to the unit-detail overview, so
  opening a unit from the roster keeps the same visual identity while validation
  controls and focus targets remain unchanged.
- 2026-07-05: Added Codex-style inline Search with clear control to the
  add-detachment row. Detachment validation focus still lands on the dropdown,
  while the filter can match either detachment name or disposition.
- 2026-07-05: Split detachment editor candidate filtering and selected-row
  rendering out of `builder_roster_detachment_editor_view.js` into focused
  candidate and row modules. The editor now owns only the add/search controls
  and list composition while preserving the previous public candidate exports.
- 2026-07-06: Split detachment candidate DP status and option label formatting
  out of `builder_roster_detachment_candidates.js` into
  `builder_roster_detachment_candidate_status.js` and
  `builder_roster_detachment_option_labels.js`. The candidate module now only
  filters, searches, and sorts rows while preserving its public exports.
- 2026-07-05: Split detachment search/select/Add controls out of
  `builder_roster_detachment_editor_view.js` into
  `builder_roster_detachment_controls.js`. The editor now composes section title,
  selected detachment list, and the focused controls module.
- 2026-07-05: Added explicit empty picker states for unit and detachment search.
  When filters return no candidates, the dropdown shows a disabled explanatory
  option and both the select and Add button are disabled.
- 2026-07-05: Replaced the generic selected-unit `Allied` badge with a compact
  source badge derived from the same allied parent-faction data used by the
  add-unit picker, keeping long multi-faction sources truncated with a full
  title tooltip.
- 2026-07-05: Tightened roster validation action routing for empty rosters and
  Warlord conflicts. `roster.empty` now jumps to Units, while multiple,
  invalid, Supreme Commander, and detachment-mandatory Warlord conflicts jump
  to the Warlord picker even when unit scope metadata is present.
- 2026-07-05: Split unit-detail validation action navigation out of
  `builder_roster_unit_detail_view.js` into
  `builder_roster_unit_detail_actions.js`, preserving the public
  `unitValidationActionTarget` re-export while reducing the main detail view.
- 2026-07-05: Split attached-unit availability and empty-state explanation logic
  out of `builder_roster_attachment_editor_view.js` into
  `builder_roster_attachment_options.js`. The editor view now stays focused on
  DOM rendering while tests keep importing `attachmentUnavailableMessage`
  through the previous public module.
- 2026-07-05: Split attached-unit option labels and failure explanations out of
  `builder_roster_attachment_options.js` into
  `builder_roster_attachment_types.js` and
  `builder_roster_attachment_failures.js`. The options module is now a small UI
  candidate facade, while the rule diagnostics remain cache-busted for
  standalone GitHub Pages builds.
- 2026-07-06: Split attached-unit list formatting out of
  `builder_roster_attachment_types.js` into
  `builder_roster_attachment_list_format.js`, so type labels/role helpers no
  longer own failure-message list copy.
- 2026-07-05: Split attached-unit validation matchers and attached-unit
  Enhancement restrictions out of `builder_attachment_rules.js`. The public
  attachment rule module still exports the same validation API, while
  datasheet/bodyguard matching and "one Enhancement per attached unit" rules
  are independently auditable.
- 2026-07-05: Split duplicate attached-unit membership validation out of
  `builder_attachment_rules.js` into `builder_attachment_membership_rules.js`.
  The public validator now delegates repeated-unit membership diagnostics before
  checking incomplete groups, must-attach cases, and pair attachability.
- 2026-07-06: Split attached-unit validation diagnostic construction out of
  `builder_attachment_rules.js` into `builder_attachment_validation_messages.js`,
  keeping the validator focused on group shape and pair attachability.
- 2026-07-05: Split unit-detail Wargear rendering and scope-local validation
  display out of `builder_roster_unit_detail_view.js` into
  `builder_roster_unit_wargear_view.js`, leaving the main detail view focused on
  composition, Warlord, allegiance, enhancements, and page layout.
- 2026-07-05: Split the unit-detail overview and Wargear section shells out of
  `builder_roster_unit_detail_view.js` into
  `builder_roster_unit_overview_view.js` and
  `builder_roster_unit_wargear_section_view.js`. The route module now only
  resolves summary/validation context and composes focused view slices.
- 2026-07-05: Split Wargear option/group controls and Wargear-scope validation
  display out of `builder_roster_unit_wargear_view.js` into option and
  validation view modules. The Wargear scope module now only composes sections,
  group lookup, target anchors, and the two focused renderers.
- 2026-07-05: Extended the standalone Builder cache-bust test to cover the new
  split modules and local unit-image helper. This keeps GitHub Pages deployments
  honest: every local Builder import must be rewritten with the same asset hash
  as the entrypoint HTML.
- 2026-07-05: Fixed attachment-scoped validation presentation to include
  diagnostics scoped to a single member `unitId`, not only grouped `unitIds`.
  Attachment rows now surface errors attached directly to a leader, support, or
  bodyguard member inside the group.
- 2026-07-05: Hardened unit-scoped validation presentation to also match
  diagnostics scoped only to model `targetId` / `targetIds`. Current validators
  usually include `unitId`, but the unit rows and unit detail page no longer
  depend on that duplicate scope being present.
- 2026-07-05: Extended attachment-scoped validation presentation with optional
  member model-target matching. The roster attachment rows now receive the
  existing unit-summary map and can surface model-only Wargear/Enhancement
  diagnostics from attached leaders, support units, or bodyguards.
- 2026-07-05: Deferred stale roster list-cache refresh from startup to roster
  and unit routes. The Builder list route now stays bootstrap-only even when
  cached summaries were written for an older data version; opening the concrete
  roster recalculates and persists the summary without touching `modifiedAt`.
- 2026-07-05: Added an `outdated` roster-list badge state for stale cached
  summaries. The list can now be honest about data-version drift while still
  avoiding full-catalog validation on the GitHub Pages startup path.
- 2026-07-05: Split model-level detachment helpers and selected-row helpers
  out of `builder_model_core.js` into `builder_model_detachments.js` and
  `builder_model_selections.js`. Core model utilities now stay focused on
  faction scope, row/id helpers, names, keywords, and set operations, while
  detachment costs/disposition badges and selected Allegiance/Enhancement rows
  are auditable separately.
- 2026-07-05: Split remaining model core helpers into
  `builder_model_factions.js` and `builder_model_utils.js`, leaving
  `builder_model_core.js` as a compatibility facade. Faction tree traversal,
  datasheet/miniature catalog id lookup, and generic set/name/id utilities are
  now independently cache-busted by the static build inventory.
- 2026-07-05: Split selected-row normalization, composition faction scope, and
  conditional keyword predicates out of `builder_model_selections.js` into
  dedicated modules. The selection facade still exports the same Builder model
  API while ally faction scope and conditional keyword requirements can be
  audited independently.
- 2026-07-05: Split unit-summary keyword/Warlord context and points helpers
  out of `builder_model_summary.js` into `builder_model_keywords.js` and
  `builder_model_points.js`. Unit summary now focuses on composing the final
  roster row while conditional keywords, roster Warlord keyword context,
  datasheet step points, and Enhancement points are independently auditable.
- 2026-07-05: Split unit-summary Enhancement decoration out of
  `builder_model_summary.js` into `builder_model_summary_enhancements.js`.
  Unit and model Enhancement point overrides now sit beside the shared
  Enhancement point helper while the main summary function keeps composing the
  final roster unit row.
- 2026-07-05: Split unit-summary keyword state and final point total helpers out
  of `builder_model_summary.js` into `builder_model_summary_keywords.js` and
  `builder_model_summary_points.js`. `unitSummary` now composes catalog rows,
  keyword state, Enhancement decoration, and point totals through focused slices.
- 2026-07-05: Split composition availability/effective-selection rules and
  miniature row/label helpers out of `builder_model_compositions.js` into
  `builder_model_composition_availability.js` and `builder_model_miniatures.js`.
  The public composition module is now a stable facade, while faction/
  detachment-gated composition selection and roster miniature normalization can
  be audited independently.
- 2026-07-05: Split composition gating predicates and shape/specificity scoring
  out of `builder_model_composition_availability.js` into
  `builder_model_composition_filters.js`. Effective composition selection now
  reads as a small orchestration layer over separately auditable static-catalog
  predicates.
- 2026-07-05: Split composition choice/default selection and effective saved
  composition repair out of `builder_model_composition_availability.js` into
  `builder_model_composition_choices.js` and
  `builder_model_composition_effective.js`. The availability module is now a
  facade over catalog filters, selectable choices, and repair logic.
- 2026-07-05: Split attachment member predicates out of
  `builder_roster_attachment_actions.js` into
  `builder_roster_attachment_members.js`. Unit removal can now depend on the
  small member helper instead of importing all attachment mutation actions, and
  attachment actions reuse the shared roster mutation helper.
- 2026-07-05: Split attachment removal mutations out of
  `builder_roster_attachment_actions.js` into
  `builder_roster_attachment_remove_actions.js`. The public attachment action
  facade still exports add/remove helpers, while remove-member cleanup is
  separately auditable.
- 2026-07-05: Split attachment failure copy out of
  `builder_roster_attachment_failures.js` into
  `builder_roster_attachment_failure_messages.js`. Attachment pairing checks
  now keep catalog-derived failure reasons separate from UI-facing text.
- 2026-07-05: Split attachment bodyguard-group row failure checks out of
  `builder_roster_attachment_failures.js` into
  `builder_roster_attachment_rule_failures.js`. Pair-level failure aggregation
  now stays separate from faction, detachment, datasheet, keyword, and shared
  keyword rule checks.
- 2026-07-06: Split attachment bodyguard-rule catalog lookups out of
  `builder_roster_attachment_rule_failures.js` into
  `builder_roster_attachment_rule_catalog.js`. The rule-failure loop now stays
  focused on applying faction, detachment, datasheet, keyword, and shared
  keyword gates.
- 2026-07-06: Unified attachment validator and picker failure bodyguard-rule
  condition checks in `builder_attachment_rule_conditions.js`. The validator now
  treats an empty condition-failure list as allowed, while UI diagnostics map the
  same condition failures to names; live-row parity tests compare both paths for
  type, datasheet, keyword, required/excluded detachment, shared-keyword, and
  faction-gated cases.
- 2026-07-05: Split Enhancement required/excluded keyword gates out of
  `builder_enhancement_eligibility.js` into
  `builder_enhancement_keyword_rules.js`. Candidate status and validation still
  use the same static catalog rows, but keyword predicates are now isolated for
  rule-by-rule audit.
- 2026-07-05: Split model availability helpers into allied unit sources,
  datasheet availability, and detachment availability modules. The public
  `builder_model_availability.js` facade still exports the same Builder model
  API while native/allied datasheet filtering, Combat Patrol exclusion,
  detachment availability, and allied source labels are auditable separately.
- 2026-07-05: Split datasheet availability predicates into
  `builder_datasheet_faction_filters.js` and
  `builder_datasheet_combat_patrol.js`. The availability list now composes
  native/allied filtering, detachment exclusions, Combat Patrol hiding, and
  composition availability through focused helpers.
- 2026-07-06: Split datasheet faction/detachment exclusion predicates out of
  `builder_datasheet_faction_filters.js` into `builder_datasheet_exclusions.js`,
  preserving existing availability exports while separating native-faction
  matching from explicit exclusion rows.
- 2026-07-05: Split pure loadout count arithmetic out of
  `builder_loadout_math.js` into `builder_loadout_counts.js`. The public
  loadout exports stay unchanged while the rule-facing module is smaller and
  still uses the same precomputed/static catalog data.
- 2026-07-05: Split the loadout count facade into key serialization,
  arithmetic/deduplication, and combination helper modules. Existing loadout
  imports still go through `builder_loadout_counts.js`, while the helper
  modules are now individually cache-busted and auditable.
- 2026-07-05: Tightened roster export/import to use only the current compact
  Builder shape. Transfer now rejects explicit legacy fields such as
  `attachedUnits`, `allegianceAbilityIds`, `unitWargear`, and old enhancement
  ID arrays, while stripping unrelated runtime/UI fields from otherwise valid
  current-shape roster data.
- 2026-07-05: Split roster transfer normalization into helper and unit/member
  row modules. The top-level roster normalizer still rejects legacy roster
  shapes, while primitive value coercion, selection rows, Wargear maps,
  miniature rows, unit rows, and attachment members can be audited separately.
- 2026-07-05: Split transfer normalization helpers into legacy-field guards,
  primitive values, selection rows, Wargear maps, and cached list-summary
  modules. The helper facade still exports the same strict current-shape parser
  pieces, but each import/export concern is now independently cache-busted.
- 2026-07-05: Split attachment-member normalization out of
  `builder_roster_transfer_normalize_units.js` into
  `builder_roster_transfer_normalize_attachments.js`. Roster import still only
  accepts the current compact Builder shape; unit and attachment strict parsing
  are now separate.
- 2026-07-05: Split miniature-row normalization out of
  `builder_roster_transfer_normalize_units.js` into
  `builder_roster_transfer_normalize_miniatures.js`. Current-shape import still
  rejects legacy miniature fields, while unit row parsing only composes strict
  child miniature rows.
- 2026-07-05: Moved roster transfer parsing/serialization behind a dynamic
  import. The Builder list still exposes Export/Import, but the transfer module
  no longer participates in the static startup graph and remains covered by the
  standalone cache-bust test.
- 2026-07-05: Split roster transfer actions out of
  `builder_roster_io_actions.js` into `builder_roster_transfer_actions.js`.
  Create/update/delete stay in the core roster action facade, while Export/Import
  keep their lazy transfer/rules/catalog loading in a focused module.
- 2026-07-06: Split new-roster document construction out of
  `builder_roster_io_actions.js` into `builder_roster_create_model.js`. Create
  action now owns only timestamp/id assignment, save/refresh, and navigation.
- 2026-07-06: Split roster transfer browser-download and import-save helpers out
  of `builder_roster_transfer_actions.js` into
  `builder_roster_export_download.js` and `builder_roster_import_save.js`. The
  transfer action module now only orchestrates lazy parsing, catalog/rules
  loading, and UI alert handling.
- 2026-07-05: Removed the remaining attachment action fallback for old scalar
  membership fields (`leaderUnitId`, `bodyguardUnitId`, `attachedUnitId`,
  `targetUnitId`). Runtime attachment membership now reads only the current
  `attachments[].members[]` shape; legacy fields are rejected at transfer
  boundaries instead of being interpreted.
- 2026-07-05: Made roster import collision-safe for browser-local storage.
  Imported rosters now receive fresh roster IDs when their exported ID already
  exists locally or repeats inside the same file, so Import adds data instead
  of silently overwriting a cached roster.
- 2026-07-05: Split attachment mutation actions out of
  `builder_roster_actions.js` into `builder_roster_attachment_actions.js`.
  The public action facade keeps the same exports, while attachment membership
  and member add/remove rules are isolated and covered by cache-busted static
  build tests.
- 2026-07-05: Split the remaining roster action facade into focused helper,
  detachment, and unit mutation modules. Existing UI imports still use
  `builder_roster_actions.js`, while add/remove detachment behavior, unit
  composition/Wargear/Enhancement/Warlord mutations, and shared immutable
  update helpers can now be audited independently.
- 2026-07-05: Split unit action mutations further into default miniature rows,
  Wargear reset/count mutations, and upgrade/Warlord mutations. The public
  `builder_roster_unit_actions.js` module still exports the same unit action
  API, while add/remove/composition, Wargear, Enhancement/Allegiance, and
  Warlord state changes are independently auditable.
- 2026-07-06: Split Warlord roster mutation out of
  `builder_roster_unit_upgrade_actions.js` into
  `builder_roster_warlord_actions.js`, leaving upgrade actions as the compact
  Enhancement/Allegiance mutation facade while preserving the public exports.
- 2026-07-06: Added an optional Warlord candidate-status guard to
  `builder_roster_warlord_actions.js`. Low-level calls without context preserve
  legacy mutation behavior, while the roster picker and unit-detail Warlord
  control now pass current unit summaries and detachments so ineligible Warlord
  targets cannot be written by the mutation layer.
- 2026-07-06: Added optional Enhancement candidate-status guards to
  `builder_roster_unit_upgrade_actions.js`. Low-level calls without context
  preserve legacy mutation behavior, while the unit-detail Enhancement editor
  now passes current unit summaries, detachments, target keywords, and model
  context so ineligible unit/model Enhancement selections cannot be written by
  the mutation layer.
- 2026-07-05: Split base unit add/remove/composition mutations out of the
  `builder_roster_unit_actions.js` facade into
  `builder_roster_unit_base_actions.js`. The public action API is unchanged,
  while attachment cleanup, default composition, Wargear reset, and miniature
  row regeneration now sit in a dedicated mutation module.
- 2026-07-06: Split datasheet availability into a reusable
  `datasheetAvailableToRoster` predicate and wired `rosterWithAddedUnit` to it.
  Unit picker rows and direct add-unit mutations now share Combat Patrol,
  native/allied availability, detachment exclusion, and default-composition
  checks, so unavailable datasheet ids cannot be written by the mutation layer.
- 2026-07-06: Split detachment availability into a reusable
  `detachmentAvailableToRoster` predicate and wired `rosterWithAddedDetachment`
  to it. Detachment picker rows and direct add-detachment mutations now share
  faction availability and Combat Patrol hiding, so unavailable detachment ids
  cannot be written by the mutation layer.
- 2026-07-06: Added a `unitCompositionCanBeSelected` guard to
  `builder_roster_unit_composition_actions.js`. The unit-detail composition
  picker and direct composition mutations now share datasheet ownership plus
  faction/detachment requirement checks before resetting Wargear and model rows.
- 2026-07-06: Added a `wargearCountCanBeWritten` scope guard to
  `builder_roster_unit_wargear_count_actions.js`. Positive Wargear count
  mutations now require the option to belong to the unit datasheet and to match
  unit-level versus model-level target scope, while zero-count writes remain
  available for cleanup.
- 2026-07-06: Added an optional `allegianceAbilityCanBeSelected` guard to
  `builder_roster_unit_upgrade_actions.js`. Low-level calls without context
  preserve legacy mutation behavior, while the unit-detail Allegiance editor now
  passes current unit summaries and detachments so detachment-gated,
  mandatory-faction, required-Wargear, and roster-limit candidate checks are
  applied before writing the selection.
- 2026-07-06: Split guarded Allegiance and Enhancement unit upgrade mutations
  out of `builder_roster_unit_upgrade_actions.js` into
  `builder_roster_unit_allegiance_actions.js` and
  `builder_roster_unit_enhancement_actions.js`. The upgrade actions module is
  now only a public facade over the two guarded mutation families plus Warlord.
- 2026-07-06: Removed the remaining legacy scalar attachment fixture from
  action tests. Old attachment fields now appear only in transfer-boundary
  rejection tests, while roster mutation tests cover the current
  `attachments[].members[]` shape.
- 2026-07-05: Split unit-detail composition, Warlord, allegiance, and
  enhancement editors out of `builder_roster_unit_detail_view.js` into
  `builder_roster_unit_detail_editors.js`. The unit detail page now stays as a
  small route/view composer while rule-aware option selection lives in a
  focused editor module covered by cache-busted static build tests.
- 2026-07-05: Split Composition, Warlord, and Allegiance unit-detail controls
  out of `builder_roster_unit_detail_editors.js` into dedicated editor modules.
  The shared unit-detail editors module is now an export facade for
  Composition, Warlord, Allegiance, and Enhancement controls.
- 2026-07-05: Split the Builder lazy module registry out of `builder.js` into
  `builder_module_loaders.js`. The entrypoint still keeps route views,
  transfer, full rules, and validators behind dynamic imports, while startup
  routing/storage code is easier to audit for thin-client behavior.
- 2026-07-06: Split the repeated lazy-module promise cache out of
  `builder_module_loaders.js` into `builder_lazy_module.js`. The loader module
  now stays as a cache-busted dynamic-import registry for route/rules chunks.
- 2026-07-05: Split the remaining Builder entrypoint into catalog-runtime,
  roster IO action, and route renderer modules. `builder.js` now only performs
  bootstrap loading, local DB opening, roster-list refresh, initial route
  dispatch, and hash-change wiring; full catalog/rules loading still happens
  only behind roster/unit/import paths.
- 2026-07-05: Split browser-local IndexedDB opening and transaction plumbing
  out of `builder_storage.js` into `builder_storage_db.js`. Public roster
  storage exports are unchanged, while the serverless GitHub Pages storage
  boundary remains guarded against `fetch`, `localStorage`, and `sessionStorage`.
- 2026-07-05: Split basic list/create route rendering and roster/unit/not-found
  route rendering out of `builder_route_renderers.js` into
  `builder_route_basic_renderers.js` and `builder_route_roster_renderers.js`.
  The central renderer now only performs route switching, catalog gating, root
  clearing, and scrollbar refresh while the lazy route bodies stay separate.
- 2026-07-05: Split roster detail, unit detail, and not-found route bodies out of
  `builder_route_roster_renderers.js` into dedicated route modules. The roster
  route facade now only re-exports lazy route handlers, keeping cache/local
  persistence and route-specific update flows isolated.
- 2026-07-05: Split generic catalog index helpers out of
  `builder_catalog_indexes.js` into `builder_catalog_index_helpers.js`.
  Rule-index construction still returns the same catalog shape, but by-id,
  grouped, precomputed-loadout, and unit-image maps can now be audited apart
  from the long list of official-rule indexes.
- 2026-07-06: Split special catalog indexes for Wargear aliases, precomputed
  loadouts, and unit images out of `builder_catalog_index_helpers.js` into
  `builder_catalog_special_indexes.js`, leaving the helper module with only
  generic `byId` and `groupBy` primitives.
- 2026-07-05: Split catalog index construction into ID/precomputed indexes and
  grouped rule indexes. `builder_catalog_indexes.js` is now only a facade that
  composes `builder_catalog_id_indexes.js` and
  `builder_catalog_group_indexes.js`, preserving the catalog shape loaded by
  the static Builder.
- 2026-07-05: Split the static Builder catalog table definition list into core,
  enhancement/allegiance, allied/restriction, and Wargear table modules. The
  exported `CATALOG_TABLES` order is unchanged, but DB rule domains can now be
  audited separately from the loader facade.
- 2026-07-05: Split all-model Wargear choice extraction and occurrence counting
  out of `builder_wargear_all_model_rules.js` into
  `builder_wargear_all_model_choices.js`. The validation rule now focuses on
  per-family validity and emits the same unit-scoped diagnostic, while catalog
  choice arithmetic is isolated and cache-busted by the static build test.
- 2026-07-05: Split all-model Wargear family aggregation out of
  `builder_wargear_all_model_rules.js` into
  `builder_wargear_all_model_family_checks.js`. Family state, substitute-only
  rejection, mixed-base detection, and miniature target collection can now be
  audited independently from the catalog row traversal.
- 2026-07-05: Split active-base and substitute occurrence counting out of
  `builder_wargear_all_model_family_checks.js` into
  `builder_wargear_all_model_family_counts.js`. The family checker now owns
  only rule state transitions, while choice arithmetic is covered by the same
  cache-busted static import inventory.
- 2026-07-06: Split all-model Wargear family state creation and miniature target
  collection out of `builder_wargear_all_model_family_checks.js` into
  `builder_wargear_all_model_family_state.js`. The checker facade keeps the
  same exports while state-key construction and target-id collection are
  independently auditable.
- 2026-07-05: Split Attached Units add-control rendering out of
  `builder_roster_attachment_editor_view.js` into
  `builder_roster_attachment_controls.js`. The editor view now composes the
  section/list, while bodyguard/type/attached selects and the Add action remain
  a small DOM module over local roster mutations.
- 2026-07-05: Split Attached Units select construction and refresh logic out of
  `builder_roster_attachment_controls.js` into
  `builder_roster_attachment_control_selects.js`. The controls module now only
  wires the Add action and event listeners, while selectable bodyguard/type/unit
  options stay isolated from roster mutation.
- 2026-07-05: Split Enhancement attached-bodyguard satisfaction checks out of
  `builder_attachment_enhancement_rules.js` into
  `builder_attachment_enhancement_bodyguard_rules.js`. Datasheet/keyword
  matching for enhancement bodyguard groups is now separate from the attached
  unit enhancement-count validator.
- 2026-07-06: Split Enhancement bodyguard datasheet/keyword allowed predicate
  out of `builder_attachment_enhancement_bodyguard_rules.js` into
  `builder_attachment_enhancement_bodyguard_allowed.js`, leaving the requirement
  loop focused on attached-group membership and faction gates.
- 2026-07-05: Split Attached Units control option factories out of
  `builder_roster_attachment_control_selects.js` into
  `builder_roster_attachment_control_options.js`. The select refresher now
  preserves values and disabled state, while bodyguard/type/unit option rows
  stay in a dedicated DOM option helper.
- 2026-07-05: Split Attached Units select empty/disabled/value preservation
  helpers out of `builder_roster_attachment_control_selects.js` into
  `builder_roster_attachment_control_state.js`. The select refresher is now a
  short ordering function over bodyguard, attachment type, and attached-unit
  options.
- 2026-07-05: Split unit-scoped validation message matching out of
  `builder_validation_scopes.js` into `builder_validation_unit_scopes.js`.
  Unit, datasheet, and miniature target-id diagnostics are now audited apart
  from detachment, attachment, and direct target filters.
- 2026-07-05: Split grouped catalog rule indexes by domain into detachment,
  unit/composition, enhancement/allegiance, allied/restriction, and Wargear
  modules. `builder_catalog_group_indexes.js` now only merges those domain
  maps while preserving every existing `state.catalog.*By*` key.
- 2026-07-05: Split roster runtime helpers out of `builder.js` into
  `builder_roster_runtime.js`. Roster lookup, bootstrap-only list summaries,
  refresh sorting, and stale list-cache persistence are isolated from the
  route render loop without pulling full rules into the startup graph.
- 2026-07-05: Split validation scope filtering and message grouping out of
  `builder_validation_view.js` into `builder_validation_scopes.js` and
  `builder_validation_groups.js`. The validation view remains the DOM facade,
  while unit, detachment, attachment, model-target matching, and grouped
  message metadata can be audited independently.
- 2026-07-05: Split validation scope label formatting out of
  `builder_validation_groups.js` into `builder_validation_scope_labels.js`.
  Message grouping now only accumulates grouped IDs/texts, while label
  hydration from validation context is isolated.
- 2026-07-05: Split validation message-list DOM rendering out of
  `builder_validation_view.js` into `builder_validation_message_list.js`.
  The validation view now composes the section/summary wrapper, while grouped
  item rows, scope badges, counts, and compact lists are isolated.
- 2026-07-05: Split attachment-specific validation scope matching out of
  `builder_validation_scopes.js` into `builder_validation_attachment_scopes.js`.
  Member unit IDs and model target IDs for attached-unit groups are now audited
  separately from generic unit/detachment/target filtering.
- 2026-07-06: Split detachment-specific and direct target validation scope
  matching out of `builder_validation_scopes.js` into
  `builder_validation_detachment_scopes.js` and
  `builder_validation_target_scopes.js`, matching the same per-scope shape as
  unit and attachment diagnostics.
- 2026-07-05: Split Warlord validation into eligibility, candidate-status, and
  scope-helper modules. `builder_warlord_rules.js` still exports the same
  `validateWarlord` and `warlordCandidateStatus` API, while mandatory faction
  Warlord, Supreme Commander, detachment-required Warlord, and generic
  eligibility checks now have smaller audit surfaces.
- 2026-07-05: Split selected-Warlord checks out of
  `builder_warlord_rules.js` into `builder_warlord_selected_rules.js`. The
  top-level validator now owns empty/multiple selection flow, while Supreme
  Commander, detachment-mandatory Warlord, mandatory faction replacement, and
  generic eligibility checks are isolated.
- 2026-07-05: Split mandatory selected-Warlord checks out of
  `builder_warlord_selected_rules.js` into
  `builder_warlord_mandatory_selected_rules.js`. Supreme Commander,
  detachment-required Warlord, and faction-required Warlord diagnostics are now
  separate from the selected model's generic eligibility validation.
- 2026-07-06: Split mandatory selected-Warlord diagnostic construction out of
  `builder_warlord_mandatory_selected_rules.js` into
  `builder_warlord_mandatory_selected_messages.js`, leaving the rule module as
  the condition order for Supreme Commander, detachment, and faction-required
  selected Warlord checks.
- 2026-07-05: Split Allegiance Ability candidate-status and shared helper
  lookups out of `builder_allegiance_rules.js`. The validator still owns
  roster messages, while UI candidate availability, detachment gates, mandatory
  faction choices, Wargear requirements, and roster group-limit candidate
  checks are independently auditable.
- 2026-07-05: Split Allegiance Ability roster-level min/max group limits out of
  `builder_allegiance_rules.js` into `builder_allegiance_group_limits.js`.
  Per-unit selected ability validation remains in the main validator, while
  roster-wide group count diagnostics are isolated.
- 2026-07-05: Split per-unit Allegiance Ability validation and mandatory
  faction Allegiance checks out of `builder_allegiance_rules.js` into
  `builder_allegiance_unit_rules.js` and
  `builder_allegiance_mandatory_rules.js`. The top-level validator now composes
  unit selection checks, roster-wide group limits, and faction mandatory rows.
- 2026-07-06: Split per-unit Allegiance Ability selection validation out of
  `builder_allegiance_unit_rules.js` into
  `builder_allegiance_unit_selection_rules.js`. The unit-rule module now owns
  only group/unit accounting while detachment gates, wrong-group selections,
  mandatory/multiple selections, and required-wargear checks are auditable
  together.
- 2026-07-05: Split loadout catalog/key helpers and precomputed fingerprint
  cache out of `builder_loadout_math.js` into `builder_loadout_catalog.js` and
  `builder_loadout_precomputed.js`. Canonical wargear alias resolution,
  choice-set hydration, and static precomputed loadouts now sit apart from
  valid loadout generation and partition matching.
- 2026-07-05: Split static precomputed loadout cache and record normalization
  out of `builder_loadout_precomputed.js` into
  `builder_loadout_precomputed_cache.js`. Choice-set context validation now
  stays separate from WeakMap cache handling and fingerprint count hydration.
- 2026-07-05: Split canonical Wargear keys, loadout choice item counts, and
  choice-set hydration out of `builder_loadout_catalog.js` into
  `builder_loadout_keys.js`, `builder_loadout_choice_items.js`, and
  `builder_loadout_choice_sets.js`. The catalog module is now a stable facade
  for loadout key/count/set helpers.
- 2026-07-05: Split valid loadout generation and exact/multi-model matcher
  search out of `builder_loadout_math.js` into `builder_loadout_choices.js`
  and `builder_loadout_matcher.js`. `builder_loadout_math.js` is now the
  stable public facade for catalog keys, count helpers, valid-loadout
  generation, and Wargear loadout matching.
- 2026-07-05: Split selected-Wargear target matching and count extraction out of
  `builder_wargear_selection.js` into `builder_wargear_entry_targets.js` and
  `builder_wargear_selection_counts.js`. Wargear validators keep the same public
  imports while unit/model targeting and count hydration are independently
  auditable.
- 2026-07-05: Split limited-Wargear choice hydration and selected-choice cover
  search out of `builder_wargear_limited_rules.js` into
  `builder_wargear_limited_choices.js` and `builder_wargear_limited_cover.js`.
  The validator now only applies limited-set limits to a roster unit, while
  model-count thresholds, upgrade-key filtering, mandatory choices, duplicate
  limits, and exact cover search are auditable separately.
- 2026-07-05: Split limited-Wargear model-count threshold lookup out of
  `builder_wargear_limited_choices.js` into
  `builder_wargear_limited_limits.js`. Choice hydration now stays separate from
  effective `choiceLimit`/`duplicateLimit` row selection.
- 2026-07-06: Split limited-Wargear selected-count filtering out of
  `builder_wargear_limited_choices.js` into
  `builder_wargear_limited_count_filters.js`, so cover-vector construction no
  longer imports the full choice hydration module.
- 2026-07-06: Split limited-Wargear upgrade-key discovery out of
  `builder_wargear_limited_choices.js` into
  `builder_wargear_limited_upgrade_keys.js`. Choice hydration now consumes an
  explicit key set while default-value option scanning stays independently
  auditable.
- 2026-07-05: Split roster-list row rendering out of
  `builder_roster_list_view.js` into `builder_roster_list_rows.js`. The list
  view now owns screen assembly and import/export controls, while the roster
  summary row and validation-state badge mapping are independently testable.
- 2026-07-05: Split attachment add-action mutation out of
  `builder_roster_attachment_actions.js` into
  `builder_roster_attachment_add_actions.js`. The public attachment actions
  module is now a thin compatibility facade over add/remove/member helpers.
- 2026-07-06: Split attachment add record construction out of
  `builder_roster_attachment_add_actions.js` into
  `builder_roster_attachment_add_model.js`, keeping guard order and membership
  checks inside the action while making the current-shape attachment records
  independently cache-busted.
- 2026-07-06: Added an optional attachment-pair rule guard to
  `builder_roster_attachment_add_actions.js`. The add action preserves legacy
  low-level calls when summaries are omitted, while the Builder UI now passes
  current unit summaries so invalid bodyguard pairs cannot be written by the
  mutation layer.
- 2026-07-05: Split per-choice-set loadout generation out of
  `builder_loadout_choices.js` into `builder_loadout_choice_set_loadouts.js`.
  Single-set limit, duplicate, empty-choice, and combination handling are now
  separate from composing regular/alternate loadout choice sets.
- 2026-07-05: Split allied keyword slotless donor/receiver counting out of
  `builder_allied_keyword_limit_rules.js` into
  `builder_allied_keyword_slotless_rules.js`. Keyword-limit validation now
  references a dedicated helper for the donor/receiver offset rule.
- 2026-07-05: Split attachment control select creation and refresh logic out of
  `builder_roster_attachment_control_selects.js` into
  `builder_roster_attachment_control_create.js` and
  `builder_roster_attachment_control_refresh.js`. The public selects module is
  now only a compatibility facade.
- 2026-07-05: Split base Enhancement target eligibility out of
  `builder_enhancement_eligibility.js` into
  `builder_enhancement_base_target_status.js`. Detachment/type/allied/model/
  Epic Hero/Character candidate gating is now separate from required-keyword,
  Wargear, attached-unit, and cannot-be-Warlord checks.
- 2026-07-05: Split unit base roster actions out of
  `builder_roster_unit_base_actions.js` into add, composition, and remove
  modules. Unit creation defaults, composition resets, and attachment cleanup on
  removal now have independent action files behind the same public facade.
- 2026-07-05: Split keyword-restriction validation message/scope helpers out of
  `builder_keyword_restriction_rules.js` into
  `builder_keyword_restriction_messages.js`. The restriction validator now keeps
  group traversal separate from diagnostic construction.
- 2026-07-05: Split roster runtime bootstrap-only summary/cache helpers out of
  `builder_roster_runtime.js` into `builder_roster_runtime_summary.js`. The
  runtime module now owns current roster lookup and storage refresh, while list
  summaries and current-data-version cache wrappers stay isolated.
- 2026-07-05: Split limited-Wargear exact-cover validation out of
  `builder_wargear_limited_cover.js` into vector preparation and memoized search
  modules. Target/vector construction is now isolated from the recursive cover
  solver.
- 2026-07-05: Split validation message summary/count helpers out of
  `builder_validation_message_list.js` into `builder_validation_summary.js`.
  The message-list module now owns grouped DOM rendering, while summary text is
  reusable without DOM code.
- 2026-07-05: Split single-unit summary assembly out of
  `builder_model_summary.js` into `builder_model_unit_summary.js`. The public
  model summary facade now only aggregates roster summaries and points over the
  per-unit summary helper.
- 2026-07-05: Split unit Wargear roster actions out of
  `builder_roster_unit_wargear_actions.js` into count-change and reset-default
  modules. Manual option count updates and default-Wargear restoration now sit
  behind separate action helpers.
- 2026-07-05: Split Supreme Commander Warlord selection discovery out of
  `builder_warlord_mandatory_selected_rules.js` into
  `builder_warlord_supreme_commander_rules.js`. The mandatory-selected validator
  now delegates the Supreme Commander roster scan.
- 2026-07-06: Split conditional Warlord keyword lookup out of
  `builder_warlord_eligibility.js` into
  `builder_warlord_conditional_keywords.js`. `canBeWarlord` now delegates
  conditional `Character` keyword row matching before applying generic Warlord
  eligibility.
- 2026-07-06: Split mandatory Warlord faction/detachment row lookup out of
  `builder_warlord_eligibility.js` into `builder_warlord_mandatory_rows.js`.
  Warlord eligibility now focuses on per-miniature eligibility and re-exports
  mandatory-row helpers for existing callers.
- 2026-07-06: Split roster Warlord miniature id scanning out of
  `builder_model_keywords.js` into `builder_model_warlord_ids.js`. Unit keyword
  resolution no longer owns the roster-level effective-composition scan for
  selected Warlord models.
- 2026-07-06: Split conditional keyword row filtering out of
  `builder_model_keywords.js` into `builder_model_conditional_keyword_rows.js`.
  Unit keyword resolution now consumes prefiltered conditional keyword rows from
  a dedicated helper.
- 2026-07-06: Split all-model Wargear family result helpers out of
  `builder_wargear_all_model_family_checks.js` into
  `builder_wargear_all_model_family_results.js`. Family mutation and final
  invalid/target-id projection are now separate.
- 2026-07-06: Split unit picker select option rendering out of
  `builder_roster_unit_controls.js` into
  `builder_roster_unit_control_options.js`. The controls module now assembles
  search/select/Add widgets while the helper refreshes optgroups and empty
  states.
- 2026-07-06: Split unit Wargear checkbox/number count control creation out of
  `builder_roster_unit_wargear_options_view.js` into
  `builder_roster_unit_wargear_count_control.js`. Wargear option rows now
  delegate input state and change wiring.
- 2026-07-06: Split mandatory Warlord presence/not-selected diagnostics out of
  `builder_warlord_rules.js` into
  `builder_warlord_mandatory_presence_rules.js`. `validateWarlord` now delegates
  faction mandatory-model presence checks before generic selected-Warlord flow.
- 2026-07-06: Split detachment row validation badge calculation out of
  `builder_roster_detachment_rows.js` into
  `builder_roster_detachment_validation_status.js`. Detachment row rendering now
  consumes a precomputed error/warning badge model.
- 2026-07-06: Split unit picker option value serialization/parsing out of
  `builder_roster_unit_candidates.js` into
  `builder_roster_unit_option_values.js`. Candidate grouping now stays separate
  from select-value compatibility parsing.
- 2026-07-05: Split the unit picker/editor view into
  `builder_roster_unit_candidates.js`, `builder_roster_unit_rows.js`, and the
  slim `builder_roster_unit_editor_view.js` facade. Candidate availability,
  selected-unit row rendering, and search/select layout are now auditable
  independently.
- 2026-07-05: Split selected-unit source badges and validation status labels out
  of `builder_roster_unit_rows.js` into `builder_roster_unit_badges.js` and
  `builder_roster_unit_validation_status.js`. The row renderer now only composes
  image/name/meta/remove controls.
- 2026-07-05: Split unit picker search/select/Add controls out of
  `builder_roster_unit_editor_view.js` into `builder_roster_unit_controls.js`.
  The editor view now composes the section and selected-unit list, while control
  refresh, empty picker states, and Add mutations stay in a small DOM module.
- 2026-07-05: Split unit candidate status/label calculation out of
  `builder_roster_unit_candidates.js` into
  `builder_roster_unit_candidate_status.js`. Query/source grouping now stays
  separate from default-composition hydration, duplicate-limit checks, and
  points-over-limit labels.
- 2026-07-06: Split unit picker option label/text formatting out of
  `builder_roster_unit_candidate_status.js` into
  `builder_roster_unit_option_labels.js`, leaving candidate status focused on
  duplicate-limit and points-over-limit checks.
- 2026-07-05: Split enhancement eligibility and candidate-status predicates
  out of `builder_enhancement_rules.js` into
  `builder_enhancement_eligibility.js`. UI candidate filtering and roster
  validation now share the same focused keyword, target, wargear, detachment,
  attached-unit, and Warlord-blocking helpers.
- 2026-07-05: Split selected Enhancement target collection out of
  `builder_enhancement_rules.js` into `builder_enhancement_selection.js`.
  Unit/model target hydration, model-count-zero diagnostics, and per-unit
  multi-Enhancement diagnostics now sit apart from the per-target requirement
  validator.
- 2026-07-05: Split per-target Enhancement validation out of
  `builder_enhancement_rules.js` into `builder_enhancement_selected_rules.js`.
  The top-level validator now composes selection targets and limit checks,
  while detachment, target type, allied, keyword, Wargear, attached-unit, and
  Warlord-blocking diagnostics live in a focused rule module.
- 2026-07-06: Split selected Enhancement per-target validation out of
  `builder_enhancement_selected_rules.js` into base target checks and
  requirement checks. Detachment/target/allied/model/Epic/Character messages now
  sit in `builder_enhancement_selected_base_rules.js`, while keyword, Wargear,
  attached-unit, and Warlord-blocking messages sit in
  `builder_enhancement_selected_requirement_rules.js`.
- 2026-07-05: Split required-Wargear Enhancement checks into
  `builder_enhancement_wargear_rules.js`. Candidate availability and roster
  validation now share the same missing-Wargear lookup, keeping UI reasons and
  validation diagnostics aligned.
- 2026-07-05: Split Enhancement selection limits into
  `builder_enhancement_limit_rules.js`. Battle-size Enhancement caps,
  per-Enhancement limits, and Combat Patrol default Enhancement enforcement are
  now separate from the per-target Enhancement requirement checks.
- 2026-07-05: Split Combat Patrol default Enhancement enforcement out of
  `builder_enhancement_limit_rules.js` into
  `builder_enhancement_combat_patrol_rules.js`, with shared unit-scope metadata
  in `builder_enhancement_limit_scopes.js`. Roster caps, duplicate limits, and
  Combat Patrol defaults are now independently auditable.
- 2026-07-06: Split Combat Patrol default Enhancement lookup and selected-target
  indexing out of `builder_enhancement_combat_patrol_rules.js` into
  `builder_enhancement_combat_patrol_defaults.js`. The rule module now only
  emits required, duplicate, and not-allowed Combat Patrol diagnostics.
- 2026-07-05: Split unit-detail enhancement controls out of
  `builder_roster_unit_detail_editors.js` into
  `builder_roster_unit_enhancement_editor.js`. Composition, Warlord, and
  allegiance controls are now separate from enhancement option hydration and
  eligibility-labelled selects.
- 2026-07-05: Split unit-detail Enhancement option discovery/labels and select
  rendering out of `builder_roster_unit_enhancement_editor.js` into
  `builder_roster_unit_enhancement_options.js` and
  `builder_roster_unit_enhancement_select.js`. The editor now composes the
  section and roster mutations, while detachments, target keywords, points, and
  candidate-status labels are auditable separately from DOM select rendering.
- 2026-07-05: Split unit-detail Enhancement select model construction out of
  `builder_roster_unit_enhancement_editor.js` into
  `builder_roster_unit_enhancement_models.js`. The editor now owns only the
  section shell and roster mutation callbacks, while unit/model option rows are
  prepared in a dedicated view-model helper.
- 2026-07-06: Split unit-detail Enhancement select labels out of
  `builder_roster_unit_enhancement_options.js` into
  `builder_roster_unit_enhancement_labels.js`, separating candidate discovery
  from detachment/points/status label formatting.
- 2026-07-05: Split allied-rule helpers and allied keyword/allegiance/
  restricting-keyword validation out of `builder_allied_rules.js` into
  `builder_allied_rule_helpers.js` and `builder_allied_keyword_rules.js`.
  `validateAlliedUnits` now stays as the ally-family orchestrator while
  keyword caps, slotless donors, required allegiance abilities, and restricting
  keyword counts are audited in a focused module.
- 2026-07-05: Split allied required-Allegiance, keyword-limit/slotless, and
  restricting-keyword checks out of `builder_allied_keyword_rules.js` into
  dedicated modules. The allied keyword module is now a facade while the three
  allied subrule families can be audited independently.
- 2026-07-06: Split allied restricting-keyword row hydration out of
  `builder_allied_restricting_keyword_rules.js` into
  `builder_allied_restricting_keyword_rows.js`, keeping old-table rows and
  keyword-column fallback rows scoped through the same allied parent matcher.
- 2026-07-05: Split allied faction availability/Warlord/detachment/datasheet/
  points checks out of `builder_allied_rules.js` into
  `builder_allied_faction_rules.js`. The top-level allied validator now only
  groups allied units and delegates base faction rules plus the already-isolated
  keyword/allegiance/restricting-keyword families.
- 2026-07-05: Split allied faction availability, Warlord, required-detachment,
  datasheet whitelist, and points-cap checks out of
  `builder_allied_faction_rules.js` into one module per subrule. This keeps
  every allied-faction exception path independently auditable while preserving
  the `validateAlliedFactionRules` facade.
- 2026-07-05: Split keyword restriction group validation out of
  `builder_restriction_rules.js` into `builder_keyword_restriction_rules.js`.
  Detachment/unit composition checks now stay separate from faction and
  detachment keyword restriction group matching, minimums, maximums, and
  excluded-faction scope handling.
- 2026-07-05: Split keyword restriction group hydration, activation, and unit
  matching out of `builder_keyword_restriction_rules.js` into
  `builder_keyword_restriction_groups.js`. The validator now focuses on roster
  and detachment limit messages while group catalog lookup remains auditable
  separately.
- 2026-07-06: Split keyword restriction group catalog hydration out of
  `builder_keyword_restriction_groups.js` into
  `builder_keyword_restriction_group_hydration.js`, leaving the group module for
  active-state and unit-matching predicates.
- 2026-07-05: Split the remaining detachment datasheet/unique-keyword, unit
  composition, and Successor Chapter Epic Hero restrictions out of
  `builder_restriction_rules.js` into focused rule modules. The public
  restriction module is now a stable facade for detachment, keyword,
  successor-chapter, and unit-composition validators.
- 2026-07-05: Split detachment datasheet requirements/exclusions and
  detachment unique-keyword conflicts out of
  `builder_detachment_restriction_rules.js` into
  `builder_detachment_datasheet_rules.js` and
  `builder_detachment_unique_keyword_rules.js`. The detachment restriction
  facade now exposes independent rule families.
- 2026-07-06: Split detachment datasheet diagnostic construction out of
  `builder_detachment_datasheet_rules.js` into
  `builder_detachment_datasheet_messages.js`, keeping required/excluded/linked
  datasheet loops separate from message text and scope construction.
- 2026-07-05: Split `validateRoster` orchestration into validation context,
  basic roster limits, domain rule runner, and post-rule unit checks. The
  public `builder_roster_validation.js` module now preserves diagnostic order
  while keeping points/context construction, selected-detachment/points limits,
  domain validators, duplicate/native/faction checks, and final result shaping
  independently auditable.
- 2026-07-05: Split roster-detail validation action routing out of
  `builder_roster_detail_view.js` into `builder_roster_validation_actions.js`.
  The roster page now stays as layout plus Warlord picker while validation
  buttons, target selection, smooth scroll/focus behavior, Codex links, and
  unit-search actions are isolated.
- 2026-07-05: Split the roster overview shell and Warlord picker out of
  `builder_roster_detail_view.js` into `builder_roster_overview_view.js` and
  `builder_roster_warlord_picker.js`. The roster page now composes overview,
  editor, and validation; the Warlord control owns candidate ordering and
  eligibility labels.
- 2026-07-06: Split roster Warlord picker option-model construction out of
  `builder_roster_warlord_picker.js` into
  `builder_roster_warlord_options.js`, leaving the picker as DOM select wiring
  over the same candidate ordering and eligibility labels.
- 2026-07-06: Reused the roster Warlord picker context in the unit-detail
  Warlord control. The unit-detail select now uses the same candidate status
  reasons as the roster-level picker and passes the same context to the guarded
  Warlord action.
- 2026-07-06: Disabled invalid non-current Warlord, Enhancement, and
  Allegiance select options while keeping current invalid selections visible
  with their validation reason. The mutation guards remain the safety net, and
  focused option-model tests now cover both blocked and current-invalid rows.
- 2026-07-06: Moved unit-detail Enhancement select row construction into
  `builder_roster_unit_enhancement_options.js`. The DOM renderer now only
  paints precomputed rows, while option-model tests prove invalid non-current
  Enhancement choices are disabled and current invalid choices stay visible.
- 2026-07-06: Split unit-detail Warlord select row construction out of
  `builder_roster_unit_warlord_editor.js` into
  `builder_roster_unit_warlord_options.js`. The editor now renders a
  precomputed model, and option-model tests cover invalid and current-invalid
  unit-level Warlord choices.
- 2026-07-06: Split unit-detail Composition select option construction out of
  `builder_roster_unit_composition_editor.js` into
  `builder_roster_unit_composition_options.js`, keeping composition availability
  and label preparation out of the DOM renderer.
- 2026-07-06: Split unit-detail Wargear group lookup out of
  `builder_roster_unit_wargear_view.js` into
  `builder_roster_unit_wargear_groups.js`, so the wargear view renders supplied
  groups while catalog filtering and display-order sorting stay testable.
- 2026-07-06: Split unit-detail Wargear option row and label construction out
  of `builder_roster_unit_wargear_options_view.js` into
  `builder_roster_unit_wargear_options.js`, keeping catalog item/point lookup
  out of the DOM renderer.
- 2026-07-05: Split validation-action target mapping and DOM scroll/focus
  helpers out of `builder_roster_validation_actions.js` into
  `builder_roster_validation_action_targets.js` and
  `builder_roster_validation_action_scroll.js`. Diagnostic code-to-action
  routing is now DOM-free, while the renderer only builds the action button and
  delegates focus behavior.
- 2026-07-05: Split validation diagnostic code-to-action mapping out of
  `builder_roster_validation_action_targets.js` into
  `builder_roster_validation_code_action_targets.js`. The target resolver now
  applies code defaults separately from unit/detachment/attachment scope
  fallbacks.
- 2026-07-05: Split default miniature wargear and closest-valid-loadout
  selection out of `builder_model_wargear.js` into
  `builder_model_wargear_defaults.js`. The main wargear model facade now keeps
  unit-level defaults, selected wargear entries, and points, while miniature
  loadout repair stays focused and testable.
- 2026-07-05: Split selected Wargear entry flattening and Wargear point totals
  out of `builder_model_wargear.js` into `builder_model_wargear_selected.js`.
  Default Wargear construction remains in the facade, while selected runtime
  cost accounting can be audited independently.
- 2026-07-05: Split the closest-valid default Wargear loadout optimizer out of
  `builder_model_wargear_defaults.js` into
  `builder_model_wargear_default_loadouts.js`. Base miniature loadouts and
  default option values now stay separate from score-based valid-loadout
  selection.
- 2026-07-05: Split default Wargear option-key/count helpers and closest-valid
  loadout scoring/search out of `builder_model_wargear_default_loadouts.js`
  into `builder_model_wargear_default_options.js` and
  `builder_model_wargear_default_search.js`. The public default-loadout module
  is now a facade while option mapping and scoring are independently auditable.
- 2026-07-06: Split preferred default-Wargear option-count hydration out of
  `builder_model_wargear_default_options.js` into
  `builder_model_wargear_option_counts.js`, leaving default options focused on
  option IDs and option-key lookup.
- 2026-07-05: Split closest-valid default Wargear candidate scoring and
  multi-model expansion out of `builder_model_wargear_default_search.js` into
  `builder_model_wargear_default_scores.js` and
  `builder_model_wargear_default_candidates.js`. Search now only hydrates valid
  loadouts, ranks them, and maps the chosen counts back to option IDs.
- 2026-07-05: Split roster transfer normalization out of
  `builder_roster_transfer.js` into `builder_roster_transfer_normalize.js`.
  Export/import envelope parsing, serialization, and collision-safe IDs now
  sit apart from strict current-shape roster/unit/miniature/attachment
  normalization and legacy-field rejection.
- 2026-07-06: Split the monolithic Builder roster action test into focused
  attachment, selection, allegiance, loadout, enhancement, and Warlord suites so
  future guarded action parity checks can be added without sharing one oversized
  context.
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
- 2026-07-06: Split multi-model loadout exact-cover partitioning out of
  `builder_loadout_matcher.js` into `builder_loadout_partition.js`, keeping the
  public matcher as a thin orchestration layer and cache-busting the new static
  import in the Builder inventory test.
- 2026-07-06: Split allegiance ability select option preparation out of
  `builder_roster_unit_allegiance_editor.js` into
  `builder_roster_unit_allegiance_options.js`, leaving the editor as a DOM-only
  wrapper around precomputed eligibility labels.
- 2026-07-06: Split allegiance ability option sorting and label text out of
  `builder_roster_unit_allegiance_options.js` into
  `builder_roster_unit_allegiance_labels.js`, leaving the option model builder
  focused on roster/unit context and candidate status calls.

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
