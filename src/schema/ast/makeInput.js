/* @flow */

import type { InputValueDefinition } from '../language/ast';
import { INPUT_VALUE_DEFINITION } from '../language/kinds';
import { makeName } from './makeName';
import { makeNamedType } from './makeNamedType';

export function makeInput(
  name: string,
  typeName: string
): InputValueDefinition {
  return {
    kind: INPUT_VALUE_DEFINITION,
    name: makeName(name),
    type: makeNamedType(typeName)
  };
}
