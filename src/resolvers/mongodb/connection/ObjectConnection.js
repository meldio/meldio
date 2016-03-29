import invariant from '../../../jsutils/invariant';
import { Connection } from './Connection';
import { EDGE_COLLECTION } from '../common';

export function ObjectConnection({
  schema,
  node,
  edge,
  field,
  aggFieldDefinitions,
  filterInputObjectDefinition,
  orderInputObjectDefinition,
}) {
  const type = schema[node];
  invariant(type, 'node must be passed to resolver');

  const InitialStages = id => [
    { $match: { nodeId: id, nodeField: field }},
    {
      $project: {
        _id: false,
        edgeProps: true,
        node: '$relatedObject',
      }
    }
  ];
  const collection = EDGE_COLLECTION;
  const kind = 'ObjectConnection';

  return Connection({
    schema,
    kind,
    node,
    edge,
    InitialStages,
    collection,
    aggFieldDefinitions,
    filterInputObjectDefinition,
    orderInputObjectDefinition });
}
