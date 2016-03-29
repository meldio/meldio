/* @flow */

import { extractVariablesFromObjectValues } from '../../../analyzer';
import { error } from '../../utils';
import type { Rule } from '../../types';

export const NoVariables: Rule = ({ order, expression }) => {
  if (!order || !expression) { throw Error('context not passed to rule.'); }
  const { name } = order;
  const target = name.replace('Order#', '');
  const { key, expressionASTs, loc } = expression;

  const variables = extractVariablesFromObjectValues(expressionASTs);

  if (variables.length) {
    return error`Order key "${key}" of order on ${target} contains
        ~ ${variables.map(s => `"${s}"`).join(', ')} variable reference(s).
        ~ Variables are not supported in order expressions. ${loc}`;
  }
};
