/* @flow */

import type {
  InputValueDefinition, InputObjectTypeDefinition,
} from '../language/ast';
import { INPUT_OBJECT_TYPE_DEFINITION } from '../language/kinds';
import { makeName } from './makeName';

export function makeInputObject(
  name: string,
  fields: Array<InputValueDefinition>
): InputObjectTypeDefinition {
  return {
    kind: INPUT_OBJECT_TYPE_DEFINITION,
    name: makeName(name),
    fields
  };
}
