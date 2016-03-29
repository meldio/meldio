/* @flow */

import { error } from '../../utils.js';
import type { Rule } from '../../types';

export const TypeIsValid: Rule = ({ mutation, argument, schema }) => {
  if (!mutation || !argument) { throw Error('context not passed to rule.'); }
  const { name: mutationName } = mutation;
  const { name, loc, type, isObject, isObjectList } = argument;

  const target = schema[type];

  if ((isObject || isObjectList) && (!target || target.kind !== 'input')) {
    return error`Mutation "${mutationName}" defines an argument "${name}" with
               ~ an unsupported type. Mutation arguments can only be scalars,
               ~ input objects, lists of scalars or lists of input objects.
               ~ ${loc}`;
  }
};
