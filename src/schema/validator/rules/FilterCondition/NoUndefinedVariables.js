/* @flow */

import keyMap from '../../../../jsutils/keyMap';
import { extractVariablesFromObjectValues } from '../../../analyzer';
import { error } from '../../utils';
import type { Rule } from '../../types';

export const NoUndefinedVariables: Rule = ({ filter, condition }) => {
  if (!filter || !condition) { throw Error('context not passed to rule.'); }
  const { name } = filter;
  const target = name.replace('Filter#', '');
  const { key, arguments: argsList, conditionAST, loc } = condition;

  const variables = extractVariablesFromObjectValues( [ conditionAST ] );
  const args = keyMap(argsList, arg => arg.name);

  return variables
    .filter(variable => !args[variable])
    .map(variable =>
      error`Filter key "${key}" of filter on ${target} contains an undefined
          ~ variable "${variable}". All variables used in filter expression
          ~ must be defined. ${loc}`);
};
