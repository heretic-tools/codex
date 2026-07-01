# Builder rules final audit

Date: 2026-07-01
Data version: 879
Source DB: `data/heretic_db.sqlite`
Static target: GitHub Pages, `/builder`

> Historical porting note: this audit was produced while the local Python
> roster API and Python validation modules were still present as a comparison
> baseline. They have since been removed. The static Builder JS validator and
> exported JSON catalog are now the active implementation.

## Verdict

Final validation coverage status: PASS.

The static builder now has a one-to-one validation implementation for every rule invoked by the Python roster builder validation pipeline. During this audit three implementation gaps were found and fixed:

1. `builder_warlord_rules.js` missed imports for `lowerName` and `namesForIds`.
2. Static wargear validation did not strictly separate unit-level wargear from model-level wargear.
3. Static default model wargear did not use the Python closest-valid-loadout normalization path.

Old local rosters are intentionally not supported. The static client now uses `heretic-builder-local-v2`, and the active data model is:

- unit-level wargear: `unit.wargear`
- model-level wargear: `unit.miniatures[].wargear`

Flat legacy `unit.wargear` entries are no longer rerouted into miniature wargear.

## Audit Method

Primary source of truth:

- Python validator orchestration: `HereticBuilder/tools/roster_builder_rules.py:19-92`
- Rule mixins: `HereticBuilder/tools/roster_builder_rule_*.py`
- Wargear validator: `HereticBuilder/tools/roster_builder_wargear.py:8-429`
- Composition and default loadout logic: `HereticBuilder/tools/roster_builder_compositions.py:12-458`
- Exported rule catalog: `HereticBuilder/tools/export_builder_data.py:17-120`

Static implementation:

- Validation orchestration: `HereticBuilder/static/builder_roster_validation.js:18-104`
- Shared model/rule helpers: `HereticBuilder/static/builder_model.js:10-638`
- Loadout math shared by defaults and validator: `HereticBuilder/static/builder_loadout_math.js:3-231`
- Rule modules: `HereticBuilder/static/builder_*_rules.js`
- Local storage schema boundary: `HereticBuilder/static/builder_storage.js:3-57`

DB audit result:

- SQLite `pragma integrity_check`: `ok`
- DB tables: 145
- Exported catalog tables: 102
- Unexpected unexported tables: 0
- Builder data files: 105

## Validation Pipeline Trace

| Python source | Rule | Static source | Status |
| --- | --- | --- | --- |
| `roster_builder_rules.py:21-23` | Total points cannot exceed battle size limit. | `builder_roster_validation.js:44-47` | Covered |
| `roster_builder_rules.py:24-25` | At least one detachment required. | `builder_roster_validation.js:31-33` | Covered |
| `roster_builder_rules.py:26-30` | Detachment points cannot exceed battle size detachment point limit. | `builder_roster_validation.js:25-27,40-43` | Covered |
| `roster_builder_rules.py:31-41` | Selected detachments must be legal for roster faction. | `builder_model.js:312-316`, `builder_roster_validation.js:34-39` | Covered |
| `roster_builder_rules.py:43` | Detachment unique keyword collision. | `builder_restriction_rules.js:5-24` | Covered |
| `roster_builder_rules.py:44` | Warlord rules. | `builder_warlord_rules.js:34-85` | Covered |
| `roster_builder_rules.py:45` | Allegiance ability rules. | `builder_allegiance_rules.js:4-74` | Covered |
| `roster_builder_rules.py:46` | Allied unit rules. | `builder_allied_rules.js:127-190` | Covered |
| `roster_builder_rules.py:47` | Enhancement rules. | `builder_enhancement_rules.js:78-164` | Covered |
| `roster_builder_rules.py:48` | Attached unit rules. | `builder_attachment_rules.js:49-88` | Covered |
| `roster_builder_rules.py:49` | Detachment required/excluded/linked datasheets. | `builder_restriction_rules.js:65-108` | Covered |
| `roster_builder_rules.py:50` | Keyword restriction groups. | `builder_restriction_rules.js:152-184` | Covered |
| `roster_builder_rules.py:51` | Unit composition validity and model-count max. | `builder_restriction_rules.js:26-37` | Covered |
| `roster_builder_rules.py:52` | Wargear loadout rules. | `builder_wargear_rules.js:221-249`, `builder_loadout_math.js:3-231` | Covered |
| `roster_builder_rules.py:54-87` | Duplicate unit limits, native faction check, faction exclusions. | `builder_roster_validation.js:59-86`, `builder_validation_core.js:24-32` | Covered |
| `roster_builder_rules.py:88` | Successor chapter Epic Hero restriction. | `builder_restriction_rules.js:39-63` | Covered |
| `roster_builder_rules.py:89-90` | Empty roster warning. | `builder_roster_validation.js:89-91` | Covered |
| `roster_builder_rules.py:91-92` | State is invalid if any error exists. | `builder_roster_validation.js:92-101` | Covered |

## Helper Trace

| Python source | Helper behavior | Static source | Status |
| --- | --- | --- | --- |
| `roster_builder_rule_helpers.py:4-18` | Faction parent scope walk. | `builder_model.js:36-46` | Covered |
| `roster_builder_rule_helpers.py:20-29` | Multi-faction scope de-duplication. | `builder_model.js:87-102` | Covered |
| `roster_builder_rule_helpers.py:31-87` | Unit keywords from active miniatures plus conditional keywords. | `builder_model.js:172-200` | Covered |
| `roster_builder_rule_helpers.py:89-98` | Conditional keyword row predicates. | `builder_model.js:156-170` | Covered |
| `roster_builder_rule_helpers.py:100-136` | Conditional keyword named lookup. | `builder_warlord_rules.js:5-10` | Covered |
| `roster_builder_rule_helpers.py:138-144` | Miniature keyword IDs. | `builder_model.js:152-154` | Covered |
| `roster_builder_rule_helpers.py:146-158` | Roster warlord miniature IDs. | `builder_model.js:202-214` | Covered |
| `roster_builder_rule_helpers.py:160-174` | Unit allegiance abilities. | `builder_model.js:104-111` | Covered |
| `roster_builder_rule_helpers.py:176-207` | Unit and miniature enhancements with points. | `builder_model.js:113-126,228-235,253-267` | Covered |
| `roster_builder_rule_helpers.py:209-225` | Enhancement keyword-specific point cost, ordered by `displayOrder`. | `builder_model.js:228-235` | Covered |
| `roster_builder_rule_helpers.py:227-233` | Roster detachment IDs. | `builder_roster_validation.js:21-24` | Covered by static roster model |
| `roster_builder_rule_helpers.py:235-261` | Can-be-warlord predicate, including granted warlord. | `builder_warlord_rules.js:12-32` | Covered |
| `roster_builder_rule_helpers.py:263-269` | Duplicate limit override for Epic Hero, Battleline, Dedicated Transport. | `builder_validation_core.js:24-32` | Covered |
| `roster_builder_rule_helpers.py:271-283` | Keyword-name checks. | `builder_validation_core.js:14-22` | Covered |
| `roster_builder_rule_helpers.py:285-327` | Name lookup helpers. | `builder_model.js:69-71`, rule-local helpers | Covered |
| `roster_builder_rule_helpers.py:329-365` | Unit/model required wargear item checks. | `builder_validation_core.js:34-49` | Covered |

## Warlord Rules Trace

| Python source | Rule | Static source | Status |
| --- | --- | --- | --- |
| `roster_builder_rule_warlord.py:3-6` | Skip warlord validation when roster has no units. | `builder_warlord_rules.js:34-37` | Covered |
| `roster_builder_rule_warlord.py:7-30` | Mandatory faction warlord must be present and selected. | `builder_warlord_rules.js:38-57` | Covered |
| `roster_builder_rule_warlord.py:31-33` | More than one Warlord is invalid. | `builder_warlord_rules.js:58-60` | Covered |
| `roster_builder_rule_warlord.py:36-44` | Supreme Commander must be Warlord. | `builder_warlord_rules.js:63-68` | Covered |
| `roster_builder_rule_warlord.py:45-61` | Detachment mandatory warlord models. | `builder_warlord_rules.js:69-76` | Covered |
| `roster_builder_rule_warlord.py:62-64` | Mandatory faction warlord cannot be replaced. | `builder_warlord_rules.js:77-79` | Covered |
| `roster_builder_rule_warlord.py:65-91` | Selected Warlord eligibility, Character/conditional Character, cannot/can flags, granted detachment exception. | `builder_warlord_rules.js:5-32,80-84` | Covered |

## Allegiance Rules Trace

| Python source | Rule | Static source | Status |
| --- | --- | --- | --- |
| `roster_builder_rule_allegiance.py:5-11` | Unit without group cannot select allegiance ability. | `builder_allegiance_rules.js:7-15` | Covered |
| `roster_builder_rule_allegiance.py:12-22` | Group detachment requirement. | `builder_allegiance_rules.js:16-25` | Covered |
| `roster_builder_rule_allegiance.py:23-31` | Wrong group, mandatory group, too many selections. | `builder_allegiance_rules.js:26-38` | Covered |
| `roster_builder_rule_allegiance.py:32-35` | Ability-required wargear. | `builder_allegiance_rules.js:39-44` | Covered |
| `roster_builder_rule_allegiance.py:37-52` | Roster-level min/max group limits. | `builder_allegiance_rules.js:46-60` | Covered |
| `roster_builder_rule_allegiance.py:55-77` | Mandatory faction allegiance ability. | `builder_allegiance_rules.js:61-73` | Covered |

## Allied Rules Trace

| Python source | Rule | Static source | Status |
| --- | --- | --- | --- |
| `roster_builder_rule_allies.py:3-5` | Skip when no allied units. | `builder_allied_rules.js:127-131` | Covered |
| `roster_builder_rule_allies.py:11-23` | Allied faction must be allowed for roster faction. | `builder_allied_rules.js:141-147` | Covered |
| `roster_builder_rule_allies.py:23-39` | Required/allowed Warlord for allies. | `builder_allied_rules.js:148-161` | Covered |
| `roster_builder_rule_allies.py:40-52` | Required detachment for allied faction. | `builder_allied_rules.js:162-168` | Covered |
| `roster_builder_rule_allies.py:53-63` | Allied datasheet whitelist. | `builder_allied_rules.js:169-177` | Covered |
| `roster_builder_rule_allies.py:64-75` | Allied points limit by battle size. | `builder_allied_rules.js:178-185` | Covered |
| `roster_builder_rule_allies.py:80-102` | Required allied allegiance ability. | `builder_allied_rules.js:72-81,187` | Covered |
| `roster_builder_rule_allies.py:103-149` | Ally restricting keywords, including legacy keyword column rule. | `builder_allied_rules.js:83-125,188` | Covered |
| `roster_builder_rule_allies.py:151-178` | Allied keyword limits and mutually exclusive keyword limit. | `builder_allied_rules.js:47-70,186` | Covered |
| `roster_builder_rule_allies.py:179-221` | Slotless donor/receiver keyword pairs. | `builder_allied_rules.js:20-45` | Covered |

## Attachment Rules Trace

| Python source | Rule | Static source | Status |
| --- | --- | --- | --- |
| `roster_builder_rule_attachments.py:5-19` | Skip when no attached-unit rows. | `builder_attachment_rules.js:49-53` | Covered |
| `roster_builder_rule_attachments.py:20-30` | Unit cannot be part of more than one attached unit. | `builder_attachment_rules.js:54-68` | Covered |
| `roster_builder_rule_attachments.py:31-41` | Attached unit must have bodyguard and leader/support; each attached model must be legal. | `builder_attachment_rules.js:69-87` | Covered |
| `roster_builder_rule_attachments.py:42-85` | Bodyguard group matching: faction, excluded/required detachment, allowed datasheets, allowed keywords, all-units keyword. | `builder_attachment_rules.js:8-47` | Covered |

## Enhancement Rules Trace

| Python source | Rule | Static source | Status |
| --- | --- | --- | --- |
| `roster_builder_rule_enhancements.py:7-23` | Gather selected unit/model enhancements; model count 0; max one enhancement per unit. | `builder_enhancement_rules.js:78-100` | Covered |
| `roster_builder_rule_enhancements.py:24-35` | Enhancement count limit and per-enhancement limit. | `builder_enhancement_rules.js:101-118` | Covered |
| `roster_builder_rule_enhancements.py:37-45` | Required detachment and unit/model target type. | `builder_enhancement_rules.js:119-129` | Covered |
| `roster_builder_rule_enhancements.py:46-54` | Allied unit enhancement permission and model exclusion flag. | `builder_enhancement_rules.js:130-135` | Covered |
| `roster_builder_rule_enhancements.py:55-60` | Epic Hero and Character eligibility. | `builder_enhancement_rules.js:136-144` | Covered |
| `roster_builder_rule_enhancements.py:61-77` | Excluded keyword and required wargear. | `builder_enhancement_rules.js:145-153` | Covered |
| `roster_builder_rule_enhancements.py:78-81` | Enhancement attached-unit requirement and cannot-be-warlord. | `builder_enhancement_rules.js:155-160`, `builder_attachment_rules.js:90-130` | Covered |
| `roster_builder_rule_enhancements.py:83` | Attached unit enhancement count. | `builder_attachment_rules.js:132-148`, `builder_enhancement_rules.js:162` | Covered |
| `roster_builder_rule_enhancements.py:84,240-288` | Combat Patrol default enhancement exactly once and no alternate enhancement. | `builder_enhancement_rules.js:48-76,163` | Covered |
| `roster_builder_rule_enhancements.py:86-131` | Required keyword/faction groups. | `builder_enhancement_rules.js:6-34` | Covered |
| `roster_builder_rule_enhancements.py:133-149` | Enhancement excluded keyword names. | `builder_enhancement_rules.js:36-42` | Covered |
| `roster_builder_rule_enhancements.py:151-218` | Enhancement bodyguard requirements. | `builder_attachment_rules.js:90-130` | Covered |

## Restriction Rules Trace

| Python source | Rule | Static source | Status |
| --- | --- | --- | --- |
| `roster_builder_rule_restrictions.py:4-26` | Selected detachments cannot share unique keyword. | `builder_restriction_rules.js:5-24` | Covered |
| `roster_builder_rule_restrictions.py:27-35` | Model count max and composition availability. | `builder_restriction_rules.js:26-37` | Covered |
| `roster_builder_rule_restrictions.py:36-51` | Successor Chapter Epic Heroes cannot mix with same parent faction Epic Heroes. | `builder_restriction_rules.js:39-63` | Covered |
| `roster_builder_rule_restrictions.py:52-80` | Detachment excluded/required datasheets. | `builder_restriction_rules.js:65-83` | Covered |
| `roster_builder_rule_restrictions.py:81-108` | Combat Patrol linked datasheets and exact counts. | `builder_restriction_rules.js:84-108` | Covered |
| `roster_builder_rule_restrictions.py:109-147` | Faction and detachment keyword restriction min/max limits. | `builder_restriction_rules.js:152-184` | Covered |
| `roster_builder_rule_restrictions.py:148-196` | Restriction group construction and excluded faction keyword name. | `builder_restriction_rules.js:110-119,152-171` | Covered |
| `roster_builder_rule_restrictions.py:198-222` | Restriction active predicate, count predicate, error text. | `builder_restriction_rules.js:121-150` | Covered |

## Wargear Rules Trace

| Python source | Rule | Static source | Status |
| --- | --- | --- | --- |
| `roster_builder_wargear.py:10-24` | Invalid unit wargear when option group is wrong datasheet or miniature-scoped. | `builder_wargear_rules.js:196-218` | Covered |
| `roster_builder_wargear.py:25-46` | Invalid model wargear when option group is wrong datasheet/model or unit-scoped. | `builder_wargear_rules.js:196-218` | Covered |
| `roster_builder_wargear.py:47-50` | Unit-level loadout choice-set validation. | `builder_wargear_rules.js:221-225` | Covered |
| `roster_builder_wargear.py:51-68` | Model-level loadout validation and model count 0 check. | `builder_wargear_rules.js:226-247` | Covered |
| `roster_builder_wargear.py:72-128` | Unit/model/combined selected wargear counters. | `builder_wargear_rules.js:13-61` | Covered |
| `roster_builder_wargear.py:130-138` | Exact loadout or multi-model partition matching. | `builder_loadout_math.js:210-221` | Covered |
| `roster_builder_wargear.py:140-230` | Loadout choice sets: regular, alternate, duplicates, empty choices, combinations. | `builder_loadout_math.js:81-164` | Covered |
| `roster_builder_wargear.py:232-270` | Partition search for multi-model selected counts. | `builder_loadout_math.js:166-208` | Covered |
| `roster_builder_wargear.py:272-289` | Limited wargear choice set validation. | `builder_wargear_rules.js:130-144` | Covered |
| `roster_builder_wargear.py:291-305` | Effective wargear limit by model count. | `builder_wargear_rules.js:70-78` | Covered |
| `roster_builder_wargear.py:306-357` | Limited choice cover DP with choice limit and duplicate limit. | `builder_wargear_rules.js:80-128` | Covered |
| `roster_builder_wargear.py:359-392` | All-model wargear choice set rules and substitute count. | `builder_wargear_rules.js:154-194` | Covered |
| `roster_builder_wargear.py:394-429` | All-model choice item loading, occurrence count, scope model count. | `builder_wargear_rules.js:146-159,63-68` | Covered |

## Composition And Default Loadout Trace

| Python source | Rule/data behavior | Static source | Status |
| --- | --- | --- | --- |
| `roster_builder_compositions.py:12-17` | First available default composition. | `builder_model.js:334-341` | Covered |
| `roster_builder_compositions.py:18-33` | Allied composition faction scope. | `builder_model.js:87-102` | Covered |
| `roster_builder_compositions.py:35-74` | Composition rows, models, required faction/detachment. | `builder_model.js:318-341,343-353` | Covered |
| `roster_builder_compositions.py:76-87` | Composition availability predicate. | `builder_model.js:318-332` | Covered |
| `roster_builder_compositions.py:89-117` | Datasheet points step by duplicate position. | `builder_model.js:216-226` | Covered |
| `roster_builder_compositions.py:156-177` | Unit default wargear only for unit-scoped groups. | `builder_model.js:396-407` | Covered |
| `roster_builder_compositions.py:178-227` | Base miniature loadout, missing default options, normalize default miniature wargear. | `builder_model.js:526-559` | Covered |
| `roster_builder_compositions.py:228-306` | Closest valid default loadout scoring. | `builder_model.js:409-524`, `builder_loadout_math.js:96-164` | Covered |
| `roster_builder_compositions.py:308-357` | Miniature default wargear and missing defaults. | `builder_model.js:526-549` | Covered |
| `roster_builder_compositions.py:358-458` | Unit summary: points, model count, keywords, warlord, enhancements. | `builder_model.js:237-292` | Covered |

## Exported Rule Tables

Every table used by the Python validation path is exported and loaded by the static catalog.

| Table | Rows | Static load/index |
| --- | ---: | --- |
| `battle_size` | 3 | `builder_catalog.js:36-185`, bootstrap |
| `detachment_faction_keyword` | 457 | `builder_catalog.js:40,114,192` |
| `detachment_faction_detachment_points_cost` | 4 | `builder_catalog.js:41,115,193` |
| `detachment_unique_keyword` | 57 | `builder_catalog.js:42,116,194,280` |
| `detachment_required_datasheet` | 0 | `builder_catalog.js:43,117,195,281` |
| `detachment_linked_datasheet` | 107 | `builder_catalog.js:44,118,196,282` |
| `detachment_mandatory_warlord_miniature` | 2 | `builder_catalog.js:45,119,197,283` |
| `detachment_granted_warlord_miniature` | 1 | `builder_catalog.js:46,120,198,284` |
| `detachment_excluded_datasheet` | 23 | `builder_catalog.js:49,123,201` |
| `faction_keyword` | 43 | `builder_catalog.js:47,121,199,266` |
| `faction_keyword_excluded_datasheet` | 23 | `builder_catalog.js:48,122,200` |
| `faction_keyword_mandatory_allegiance_ability` | 0 | `builder_catalog.js:67,141,219,298` |
| `datasheet` | 1142 | `builder_catalog.js:50,124,202,267` |
| `datasheet_faction_keyword` | 1256 | `builder_catalog.js:51,125,203,285` |
| `datasheet_points_step` | 334 | `builder_catalog.js:52,126,204,286` |
| `datasheet_bodyguard_group` | 1266 | `builder_catalog.js:53,127,205,287` |
| `datasheet_bodyguard_group_datasheet` | 1260 | `builder_catalog.js:54,128,206,288` |
| `datasheet_bodyguard_group_keyword` | 14 | `builder_catalog.js:55,129,207,289` |
| `unit_composition` | 1516 | `builder_catalog.js:56,130,208,268,291` |
| `unit_composition_miniature` | 2258 | `builder_catalog.js:57,131,209,292` |
| `unit_composition_required_faction_keyword` | 51 | `builder_catalog.js:58,132,210,293` |
| `unit_composition_required_detachment` | 8 | `builder_catalog.js:59,133,211,294` |
| `miniature` | 1569 | `builder_catalog.js:60,134,212,269,295` |
| `miniature_keyword` | 8773 | `builder_catalog.js:62,136,214,296` |
| `conditional_keyword` | 380 | `builder_catalog.js:63,137,215,297` |
| `keyword` | 1239 | `builder_catalog.js:61,135,213,270` |
| `keyword_restriction_group` | 16 | `builder_catalog.js:93,167,245,321` |
| `keyword_restriction_group_keyword` | 21 | `builder_catalog.js:94,168,246,322` |
| `restriction_group_detachment_limit` | 7 | `builder_catalog.js:95,169,247,323` |
| `allegiance_ability_group` | 10 | `builder_catalog.js:68,142,220,273` |
| `allegiance_ability` | 26 | `builder_catalog.js:69,143,221,274,299` |
| `allied_faction` | 21 | `builder_catalog.js:80,154,232,276` |
| `faction_keyword_allied_faction` | 87 | `builder_catalog.js:81,155,233,309` |
| `allied_faction_parent_faction_keyword` | 25 | `builder_catalog.js:82,156,234,310` |
| `allied_faction_datasheet` | 320 | `builder_catalog.js:83,157,235,311` |
| `allied_faction_points_limit` | 39 | `builder_catalog.js:84,158,236,312` |
| `allied_faction_keyword` | 54 | `builder_catalog.js:85,159,237,313` |
| `allied_faction_allowed_warlord_miniature` | 28 | `builder_catalog.js:86,160,238,314` |
| `allied_faction_required_detachment` | 29 | `builder_catalog.js:87,161,239,315` |
| `allied_faction_allegiance_ability` | 0 | `builder_catalog.js:88,162,240,316` |
| `allied_faction_keyword_slotless_keyword_group` | 12 | `builder_catalog.js:89,163,241,317` |
| `allied_faction_keyword_slotless_keyword_group_donor_keyword` | 18 | `builder_catalog.js:90,164,242,318` |
| `allied_faction_keyword_slotless_keyword_group_receiver_keyword` | 12 | `builder_catalog.js:91,165,243,319` |
| `keyword_ally_restricting_keyword` | 0 | `builder_catalog.js:92,166,244,320` |
| `enhancement` | 957 | `builder_catalog.js:70,144,222,275` |
| `enhancement_keyword_points_cost` | 0 | `builder_catalog.js:71,145,223,300` |
| `enhancement_excluded_keyword` | 32 | `builder_catalog.js:72,146,224,301` |
| `enhancement_required_wargear_item` | 1 | `builder_catalog.js:73,147,225,302` |
| `enhancement_required_keyword_group` | 1027 | `builder_catalog.js:74,148,226,303` |
| `enhancement_required_keyword_group_keyword` | 670 | `builder_catalog.js:75,149,227,304` |
| `enhancement_required_keyword_group_faction_keyword` | 639 | `builder_catalog.js:76,150,228,305` |
| `enhancement_bodyguard_group` | 19 | `builder_catalog.js:77,151,229,306` |
| `enhancement_bodyguard_group_datasheet` | 19 | `builder_catalog.js:78,152,230,307` |
| `enhancement_bodyguard_group_keyword` | 0 | `builder_catalog.js:79,153,231,308` |
| `base_miniature_loadout` | 1300 | `builder_catalog.js:96,170,248,324-325` |
| `base_miniature_loadout_wargear_option` | 3132 | `builder_catalog.js:97,171,249,326` |
| `loadout_choice_set` | 2445 | `builder_catalog.js:98,172,250,327` |
| `loadout_choice` | 5374 | `builder_catalog.js:99,173,251,328` |
| `loadout_choice_wargear_item` | 8325 | `builder_catalog.js:100,174,252,329` |
| `limited_wargear_choice_set` | 343 | `builder_catalog.js:101,175,253,330` |
| `limited_wargear_choice` | 569 | `builder_catalog.js:102,176,254,331` |
| `limited_wargear_choice_wargear_item` | 676 | `builder_catalog.js:103,177,255,332` |
| `wargear_limit` | 492 | `builder_catalog.js:104,178,256,333` |
| `all_model_wargear_choice_set` | 28 | `builder_catalog.js:105,179,257,334` |
| `all_model_wargear_choice` | 63 | `builder_catalog.js:106,180,258,335` |
| `all_model_wargear_choice_wargear_item` | 69 | `builder_catalog.js:107,181,259,336` |
| `wargear_option_group` | 3025 | `builder_catalog.js:108,182,260,277,337` |
| `wargear_option` | 6322 | `builder_catalog.js:109,183,261,278,338` |
| `wargear_item` | 3516 | `builder_catalog.js:110,184,262,279` |
| `publication` | 69 | `builder_catalog.js:64,138,216,271` |

## Intentional Boundaries

The validation engine is implemented ahead of parts of the visible editor surface. Allied unit source selection is present in the roster editor; some rules can only be exercised once UI controls are added for Warlord, allegiance ability choices, attachments, and enhancements. This is not a validation gap: the data shape and validator already support those selections.

The static app does not export or read server roster tables. User roster data is stored locally in IndexedDB. Old local roster data is intentionally abandoned by the `heretic-builder-local-v2` store name.

Combat Patrol units remain filtered out of the normal datasheet picker, while Combat Patrol validation rules remain implemented because catalog data can still contain Combat Patrol detachments and enhancements.

## Verification

Commands run:

```bash
for f in HereticBuilder/static/builder*.js; do node --check "$f" || exit 1; done
python3 HereticBuilder/tools/builder.py build-builder
python3 HereticBuilder/tools/builder.py build-builder --profile builder-pages --out /private/tmp/heretic-builder-pages-audit-test
```

Results:

- JS syntax check: pass.
- Local builder build: pass, data version 879, 105 builder data files.
- GitHub Pages profile build: pass, base path `/builder`, data version 879, 105 builder data files.
- In-app browser fresh navigation: pass, `http://127.0.0.1:4180/?audit=...#/`, status `v879`, screen `list-screen`, text `No rosters`, console errors `[]`.
- All-faction allied source audit: pass. Checked 36 builder factions, 21 allied sources and all 87 allowed faction-to-allied-source pairs. Every allowed pair returned at least one datasheet; every unauthorized Python catalog pair returned zero datasheets; static client dropdown exposed exactly the 87 allowed allied pairs; static `availableDatasheets` returned zero datasheets for unauthorized `allyType` values; Combat Patrol leaks were zero.
- Allied rule data export audit: pass. Static JSON row counts matched SQLite for every allied rule table: `allied_faction`, `faction_keyword_allied_faction`, `allied_faction_parent_faction_keyword`, `allied_faction_datasheet`, `allied_faction_points_limit`, `allied_faction_keyword`, `allied_faction_allowed_warlord_miniature`, `allied_faction_required_detachment`, `allied_faction_allegiance_ability`, `allied_faction_keyword_slotless_keyword_group`, donor/receiver slotless keyword tables and `keyword_ally_restricting_keyword`.
