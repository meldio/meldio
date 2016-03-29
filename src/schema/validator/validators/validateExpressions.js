import flatten from '../../../jsutils/flatten2';
import type { OrderExpressionDefinition } from '../../analyzer';
import type { ValidationContext, ValidationResult, Rules } from './types';

export function validateExpressions(
  expressions: Array<OrderExpressionDefinition>,
  context: ValidationContext,
  parentPath: string,
  rules: Rules,
): ValidationResult {
  const path = `${parentPath}/expression`;
  const ruleSet = rules[path] || [ ];
  return flatten(
    expressions.map(expression =>
      flatten(ruleSet.map(rule => rule({ ...context, expression }) || [ ]))));
}
