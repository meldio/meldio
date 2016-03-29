/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const NameIsNotReserved: Rule =
({ interface: inter, TYPE_RESERVED_WORDS }) => {
  if (!inter) { throw Error('context not passed to rule.'); }
  const { name, loc, isSystemDefined } = inter;
  const reserved = TYPE_RESERVED_WORDS.join(', ');

  if (TYPE_RESERVED_WORDS.includes(name) && !isSystemDefined) {
    return error`Interface name "${name}" is reserved. The following names
               ~ are reserved: ${reserved}. ${loc}`;
  }
};
