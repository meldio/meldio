/* @flow */

import { error } from '../../utils.js';
import type { Rule } from '../../types';

export const TypeIsValid: Rule = ({ filter, argument, schema }) => {
  if (!filter || !argument) { throw Error('context not passed to rule.'); }
  const { name: filterName } = filter;
  const filterTarget = filterName.replace('Filter#', '');
  const { name, loc, type, isObject, isObjectList } = argument;

  const target = schema[type];

  if ((isObject || isObjectList) && (!target || target.kind !== 'input')) {
    return error`Filter on ${filterTarget} defines an argument "${name}" with
               ~ an unsupported type. Filter arguments can only be scalars,
               ~ input objects, lists of scalars or lists of input objects.
               ~ ${loc}`;
  }
};
