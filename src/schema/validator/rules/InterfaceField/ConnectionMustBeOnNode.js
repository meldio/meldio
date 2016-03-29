/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const ConnectionMustBeOnNode: Rule =
({ interface: inter, field }) => {
  if (!inter || !field) { throw Error('context not passed to rule.'); }
  const { name: interfaceName, everyTypeImplementsNode } = inter;
  const { name, loc, isNodeConnection, isObjectConnection,
          isScalarConnection } = field;

  const isConn = isNodeConnection || isObjectConnection || isScalarConnection;

  if (isConn && !everyTypeImplementsNode) {
    return error`Field "${name}" on "${interfaceName}" interface is defined as a
               ~ connection, but some types that implement "${interfaceName}"
               ~ interface do not implement Node. Connection fields can only be
               ~ defined on interfaces whose all implementations also implement
               ~ Node. ${loc}`;
  }
};
