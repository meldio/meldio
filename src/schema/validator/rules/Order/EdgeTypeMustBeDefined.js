/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const EdgeTypeMustBeDefined: Rule = ({ order, schema }) => {
  if (!order) { throw Error('context not passed to rule.'); }
  const { name, loc, edgeType } = order;
  const target = name.replace('Order#', '');

  const isValid =
    !edgeType ||
    schema[edgeType] &&
    schema[edgeType].kind === 'type' &&
    !schema[edgeType].implementsNode;

  if (!isValid) {
    return error`Order on ${target} references "${edgeType}" edge type, but
               ~ type is either undefined or invalid. Edge type must be defined
               ~ and can not implement Node interface. ${loc}`;
  }
};
