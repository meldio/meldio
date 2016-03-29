/* @flow */

import type { InputValueDefinition } from '../language/ast';
// import { LIST_TYPE, INPUT_VALUE_DEFINITION } from '../language/kinds';
import { INPUT_VALUE_DEFINITION } from '../language/kinds';
import { makeName } from './makeName';
import { makeNamedType } from './makeNamedType';

export function makeListInput(
  name: string,
  typeName: string
): InputValueDefinition {
  return {
    kind: INPUT_VALUE_DEFINITION,
    name: makeName(name),
    type: {
      kind: 'ListType', // FIXME: bc flow 0.21 issue, should be LIST_TYPE
      type: makeNamedType(typeName)
    }
  };
}
