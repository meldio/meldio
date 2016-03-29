/* @flow */

import type { TransformerAccumulator, TransformerContext} from '../types';
import type { TypeDefinition } from '../../language/ast';

import { makeInput, makeInputObject } from '../../ast';
import { SCALAR_TYPES } from '../../analyzer';

export function MakeOrderInputTypes(
  accumulator: TransformerAccumulator,
  context: TransformerContext
): Array<TypeDefinition> {
  const { schema, connections, lists } = context;
  const orders = { };

  const hasScalarFields = typeName => {
    const type = schema[typeName];
    return type &&
      (type.kind === 'type' || type.kind === 'interface') &&
      type.fields.some(f => f.isScalar);
  };

  const makeFieldOrders = fields => {
    return fields
      .filter(field => field.isScalar)
      .map(field => makeInput(field.name, `_Order`));
  };

  const makeTypeOrder = typeName => {
    if (orders[typeName] ||
        SCALAR_TYPES.includes(typeName) ||
        schema[typeName] && schema[typeName].kind === 'enum') {
      return;
    }

    if (schema[typeName] && schema[typeName].kind === 'union') {
      const isNode = schema[typeName].everyTypeImplementsNode;

      orders[typeName] =
        makeInputObject(`_${typeName}_Order`, [
          ...isNode ?
            [ makeInput('id', `_Order`) ] :
            [ ],
          // makeInput('type', `_Order`)
        ]);
    } else if (schema[typeName] && schema[typeName].kind === 'interface') {
      const isNode = schema[typeName].everyTypeImplementsNode;
      const fields = schema[typeName].fields;

      orders[typeName] =
        makeInputObject(`_${typeName}_Order`, [
          ...isNode && !fields.some(f => f.name === 'id') ?
            [ makeInput('id', `_Order`) ] :
            [ ],
          // makeInput('type', `_Order`),
          ...makeFieldOrders(fields)
        ]);
    } else if (schema[typeName] && schema[typeName].kind === 'type') {
      const fields = schema[typeName].fields;

      orders[typeName] =
        makeInputObject(`_${typeName}_Order`, makeFieldOrders(fields));
    }
  };

  const makeEdgeOrder = (kind, typeName, edgeTypeName) => {
    const edgeType = schema[edgeTypeName];

    return makeInputObject(`_${typeName}_${edgeTypeName}_EdgeOrder`, [
      ...edgeType && edgeType.fields ?
        makeFieldOrders(edgeType.fields) :
        [ ],
      ...kind === 'ScalarConnection' ?
           [ makeInput('node', `_Order`) ] :
         kind === 'NodeConnection' ?
           [ makeInput('node', `_${typeName}_Order`) ] :
         kind === 'ObjectConnection' && hasScalarFields(typeName) ?
           [ makeInput('node', `_${typeName}_Order`) ] :
           [ ]
    ]);
  };

  lists
    .filter(list =>
      list.kind === 'NodeList' ||
      list.kind === 'ObjectList' && hasScalarFields(list.type)
    )
    .forEach(list => {
      if (!orders[list.type]) {
        makeTypeOrder(list.type);
      }
    });

  connections
    .filter(connection =>
      connection.kind === 'NodeConnection' ||
      connection.kind === 'ObjectConnection' && hasScalarFields(connection.type)
    )
    .forEach(connection => {
      if (!orders[connection.type]) {
        makeTypeOrder(connection.type);
      }
    });

  const edgeOrders = connections
    .filter(connection =>
      connection.kind !== 'ObjectConnection' ||
      hasScalarFields(connection.type) ||
      hasScalarFields(connection.edgeType))
    .map(connection =>
      makeEdgeOrder(connection.kind, connection.type, connection.edgeType) );

  return [
    ...edgeOrders,
    ...Object.keys(orders).map(key => orders[key]),
  ];
}
