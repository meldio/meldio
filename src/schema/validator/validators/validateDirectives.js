import flatten from '../../../jsutils/flatten2';
import type { DirectiveDefinition } from '../../analyzer';
import type { ValidationContext, ValidationResult, Rules } from './types';

export function validateDirectives(
  directives: Array<DirectiveDefinition>,
  context: ValidationContext,
  parentPath: string,
  rules: Rules,
): ValidationResult {
  const path = `${parentPath}/directive`;
  const ruleSet = rules[path] || [ ];
  return flatten(
    directives.map(directive =>
      flatten(ruleSet.map(rule => rule({ ...context, directive }) || [ ]))));
}
