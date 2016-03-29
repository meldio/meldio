/* @flow */
import type { ResolverContext } from '../../types';
import { SCALAR_TYPES } from '../../../schema/analyzer';
import { Filters } from '../common/Filters';

type FilterExpression = any;
type MongoMatchExpression = any;
type Filter = (filter: FilterExpression) => MongoMatchExpression;

const hasEdgeFilter = filter =>
  Object.keys(filter)
    .filter(key => key !== 'node')
    .length !== 0;

export function ConnectionFilter(context: ResolverContext): Filter {
  const { schema, edge, node } = context;

  const {
    objectFilter,
    fieldFilter,
  } = Filters({ schema });

  const nodeIsScalar =
    SCALAR_TYPES.includes(node) ||
    schema[node] && schema[node].kind === 'enum';

  if (nodeIsScalar) {
    return function (filter) {
      return {
        $and: [
          ...filter.node ?
            fieldFilter(filter.node, { isScalar: true, name: 'node' }, '') :
            [ ],
          ...hasEdgeFilter(filter) ?
            objectFilter(filter, edge, 'edgeProps') :
            [ ],
          { }
        ]
      };
    };
  }
  return function (filter) {
    return {
      $and: [
        ...filter.node ?
          objectFilter(filter.node, node, 'node') :
          [ ],
        ...hasEdgeFilter(filter) ?
          objectFilter(filter, edge, 'edgeProps') :
          [ ],
        { }
      ]
    };
  };
}
