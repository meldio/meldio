/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const NoLeadingUnderscore: Rule = ({ union }) => {
  if (!union) { throw Error('context not passed to rule.'); }
  const { name, loc } = union;

  if (name.startsWith('_')) {
    return error`Union name "${name}" cannot start with an
               ~ underscore "_". ${loc}`;
  }
};
