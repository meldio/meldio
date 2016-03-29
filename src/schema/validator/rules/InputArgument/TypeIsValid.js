/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const TypeIsValid: Rule = ({ input, argument, schema }) => {
  if (!input || !argument) { throw Error('context not passed to rule.'); }
  const { name: inputName } = input;
  const { name, loc, type, isObject, isObjectList } = argument;

  const target = schema[type];

  if ((isObject || isObjectList) && (!target || target.kind !== 'input')) {
    return error`Input object "${inputName}" defines a field "${name}" with an
               ~ unsupported type. Input object fields can only be scalars,
               ~ input objects, lists of scalars or lists of input objects.
               ~ ${loc}`;
  }
};
