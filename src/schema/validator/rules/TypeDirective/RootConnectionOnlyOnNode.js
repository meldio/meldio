/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const RootConnectionOnlyOnNode: Rule = ({ type, directive }) => {
  if (!type || !directive) { throw Error('context not passed to rule.'); }
  const { name: typeName, implementsNode } = type;
  const { name, loc } = directive;

  if (name === 'rootConnection' && !implementsNode) {
    return error`Directive "@rootConnection" is defined on "${typeName}"
               ~ type which does not implement Node. @rootConnection directive
               ~ can only be specified on types that implement Node. ${loc}`;
  }
};
