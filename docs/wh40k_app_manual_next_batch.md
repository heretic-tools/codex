# WH 40K app next pending batch

Date: 2026-07-03

Data version: 879
Total pending rows: 43

Section: Minimum UI
Batch: Heretic Astartes allies
Pass-pack rows: 1, 2, 3, 4, 5

| Row | Case id | Builder test | Codes | WH app scenario | WH app result | Parity | Action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `heretic-astartes-daemon-allies-points` | tests/builder_validation_allied.test.mjs | allied_points.limit_exceeded | Manual WH app UI: create a Heretic Astartes Strike Force roster, add Legiones Daemonica ally units under and over the battle-size ally points cap, and compare the `daemon-points-under-cap` / `daemon-points-over-cap` Builder fixture states. | Pending | Pending | Pending |
| 2 | `heretic-astartes-daemon-outnumbering` | tests/builder_validation_allied.test.mjs | allied_keyword_restricting_keyword.outnumbered_keywords | Manual WH app UI: in a Heretic Astartes roster, compare Khorne, Nurgle, Slaanesh, and Tzeentch Legiones Daemonica non-Battleline allies that outnumber their matching Battleline controls. | Pending | Pending | Pending |
| 3 | `heretic-astartes-chaos-knights-cap` | tests/builder_validation_allied.test.mjs | allied_keyword_count.limit_exceeded, allied_keyword_count.invalid_mutually_exclusive_keywords | Manual WH app UI: in a Heretic Astartes roster, add Chaos Knights allies at cap and over cap, then compare the Builder keyword-cap and mutually-exclusive ally-bucket fixture states. | Pending | Pending | Pending |
| 4 | `heretic-astartes-cult-legion-detachment` | tests/builder_validation_allied.test.mjs | allied_unit.required_detachment_not_selected | Manual WH app UI: in a Heretic Astartes roster, add Death Guard, Thousand Sons, World Eaters, and Emperor's Children cult-legion allies with and without their configured required detachment selected. | Pending | Pending | Pending |
| 5 | `heretic-astartes-titanicus-traitoris-cap` | tests/builder_validation_allied.test.mjs | allied_keyword_count.limit_exceeded | Manual WH app UI: in a Heretic Astartes roster, add Titanicus Traitoris allies at cap and over cap, then compare the Builder keyword-cap fixture state. | Pending | Pending | Pending |
