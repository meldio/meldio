/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const ObjectConnectionTypeIsValid: Rule = ({type: t, field, schema}) => {
  if (!t || !field) { throw Error('context not passed to rule.'); }
  const { name: typeName } = t;
  const { name, loc, isObjectConnection, type } = field;

  const related = schema[type];

  if (isObjectConnection &&
      (!related || related.kind !== 'type' || related.implementsNode) &&
      (!related || related.kind !== 'interface' ||
        related.everyTypeImplementsNode) &&
      (!related || related.kind !== 'union' ||
        related.everyTypeImplementsNode)) {
    return error`Field "${name}" on "${typeName}" type defines an
               ~ ObjectConnection with an invalid type.  ObjectConnection can
               ~ link to a type that does not implement Node, interface with no
               ~ implementation that also implements Node or union with no
               ~ members that implement Node. If you are looking to make a
               ~ connection to a Node type, use NodeConnection instead. ${loc}`;
  }
};
