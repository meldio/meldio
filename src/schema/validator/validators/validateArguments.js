import flatten from '../../../jsutils/flatten2';
import type { ArgumentDefinition } from '../../analyzer';
import type { ValidationContext, ValidationResult, Rules } from './types';

export function validateArguments(
  args: Array<ArgumentDefinition>,
  context: ValidationContext,
  parentPath: string,
  rules: Rules,
): ValidationResult {
  const path = `${parentPath}/argument`;
  const ruleSet = rules[path] || [ ];
  return flatten(
    args.map(argument =>
      flatten(ruleSet.map(rule => rule({ ...context, argument }) || [ ]))));
}
