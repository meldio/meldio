/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const NoLeadingUnderscore: Rule = ({ interface: inter, field }) => {
  if (!inter || !field) { throw Error('context not passed to rule.'); }
  const { name: interfaceName } = inter;
  const { name, loc } = field;

  if (name.startsWith('_')) {
    return error`Field name "${name}" of interface "${interfaceName}"
               ~ cannot start with an underscore "_". ${loc}`;
  }
};
