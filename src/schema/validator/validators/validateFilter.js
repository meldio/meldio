import flatten from '../../../jsutils/flatten2';
import type { FilterDefinition } from '../../analyzer';
import type { ValidationContext, ValidationResult, Rules } from './types';
import { validateConditions } from './validateConditions';

export function validateFilter(
  filter: FilterDefinition,
  parentContext: ValidationContext,
  rules: Rules,
): ValidationResult {
  const path = `/filter`;
  const context = { ...parentContext, filter };
  return flatten( (rules[path] || [ ]).map(rule => rule(context) || [ ]) )
    .concat(validateConditions(filter.conditions, context, path, rules));
}
