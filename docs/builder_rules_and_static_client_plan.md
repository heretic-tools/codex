# Builder rules audit and GitHub Pages implementation plan

Дата аудита: 2026-07-01.

Источник: `data/heretic_db.sqlite`, `metadata.dataVersion = 879`.

> Historical porting note: this document was written while the local Python
> roster API still existed and was used as a reference for the static Builder
> port. The Python HTTP API, roster mutation modules and Python validation
> modules have since been removed; the production Builder is static HTML/CSS/JS
> plus exported JSON data.

Проверки:

- `pragma integrity_check` -> `ok`.
- Размер SQLite snapshot: 26M.
- В базе 145 таблиц, включая catalog data, локальное состояние roster builder, mission/battle state и справочные textual rules.

## Главный вывод

Builder-правила в текущей базе не лежат в одной таблице `rules`. Они разделены на два разных слоя:

1. Текстовые правила Codex: `army_rule`, `detachment_rule`, `datasheet_rule`, `wargear_rule`, `rule_section`, `rule_container`, `rule_container_component`. Их нужно показывать пользователю как справку, но текущий валидатор почти не использует их как машинные ограничения.
2. Машиночитаемые ограничения builder-а: battle size лимиты, faction/detachment availability, unit composition, wargear choice sets, enhancement restrictions, allied faction limits, attachment/bodyguard rules, allegiance abilities, warlord eligibility и duplicate limits. Именно этот слой нужно переносить в тонкий GitHub Pages-клиент.

Текущий локальный builder уже имеет Python-сервер и API, но это read/write SQLite-приложение. Для `https://heretic-tools.github.io/builder/` нужен отдельный static SPA: catalog data read-only из ассетов, пользовательские roster data только в browser storage/cache.

## Существующая реализация: построчный поток валидации

Файл: `HereticBuilder/tools/roster_builder_rules.py`.

Строки 1-7: валидатор собран из mixin-ов:

- `RosterAllegianceRulesMixin`
- `RosterAlliedRulesMixin`
- `RosterAttachmentRulesMixin`
- `RosterEnhancementRulesMixin`
- `RosterRuleHelpersMixin`
- `RosterRestrictionRulesMixin`
- `RosterWarlordRulesMixin`

Строки 10-18: `RosterRulesMixin` наследует все rule modules. Это не declarative rule engine; порядок и семантика правил зашиты в Python.

Строки 19-23: проверяется общий лимит очков ростера из `battle_size.pointsLimit`.

Строки 24-25: ростер без detachment всегда invalid.

Строки 26-30: проверяется detachment points limit из `battle_size.detachmentPointsLimit` против суммы `detachmentPointsCost`.

Строки 31-41: каждый выбранный detachment должен быть разрешен текущей faction через `detachment_faction_keyword`.

Строки 43-52: основной fan-out правил:

- unique detachment keywords;
- warlord;
- allegiance abilities;
- allied units;
- enhancements;
- attached units;
- detachment datasheet restrictions;
- keyword restrictions;
- unit compositions;
- wargear loadouts.

Строки 54-58: берется base duplicate limit из `battle_size.duplicateUnitLimit`; дополнительно строится faction scope через parent faction hierarchy.

Строки 59-72: native unit должен иметь `datasheet_faction_keyword` внутри faction scope. Для Space Marine supplements это важно: дочерняя faction наследует parent `Adeptus Astartes`.

Строки 73-82: faction-specific исключения юнитов из `faction_keyword_excluded_datasheet`.

Строки 83-87: duplicate limit считается на datasheet. `Epic Hero` -> 1, `Battleline`/`Dedicated Transport` -> 6, остальные -> battle size duplicate limit.

Строка 88: отдельное ограничение successor chapter epic heroes.

Строки 89-90: пустой ростер получает warning, но не только из-за этого invalid.

Строки 91-92: состояние `invalid`, если есть хотя бы одна error message.

## Существующая реализация: read/write state

Файл: `HereticBuilder/tools/roster_builder_rosters.py`.

Строки 4-26: `create_roster` пишет в `roster` и `roster_detachment`, затем пересчитывает validation state.

Строки 28-41: смена detachments полностью удаляет и пересоздает строки `roster_detachment`.

Строки 43-50: удаление roster удаляет `roster_validation_state`, затем `roster`.

Строки 56-105: `roster_payload` собирает roster, detachments, units, points и validation. Это хороший контракт для будущего local selector-а.

Строки 107-119: `sync_roster_validation_state` пишет только `valid/invalid`. В static client это поле лучше сделать computed/cache, не источник истины.

Строки 121-141: `add_unit` создает `roster_unit`, выбирает default composition и применяет base/default wargear.

Строки 151-157: смена composition пересоздает miniatures/wargear через `apply_composition`.

Строки 159-219: model-level и unit-level wargear пишутся отдельно.

Строки 221-299: warlord toggle предварительно проверяет eligibility и сбрасывает всех остальных warlord в roster.

Строки 301-341: allegiance ability toggle удаляет предыдущий выбор из той же group.

Строки 343-399: enhancements могут назначаться на unit или на конкретную miniature.

Строки 401-454: attached unit - отдельная group entity с bodyguard и leader/support members.

Вывод для GitHub Pages: эти методы надо переписать как pure/local operations над IndexedDB/local state. Серверных `POST /api/*` быть не должно.

## Существующая реализация: сервер и static build

Файл: `HereticBuilder/tools/roster_builder_server.py`.

- Строки 171-187: read API для bootstrap, detachments, datasheets, allied factions, roster, unit detail.
- Строки 196-257: write API для roster/unit/composition/allegiance/enhancement/attachment/wargear/warlord.
- Строки 264-277: локальный HTTP-сервер на 127.0.0.1, не пригоден для GitHub Pages.

Файл: `HereticBuilder/tools/build_static_site.py`.

- Строки 58-68: search index methods относятся к Codex/static reference, не к builder app.
- Строки 189-214: уже есть корректная base path инъекция для GitHub Pages.
- Строки 353-393: static build генерирует только Codex pages.
- Строки 424-433: build копирует static/assets, пишет Codex pages и search index.

Вывод: builder deployment должен быть отдельным режимом static build, а не расширением существующих `/api/*`.

## DB audit: snapshot counts

Ключевые счетчики:

| Area | Rows |
| --- | ---: |
| `battle_size` | 3 |
| builder-visible `faction_keyword` | 36 |
| excluded `faction_keyword` | 7 |
| `datasheet` | 1,142 |
| `miniature` | 1,569 |
| `unit_composition` | 1,516 |
| `wargear_option_group` | 3,025 |
| `wargear_option` | 6,322 |
| `loadout_choice_set` | 2,445 |
| `limited_wargear_choice_set` | 343 |
| `all_model_wargear_choice_set` | 28 |
| `enhancement` | 957 |
| `allied_faction` | 21 |
| `keyword_restriction_group` | 16 |
| `datasheet_bodyguard_group` | 1,266 |
| `conditional_keyword` | 380 |
| existing local `roster` | 1 |
| existing local `roster_unit` | 1 |

The local roster currently in the DB is `New Roster`, faction `Heretic Astartes`, battle size `Strike Force`, with one `Abaddon the Despoiler` unit and validation state `invalid`. It should not be shipped as shared mutable product data.

## Battle size rules

Table: `battle_size`.

Columns:

- `id`: stable catalog id.
- `name`: Incursion, Strike Force, Onslaught.
- `pointsLimit`: total roster point cap.
- `detachmentPointsLimit`: max detachment points.
- `enhancementLimit`: max included enhancements.
- `duplicateUnitLimit`: normal duplicate datasheet cap.

Rows:

| Name | Points | Detachment points | Enhancements | Duplicate unit limit |
| --- | ---: | ---: | ---: | ---: |
| Incursion | 1,000 | 2 | 2 | 2 |
| Strike Force | 2,000 | 3 | 4 | 3 |
| Onslaught | 3,000 | 3 | 4 | 3 |

Client implementation:

- Keep this in bootstrap data.
- Validate total points and detachment points immediately.
- Duplicate limit must be adjusted by unit keywords: `Epic Hero = 1`, `Battleline/Dedicated Transport = 6`.

## Faction and detachment availability

Relevant tables:

- `faction_keyword`
- `detachment`
- `detachment_faction_keyword`
- `detachment_faction_detachment_points_cost`
- `faction_keyword_excluded_datasheet`
- `detachment_excluded_datasheet`
- `detachment_required_datasheet`
- `detachment_linked_datasheet`
- `detachment_unique_keyword`

Important counts:

- `detachment_faction_keyword`: 457.
- `detachment_faction_detachment_points_cost`: 4.
- `faction_keyword_excluded_datasheet`: 23.
- `detachment_excluded_datasheet`: 23.
- `detachment_required_datasheet`: 0 in this snapshot.
- `detachment_linked_datasheet`: 107, used for Combat Patrol exact rosters.
- `detachment_unique_keyword`: 57.

Field-level semantics:

- `faction_keyword.parentFactionKeywordId`: parent scope, currently used heavily by Adeptus Astartes supplements.
- `faction_keyword.excludedFromArmyBuilder`: hide from builder create-flow.
- `faction_keyword.mandatoryWarlordId`: present in schema, zero active rows.
- `detachment.detachmentPointsCost`: default detachment cost.
- `detachment_faction_detachment_points_cost.detachmentPointsCost`: faction override for selected detachment.
- `detachment.isCombatPatrol`: switches validation into exact linked datasheet mode.
- `detachment_unique_keyword.keywordId`: selected detachments cannot share the same unique keyword.

Observed builder-visible faction shape:

- 36 factions visible.
- 10 Space Marine supplement factions have parent `Adeptus Astartes`.
- `Adeptus Titanicus` and `Titanicus Traitoris` are visible but have 0 available detachments in this snapshot.

Client implementation:

- Faction selector must include only `excludedFromArmyBuilder = 0`.
- Detachment selector must filter by exact `detachment_faction_keyword` for current faction.
- Datasheet selector must use faction scope for native units, but detachment selector itself uses exact faction-detachment rows.
- Combat Patrol should either be a separate mode or explicitly disabled until exact linked roster validation is implemented.

## Datasheet, miniature, composition, points

Relevant tables:

- `datasheet`
- `miniature`
- `miniature_keyword`
- `datasheet_faction_keyword`
- `unit_composition`
- `unit_composition_miniature`
- `unit_composition_required_faction_keyword`
- `unit_composition_required_detachment`
- `datasheet_points_step`
- `conditional_keyword`

Important counts:

- `datasheet`: 1,142.
- `miniature`: 1,569.
- `unit_composition`: 1,516.
- default compositions: 1,195 rows marked default.
- `unit_composition_required_faction_keyword`: 51.
- `unit_composition_required_detachment`: 8.
- `datasheet_points_step`: 334.
- `conditional_keyword`: 380.

Composition edge cases:

- 2 datasheets have no composition: `Callous Blades Infractors`, `Sir Hekhtur`.
- Many datasheets have multiple rows marked `isDefault = 1`; current code picks by `isDefault desc, displayOrder`, then later selects a matching composition by actual model counts.

Field-level semantics:

- `datasheet.maxModelCount`: validates total selected models.
- `datasheet.isSuccessorChapter`: participates in successor Epic Hero rule.
- `datasheet.allegianceAbilityGroupId`: enables per-unit allegiance choices.
- `miniature.isSupremeCommander`: if any present, one Supreme Commander must be Warlord.
- `miniature.cannotBeWarlord`: hard block unless detachment grants warlord.
- `miniature.canBeNonCharacterWarlord`: bypasses Character keyword requirement.
- `miniature.excludedFromEnhancements`: hard block for model-level enhancements.
- `miniature.miniatureSlots`: present but not yet used by current validator.
- `unit_composition.points`: base unit points before wargear/enhancement/points step.
- `datasheet_points_step.stepAt/stepPoints`: adds points to Nth duplicate copy of the same datasheet.

Conditional keywords:

| Condition column | Rows |
| --- | ---: |
| `requiredWarlordMiniatureId` | 2 |
| `requiredAllegianceAbilityId` | 270 |
| `requiredRosterFactionKeywordId` | 32 |
| `requiredDetachmentId` | 77 |

Client implementation:

- Store selected unit composition by `compositionId`, but also recalculate selected composition from actual miniature counts.
- Add points step after base composition and before roster total.
- Conditional keywords must be recomputed whenever Warlord, detachment, faction, or allegiance choices change.

## Wargear rules

Relevant tables:

- `wargear_option_group`
- `wargear_option`
- `wargear_item`
- `base_miniature_loadout`
- `base_miniature_loadout_wargear_option`
- `loadout_choice_set`
- `loadout_choice`
- `loadout_choice_wargear_item`
- `limited_wargear_choice_set`
- `limited_wargear_choice`
- `limited_wargear_choice_wargear_item`
- `wargear_limit`
- `all_model_wargear_choice_set`
- `all_model_wargear_choice`
- `all_model_wargear_choice_wargear_item`

Wargear option input types:

| Input type | Rows | Priced rows |
| --- | ---: | ---: |
| checkbox | 4,406 | 57 |
| stepper | 1,916 | 26 |

Choice set shape:

| Table | Rows | Unit-scoped | Model-scoped | Special |
| --- | ---: | ---: | ---: | --- |
| `loadout_choice_set` | 2,445 | 19 | 2,426 | 5 alternate, 46 allow duplicates |
| `limited_wargear_choice_set` | 343 | 80 | 263 | 0 mandatory |
| `all_model_wargear_choice_set` | 28 | 9 | 19 | all-model substitution logic |

Current validator semantics:

- Selected wargear is stored by option id, but loadout validation counts items by `lower(wargear_item.name)`.
- There are 296 datasheet/scope cases where multiple `wargear_option.id` share the same lower-case wargear name.
- Therefore the client must store exact option ids for UI/editing, but validation must aggregate by current name-key semantics for parity.

Loadout choice algorithm:

- Regular `loadout_choice_set` groups are combined by cartesian product.
- Alternate groups add additional standalone legal loadouts.
- `limit = 0` means empty loadout is legal.
- `allowDuplicates = 1` uses combinations with replacement.
- For multi-model miniature rows, selected item counts must partition into `modelCount` legal single-model loadouts.

Limited wargear algorithm:

- Choose effective `wargear_limit` by largest `modelCount <= current unit modelCount`, or first row if none match.
- Consider only selected items that appear in limited choices.
- Selected relevant items must be coverable by no more than `choiceLimit` choices.
- If `duplicateLimit` exists, cap repeats per choice.
- `mandatory = 1` would require at least one relevant selection, but there are currently no mandatory limited sets.

All-model algorithm:

- For each all-model set, choose at most one base non-substitute choice.
- Base occurrences plus substitute occurrences must equal the scoped model count.
- More than one active base choice invalidates the unit.

Client implementation:

- Wargear editor cannot be postponed too far: invalid default wargear produces validation errors.
- Use exact `wargearOptionId` in local state.
- Build a derived `selectedItemCountsByNameKey` for validation parity.
- Consider moving heavy combinatorics into a small pure module with memoization.

## Warlord rules

Relevant tables/columns:

- `faction_keyword.mandatoryWarlordId`
- `miniature.isSupremeCommander`
- `miniature.cannotBeWarlord`
- `miniature.canBeNonCharacterWarlord`
- `detachment_granted_warlord_miniature`
- `detachment_mandatory_warlord_miniature`
- `conditional_keyword`

Counts:

- faction mandatory warlord rows: 0.
- `miniature.cannotBeWarlord = 1`: 27.
- `miniature.isSupremeCommander = 1`: 17.
- `miniature.canBeNonCharacterWarlord = 1`: 8.
- `detachment_granted_warlord_miniature`: 1.
- `detachment_mandatory_warlord_miniature`: 2.

Client implementation:

- Exactly one Warlord required if roster has units.
- If Supreme Commander is present, selected Warlord must be one of them.
- Character keyword can be native or conditional.
- Detachment-granted warlord overrides `cannotBeWarlord`.
- Warlord selection invalidates/recomputes conditional keywords, allied requirements, enhancement restrictions and keyword restrictions.

## Enhancement rules

Relevant tables:

- `enhancement`
- `enhancement_required_keyword_group`
- `enhancement_required_keyword_group_keyword`
- `enhancement_required_keyword_group_faction_keyword`
- `enhancement_excluded_keyword`
- `enhancement_bodyguard_group`
- `enhancement_bodyguard_group_datasheet`
- `enhancement_bodyguard_group_keyword`
- `enhancement_required_wargear_item`
- `enhancement_keyword_points_cost`
- `enhancement_datasheet_ability`
- `enhancement_wargear_item_profile`

Enhancement rows by type:

| Type | Rows | Detachment-bound | No base points | Excluded from roster limit | Combat Patrol default |
| --- | ---: | ---: | ---: | ---: | ---: |
| miniature | 880 | 880 | 48 | 8 | 24 |
| upgrade | 71 | 71 | 0 | 1 | 0 |
| unit | 6 | 6 | 0 | 0 | 0 |

Other counts:

- required keyword groups: 1,027.
- required keyword group keyword rows: 670.
- required keyword group faction keyword rows: 639.
- excluded keyword rows: 32.
- enhancement bodyguard groups: 19.
- enhancement bodyguard datasheet rows: 19.
- enhancement bodyguard keyword rows: 0.
- required wargear item rows: 1.
- keyword-specific points rows: 0.
- datasheet ability rows: 6.
- wargear item profile rows: 1.

Current validator semantics:

- A unit can have no more than one selected enhancement across unit-level and miniature-level selections.
- Roster enhancement limit only counts `isIncludedInEnhancementLimit = 1`.
- Each enhancement may have its own `"limit"`; in this snapshot all 957 rows have a custom limit value.
- `enhancementType = miniature` must target a miniature. Other types target unit.
- Allied units can take enhancements only if `allied_faction.canTakeEnhancements = 1`.
- Epic Hero and non-Character eligibility are controlled by flags on enhancement.
- Required keyword groups are OR-groups; within a group, keyword requirements are subset checks and faction requirements are intersection checks.
- Bodyguard requirements inspect attached-unit groups.
- `cannotBeWarlord` enhancement flag invalidates if target unit is Warlord.
- Combat Patrol enhancements are exact-default rules if Combat Patrol detachment is selected.

Client implementation:

- UI must expose both unit and model targets.
- Availability reasons should be computed in the same module as validation; do not duplicate logic manually in components.
- Enhancement points are currently base points because keyword-specific points table is empty, but export schema should support keyword-specific overrides.

## Attached units and bodyguard rules

Relevant tables:

- `datasheet_bodyguard_group`
- `datasheet_bodyguard_group_datasheet`
- `datasheet_bodyguard_group_keyword`
- `roster_attached_unit`
- `roster_attached_unit_roster_unit`

Counts:

| Bodyguard type | Rows | Excluded detachment | Required detachment | Requires all units keyword |
| --- | ---: | ---: | ---: | ---: |
| leader | 1,056 | 54 | 270 | 270 |
| support | 210 | 7 | 35 | 35 |

Additional rows:

- allowed bodyguard datasheets: 1,260.
- allowed bodyguard keywords: 14.

Current validator semantics:

- A roster unit cannot be part of more than one attached unit.
- Each attached group needs at least one bodyguard and at least one leader/support.
- `bodyguardType` must match `leader` or `support`.
- Group can be limited by required/excluded detachment.
- Bodyguard can match by explicit datasheet or by keyword.
- Some rows require attached and bodyguard units both to have the same required keyword.

Client implementation:

- Store attachment groups as explicit local entities; do not infer from selected leader alone.
- Attachment candidate list should be derived from the same `attached_unit_can_attach` function used by validation.

## Allied unit rules

Relevant tables:

- `faction_keyword_allied_faction`
- `allied_faction`
- `allied_faction_parent_faction_keyword`
- `allied_faction_datasheet`
- `allied_faction_points_limit`
- `allied_faction_keyword`
- `allied_faction_keyword_slotless_keyword_group`
- donor/receiver keyword tables
- `allied_faction_required_detachment`
- `allied_faction_allowed_warlord_miniature`
- `allied_faction_allegiance_ability`
- `keyword_ally_restricting_keyword`
- `keyword.allyRestrictingKeywordId`
- `keyword.allyRestrictingFactionKeywordId`

Counts:

- `allied_faction`: 21.
- can take enhancements: 5.
- mutually exclusive keyword limit: 4.
- sibling allied factions: 6.
- `allied_faction_datasheet`: 320.
- `allied_faction_keyword`: 54.
- `allied_faction_points_limit`: 39.
- `allied_faction_required_detachment`: 29.
- `allied_faction_allowed_warlord_miniature`: 28.
- slotless keyword groups: 12.
- `allied_faction_allegiance_ability`: 0.
- `keyword_ally_restricting_keyword`: 0.

Current validator semantics:

- Allied unit is any unit with `allyType != native`.
- `allyType` stores `allied_faction.id`.
- Faction must allow the allied faction via `faction_keyword_allied_faction`.
- Each allied datasheet must be listed in `allied_faction_datasheet`.
- Points cap is battle-size-specific.
- Keyword limits count allied units with keyword, minus slotless donor/receiver allowance.
- Some allied keyword limits are mutually exclusive.
- Required detachments and allowed Warlord miniatures are enforced.
- There is support for required allegiance abilities and ally-restricting keywords, but both are empty in this snapshot.

Client implementation:

- Add allied faction selector after roster exists.
- Native and allied unit search must use different source filters.
- Allied faction parent keyword scope is used for composition faction ids.

## Allegiance ability rules

Relevant tables:

- `allegiance_ability_group`
- `allegiance_ability`
- `roster_unit_allegiance_ability`
- `faction_keyword_mandatory_allegiance_ability`
- `allied_faction_allegiance_ability`

Counts:

- groups: 10.
- detachment-bound groups: 7.
- mandatory groups: 5.
- groups with min roster limit: 1.
- groups with max roster limit: 4.
- abilities: 26.
- abilities requiring wargear: 4.
- mandatory faction allegiance ability rows: 0.
- allied faction allegiance ability rows: 0.

Current validator semantics:

- Unit can select only from its `datasheet.allegianceAbilityGroupId`.
- Group can require selected detachment.
- Mandatory group requires exactly one selected ability on the unit.
- Unit cannot select more than one ability from the same group.
- Group min/max applies across roster.
- Ability can require a wargear item.

Client implementation:

- Allegiance choices belong in unit editor, near wargear because some choices require wargear.
- Changing allegiance choices must recompute conditional keywords.

## Keyword restrictions

Relevant tables:

- `keyword_restriction_group`
- `keyword_restriction_group_keyword`
- `restriction_group_detachment_limit`

Counts:

- restriction groups: 16.
- groups with base limit: 15.
- groups excluding a faction keyword: 3.
- groups requiring warlord miniature: 0.
- detachment limit rows: 7.
- detachment rows with max roster limit: 6.
- detachment rows with min roster limit: 1.

Semantics:

- Restriction group counts units that have any keyword from the group.
- If `excludedFactionKeywordId` is set, units with that faction keyword are skipped.
- If group limit is 0, matching units are not allowed.
- Detachment-specific min/max can override/add requirements.

Client implementation:

- This can be pure derived validation over unit keyword ids.
- Must run after conditional keywords are applied.

## Textual rule tables

Relevant tables and counts:

| Table | Rows | Builder role |
| --- | ---: | --- |
| `army_rule` | 98 | display/reference |
| `army_rule_faction_keyword` | 71 | maps army rules to factions |
| `army_rule_excluded_from_command_bunker_faction_keyword` | 37 | display/filtering |
| `army_rule_behaviour_type` | 0 | inactive |
| `detachment_rule` | 306 | display/reference |
| `datasheet_rule` | 525 | display/reference |
| `wargear_rule` | 1,366 | display/reference |
| `rule_section` | 33 | Codex core rules hierarchy |
| `rule_container` | 399 | Codex content cards |
| `rule_container_component` | 1,791 | Codex content components |

`rule_container_component.type` distribution:

- `text`: 918.
- `loreAccordion`: 408.
- `header`: 175.
- `accordion`: 143.
- `image`: 115.
- `triggerEffectAccordion`: 12.
- `quote`: 10.
- `textBold`: 6.
- `boxedText`: 3.
- `bullets`: 1.

Client implementation:

- For MVP builder validation, do not parse textual rules.
- Link out to Codex pages or include compact rule excerpts as reference cards.
- Avoid relying on free-text rules for legality.

## Empty or inactive rule paths to keep in schema

These paths are implemented or modeled, but inactive in data version 879:

- `army_rule_behaviour_type`: 0.
- `detachment_required_datasheet`: 0.
- `faction_keyword.mandatoryWarlordId`: 0 active rows.
- `faction_keyword_mandatory_allegiance_ability`: 0.
- `allied_faction_allegiance_ability`: 0.
- `keyword_ally_restricting_keyword`: 0, although `keyword.allyRestricting*` still exists.
- `enhancement_keyword_points_cost`: 0.
- `enhancement_bodyguard_group_keyword`: 0.

Implementation note: do not remove these from the export model. They are likely future-proofing for later data versions.

## Static client target architecture

Target URL: `https://heretic-tools.github.io/builder/`.

Principles:

- No backend.
- No shared mutable DB.
- Catalog data is immutable per `dataVersion`.
- User data stays in browser storage.
- App works under GitHub Pages base path `/builder`.
- Client is thin: fetch precomputed JSON chunks, run pure local validation, write user state locally.

Recommended storage split:

- Cache Storage: immutable app shell, icons, image assets, data chunks, `manifest.json`.
- IndexedDB: user rosters, selected units, selected wargear, enhancements, attachments, local migration metadata.
- localStorage: only tiny preferences such as selected roster id, last faction, UI flags. Avoid storing full rosters there.

Why IndexedDB, not only Cache Storage:

- Cache Storage is response/blob oriented and awkward for frequently mutated structured user data.
- IndexedDB is transactional, versioned, and handles larger rosters safely.
- This still satisfies "user info in cache" at product level: all user data is local browser-side, not server-side.

## Proposed static data export

The first catalog-only export command now exists:

```bash
python3 HereticBuilder/tools/builder.py export-builder-data --out dist/builder-data
```

It can later be integrated into a full builder build mode:

```bash
python3 HereticBuilder/tools/builder.py build --profile builder-pages
```

Suggested files:

```text
builder-data/
  manifest.json
  bootstrap.json
  factions.json
  detachments.json
  datasheet-index.json
  allied-factions.json
  rules/
    battle-sizes.json
    faction-scope.json
    keyword-restrictions.json
    detachment-restrictions.json
    enhancement-rules.json
    allied-rules.json
  datasheets/
    <datasheetId>.json
  search/
    units.json
```

`manifest.json` should include:

- `dataVersion`.
- build timestamp.
- db source hash.
- schema/export version.
- list of chunks and hashes.

Export strategy:

- Put heavy per-datasheet material in lazy chunks.
- Put global rule tables in normalized id-indexed objects.
- Do not export `roster*`, `battle*`, `favourite`, `entitlement`, `grdb_migrations`.
- Either reuse image manifests or point to existing `assets/unit-images` and `assets/faction-images`.

## Proposed client modules

No framework is required for MVP. Existing project has no `package.json`; a vanilla ES module app keeps the client thin and deployable through the existing Python static builder.

Suggested structure:

```text
HereticBuilder/static/builder/
  app.js
  data-store.js
  local-db.js
  roster-model.js
  validation/
    index.js
    wargear.js
    enhancements.js
    allies.js
    attachments.js
    keywords.js
  views/
    roster-list.js
    roster-create.js
    roster-detail.js
    unit-picker.js
    unit-editor.js
  builder.css
  service-worker.js
```

Core local state model:

```text
Roster
  id
  name
  factionKeywordId
  battleSizeId
  detachmentIds[]
  units[]
  createdAt
  modifiedAt
  dataVersion

RosterUnit
  id
  datasheetId
  allyType
  compositionId
  miniatures[]
  unitWargear[]
  allegianceAbilityIds[]
  unitEnhancementIds[]

RosterUnitMiniature
  id
  miniatureId
  count
  isWarlord
  wargear[]
  enhancementIds[]

AttachedUnit
  id
  members[{rosterUnitId, attachmentType}]
```

Validation should be pure:

```text
validateRoster(catalog, roster) -> {
  state: "valid" | "invalid",
  messages: [{level, text, code?, refs?}],
  points: {total, limit}
}
```

The UI should never be the source of rules; it should ask the same pure modules for selectable options and unavailable reasons.

## Implementation phases

### Phase 0: data and parity harness

Deliverables:

- Add export audit tests that assert key counts for data version 879.
- Create small golden rosters as JSON fixtures.
- Add a parity runner that evaluates a fixture through current Python code and future JS validator.

Acceptance:

- Counts match this audit.
- Existing local DB is not included in builder data export.

### Phase 1: static builder shell

Deliverables:

- Add builder app entry page. Initial shell exists as `templates/builder.html`.
- Add `builder-pages` profile with `base_path = "/builder"`. This profile exists in `heretic.toml`.
- Add static route fallback/`404.html` for SPA reloads.
- Add app shell loading `manifest.json` and `bootstrap.json`.
- Add a build command. Initial command exists:

```bash
python3 HereticBuilder/tools/builder.py build-builder --profile builder-pages
```

Acceptance:

- Opening `/builder/` shows roster list/create UI.
- Reloading nested builder routes works on GitHub Pages.
- No network calls except static assets/data from same Pages origin.

### Phase 2: native roster MVP

Deliverables:

- Create/list/rename/delete local rosters in IndexedDB.
- Select battle size, faction, detachments.
- Add native units using faction scope and detachment exclusions.
- Apply default composition and default/base wargear.
- Show points and basic validation.

Rules covered:

- battle size limits;
- detachment availability;
- native datasheet availability;
- faction/detachment exclusions;
- duplicate limits;
- unit compositions;
- no-units warning.

Acceptance:

- Can build a simple valid native roster without server.
- Browser refresh preserves roster.

### Phase 3: full unit editor and wargear validation

Deliverables:

- Composition editor.
- Model counts.
- Unit-level and model-level wargear controls.
- Wargear choice validation parity with Python.
- Points from composition, points step, wargear options.

Acceptance:

- Invalid wargear configurations are detected.
- Multi-model partition logic matches Python for fixtures.

### Phase 4: advanced legality

Deliverables:

- Warlord selector.
- Conditional keywords.
- Allegiance ability choices.
- Enhancements on units and miniatures.
- Attached unit groups.
- Allied faction and allied unit flow.
- Keyword restriction validation.

Acceptance:

- All current Python validation branches have JS equivalents.
- Empty/inactive tables are represented but harmless.

### Phase 5: offline/cache, import/export, migrations

Deliverables:

- Service worker for app shell and immutable data chunks.
- Data version detection.
- Local roster migration or compatibility warning on dataVersion changes.
- Export/import roster JSON.
- "Clear local data" control.

Acceptance:

- App opens offline after first successful load.
- User can recover by exporting/importing roster JSON.

### Phase 6: deployment

Deliverables:

- GitHub Actions workflow for builder repository/pages.
- Build command for `heretic-tools.github.io/builder/`.
- Optional link from HereticTools home or Codex to Builder.

Candidate config addition:

```toml
[profiles.builder-pages]
base_path = "/builder"
mount_codex_at_root = false
```

The current `StaticBuildConfig` needs an app/mode field before this is sufficient, because existing static build always emits Codex pages.

## Test plan

Automated:

- SQLite integrity check and dataVersion check.
- Export count tests for every table used by validator.
- Golden roster parity between Python and JS.
- Unit tests for:
  - `faction_keyword_scope`;
  - composition availability;
  - conditional keywords;
  - duplicate limits;
  - wargear loadout cartesian/alternate/partition logic;
  - limited/all-model wargear;
  - enhancement requirements;
  - allied points and keyword limits;
  - attachment candidates.

Browser:

- Create roster -> reload -> roster remains.
- Add unit -> edit wargear -> validation updates.
- Toggle Warlord -> conditional keywords update.
- IndexedDB unavailable/private mode fallback message.
- Service worker update from one dataVersion to another.

Deployment:

- Build artifact has no `roster*` user data.
- All asset URLs include `/builder/` base path.
- `manifest.json` dataVersion equals SQLite metadata.
- Static app works with GitHub Pages hard refresh on nested routes.

## Risks and decisions

1. Wargear validation is the hardest part.
   It uses generated legal loadout combinations and name-key aggregation. Port this before polishing UI.

2. Existing Python code is imperative.
   There is no declarative schema that can be consumed automatically by JS. The first implementation should be a careful port, then later refactor to shared generated rule metadata if needed.

3. Textual rules should not be parsed.
   They are reference content, not validation truth.

4. User data must not live in the shipped SQLite snapshot.
   Export catalog-only data and keep roster data in IndexedDB.

5. Combat Patrol is special.
   `detachment_linked_datasheet` and `isCombatPatrolDefault` enhancements imply exact-roster rules. It should be either fully implemented as a mode or hidden in MVP.

6. Data updates need migrations.
   Roster ids reference catalog ids. If dataVersion changes and ids disappear, client must mark affected units/options and offer repair.

7. Thin client means "thin backend", not "no validation".
   All validation still runs locally; otherwise the builder will accept illegal rosters.

## Recommended next implementation slice

Start with these files/tasks:

1. Extend the existing `tools/export_builder_data.py` contract from normalized table chunks into optimized lazy chunks when the standalone client needs them.
2. Extend the existing `templates/builder.html`, `static/builder.css`, and `static/builder.js` shell into the full SPA.
3. Extend the existing `build_builder_site.py` path instead of mixing Builder route generation into the Codex build.
4. Add IndexedDB wrapper and local roster model.
5. Port `RosterRulesMixin.validate` plus helper functions for battle size, detachments, faction scope, compositions and duplicate limits.
6. Then port wargear validation before adding enhancements/allies.

This order gets a real `/builder/` app online quickly while protecting the hardest legality logic from becoming an afterthought.
