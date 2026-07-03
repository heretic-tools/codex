# WH 40K app manual runbook

Date: 2026-07-03

Scope: execution order for the remaining official WH 40K app UI checks.

Data version: 879
Total manual rows: 43
Minimum UI/golden rows: 17
Minimum UI subchecks: 54
Wargear UI setup rows: 26

Primary input file: `docs/wh40k_app_manual_pass_pack.md`.

Recommended loop:

```bash
node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --check-results docs/wh40k_app_manual_pass_pack.md --allow-pending
node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --status --from docs/wh40k_app_manual_pass_pack.md --format markdown > docs/wh40k_app_manual_status.md
node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --next-action --from docs/wh40k_app_manual_pass_pack.md --format markdown > docs/wh40k_app_manual_next_action.md
node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --extract next-pending-batch --from docs/wh40k_app_manual_pass_pack.md > docs/wh40k_app_manual_next_batch.md
node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --extract minimum-subcheck-batch --from docs/wh40k_app_manual_pass_pack.md > docs/wh40k_app_manual_minimum_subcheck_batch.md
node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --check-batch docs/wh40k_app_manual_next_batch.md --from docs/wh40k_app_manual_pass_pack.md --allow-pending
node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --check-subcheck-batch docs/wh40k_app_manual_minimum_subcheck_batch.md --from docs/wh40k_app_manual_pass_pack.md --allow-pending
node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --merge-subcheck-batch docs/wh40k_app_manual_minimum_subcheck_batch.md --from docs/wh40k_app_manual_pass_pack.md > updated-pass-pack.md
node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --merge-batch docs/wh40k_app_manual_next_batch.md --from docs/wh40k_app_manual_pass_pack.md > updated-pass-pack.md
node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --extract action-backlog --from docs/wh40k_app_manual_pass_pack.md > docs/wh40k_app_manual_action_backlog.md
node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --extract minimum-checklist --from docs/wh40k_app_manual_pass_pack.md > updated-minimum-checklist.md
node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --extract wargear-results --from docs/wh40k_app_manual_pass_pack.md > filled-wargear-results.md
```

For Minimum UI batches, prefer `docs/wh40k_app_manual_minimum_subcheck_batch.md` because it carries one `Setup hint` per atomic official-app check.

Fill only the WH app result/diagnostic, parity, action, and evidence columns in the pass pack or batch worksheets. Keep `blocked` for setups a UI cannot express.

Action rule of thumb: `match -> none`, `mismatch -> logic|builder-ui`, `blocked -> official-ui-blocked|builder-ui`.

## Minimum UI Batches

| Batch | Pass-pack rows | Case ids | Builder tests |
| --- | --- | --- | --- |
| Heretic Astartes allies | 1, 2, 3, 4, 5 | `heretic-astartes-daemon-allies-points`, `heretic-astartes-daemon-outnumbering`, `heretic-astartes-chaos-knights-cap`, `heretic-astartes-cult-legion-detachment`, `heretic-astartes-titanicus-traitoris-cap` | tests/builder_validation_allied.test.mjs, tests/builder_validation_allied_availability.test.mjs |
| Adeptus Astartes faction rules | 6, 7 | `adeptus-astartes-detachment-dp-overrides`, `adeptus-astartes-successor-epic-hero-conflict` | tests/builder_validation_factions.test.mjs |
| Aeldari and Drukhari faction rules | 8, 9, 10 | `ynnari-devoted-of-ynnead-warlord`, `asuryani-ynnari-keyword-restrictions`, `drukhari-harlequin-character-limits` | tests/builder_validation_factions.test.mjs |
| Enhancements | 11, 12, 13 | `enhancement-roster-limit`, `enhancement-required-keyword-excluded-keyword-wargear`, `enhancement-disciple-of-khorne-warlord-target` | tests/builder_validation_enhancement_limits.test.mjs, tests/builder_validation_enhancement_edges.test.mjs |
| Attachments | 14 | `attachment-valid-invalid-and-must-attach` | tests/builder_validation_attachments.test.mjs |
| Allegiance abilities | 15, 16, 17 | `allegiance-pactbound-mark-of-chaos`, `allegiance-daemonic-required-wargear`, `allegiance-roster-min-max-groups` | tests/builder_validation_allegiance.test.mjs |

## Wargear Roster Batches

| Roster context | Pass-pack rows | Units | Case ids |
| --- | --- | --- | --- |
| Leagues of Votann / Armoured Trailblazers | 1, 3, 4, 5, 10 | Cthonian Beserks, Hernkyn Yaegirs | `duplicate-name-cthonian-beserks-default-valid`, `all-model-mixed-base-invalid`, `cthonian-twin-concussion-gauntlet-limit-valid`, `cthonian-twin-concussion-gauntlet-over-limit-invalid`, `all-model-substitute-with-active-base-valid` |
| Orks / More Dakka! | 2, 13, 14, 21 | ’Ardmob Boyz, Deff Dread, Tankbustas | `duplicate-name-ardmob-boyz-default-valid`, `duplicate-allowed-loadout-valid`, `duplicate-allowed-loadout-over-limit-invalid`, `limited-default-component-default-loadouts-valid` |
| Adeptus Astartes / Fulguris Task Force | 6, 7, 15, 16 | Eliminator Squad, Intercessor Squad | `all-model-eliminator-sergeant-substitute-valid`, `all-model-eliminator-mixed-base-invalid`, `unit-scoped-limited-counts-across-models-valid`, `unit-scoped-limited-over-limit-invalid` |
| Necrons / Hand of the Dynasty | 8 | Canoptek Macrocytes | `all-model-substitute-without-base-invalid` |
| Tyranids / Ambush Predators | 9, 17, 18, 22, 23, 24, 25 | Termagants, Hyperadapted Raveners | `all-model-termagant-base-plus-substitute-valid`, `limited-threshold-ten-termagants-invalid`, `limited-threshold-twenty-termagants-valid`, `default-only-limited-cap-invalid`, `zero-count-model-wargear-invalid`, `invalid-unit-scope-wargear`, `invalid-model-scope-wargear` |
| Heretic Astartes / Cabal of Chaos | 11, 12 | Chaos Terminator Squad | `alternate-loadout-replaces-regular-valid`, `alternate-loadout-mixed-with-regular-invalid` |
| Adepta Sororitas / Chorus of Condemnation | 19 | Battle Sisters Squad | `limited-overlapping-combo-exact-cover-valid` |
| T’au Empire / Advanced Acquisition Cadre | 20, 26 | Pathfinder Team, Breacher Team | `limited-default-component-default-loadouts-valid`, `invalid-unit-loadout` |

## Completion Gates

- `--check-results` without `--allow-pending` must return `match` before the manual pass is complete.
- Extracted minimum checklist must pass `export_minimum_parity_manifest.mjs --check-results`.
- Extracted wargear worksheet must pass `export_wargear_parity_manifest.mjs --check-results`.
