/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';


export const NoLeadingUnderscore: Rule = ({ enum: enumeration }) => {
  if (!enumeration) { throw Error('context not passed to rule.'); }
  const { name, loc } = enumeration;

  if (name.startsWith('_')) {
    return error`Enum name "${name}" cannot start with an
               ~ underscore "_". ${loc}`;
  }
};
