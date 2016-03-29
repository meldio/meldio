import flatten from '../../../jsutils/flatten2';
import type { MutationDefinition } from '../../analyzer';
import type { ValidationContext, ValidationResult, Rules } from './types';
import { validateDirectives } from './validateDirectives';
import { validateArguments } from './validateArguments';
import { validateFields } from './validateFields';

export function validateMutation(
  mutation: MutationDefinition,
  parentContext: ValidationContext,
  rules: Rules,
): ValidationResult {
  const path = `/mutation`;
  const context = { ...parentContext, mutation };
  return flatten( (rules[path] || [ ]).map(rule => rule(context) || [ ]) )
    .concat(validateDirectives(mutation.directives, context, path, rules))
    .concat(validateArguments(mutation.arguments, context, path, rules))
    .concat(validateFields(mutation.fields, context, path, rules));
}
