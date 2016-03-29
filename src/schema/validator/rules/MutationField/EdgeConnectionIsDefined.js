/* @flow */

import { error } from '../../utils.js';
import type { Rule } from '../../types';

export const EdgeConnectionIsDefined: Rule =
({ mutation, field, connections }) => {
  if (!mutation || !field) { throw Error('context not passed to rule.'); }
  const { name: mutationName } = mutation;
  const { name, loc, type, edgeType, isEdge } = field;

  const isConnectionDefined =
    connections.some(conn =>
      conn.type === type && (!edgeType || edgeType === conn.edgeType));

  if (isEdge && !isConnectionDefined) {
    return error`Field "${name}" on "${mutationName}" mutation defines an edge
              ~ with "${type}" type and "${edgeType}" edge type.
              ~ However a connection field with these properties has not been
              ~ defined elsewhere. ${loc}`;
  }
};
