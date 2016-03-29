/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const ConnectionEdgeTypeIsDefined: Rule = ({ type, field, schema }) => {
  if (!type || !field) { throw Error('context not passed to rule.'); }
  const { name: typeName } = type;
  const { name, loc, isNodeConnection, isObjectConnection, isScalarConnection,
          edgeType } = field;

  const isConnectionField =
    isNodeConnection || isObjectConnection || isScalarConnection;
  const edgeTypeIsNotDefined =
    edgeType && (!schema[edgeType] || schema[edgeType].kind !== 'type');

  if (isConnectionField && edgeTypeIsNotDefined) {
    return error`Field "${name}" on "${typeName}" type defines a
               ~ connection with "${edgeType}" edge type that is undefined.
               ~ Edges must be defined as types and cannot implement Node
               ~ interface. ${loc}`;
  }
};
