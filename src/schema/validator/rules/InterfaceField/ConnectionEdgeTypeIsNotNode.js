/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const ConnectionEdgeTypeIsNotNode: Rule =
({ interface: inter, field, schema }) => {
  if (!inter || !field) { throw Error('context not passed to rule.'); }
  const { name: interfaceName } = inter;
  const { name, loc, edgeType, isNodeConnection, isObjectConnection,
          isScalarConnection } = field;

  const isConnectionField =
    isNodeConnection || isObjectConnection || isScalarConnection;
  const edgeTypeImplementsNode =
    edgeType && schema[edgeType] && schema[edgeType].kind === 'type' &&
    schema[edgeType].implementsNode;

  if (isConnectionField && edgeTypeImplementsNode) {
    return error`Field "${name}" on "${interfaceName}" interface defines a
               ~ connection with "${edgeType}" edge type that implements Node.
               ~ Edge types cannot implement Node. ${loc}`;
  }
};
