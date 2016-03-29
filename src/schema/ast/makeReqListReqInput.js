/* @flow */

import type { InputValueDefinition } from '../language/ast';
import {
// NON_NULL_TYPE,
// LIST_TYPE,
  INPUT_VALUE_DEFINITION,
} from '../language/kinds';
import { makeName } from './makeName';
import { makeNamedType } from './makeNamedType';

export function makeReqListReqInput(
  name: string,
  typeName: string
): InputValueDefinition {
  return {
    kind: INPUT_VALUE_DEFINITION,
    name: makeName(name),
    type: {
      kind: 'NonNullType', // FIXME: bc flow 0.21 issue, should be NON_NULL_TYPE
      type: {
        kind: 'ListType', // FIXME: bc flow 0.21 issue, should be LIST_TYPE,
        type: {
          kind: 'NonNullType', // FIXME: bc flow 0.21 issue, be NON_NULL_TYPE,
          type: makeNamedType(typeName)
        }
      }
    }
  };
}
