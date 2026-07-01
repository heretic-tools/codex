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
- 2026-07-01: Added golden tests for Heretic Astartes allied points, keyword
  caps, mutually exclusive ally buckets, required CSM detachment allies, and
  Khorne/Nurgle/Slaanesh/Tzeentch outnumbering restrictions.
- 2026-07-01: Added golden tests for allegiance ability mandatory selection,
  single-choice enforcement, required detachment scope, required wargear, and
  roster min/max keyword groups.
- 2026-07-01: Added faction-specific golden tests for Adeptus Astartes
  detachment point overrides, successor chapter Epic Hero conflicts, Devoted of
  Ynnead mandatory warlords, and Asuryani/Ynnari keyword restriction
  exclusions.
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
- 2026-07-01: Expanded allied golden coverage for all four Heretic Astartes
  cult-legion parent factions, Titanicus Traitoris titan caps, Agents of the
  Imperium allowed-warlord requirements, and slotless Retinue donor/receiver
  pairs.
- 2026-07-01: Added coverage for previously unasserted validation codes:
  unavailable/disallowed allies, required allied allegiance abilities,
  wrong-group/mandatory allegiance choices, Combat Patrol enhancements,
  enhancement target type and target eligibility failures, top-level roster
  illegal datasheets, detachment required datasheets, detachment keyword
  min/max restrictions, faction mandatory warlords, and invalid wargear scope
  and loadout paths.
- 2026-07-01: Audited all current `validationMessage(...)` codes in Builder
  validators against the split `tests/builder_validation_*.test.mjs` suite;
  uncovered list is now empty and `npm test` passes 41 validation tests.
- 2026-07-01: Added an automated validation-code coverage test so new
  `validationMessage(...)` codes cannot be added without a focused test.
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

- Each fixture records the expected Builder validation codes.
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
- Asuryani/Ynnari and named chapter cases are covered by tests.

### 6. Rework wargear parity carefully

Problem:

- Builder's loadout matching is keyed by normalized wargear names.
- Official app exposes dedicated `RawWargearChoice`, `RawWargearItem`,
  `LoadoutKey`, and `WargearValidation` concepts.
- v879 has duplicate wargear names, including same-datasheet edge cases.

Rules:

- Do not blindly switch everything to `wargear_item.id`.
- Do not keep name-keying without golden tests.

Fix:

- Introduce a `canonicalWargearKey` layer.
- Use item IDs for normal cases.
- Support explicit alias/group keys only where GW data requires equivalence,
  such as confirmed duplicate-name loadout bridges.
- Re-check:
  - regular `loadout_choice_set`;
  - `limited_wargear_choice_set`;
  - `all_model_wargear_choice_set`;
  - base loadouts;
  - zero-count miniature behavior.

Done when:

- Golden wargear fixtures match WH app valid/invalid results.
- Cthonian Beserks, `’Ardmob Boyz`, and Eliminator Squad are covered by
  regression tests.

### 7. Improve message parity

After logic parity is stable:

- Map Builder codes to official-like validation concepts.
- Keep text concise for the UI.
- Avoid depending on exact official copyrighted phrasing.

Done when:

- UI shows useful errors.
- Tests assert stable codes.
- Audit can map each official validator/error to a Builder code.

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
