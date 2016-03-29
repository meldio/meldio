/* @flow */

import type { TypeDefinition } from '../../language/ast';

import { makeType } from '../../ast/makeType';
import { makeField } from '../../ast/makeField';
import { makeRequiredField } from '../../ast/makeRequiredField';

export function MakePageInfoType(): Array<TypeDefinition> {
  const fields = [
    makeRequiredField('hasPreviousPage', [ ], 'Boolean'),
    makeRequiredField('hasNextPage', [ ], 'Boolean'),
    makeField('startCursor', [ ], 'String'),
    makeField('endCursor', [ ], 'String')
  ];
  const interfaces = [];
  return [ makeType('PageInfo', interfaces, fields) ];
}
