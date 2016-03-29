/* @flow */

import { capitalCase } from '../../../../jsutils/casing';
import { warning } from '../../utils';
import type { Rule } from '../../types';

export const KeyInCapitalCase: Rule = ({ order, expression }) => {
  if (!order || !expression) { throw Error('context not passed to rule.'); }
  const { name } = order;
  const target = name.replace('Order#', '');
  const { key, loc } = expression;

  if (key !== capitalCase(key)) {
    return warning`Order key "${key}" of order on ${target} should be in
                 ~ "CAPITAL_CASE", like this: "${capitalCase(key)}". ${loc}`;
  }
};
