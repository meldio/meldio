/* @flow */

import type { ObjectTypeDefinition, FieldDefinition } from '../language/ast';
import { OBJECT_TYPE_DEFINITION } from '../language/kinds';
import { makeNamedType } from './makeNamedType';
import { makeName } from './makeName';

export function makeType(
  name: string,
  interfaceNames: Array<string>,
  fields: Array<FieldDefinition>
): ObjectTypeDefinition {
  return {
    kind: OBJECT_TYPE_DEFINITION,
    name: makeName(name),
    interfaces: interfaceNames.map(interfaceName =>
      makeNamedType(interfaceName)),
    fields
  };
}
