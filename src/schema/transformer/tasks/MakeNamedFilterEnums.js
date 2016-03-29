/* @flow */

import type { TransformerAccumulator, TransformerContext } from '../types';
import type { TypeDefinition } from '../../language/ast';

import { makeEnum } from '../../ast';

export function MakeNamedFilterEnums(
  accumulator: TransformerAccumulator,
  context: TransformerContext
): Array<TypeDefinition> {
  const { schema } = context;

  return Object.keys(schema)
    .map(key => schema[key])
    .filter(type =>
      type.kind === 'filter' &&
      type.conditions.length)
    .map(filter =>
      makeEnum(
        filter.isNodeList || filter.isScalarList || filter.isObjectList ?
          `_${filter.type || ''}_ListFilterKeys` :
          `_${filter.type || ''}_${filter.edgeType || ''}_ConnectionFilterKeys`,
        (filter.conditions || []).map(c => c.key))
    );
}
