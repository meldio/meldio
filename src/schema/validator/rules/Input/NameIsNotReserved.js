/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const NameIsNotReserved: Rule = ({ input, TYPE_RESERVED_WORDS }) => {
  if (!input) { throw Error('context not passed to rule.'); }
  const { name, loc } = input;

  const reserved = TYPE_RESERVED_WORDS.join(', ');

  if (TYPE_RESERVED_WORDS.includes(name)) {
    return error`Input object name "${name}" is reserved. The following names
               ~ are reserved: ${reserved}. ${loc}`;

  }
};
