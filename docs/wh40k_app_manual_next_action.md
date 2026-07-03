# WH 40K app manual next action

Date: 2026-07-03

Data version: 879
State: fill-next-batch
Reason: Official WH 40K app UI results are still needed for the next pending batch.
Pending rows: 43
Blocking failures: 0
Next batch: Minimum UI / Heretic Astartes allies (rows 1, 2, 3, 4, 5)
Recommended worksheet: docs/wh40k_app_manual_minimum_subcheck_batch.md (per-subcheck Setup hint)
Action logic: 0
Action builder-ui: 0
Action official-ui-blocked: 0

## Commands

```bash
node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --extract next-pending-batch --from docs/wh40k_app_manual_pass_pack.md > docs/wh40k_app_manual_next_batch.md
node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --extract minimum-subcheck-batch --from docs/wh40k_app_manual_pass_pack.md > docs/wh40k_app_manual_minimum_subcheck_batch.md
node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --check-batch docs/wh40k_app_manual_next_batch.md --from docs/wh40k_app_manual_pass_pack.md --allow-pending
node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --check-subcheck-batch docs/wh40k_app_manual_minimum_subcheck_batch.md --from docs/wh40k_app_manual_pass_pack.md --allow-pending
node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --check-subcheck-batch docs/wh40k_app_manual_minimum_subcheck_batch.md --from docs/wh40k_app_manual_pass_pack.md
node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --merge-subcheck-batch docs/wh40k_app_manual_minimum_subcheck_batch.md --from docs/wh40k_app_manual_pass_pack.md > updated-pass-pack.md
node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --check-batch docs/wh40k_app_manual_next_batch.md --from docs/wh40k_app_manual_pass_pack.md
node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --merge-batch docs/wh40k_app_manual_next_batch.md --from docs/wh40k_app_manual_pass_pack.md > updated-pass-pack.md
node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --status --from docs/wh40k_app_manual_pass_pack.md --format markdown > docs/wh40k_app_manual_status.md
node HereticBuilder/tools/export_manual_wh40k_pass_pack.mjs --extract action-backlog --from docs/wh40k_app_manual_pass_pack.md > docs/wh40k_app_manual_action_backlog.md
```
