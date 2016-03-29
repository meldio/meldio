/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const NoEdgeDefinition: Rule = ({ interface: inter, field }) => {
  if (!inter || !field) { throw Error('context not passed to rule.'); }
  const { name: interfaceName } = inter;
  const { name, loc, isEdge } = field;

  if (isEdge) {
    return error`Interface "${interfaceName}" defines a field "${name}" as
               ~ an edge, but edges could only be defined on mutation and
               ~ subscription fields. ${loc}`;
  }
};
