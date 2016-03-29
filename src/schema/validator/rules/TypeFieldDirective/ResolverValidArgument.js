/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const ResolverValidArgument: Rule = ({ type, field, directive }) => {
  if (!type || !field || !directive) {
    throw Error('context not passed to rule.');
  }

  const { name: typeName } = type;
  const { name: fieldName } = field;
  const { name, loc, arguments: args } = directive;

  if (name === 'resolver') {
    if (args.length !== 1) {
      return error`Directive @resolver defined on "${fieldName}" of
                 ~ "${typeName}" type should have exactly one argument. ${loc}`;
    }

    const {
      name: argName,
      type: argType,
      value: argValue
    } = args[0];

    if (argName !== 'function' || argType !== 'String' || !argValue) {
      return error`Directive @resolver defined on "${fieldName}" of
                 ~ "${typeName}" type should have argument "function" with a
                 ~ String value. ${loc}`;
    }
  }
};
