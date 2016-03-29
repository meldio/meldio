/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const NameIsNotReserved: Rule =
  ({ type, field, FIELD_RESERVED_WORDS }) => {
    if (!type || !field) { throw Error('context not passed to rule.'); }
    const { name: typeName } = type;
    const { name, loc } = field;
    const reserved = FIELD_RESERVED_WORDS.join(', ');

    if (FIELD_RESERVED_WORDS.includes(name)) {
      return error`Field name "${name}" in type "${typeName}" is
                 ~ reserved. The following field names are reserved:
                 ~ ${reserved}. ${loc}`;
    }
  };
