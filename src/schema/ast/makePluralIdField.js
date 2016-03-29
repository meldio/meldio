/* @flow */

import type { FieldDefinition } from '../language/ast';
import { camelCase } from '../../jsutils/casing';
import { makeRequiredListField } from './makeRequiredListField';
import { makeReqListReqInput } from './makeReqListReqInput';

export function makePluralIdField(
  fieldName: string,
  fieldTypeName?: string,
  inputFieldName?: string,
  inputFieldTypeName?: string
): FieldDefinition {
  return makeRequiredListField(
    fieldTypeName ? fieldName : camelCase(fieldName),
    [ makeReqListReqInput(
        inputFieldName || 'id',
        inputFieldTypeName || 'ID') ],
    fieldTypeName || fieldName);
}
