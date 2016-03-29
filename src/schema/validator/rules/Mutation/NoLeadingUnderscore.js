/* @flow */

import { error } from '../../utils.js';
import type { Rule } from '../../types';

export const NoLeadingUnderscore: Rule = ({ mutation }) => {
  if (!mutation) { throw Error('context not passed to rule.'); }
  const { name, loc } = mutation;

  if (name.startsWith('_')) {
    return error`Mutation name "${name}" cannot start with an
               ~ underscore "_". ${loc}`;
  }
};
