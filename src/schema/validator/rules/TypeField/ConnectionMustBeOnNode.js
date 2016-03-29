/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const ConnectionMustBeOnNode: Rule = ({ type, field }) => {
  if (!type || !field) { throw Error('context not passed to rule.'); }
  const { name: typeName, implementsNode } = type;
  const { name, loc, isNodeConnection, isObjectConnection,
          isScalarConnection } = field;

  const isConn = isNodeConnection || isObjectConnection || isScalarConnection;

  if (isConn && !implementsNode) {
    return error`Field "${name}" on "${typeName}" type is defined as a
               ~ connection, but ${typeName} type does not implement Node
               ~ interface. Connection fields can only be defined on types
               ~ that implement Node. ${loc}`;
  }
};
