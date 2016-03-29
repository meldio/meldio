/* @flow */

import type { InputValueDefinition, FieldDefinition} from '../language/ast';
import { FIELD_DEFINITION } from '../language/kinds';
import { makeName } from './makeName';
import { makeNamedType } from './makeNamedType';

export function makeField(
  name: string,
  arg: Array<InputValueDefinition>,
  typeName: string
): FieldDefinition {
  return {
    kind: FIELD_DEFINITION,
    name: makeName(name),
    arguments: arg,
    type: makeNamedType(typeName)
  };
}
