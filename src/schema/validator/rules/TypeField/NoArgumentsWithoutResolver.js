/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const NoArgumentsWithoutResolver: Rule = ({ type, field }) => {
  if (!type || !field) { throw Error('context not passed to rule.'); }
  const { name: typeName } = type;
  const { name, loc, hasArguments, directives } = field;

  if (hasArguments && !directives.some(d => d.name === 'resolver')) {
    return error`Field "${name}" in type "${typeName}" cannot have arguments,
               | that is currently unsupported. ${loc}`;
  }
};
