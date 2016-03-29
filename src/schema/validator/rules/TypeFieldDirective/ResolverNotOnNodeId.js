/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const ResolverNotOnNodeId: Rule = ({ type, field, directive }) => {
  if (!type || !field || !directive) {
    throw Error('context not passed to rule.');
  }

  const { name: typeName, implementsNode } = type;
  const { name: fieldName } = field;
  const { name, loc } = directive;

  if (name === 'resolver' && fieldName === 'id' && implementsNode) {
    return error`Directive @resolver cannot be defined on id field of
               | ${typeName} type. Types that implement Node interface cannot
               | have @resolver directive defined on their id field. ${loc}`;
  }
};
