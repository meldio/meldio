import flatten from '../../../jsutils/flatten2';
import type { FilterConditionDefinition } from '../../analyzer';
import type { ValidationContext, ValidationResult, Rules } from './types';
import { validateArguments } from './validateArguments';

export function validateConditions(
  conditions: Array<FilterConditionDefinition>,
  context: ValidationContext,
  parentPath: string,
  rules: Rules,
): ValidationResult {
  const path = `${parentPath}/condition`;
  const ruleSet = rules[path] || [ ];
  return flatten(
    conditions.map(condition =>
      flatten(ruleSet.map(rule => rule({ ...context, condition }) || [ ]))
        .concat(validateArguments(
                  condition.arguments,
                  { ...context, condition },
                  path,
                  rules))));
}
