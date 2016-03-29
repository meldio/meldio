import invariant from '../../../jsutils/invariant';
import { Connection } from '../connection';

export function ConnectionField({
  schema,
  node,
  aggFieldDefinitions,
  filterInputObjectDefinition,
  orderInputObjectDefinition,
}) {
  const type = schema[node];
  invariant(type && type.kind === 'type', 'node must be passed to resolver');

  const InitialStages = () => [
    {
      $project: {
        _id: false,
        node: '$$ROOT',
        __encodedNodeType: {$substr: [ '$_id', 21, -1 ]}
      }
    },
    { $match: { node: { $ne: null } } },
  ];
  const collection = type.name;
  const kind = 'NodeConnection';

  return Connection({
    schema,
    kind,
    node,
    InitialStages,
    collection,
    aggFieldDefinitions,
    filterInputObjectDefinition,
    orderInputObjectDefinition });
}
