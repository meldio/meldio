/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const NoArguments: Rule = ({ mutation, field }) => {
  if (!mutation || !field) { throw Error('context not passed to rule.'); }
  const { name: mutationName } = mutation;
  const { name, loc, hasArguments } = field;

  if (hasArguments) {
    return error`Field "${name}" of mutation "${mutationName}" cannot have
               ~ arguments, that is currently unsupported. ${loc}`;
  }
};
