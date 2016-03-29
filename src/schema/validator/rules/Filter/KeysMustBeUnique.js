/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const KeysMustBeUnique: Rule = ({ filter }) => {
  if (!filter) { throw Error('context not passed to rule.'); }
  const { name, conditions, loc } = filter;
  const target = name.replace('Filter#', '');

  const count = conditions
    .reduce((acc, condition) =>
      ({...acc, [condition.key]: (acc[condition.key] || 0) + 1 }), { });

  return Object.keys(count)
    .filter(key => count[key] > 1)
    .map(key => error`Filter on ${target} defines "${key}" key multiple times.
                    ~ Filter condition keys must be unique. ${loc}`);
};
