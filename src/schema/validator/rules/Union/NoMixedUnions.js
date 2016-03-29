/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const NoMixedUnions: Rule = ({ union }) => {
  if (!union) { throw Error('context not passed to rule.'); }
  const { name, loc, everyTypeImplementsNode, noTypeImplementsNode } = union;

  if (!everyTypeImplementsNode && !noTypeImplementsNode) {
    return error`Union "${name}" member types must either all implement Node
               | interface or none can implement Node interface.
               | You cannot mix the two together. ${loc}`;
  }
};
