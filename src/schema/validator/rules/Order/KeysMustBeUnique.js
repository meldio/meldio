/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const KeysMustBeUnique: Rule = ({ order }) => {
  if (!order) { throw Error('context not passed to rule.'); }
  const { name, expressions, loc } = order;
  const target = name.replace('Order#', '');

  const count = expressions
    .reduce((acc, expression) =>
      ({...acc, [expression.key]: (acc[expression.key] || 0) + 1 }), { });

  return Object.keys(count)
    .filter(key => count[key] > 1)
    .map(key => error`Order on ${target} defines "${key}" key multiple times.
                    ~ Order expression keys must be unique. ${loc}`);
};
