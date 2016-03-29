/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const EdgeTypeMustBeDefined: Rule = ({ filter, schema }) => {
  if (!filter) { throw Error('context not passed to rule.'); }
  const { name, loc, edgeType } = filter;
  const target = name.replace('Filter#', '');

  const isValid =
    !edgeType ||
    schema[edgeType] &&
    schema[edgeType].kind === 'type' &&
    !schema[edgeType].implementsNode;

  if (!isValid) {
    return error`Filter on ${target} references "${edgeType}" edge type, but
               ~ type is either undefined or invalid. Edge type must be defined
               ~ and can not implement Node interface. ${loc}`;
  }
};
