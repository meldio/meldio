/* @flow */

import type { InterfaceTypeDefinition, FieldDefinition } from '../language/ast';
import { INTERFACE_TYPE_DEFINITION } from '../language/kinds';
import { makeName } from './makeName';

export function makeInterface(
  name: string,
  fields: Array<FieldDefinition>
): InterfaceTypeDefinition {
  return {
    kind: INTERFACE_TYPE_DEFINITION,
    name: makeName(name),
    fields
  };
}
