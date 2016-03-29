/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const RootPluralIdOnlyOnNode: Rule = ({ type, field, directive }) => {
  if (!type || !field || !directive) {
    throw Error('context not passed to rule.');
  }

  const { name: typeName, implementsNode } = type;
  const { name, loc } = directive;

  if (name === 'rootPluralId' && !implementsNode) {
    return error`Directive @rootPluralId cannot be defined on "${typeName}" type
               ~ because "${typeName}" does not implement Node. ${loc}`;
  }
};
