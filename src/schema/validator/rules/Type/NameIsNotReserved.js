/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const NameIsNotReserved: Rule = ({ type, TYPE_RESERVED_WORDS }) => {
  if (!type) { throw Error('context not passed to rule.'); }
  const { name, loc } = type;
  const reserved = TYPE_RESERVED_WORDS.join(', ');

  if (TYPE_RESERVED_WORDS.includes(name)) {
    return error`Type name "${name}" is reserved. The following names
               ~ are reserved: ${reserved}. ${loc}`;
  }
};
