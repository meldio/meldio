/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const NoLeadingUnderscore: Rule = ({ type }) => {
  if (!type) { throw Error('context not passed to rule.'); }
  const { name, loc } = type;

  if (name.startsWith('_')) {
    return error`Type name "${name}" cannot start with an
               ~ underscore "_". ${loc}`;
  }
};
