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

### 2. Add golden parity fixtures - started

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
  - Official `UnitMustBeAttached` trigger case.
- Wargear:
  - Cthonian Beserks heavy plasma axe / concussion maul / twin gauntlet.
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

### 4. Implement attachment parity

Problem:

- Official app has a distinct `UnitMustBeAttached` error.
- Builder currently validates existing attachment groups, but returns early when
  no groups exist.

Fix:

- Use golden fixtures to identify the exact official trigger.
- Add a standalone `attachment.unit_must_be_attached` validation path if the app
  requires a unit to be attached even before a group exists.
- Keep incomplete-group validation separate from must-be-attached validation.

Done when:

- Builder distinguishes:
  - a unit that must be attached but is not;
  - an incomplete manually-created attachment group;
  - an invalid leader/support/bodyguard pairing.

### 5. Verify keyword restriction scope

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
- Cthonian Beserks and Eliminator Squad are covered by regression tests.

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
