import flatten from '../../../jsutils/flatten2';
import type { TypeDefinition } from '../../analyzer';
import type { ValidationContext, ValidationResult, Rules } from './types';
import { validateDirectives } from './validateDirectives';
import { validateFields } from './validateFields';

export function validateType(
  type: TypeDefinition,
  parentContext: ValidationContext,
  rules: Rules,
): ValidationResult {
  const path = `/type`;
  const context = { ...parentContext, type };
  return flatten( (rules[path] || [ ]).map(rule => rule(context) || [ ]) )
    .concat(validateDirectives(type.directives, context, path, rules))
    .concat(validateFields(type.fields, context, path, rules));
}
