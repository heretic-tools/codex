import { rosterSummary } from "./builder_validation_core.js";
import {
  rosterValidationContext,
  rosterValidationResult,
} from "./builder_roster_validation_context.js";
import { validateRosterSelectionLimits } from "./builder_roster_validation_basic_rules.js";
import { runRosterRuleValidators } from "./builder_roster_validation_rule_runner.js";
import { validateRosterUnitRules } from "./builder_roster_validation_unit_rules.js";

function validateRoster(roster) {
  const messages = [];
  const context = rosterValidationContext(roster);
  validateRosterSelectionLimits(roster, context, messages);
  runRosterRuleValidators(roster, context, messages);
  validateRosterUnitRules(roster, context, messages);
  return rosterValidationResult(context, messages);
}

export { rosterSummary, validateRoster };
