/* @flow */

import { SCALAR_TYPES } from '../../../analyzer';
import { error } from '../../utils';
import type { Rule } from '../../types';

export const ConnectionKindIsValid: Rule = ({ order, schema }) => {
  if (!order) { throw Error('context not passed to rule.'); }
  const {
    name,
    loc,
    type,
    isScalarConnection,
    isObjectConnection,
    isNodeConnection,
  } = order;
  const target = name.replace('Order#', '');

  const related = schema[type];

  if (isScalarConnection &&
       !SCALAR_TYPES.includes(type) &&
       (!related || related.kind !== 'enum')) {
    return error`Order on ${target} refereces type "${type}" that is not
               ~ scalar. ${loc}`;
  }

  if (!related) { return; } // will be caught by TypeMustBeDefined rule

  if (isObjectConnection &&
       (related.kind !== 'type' || related.implementsNode) &&
       (related.kind !== 'interface' || related.everyTypeImplementsNode) &&
       (related.kind !== 'union' || related.everyTypeImplementsNode)) {
    return error`Order on ${target} refereces "${type}" which is invalid for
               ~ ObjectConnection. ${loc}`;
  }

  if (isNodeConnection &&
      (related.kind !== 'type' || !related.implementsNode) &&
      (related.kind !== 'interface' || !related.everyTypeImplementsNode) &&
      (related.kind !== 'union' || !related.everyTypeImplementsNode)) {
    return error`Order on ${target} refereces "${type}" which is invalid for
               ~ NodeConnection. ${loc}`;
  }
};
