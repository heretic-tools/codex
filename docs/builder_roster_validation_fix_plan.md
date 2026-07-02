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
  slotless donor/receiver reduction for all 12 current slotless groups.
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
  is test-only and gives the future WH app comparison a concrete checklist.
- 2026-07-02: Added an executable minimum WH app parity manifest that maps the
  non-wargear required audit groups to focused Builder test files, anchors, and
  expected validation codes/concepts.
- 2026-07-02: Tightened the minimum parity manifest and allied tests so the
  Heretic Astartes daemon ally fixture explicitly covers under-cap and over-cap
  points, plus Khorne, Nurgle, Slaanesh, and Tzeentch Battleline outnumbering
  invalid/valid pairs.
- 2026-07-02: Expanded the Aeldari parity fixture and minimum manifest to cover
  Drukhari keyword restriction limits for Harlequin characters, not only the
  Asuryani/Ynnari zero-limit exception.
- 2026-07-02: Added real-catalog coverage for every live v879 top-level
  `keyword_restriction_group` with a configured limit. The test proves valid and
  invalid states for all 15 current top-level groups.
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
