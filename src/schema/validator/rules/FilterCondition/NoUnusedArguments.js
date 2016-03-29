/* @flow */

import keyMap from '../../../../jsutils/keyMap';
import { extractVariablesFromObjectValues } from '../../../analyzer';
import { error } from '../../utils';
import type { Rule } from '../../types';

export const NoUnusedArguments: Rule = ({ filter, condition }) => {
  if (!filter || !condition) { throw Error('context not passed to rule.'); }
  const { name } = filter;
  const target = name.replace('Filter#', '');
  const { key, arguments: args, conditionAST, loc } = condition;

  const variables = keyMap(
    extractVariablesFromObjectValues( [ conditionAST ] ),
    variable => variable);

  return args
    .filter(arg => !variables[arg.name])
    .map(arg =>
      error`Filter key "${key}" of filter on ${target} contains an unused
          ~ argument "${arg.name}". All arguments defined for a filter key
          ~ must be referenced by variables within expression. ${loc}`);
};
