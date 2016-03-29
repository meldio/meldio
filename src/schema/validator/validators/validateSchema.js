import flatten from '../../../jsutils/flatten2';
import type { ValidationContext, ValidationResult, Rules } from './types';

export function validateSchema(
  context: ValidationContext,
  rules: Rules,
): ValidationResult {
  const path = `/`;
  return flatten( (rules[path] || [ ]).map(rule => rule(context) || [ ]) );
}
