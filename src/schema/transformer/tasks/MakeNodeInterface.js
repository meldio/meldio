/* @flow */

import type { TypeDefinition } from '../../language/ast';

import { makeInterface, makeRequiredField } from '../../ast';

export function MakeNodeInterface(): Array<TypeDefinition> {
  const fields = [ makeRequiredField('id', [ ], 'ID') ];
  return [ makeInterface('Node', fields) ];
}
