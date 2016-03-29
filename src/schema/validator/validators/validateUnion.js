import flatten from '../../../jsutils/flatten2';
import type { UnionDefinition } from '../../analyzer';
import type { ValidationContext, ValidationResult, Rules } from './types';
import { validateDirectives } from './validateDirectives';

export function validateUnion(
  union: UnionDefinition,
  parentContext: ValidationContext,
  rules: Rules,
): ValidationResult {
  const path = `/union`;
  const context = { ...parentContext, union };
  return flatten( (rules[path] || [ ]).map(rule => rule(context) || [ ]) )
    .concat(validateDirectives(union.directives, context, path, rules));
}
