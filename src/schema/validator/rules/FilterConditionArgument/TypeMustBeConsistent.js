/* @flow */

import flatten from '../../../../jsutils/flatten';
import { error } from '../../utils.js';
import type { Rule } from '../../types';

export const TypeMustBeConsistent: Rule = ({ filter, condition, argument }) => {
  if (!filter || !condition || !argument) {
    throw Error('context not passed to rule.');
  }
  const { name: filterName, conditions } = filter;
  const filterTarget = filterName.replace('Filter#', '');
  const { key } = condition;
  const { name, loc, type, isScalarList, isObjectList } = argument;

  const duplicateArgs = flatten(conditions
    .map(cond =>
      cond.arguments
        .map(arg => ({ ...arg, key: cond.key }))
        .filter(arg =>
          arg.name === name && (
            arg.type !== type ||
            arg.isScalarList !== isScalarList ||
            arg.isObjectList !== isObjectList))));

  if (duplicateArgs.length) {
    return error`Filter on ${filterTarget} defines an argument "${name}" under
               ~ "${key}" key, however argument with the same name and different
               ~ type is defined under the following key(s):
               ~ ${duplicateArgs.map(a => `"${a.key}"`).join(', ')}. ${loc}`;
  }
};
