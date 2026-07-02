# WH 40K app wargear UI setups

Date: 2026-07-02

Scope: human-readable setup table for the executable wargear parity manifest in
`tests/builder_validation_wargear_parity_cases.test.mjs`.

Use these rows with
`node HereticBuilder/tools/export_wargear_parity_manifest.mjs`. The JSON export
contains exact selected option IDs, wargear item IDs, display names, and counts;
this document only records the WH app roster context needed to create each unit.
All rows are `wargear-only`: satisfy or ignore unrelated Warlord, detachment, or
roster-level errors before recording the wargear diagnostic family.

For a generated working table with expected state, Builder validation codes,
selected wargear grouped by model, and blank WH app result columns, run:

```bash
node HereticBuilder/tools/export_wargear_parity_manifest.mjs --format markdown
```

After filling the generated WH app result columns, validate the worksheet before
copying results back into the audit:

```bash
node HereticBuilder/tools/export_wargear_parity_manifest.mjs --check-results filled-results.md
```

Use `--allow-pending` only for an in-progress pass. It still fails on missing,
duplicate, unexpected, state-mismatched, or parity-mismatched rows:

```bash
node HereticBuilder/tools/export_wargear_parity_manifest.mjs --check-results filled-results.md --allow-pending
```

| Case id | Roster faction | Detachment | Unit |
| --- | --- | --- | --- |
| `duplicate-name-cthonian-beserks-default-valid` | Leagues of Votann | Armoured Trailblazers | Cthonian Beserks |
| `duplicate-name-ardmob-boyz-default-valid` | Orks | More Dakka! | ’Ardmob Boyz |
| `all-model-mixed-base-invalid` | Leagues of Votann | Armoured Trailblazers | Cthonian Beserks |
| `cthonian-twin-concussion-gauntlet-limit-valid` | Leagues of Votann | Armoured Trailblazers | Cthonian Beserks |
| `cthonian-twin-concussion-gauntlet-over-limit-invalid` | Leagues of Votann | Armoured Trailblazers | Cthonian Beserks |
| `all-model-eliminator-sergeant-substitute-valid` | Adeptus Astartes | Fulguris Task Force | Eliminator Squad |
| `all-model-eliminator-mixed-base-invalid` | Adeptus Astartes | Fulguris Task Force | Eliminator Squad |
| `all-model-substitute-without-base-invalid` | Necrons | Hand of the Dynasty | Canoptek Macrocytes |
| `all-model-termagant-base-plus-substitute-valid` | Tyranids | Ambush Predators | Termagants |
| `all-model-substitute-with-active-base-valid` | Leagues of Votann | Armoured Trailblazers | Hernkyn Yaegirs |
| `alternate-loadout-replaces-regular-valid` | Heretic Astartes | Cabal of Chaos | Chaos Terminator Squad |
| `alternate-loadout-mixed-with-regular-invalid` | Heretic Astartes | Cabal of Chaos | Chaos Terminator Squad |
| `duplicate-allowed-loadout-valid` | Orks | More Dakka! | Deff Dread |
| `duplicate-allowed-loadout-over-limit-invalid` | Orks | More Dakka! | Deff Dread |
| `unit-scoped-limited-counts-across-models-valid` | Adeptus Astartes | Fulguris Task Force | Intercessor Squad |
| `unit-scoped-limited-over-limit-invalid` | Adeptus Astartes | Fulguris Task Force | Intercessor Squad |
| `limited-threshold-ten-termagants-invalid` | Tyranids | Ambush Predators | Termagants |
| `limited-threshold-twenty-termagants-valid` | Tyranids | Ambush Predators | Termagants |
| `limited-overlapping-combo-exact-cover-valid` | Adepta Sororitas | Chorus of Condemnation | Battle Sisters Squad |
| `limited-default-component-default-loadouts-valid` | T’au Empire | Advanced Acquisition Cadre | Pathfinder Team |
| `limited-default-component-default-loadouts-valid` | Orks | More Dakka! | Tankbustas |
| `default-only-limited-cap-invalid` | Tyranids | Ambush Predators | Hyperadapted Raveners |
| `zero-count-model-wargear-invalid` | Tyranids | Ambush Predators | Termagants |
| `invalid-unit-scope-wargear` | Tyranids | Ambush Predators | Termagants |
| `invalid-model-scope-wargear` | Tyranids | Ambush Predators | Termagants |
| `invalid-unit-loadout` | T’au Empire | Advanced Acquisition Cadre | Breacher Team |
