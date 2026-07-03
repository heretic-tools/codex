import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
export const projectRoot = dirname(dirname(dirname(currentFile)));
export const checklistPath = join(projectRoot, "docs", "wh40k_app_manual_parity_checklist.md");
export const actionValues = ["pending", "none", "logic", "builder-ui", "official-ui-blocked"];
export const extractModes = ["action-backlog", "minimum-checklist", "minimum-subcheck-batch", "next-pending-batch", "wargear-results"];
