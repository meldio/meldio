/* @flow */

import type { InputValueDefinition, FieldDefinition } from '../language/ast';

import {
//  NON_NULL_TYPE,
//  LIST_TYPE,
  FIELD_DEFINITION,
} from '../language/kinds';

import { makeName } from './makeName';
import { makeNamedType } from './makeNamedType';

export function makeRequiredListField(
  name: string,
  arg: Array<InputValueDefinition>,
  typeName: string
): FieldDefinition {
  return {
    kind: FIELD_DEFINITION,
    name: makeName(name),
    arguments: arg,
    type: {
      kind: 'NonNullType', // FIXME: bc flow 0.21 issue, should be NON_NULL_TYPE
      type: {
        kind: 'ListType', // FIXME: bc flow 0.21 issue, should be LIST_TYPE,
        type: makeNamedType(typeName)
      }
    }
  };
}
