/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const NoLeadingUnderscore: Rule = ({ type, field }) => {
  if (!type || !field) { throw Error('context not passed to rule.'); }
  const { name: typeName } = type;
  const { name, loc } = field;

  if (name.startsWith('_')) {
    return error`Field name "${name}" in type "${typeName}"
               ~ cannot start with an underscore "_". ${loc}`;
  }
};
