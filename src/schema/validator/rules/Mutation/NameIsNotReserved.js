/* @flow */

import { error } from '../../utils.js';
import type { Rule } from '../../types';

export const NameIsNotReserved: Rule =
({ mutation, TYPE_RESERVED_WORDS}) => {
  if (!mutation) { throw Error('context not passed to rule.'); }
  const { name, loc } = mutation;
  const reserved = TYPE_RESERVED_WORDS.join(', ');

  if (TYPE_RESERVED_WORDS.includes(name)) {
    return error`Mutation name "${name}" is reserved.
               | The following names are reserved: ${reserved}. ${loc}`;
  }
};
