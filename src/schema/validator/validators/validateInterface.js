import flatten from '../../../jsutils/flatten2';
import type { InterfaceDefinition } from '../../analyzer';
import type { ValidationContext, ValidationResult, Rules } from './types';
import { validateDirectives } from './validateDirectives';
import { validateFields } from './validateFields';

export function validateInterface(
  inter: InterfaceDefinition,
  parentContext: ValidationContext,
  rules: Rules,
): ValidationResult {
  const path = `/interface`;
  const context = { ...parentContext, interface: inter };
  return flatten( (rules[path] || [ ]).map(rule => rule(context) || [ ]) )
    .concat(validateDirectives(inter.directives, context, path, rules))
    .concat(validateFields(inter.fields, context, path, rules));
}
