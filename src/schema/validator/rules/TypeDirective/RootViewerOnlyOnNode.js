/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const RootViewerOnlyOnNode: Rule = ({ type, directive }) => {
  if (!type || !directive) { throw Error('context not passed to rule.'); }
  const { name: typeName, implementsNode } = type;
  const { name, loc } = directive;

  if (name === 'rootViewer' && !implementsNode) {
    return error`Directive "@rootViewer" is defined on "${typeName}"
               ~ type which does not implement Node. @rootViewer directive
               ~ can only be specified on types that implement Node. ${loc}`;
  }
};
