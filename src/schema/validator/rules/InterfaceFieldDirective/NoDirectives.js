/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const NoDirectives: Rule =
({ interface: inter, field, directive }) => {
  if (!inter || !field || !directive) {
    throw Error('context not passed to rule.');
  }

  const { name: interfaceName } = inter;
  const { name: fieldName } = field;
  const { name, loc } = directive;

  return error`Field "${fieldName}" of "${interfaceName}" interface cannot
             ~ have "@${name}" directive, that is currently unsupported.
             ~ ${loc}`;
};
