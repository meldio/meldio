/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const NameSuffixIsNotReserved: Rule =
({ type, TYPE_RESERVED_SUFFIXES }) => {
  if (!type) { throw Error('context not passed to rule.'); }
  const { name, loc } = type;
  const reserved = TYPE_RESERVED_SUFFIXES.join(', ');

  return TYPE_RESERVED_SUFFIXES
    .filter(suffix => name.endsWith(suffix))
    .map(suffix =>
      error`Type name "${name}" cannot end with "${suffix}". The following
          ~ suffixes are reserved: ${reserved}. ${loc}`);
};
