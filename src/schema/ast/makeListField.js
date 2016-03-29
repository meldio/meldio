/* @flow */

import type { InputValueDefinition, FieldDefinition } from '../language/ast';
// import { LIST_TYPE, FIELD_DEFINITION } from '../language/kinds';
import { FIELD_DEFINITION } from '../language/kinds';
import { makeName } from './makeName';
import { makeNamedType } from './makeNamedType';

export function makeListField(
  name: string,
  arg: Array<InputValueDefinition>,
  typeName: string
): FieldDefinition {
  return {
    kind: FIELD_DEFINITION,
    name: makeName(name),
    arguments: arg,
    type: {
      kind: 'ListType', // FIXME: bc flow 0.21 issue, should be LIST_TYPE,
      type: makeNamedType(typeName)
    }
  };
}
