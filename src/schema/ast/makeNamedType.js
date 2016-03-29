/* @flow */

import type { NamedType } from '../language/ast';
import { NAMED_TYPE } from '../language/kinds';
import { makeName } from './makeName';

export function makeNamedType(typeName: string): NamedType {
  return {
    kind: NAMED_TYPE,
    name: makeName(typeName)
  };
}
