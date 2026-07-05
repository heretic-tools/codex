import { unitValidationMessage } from "./builder_validation_messages.js";

function validateUnitCompositions(units, messages) {
  for (const unit of units) {
    if (unit.maxModelCount && unit.modelCount > unit.maxModelCount) {
      messages.push(unitValidationMessage("unit.max_model_count_too_many_models", unit, `${unit.name} has ${unit.modelCount} models; limit is ${unit.maxModelCount}.`));
    }
    if (!unit.selectedCompositionId) {
      messages.push(unitValidationMessage("unit_composition.invalid_unit_composition", unit, `${unit.name} has an invalid unit composition.`));
    } else if (!unit.selectedCompositionAvailable) {
      messages.push(unitValidationMessage("unit_composition.unavailable", unit, `${unit.name} uses a composition that is not available to this faction or detachment.`));
    }
  }
}

export { validateUnitCompositions };
