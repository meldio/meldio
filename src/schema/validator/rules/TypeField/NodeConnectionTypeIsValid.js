/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const NodeConnectionTypeIsValid: Rule = ({ type: t, field, schema }) => {
  if (!t || !field) { throw Error('context not passed to rule.'); }
  const { name: typeName } = t;
  const { name, loc, isNodeConnection, type } = field;

  const related = schema[type];

  if (isNodeConnection &&
      (!related || related.kind !== 'type' || !related.implementsNode) &&
      (!related || related.kind !== 'interface' ||
        !related.everyTypeImplementsNode) &&
      (!related || related.kind !== 'union' ||
        !related.everyTypeImplementsNode)) {
    return error`Field "${name}" on "${typeName}" type defines a
               ~ NodeConnection with an invalid type.  NodeConnection can link
               ~ to a type that implements Node, interface with implementations
               ~ that all implement Node or union with members that all
               ~ implement Node. ${loc}`;
  }
};
