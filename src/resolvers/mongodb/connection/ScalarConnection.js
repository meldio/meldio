import invariant from '../../../jsutils/invariant';
import { Connection } from './Connection';
import { EDGE_COLLECTION } from '../common';

export function ScalarConnection({
  schema,
  node,
  edge,
  field,
  aggFieldDefinitions,
  filterInputObjectDefinition,
  orderInputObjectDefinition,
}) {
  invariant(node, 'node must be passed to resolver');

  const InitialStages = id => [
    { $match: { nodeId: id, nodeField: field }},
    {
      $project: {
        _id: false,
        edgeProps: true,
        node: '$relatedValue',
      }
    }
  ];
  const collection = EDGE_COLLECTION;
  const kind = 'ScalarConnection';

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
