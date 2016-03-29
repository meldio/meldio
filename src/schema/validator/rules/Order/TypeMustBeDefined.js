/* @flow */

import { SCALAR_TYPES } from '../../../analyzer';
import { error } from '../../utils';
import type { Rule } from '../../types';

export const TypeMustBeDefined: Rule = ({ order, schema }) => {
  if (!order) { throw Error('context not passed to rule.'); }
  const { name, loc, type } = order;
  const target = name.replace('Order#', '');

  const isDefined =
    SCALAR_TYPES.includes(type) ||
    schema[type] &&
    [ 'enum', 'interface', 'union', 'type' ].includes(schema[type].kind);

  if (!isDefined) {
    return error`Order on ${target} references "${type}", but no
               ~ such type is defined. Order must reference a valid type.
               ~ ${loc}`;
  }
};
