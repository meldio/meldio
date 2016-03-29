/* @flow */

import { capitalCase } from '../../../../jsutils/casing';
import { warning } from '../../utils';
import type { Rule } from '../../types';

export const KeyInCapitalCase: Rule = ({ filter, condition }) => {
  if (!filter || !condition) { throw Error('context not passed to rule.'); }
  const { name } = filter;
  const target = name.replace('Filter#', '');
  const { key, loc } = condition;

  if (key !== capitalCase(key)) {
    return warning`Filter key "${key}" of filter on ${target} should be in
                 ~ "CAPITAL_CASE", like this: "${capitalCase(key)}". ${loc}`;
  }
};
