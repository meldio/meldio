/* @flow */

import { camelCase } from '../../../../jsutils/casing';
import { error, warning } from '../../utils';
import type { Rule } from '../../types';

export const RootConnectionValidArgument: Rule =
({ type, directive, rootQueryFieldNames }) => {
  if (!type || !directive) { throw Error('context not passed to rule.'); }
  const { name: typeName } = type;
  const { name, loc, arguments: args } = directive;

  if (name !== 'rootConnection') { return; }

  const goodArgs = [ 'field' ];
  const badArgs = args.filter(a => !goodArgs.includes(a.name));
  if (badArgs.length) {
    return error`Directive "@rootConnection" defined on "${typeName}"
               ~ type specifies an invalid argument(s):
               ~ ${badArgs.map(a => `"${a.name}"`).join(', ')}. ${loc}`;
  }
  const fieldArg = args.filter(a => a.name === 'field');
  if (fieldArg.length !== 1) {
    return error`Directive "@rootConnection" defined on "${typeName}"
               ~ type must have argument "field". ${loc}`;
  }

  const { type: fieldType, value: fieldValue } = fieldArg[0];
  const fieldValueStr = String(fieldValue);

  if (fieldType !== 'String' || !fieldValueStr) {
    return error`Directive "@rootConnection" defined on "${typeName}"
               ~ type must have argument "field" with a String
               ~ value. ${loc}`;
  }
  if (fieldValueStr !== camelCase(fieldValueStr)) {
    return warning`Directive "@rootConnection" defined on "${typeName}"
                 ~ type should specify field name in "camelCase",
                 ~ e.g. "${camelCase(fieldValueStr)}". ${loc}`;
  }

  const isFieldNameUniqueAtRoot = rootQueryFieldNames
    .filter(fieldName => fieldName === fieldValueStr)
    .length === 1;
  if (!isFieldNameUniqueAtRoot) {
    return error`Directive "@rootConnection" defined on "${typeName}"
               ~ type specifies field name "${fieldValueStr}", which
               ~ is not unique. ${loc}`;
  }
};
