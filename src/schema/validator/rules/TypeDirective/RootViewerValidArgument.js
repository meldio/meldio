/* @flow */

import { camelCase } from '../../../../jsutils/casing';
import { error, warning } from '../../utils';
import type { Rule } from '../../types';

export const RootViewerValidArgument: Rule =
({ type, directive, rootQueryFieldNames }) => {
  if (!type || !directive) { throw Error('context not passed to rule.'); }
  const { name: typeName } = type;
  const { name, loc, arguments: args } = directive;

  if (name !== 'rootViewer') { return; }

  if (args.length !== 1) {
    return error`Directive "@rootViewer" defined on "${typeName}"
               ~ type should have exactly one argument. ${loc}`;
  }
  const { name: argName, type: argType, value: argValue } = args[0];
  const argValueStr = String(argValue);

  const isFieldNameUniqueAtRoot = rootQueryFieldNames
    .filter(fieldName => fieldName === argValueStr)
    .length === 1;

  if (argName !== 'field' || argType !== 'String' || !argValue) {
    return error`Directive "@rootViewer" defined on "${typeName}"
               ~ type should have argument "field" with a String
               ~ value. ${loc}`;
  }
  if (argValue !== camelCase(String(argValue))) {
    return warning`Directive "@rootViewer" defined on "${typeName}"
                 ~ type should specify field name in "camelCase",
                 ~ e.g. "${camelCase(String(argValue))}". ${loc}`;
  }
  if (!isFieldNameUniqueAtRoot) {
    return error`Directive "@rootViewer" defined on "${typeName}"
               ~ type specifies field name "${argValue}", which
               ~ is not unique. ${loc}`;
  }
};
