import flatten from '../../../jsutils/flatten2';
import type { FieldDefinition } from '../../analyzer';
import type { ValidationContext, ValidationResult, Rules } from './types';
import { validateDirectives } from './validateDirectives';

export function validateFields(
  fields: Array<FieldDefinition>,
  context: ValidationContext,
  parentPath: string,
  rules: Rules,
): ValidationResult {
  const path = `${parentPath}/field`;
  const ruleSet = rules[path] || [ ];
  return flatten(
    fields.map(field =>
      flatten(ruleSet.map(rule => rule({ ...context, field }) || [ ]))
        .concat(
          validateDirectives(field.directives, {...context, field}, path, rules)
        )
      ));
}
