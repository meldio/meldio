/* @flow */

import type { EnumTypeDefinition } from '../language/ast';
import { ENUM_TYPE_DEFINITION, ENUM_VALUE_DEFINITION } from '../language/kinds';
import { makeName } from './makeName';

export function makeEnum(
  name: string,
  options: Array<string>
): EnumTypeDefinition {
  return {
    kind: ENUM_TYPE_DEFINITION,
    name: makeName(name),
    values: options.map(option => ({
      kind: ENUM_VALUE_DEFINITION,
      name: makeName(option)
    }))
  };
}
