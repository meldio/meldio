/* @flow */

import { warning } from '../../utils.js';
import type { Rule } from '../../types';
import { SCALAR_TYPES } from '../../../analyzer';

export const TypeIsWellSupported: Rule = ({ filter, argument, schema }) => {
  if (!filter || !argument) { throw Error('context not passed to rule.'); }
  const { name: filterName } = filter;
  const filterTarget = filterName.replace('Filter#', '');
  const { name, loc, type, isScalarList, isObjectList } = argument;

  const target = schema[type];
  const isEnum = target && target.kind === 'enum';
  const isScalar = SCALAR_TYPES.includes(type);

  if (!isEnum && !isScalar || isScalarList || isObjectList) {
    return warning`Filter on ${filterTarget} defines an argument "${name}" with
               ~ a type that is not well supported by Relay at this time.
               ~ Filter arguments should be Int, Float, String, Boolean, ID
               ~ or Enum. ${loc}`;
  }
};
