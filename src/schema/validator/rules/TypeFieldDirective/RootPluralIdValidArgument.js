/* @flow */

import { camelCase } from '../../../../jsutils/casing';
import { warning, error } from '../../utils';
import type { Rule } from '../../types';

export const RootPluralIdValidArgument: Rule =
({ type, field, directive, rootQueryFieldNames }) => {
  if (!type || !field || !directive) {
    throw Error('context not passed to rule.');
  }

  const { name: typeName } = type;
  const { name: fieldName } = field;
  const { name, loc, arguments: args } = directive;

  if (name === 'rootPluralId') {
    if (args.length !== 1) {
      return error`Directive @rootPluralId defined on "${fieldName}" of
                 ~ "${typeName}" type should have exactly one argument. ${loc}`;
    }

    const {
      name: argName,
      type: argType,
      value: argValue
    } = args[0];

    if (argName !== 'field' || argType !== 'String' || !argValue) {
      return error`Directive @rootPluralId defined on "${fieldName}" of
                 ~ "${typeName}" type should have argument "field" with
                 ~ a String value. ${loc}`;
    }

    if (argValue !== camelCase(String(argValue))) {
      return warning`Directive @rootPluralId defined on "${fieldName}" of
                   ~ "${typeName}" type should specify field name in
                   ~ "camelCase", e.g. ${camelCase(String(argValue))}. ${loc}`;
    }

    const isNameUniqueAtRoot = rootQueryFieldNames
      .filter(f => f === argValue)
      .length === 1;

    if (!isNameUniqueAtRoot) {
      return error`Directive @rootPluralId defined on "${fieldName}" of
                   ~ "${typeName}" type specifies field name "${argValue}",
                   ~ which is not unique. ${loc}`;
    }
  }
};
