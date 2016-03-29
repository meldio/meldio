/* @flow */

import type { TypeDefinition } from '../../language/ast';
import { makeEnum } from '../../ast';

export function MakeBasicEnums(): Array<TypeDefinition> {
  return [
    makeEnum('_NodeValue', [ 'value' ]),
    makeEnum('_NumericAggregate', [ 'SUM', 'COUNT', 'MIN', 'MAX', 'AVERAGE' ]),
    makeEnum('_Order', [ 'ASCENDING', 'DESCENDING' ])
  ];
}
