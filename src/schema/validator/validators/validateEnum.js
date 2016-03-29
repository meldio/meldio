import flatten from '../../../jsutils/flatten2';
import type { EnumDefinition } from '../../analyzer';
import type { ValidationContext, ValidationResult, Rules } from './types';

export function validateEnum(
  enumeration: EnumDefinition,
  parentContext: ValidationContext,
  rules: Rules,
): ValidationResult {
  const path = `/enum`;
  const context = { ...parentContext, enum: enumeration };
  return flatten( (rules[path] || [ ]).map(rule => rule(context) || [ ]) );
}
