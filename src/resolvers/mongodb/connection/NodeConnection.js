import invariant from '../../../jsutils/invariant';
import { Connection } from './Connection';
import { EDGE_COLLECTION } from '../common';

export function NodeConnection({
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

  const typeNames = type.kind === 'type' ? [ type.name ] :
    type.kind === 'union' ? type.typeNames :
    type.kind === 'interface' ? type.implementations : [ ];
  invariant(typeNames.length, 'union or interface must have implementations');

  const InitialStages = id => [
    {
      $match: {
        $or: [
          { nodeId: id, nodeField: field },
          { relatedId: id, relatedField: field }
        ]
      }
    },
    {
      $project: {
        edgeProps: true,
        joinId: {$cond: {
          if: { $eq: [ '$nodeId', id ] },
          then: '$relatedId',
          else: '$nodeId' } },
        __encodedNodeType: {$substr: [
          {$cond: {
            if: { $eq: [ '$nodeId', id ] },
            then: '$relatedId',
            else: '$nodeId' } },
          21,
          -1
        ]},
      }
    },
    ...typeNames.map(typeName => ({
      $lookup: {
        from: typeName,
        localField: 'joinId',
        foreignField: '_id',
        as: typeName
      }})
    ),
    {
      $project: {
        _id: false,
        edgeProps: true,
        __nodeType: true,
        node: {
          $arrayElemAt: [ { $concatArrays: typeNames.map(tn => '$' + tn) }, 0 ]
        }
      }
    },
    {
      $match: { node: { $ne: null } }
    }
  ];
  const collection = EDGE_COLLECTION;
  const kind = 'NodeConnection';

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
