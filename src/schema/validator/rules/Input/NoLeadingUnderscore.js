/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const NoLeadingUnderscore: Rule = ({ input }) => {
  if (!input) { throw Error('context not passed to rule.'); }
  const { name, loc } = input;

  if (name.startsWith('_')) {
    return error`Input object name "${name}" cannot start with an
               ~ underscore "_". ${loc}`;
  }

};
