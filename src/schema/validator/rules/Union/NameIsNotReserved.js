/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const NameIsNotReserved: Rule = ({ union, TYPE_RESERVED_WORDS }) => {
  if (!union) { throw Error('context not passed to rule.'); }
  const { name, loc } = union;
  const reserved = TYPE_RESERVED_WORDS.join(', ');

  if (TYPE_RESERVED_WORDS.includes(name)) {
    return error`Union name "${name}" is reserved. The following names
              ~  are reserved: ${reserved}. ${loc}`;
  }
};
