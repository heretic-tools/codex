# WH 40K app manual pass pack

Date: 2026-07-03

Scope: focused checklist for official WH 40K app UI work that still cannot be proven from local DB/bundle/export guards.

Data version: 879
Minimum manual UI/golden cases: 17
Wargear UI setups: 26

Validation commands:

```bash
node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --check-results docs/wh40k_app_manual_pass_pack.md --allow-pending
node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --status --from docs/wh40k_app_manual_pass_pack.md --format markdown > docs/wh40k_app_manual_status.md
node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --next-action --from docs/wh40k_app_manual_pass_pack.md --format markdown > docs/wh40k_app_manual_next_action.md
node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --extract next-pending-batch --from docs/wh40k_app_manual_pass_pack.md > docs/wh40k_app_manual_next_batch.md
node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --check-batch docs/wh40k_app_manual_next_batch.md --from docs/wh40k_app_manual_pass_pack.md --allow-pending
node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --merge-batch docs/wh40k_app_manual_next_batch.md --from docs/wh40k_app_manual_pass_pack.md > updated-pass-pack.md
node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --extract action-backlog --from docs/wh40k_app_manual_pass_pack.md > docs/wh40k_app_manual_action_backlog.md
node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --format runbook > docs/wh40k_app_manual_runbook.md
node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --extract minimum-checklist --from docs/wh40k_app_manual_pass_pack.md > updated-minimum-checklist.md
node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --extract wargear-results --from docs/wh40k_app_manual_pass_pack.md > filled-wargear-results.md
node HereticBuilder/tools/export_minimum_parity_manifest.mjs --check-results docs/wh40k_app_manual_parity_checklist.md --allow-manual-pending-only
node HereticBuilder/tools/export_wargear_parity_manifest.mjs --check-results filled-wargear-results.md --allow-pending
```

## Minimum Manual UI Cases

| # | Case id | Builder test | Codes | WH app scenario | WH app result | Parity | Action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `heretic-astartes-daemon-allies-points` | tests/builder_validation_allied.test.mjs | allied_points.limit_exceeded | Manual WH app UI: create a Heretic Astartes Strike Force roster, add Legiones Daemonica ally units under and over the battle-size ally points cap, and compare the `daemon-points-under-cap` / `daemon-points-over-cap` Builder fixture states. | Pending | Pending | Pending |
| 2 | `heretic-astartes-daemon-outnumbering` | tests/builder_validation_allied.test.mjs | allied_keyword_restricting_keyword.outnumbered_keywords | Manual WH app UI: in a Heretic Astartes roster, compare Khorne, Nurgle, Slaanesh, and Tzeentch Legiones Daemonica non-Battleline allies that outnumber their matching Battleline controls. | Pending | Pending | Pending |
| 3 | `heretic-astartes-chaos-knights-cap` | tests/builder_validation_allied.test.mjs | allied_keyword_count.limit_exceeded, allied_keyword_count.invalid_mutually_exclusive_keywords | Manual WH app UI: in a Heretic Astartes roster, add Chaos Knights allies at cap and over cap, then compare the Builder keyword-cap and mutually-exclusive ally-bucket fixture states. | Pending | Pending | Pending |
| 4 | `heretic-astartes-cult-legion-detachment` | tests/builder_validation_allied.test.mjs | allied_unit.required_detachment_not_selected | Manual WH app UI: in a Heretic Astartes roster, add Death Guard, Thousand Sons, World Eaters, and Emperor's Children cult-legion allies with and without their configured required detachment selected. | Pending | Pending | Pending |
| 5 | `heretic-astartes-titanicus-traitoris-cap` | tests/builder_validation_allied.test.mjs | allied_keyword_count.limit_exceeded | Manual WH app UI: in a Heretic Astartes roster, add Titanicus Traitoris allies at cap and over cap, then compare the Builder keyword-cap fixture state. | Pending | Pending | Pending |
| 6 | `adeptus-astartes-detachment-dp-overrides` | tests/builder_validation_factions.test.mjs | roster.detachment_points_limit_exceeded | Manual WH app UI: compare Adeptus Astartes child-faction detachment point overrides for Black Templars, Blood Angels, Deathwatch, Stormlance Task Force, and Bastion Task Force cases. | Pending | Pending | Pending |
| 7 | `adeptus-astartes-successor-epic-hero-conflict` | tests/builder_validation_factions.test.mjs | roster.successor_chapter_epic_hero_in_roster | Manual WH app UI: create an Adeptus Astartes successor-chapter roster containing a parent-faction Epic Hero and compare the successor Epic Hero conflict fixture. | Pending | Pending | Pending |
| 8 | `ynnari-devoted-of-ynnead-warlord` | tests/builder_validation_factions.test.mjs | mandatory_warlord.detachment_not_selected | Manual WH app UI: create an Aeldari Devoted of Ynnead roster with and without Yvraine or the Yncarne selected as Warlord, then compare the mandatory-warlord fixture. | Pending | Pending | Pending |
| 9 | `asuryani-ynnari-keyword-restrictions` | tests/builder_validation_factions.test.mjs | keyword_restriction_group.limit_zero | Manual WH app UI: compare Asuryani/Ynnari keyword restriction zero-limit behavior in the Aeldari keyword restriction fixture. | Pending | Pending | Pending |
| 10 | `drukhari-harlequin-character-limits` | tests/builder_validation_factions.test.mjs | keyword_restriction_group.limit_exceeded | Manual WH app UI: create a Drukhari roster with Harlequin Character allies, including the Death Jester over-limit case, and compare the keyword restriction limit fixture. | Pending | Pending | Pending |
| 11 | `enhancement-roster-limit` | tests/builder_validation_enhancements.test.mjs | enhancement.roster_has_too_many_enhancements | Manual WH app UI: select enhancements up to and over the battle-size roster enhancement cap, then compare the Builder roster-limit fixture. | Pending | Pending | Pending |
| 12 | `enhancement-required-keyword-excluded-keyword-wargear` | tests/builder_validation_enhancements.test.mjs | enhancement.model_does_not_have_required_keywords, enhancement.model_must_not_have_excluded_keywords, enhancement.model_does_not_have_required_wargear | Manual WH app UI: apply enhancements that require keywords, exclude keywords, or require wargear, checking valid targets plus missing/excluded/wargear failure states. | Pending | Pending | Pending |
| 13 | `enhancement-disciple-of-khorne-warlord-target` | tests/builder_validation_enhancements.test.mjs | warlord.invalid_due_to_enhancement | Manual WH app UI: apply Disciple of Khorne in Khorne Daemonkin and compare the enhanced-model cannot-be-Warlord state against the unenhanced-model control. | Pending | Pending | Pending |
| 14 | `attachment-valid-invalid-and-must-attach` | tests/builder_validation_attachments.test.mjs | attached_unit.must_be_attached, attached_unit.incomplete, attached_unit.missing_requirements | Manual WH app UI: compare attachment groups for valid leader/bodyguard, duplicate attachments, leader/support without bodyguard, bodyguard without attached model, and invalid support group states. | Pending | Pending | Pending |
| 15 | `allegiance-pactbound-mark-of-chaos` | tests/builder_validation_allegiance.test.mjs | allegiance_ability.not_selected, allegiance_ability.multiple_selected, allegiance_ability.required_detachment_missing | Manual WH app UI: create a Pactbound Zealots roster and compare Mark of Chaos missing, multiple-selected, selected, and required-detachment-scope states. | Pending | Pending | Pending |
| 16 | `allegiance-daemonic-required-wargear` | tests/builder_validation_allegiance.test.mjs | allegiance_ability.missing_wargear_item | Manual WH app UI: select a Daemonic Allegiance ability that requires wargear, then compare missing-wargear and equipped-wargear states. | Pending | Pending | Pending |
| 17 | `allegiance-roster-min-max-groups` | tests/builder_validation_allegiance.test.mjs | allegiance_ability.group_limit_not_reached, allegiance_ability.group_limit_exceeded | Manual WH app UI: compare Headhunter Task Force and Houndpack Lance roster keyword min/max allegiance group states against the Builder fixture. | Pending | Pending | Pending |

## Wargear UI Cases

| # | Case id | Expected | Codes | Roster faction | Detachment | Unit | Wargear setup | WH app state | WH app diagnostic | Parity | Action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `duplicate-name-cthonian-beserks-default-valid` | valid | none | Leagues of Votann | Armoured Trailblazers | Cthonian Beserks | Cthonian Beserk x5: 5 Heavy plasma axe | Pending | Pending | Pending | Pending |
| 2 | `duplicate-name-ardmob-boyz-default-valid` | valid | none | Orks | More Dakka! | ’Ardmob Boyz | Boss Nob x1: 1 Big Choppa; 1 Kustom Shoota; 1 Slugga<br>Boyz x9: 9 Choppa; 9 Shoota; 9 Slugga | Pending | Pending | Pending | Pending |
| 3 | `all-model-mixed-base-invalid` | invalid | wargear_loadout.invalid_wargear_requirement | Leagues of Votann | Armoured Trailblazers | Cthonian Beserks | Cthonian Beserk x5: 1 Concussion maul; 4 Heavy plasma axe | Pending | Pending | Pending | Pending |
| 4 | `cthonian-twin-concussion-gauntlet-limit-valid` | valid | none | Leagues of Votann | Armoured Trailblazers | Cthonian Beserks | Cthonian Beserk x5: 4 Heavy plasma axe; 1 Twin concussion gauntlet | Pending | Pending | Pending | Pending |
| 5 | `cthonian-twin-concussion-gauntlet-over-limit-invalid` | invalid | wargear_loadout.invalid_wargear_requirement | Leagues of Votann | Armoured Trailblazers | Cthonian Beserks | Cthonian Beserk x5: 3 Heavy plasma axe; 2 Twin concussion gauntlet | Pending | Pending | Pending | Pending |
| 6 | `all-model-eliminator-sergeant-substitute-valid` | valid | none | Adeptus Astartes | Fulguris Task Force | Eliminator Squad | Eliminator x2: 2 Bolt pistol; 2 Bolt sniper rifle; 2 Close combat weapon<br>Eliminator Sergeant x1: 1 Bolt pistol; 1 Close combat weapon; 1 Instigator bolt carbine | Pending | Pending | Pending | Pending |
| 7 | `all-model-eliminator-mixed-base-invalid` | invalid | wargear_loadout.invalid_wargear_requirement | Adeptus Astartes | Fulguris Task Force | Eliminator Squad | Eliminator x2: 2 Bolt pistol; 1 Bolt sniper rifle; 2 Close combat weapon; 1 Las fusil<br>Eliminator Sergeant x1: 1 Bolt pistol; 1 Bolt sniper rifle; 1 Close combat weapon | Pending | Pending | Pending | Pending |
| 8 | `all-model-substitute-without-base-invalid` | invalid | wargear_loadout.invalid_wargear_requirement | Necrons | Hand of the Dynasty | Canoptek Macrocytes | Canoptek Macrocytes x5: 5 Accelerator Mandible; 5 Claws | Pending | Pending | Pending | Pending |
| 9 | `all-model-termagant-base-plus-substitute-valid` | valid | none | Tyranids | Ambush Predators | Termagants | Termagant x10: 10 Chitinous claws and teeth; 9 Fleshborer; 1 Strangleweb | Pending | Pending | Pending | Pending |
| 10 | `all-model-substitute-with-active-base-valid` | valid | none | Leagues of Votann | Armoured Trailblazers | Hernkyn Yaegirs | Hernkyn Yaegir x9: 1 APM launcher; 8 Bolt shotgun; 9 Close combat weapon<br>Yaegir Theyn x1: 1 Bolt shotgun; 1 Close combat weapon | Pending | Pending | Pending | Pending |
| 11 | `alternate-loadout-replaces-regular-valid` | valid | none | Heretic Astartes | Cabal of Chaos | Chaos Terminator Squad | Terminator Champion x1: 1 Paired accursed weapons<br>Chaos Terminator x4: 4 Accursed weapon; 4 Combi-bolter | Pending | Pending | Pending | Pending |
| 12 | `alternate-loadout-mixed-with-regular-invalid` | invalid | wargear_loadout.invalid_miniature_wargear_loadout | Heretic Astartes | Cabal of Chaos | Chaos Terminator Squad | Terminator Champion x1: 1 Combi-bolter; 1 Paired accursed weapons<br>Chaos Terminator x4: 4 Accursed weapon; 4 Combi-bolter | Pending | Pending | Pending | Pending |
| 13 | `duplicate-allowed-loadout-valid` | valid | none | Orks | More Dakka! | Deff Dread | Deff Dread x1: 4 Dread klaw; 1 Stompy feet | Pending | Pending | Pending | Pending |
| 14 | `duplicate-allowed-loadout-over-limit-invalid` | invalid | wargear_loadout.invalid_miniature_wargear_loadout | Orks | More Dakka! | Deff Dread | Deff Dread x1: 5 Dread klaw; 1 Stompy feet | Pending | Pending | Pending | Pending |
| 15 | `unit-scoped-limited-counts-across-models-valid` | valid | none | Adeptus Astartes | Fulguris Task Force | Intercessor Squad | Intercessor Sergeant x1: 1 Bolt pistol; 1 Bolt rifle; 1 Close combat weapon<br>Intercessor x4: 1 Astartes grenade launcher; 4 Bolt pistol; 4 Bolt rifle; 4 Close combat weapon | Pending | Pending | Pending | Pending |
| 16 | `unit-scoped-limited-over-limit-invalid` | invalid | wargear_loadout.invalid_wargear_requirement | Adeptus Astartes | Fulguris Task Force | Intercessor Squad | Intercessor Sergeant x1: 1 Bolt pistol; 1 Bolt rifle; 1 Close combat weapon<br>Intercessor x4: 2 Astartes grenade launcher; 4 Bolt pistol; 4 Bolt rifle; 4 Close combat weapon | Pending | Pending | Pending | Pending |
| 17 | `limited-threshold-ten-termagants-invalid` | invalid | wargear_loadout.invalid_wargear_requirement | Tyranids | Ambush Predators | Termagants | Termagant x10: 10 Chitinous claws and teeth; 8 Fleshborer; 2 Strangleweb | Pending | Pending | Pending | Pending |
| 18 | `limited-threshold-twenty-termagants-valid` | valid | none | Tyranids | Ambush Predators | Termagants | Termagant x20: 20 Chitinous claws and teeth; 18 Fleshborer; 2 Strangleweb | Pending | Pending | Pending | Pending |
| 19 | `limited-overlapping-combo-exact-cover-valid` | valid | none | Adepta Sororitas | Chorus of Condemnation | Battle Sisters Squad | Sister Superior x1: 1 Bolt pistol; 1 Boltgun; 1 Close combat weapon<br>Battle Sister x9: 9 Bolt pistol; 7 Boltgun; 9 Close combat weapon; 1 Heavy bolter; 1 Ministorum flamer | Pending | Pending | Pending | Pending |
| 20 | `limited-default-component-default-loadouts-valid` | valid | none | T’au Empire | Advanced Acquisition Cadre | Pathfinder Team | Pathfinder x9: 9 Close combat weapon; 9 Pulse carbine; 9 Pulse pistol<br>Pathfinder Shas’ui x1: 1 Close combat weapon; 1 Pulse carbine; 1 Pulse pistol | Pending | Pending | Pending | Pending |
| 21 | `limited-default-component-default-loadouts-valid` | valid | none | Orks | More Dakka! | Tankbustas | Boss Nob x1: 1 Choppa; 1 Rokkit pistol; 1 Smash hammer<br>Tankbusta x5: 5 Close combat weapon; 5 Rokkit launcha | Pending | Pending | Pending | Pending |
| 22 | `default-only-limited-cap-invalid` | invalid | wargear_loadout.invalid_wargear_requirement | Tyranids | Ambush Predators | Hyperadapted Raveners | Raveners x4: 4 Ravener heavy claws and talons; 2 Venom bolt<br>Ravener Prime x1: 1 Prime claws and talons | Pending | Pending | Pending | Pending |
| 23 | `zero-count-model-wargear-invalid` | invalid | wargear_loadout.zero_count_model_wargear | Tyranids | Ambush Predators | Termagants | Termagant x0: 1 Chitinous claws and teeth; 1 Fleshborer | Pending | Pending | Pending | Pending |
| 24 | `invalid-unit-scope-wargear` | invalid | wargear_loadout.invalid_unit_wargear | Tyranids | Ambush Predators | Termagants | Unit: 1 Fleshborer<br>Termagant x10: 10 Chitinous claws and teeth; 10 Fleshborer | Pending | Pending | Pending | Pending |
| 25 | `invalid-model-scope-wargear` | invalid | wargear_loadout.invalid_model_wargear | Tyranids | Ambush Predators | Termagants | Termagant x10: 1 Bolt sniper rifle | Pending | Pending | Pending | Pending |
| 26 | `invalid-unit-loadout` | invalid | wargear_loadout.invalid_unit_wargear_loadout | T’au Empire | Advanced Acquisition Cadre | Breacher Team | Breacher Fire Warrior x9: 9 Close combat weapon; 9 Pulse blaster; 9 Pulse pistol<br>Breacher Fire Warrior Shas’ui x1: 1 Close combat weapon; 1 Pulse blaster; 1 Pulse pistol | Pending | Pending | Pending | Pending |

## Completion Rule

Do not mark a row `match` until the official WH 40K app UI and Builder agree on valid/invalid state and diagnostic family. Use `mismatch` for a proven difference and `blocked` only when a UI cannot express the setup.

Action values:

- `pending`: row is not checked yet.
- `none`: `match`; no Builder change is needed.
- `logic`: `mismatch`; fix validator/model/catalog interpretation.
- `builder-ui`: `mismatch` or `blocked`; fix Builder UI because our app cannot express a user-relevant scenario.
- `official-ui-blocked`: `blocked`; official WH 40K app UI cannot express the scenario, so no Builder UI change is implied.
