/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const NoEdgeDefinition: Rule = ({ type, field }) => {
  if (!type || !field) { throw Error('context not passed to rule.'); }
  const { name: typeName } = type;
  const { name, loc, isEdge } = field;

  if (isEdge) {
    return error`Type "${typeName}" defines a field "${name}" as
               ~ an edge, but edges could only be defined on mutation and
               ~ subscription fields. ${loc}`;
  }
};
