import flatten from '../../../jsutils/flatten2';
import type { InputDefinition } from '../../analyzer';
import type { ValidationContext, ValidationResult, Rules } from './types';
import { validateArguments } from './validateArguments';

export function validateInput(
  input: InputDefinition,
  parentContext: ValidationContext,
  rules: Rules,
): ValidationResult {
  const path = `/input`;
  const context = { ...parentContext, input };
  return flatten( (rules[path] || [ ]).map(rule => rule(context) || [ ]) )
    .concat(validateArguments(input.arguments, context, path, rules));
}
