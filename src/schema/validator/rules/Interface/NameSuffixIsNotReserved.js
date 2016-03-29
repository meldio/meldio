/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const NameSuffixIsNotReserved: Rule =
({ interface: inter, TYPE_RESERVED_SUFFIXES }) => {
  if (!inter) { throw Error('context not passed to rule.'); }
  const { name, loc } = inter;
  const reserved = TYPE_RESERVED_SUFFIXES.join(', ');

  return TYPE_RESERVED_SUFFIXES
    .filter(suffix => name.endsWith(suffix))
    .map(suffix =>
      error`Interface name "${name}" cannot end with "${suffix}". The following
          ~ suffixes are reserved: ${reserved}. ${loc}`);
};
