/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const NoLeadingUnderscore: Rule = ({ interface: inter }) => {
  if (!inter) { throw Error('context not passed to rule.'); }
  const { name, loc } = inter;

  if (name.startsWith('_')) {
    return error`Interface name "${name}" cannot start with an
               ~ underscore "_". ${loc}`;
  }
};
