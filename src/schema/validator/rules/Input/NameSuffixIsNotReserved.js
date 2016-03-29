/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const NameSuffixIsNotReserved: Rule =
({ input, TYPE_RESERVED_SUFFIXES }) => {
  if (!input) { throw Error('context not passed to rule.'); }
  const { name, loc } = input;
  const reserved = TYPE_RESERVED_SUFFIXES.join(', ');

  return TYPE_RESERVED_SUFFIXES
    .filter(suffix => name.endsWith(suffix))
    .map(suffix =>
      error`Input object name "${name}" cannot end with "${suffix}".
          ~ The following suffixes are reserved: ${reserved}. ${loc}`);
};
