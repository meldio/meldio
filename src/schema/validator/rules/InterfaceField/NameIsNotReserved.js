/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const NameIsNotReserved: Rule =
({ interface: inter, field, FIELD_RESERVED_WORDS }) => {
  if (!inter || !field) { throw Error('context not passed to rule.'); }
  const { name: interfaceName } = inter;
  const { name, loc } = field;

  const reserved = FIELD_RESERVED_WORDS.join(', ');

  if (FIELD_RESERVED_WORDS.includes(name)) {
    return error`Field name "${name}" of interface "${interfaceName}" is
               ~ reserved. The following field names are reserved:
               ~ ${reserved}. ${loc}`;
  }
};
