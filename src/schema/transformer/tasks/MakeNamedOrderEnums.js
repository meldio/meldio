/* @flow */

import type { TransformerAccumulator, TransformerContext } from '../types';
import type { TypeDefinition } from '../../language/ast';

import { makeEnum } from '../../ast';

export function MakeNamedOrderEnums(
  accumulator: TransformerAccumulator,
  context: TransformerContext
): Array<TypeDefinition> {
  const { schema } = context;

  return Object.keys(schema)
    .map(key => schema[key])
    .filter(type =>
      type.kind === 'order' &&
      type.expressions.length)
    .map(order =>
      makeEnum(
        order.isNodeList || order.isScalarList || order.isObjectList ?
          `_${order.type || ''}_ListOrderKeys` :
          `_${order.type || ''}_${order.edgeType || ''}_ConnectionOrderKeys`,
        (order.expressions || []).map(c => c.key))
    );
}
