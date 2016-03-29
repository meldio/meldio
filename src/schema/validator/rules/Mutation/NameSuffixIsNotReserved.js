/* @flow */

import { error } from '../../utils.js';
import type { Rule } from '../../types';

export const NameSuffixIsNotReserved: Rule =
({ mutation, TYPE_RESERVED_SUFFIXES}) => {
  if (!mutation) { throw Error('context not passed to rule.'); }
  const { name, loc } = mutation;
  const reserved = TYPE_RESERVED_SUFFIXES.join(', ');

  return TYPE_RESERVED_SUFFIXES
    .filter(suffix => name.endsWith(suffix))
    .map(suffix =>
      error`Mutation name "${name}" cannot end with "${suffix}".
          | The following suffixes are reserved: ${reserved}. ${loc}`);
};
