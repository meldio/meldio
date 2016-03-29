/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const NameIsNotReserved: Rule = ({
  filter,
  argument,
  ARGUMENT_RESERVED_WORDS
}) => {
  if (!filter || !argument) { throw Error('context not passed to rule.'); }
  const { name: filterName } = filter;
  const target = filterName.replace('Filter#', '');
  const { name, loc } = argument;
  const reserved = ARGUMENT_RESERVED_WORDS.join(', ');

  if (ARGUMENT_RESERVED_WORDS.includes(name)) {
    return error`Argument name "${name}" of filter on ${target} is reserved.
               ~ The following names are reserved: ${reserved}. ${loc}`;
  }
};
