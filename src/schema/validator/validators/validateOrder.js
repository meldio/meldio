import flatten from '../../../jsutils/flatten2';
import type { OrderDefinition } from '../../analyzer';
import type { ValidationContext, ValidationResult, Rules } from './types';
import { validateExpressions } from './validateExpressions';

export function validateOrder(
  order: OrderDefinition,
  parentContext: ValidationContext,
  rules: Rules,
): ValidationResult {
  const path = `/order`;
  const context = { ...parentContext, order };
  return flatten( (rules[path] || [ ]).map(rule => rule(context) || [ ]) )
    .concat(validateExpressions(order.expressions, context, path, rules));
}
