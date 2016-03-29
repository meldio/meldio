/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const OnlyAllowedDirectives: Rule = ({ type, field, directive }) => {
  if (!type || !field || !directive) {
    throw Error('context not passed to rule.');
  }

  const { name: typeName } = type;
  const { name: fieldName } = field;
  const { name, loc } = directive;

  if (![ 'rootPluralId', 'resolver' ].includes(name)) {
    return error`Field "${fieldName}" of "${typeName}" type cannot have
               ~ "@${name}" directive, that is currently unsupported. ${loc}`;
  }
};
