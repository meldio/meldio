/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const NoConnection: Rule = ({ mutation, field }) => {
  if (!mutation || !field) { throw Error('context not passed to rule.'); }
  const { name: mutationName } = mutation;
  const { name, loc,
          isNodeConnection, isObjectConnection, isScalarConnection } = field;

  if (isNodeConnection || isObjectConnection || isScalarConnection) {
    return error`Mutation "${mutationName}" declares field "${name}" as a
               ~ connection. Mutation fields cannot be connections, but could be
               ~ edges of a connection. ${loc}`;
  }
};
