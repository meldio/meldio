/* @flow */

import type { TransformerAccumulator, TransformerContext } from '../../types';
import type { VisitorMap } from '../../../analyzer';
import invariant from '../../../../jsutils/invariant';

import {
  makeInput,
  makeListReqInput
} from '../../../ast';
import { NUMERIC_TYPES } from '../../../analyzer';

export function AddArgsToListsAndConnections(
  accumulator: TransformerAccumulator,
  context: TransformerContext
): VisitorMap {
  return {
    InterfaceTypeDefinition: nodeAST => {
      const filterArguments = accumulator.filterArguments;
      const typeName = nodeAST.name.value;
      const fields = nodeAST.fields;
      const parent = context.schema[typeName];
      invariant(parent, `Metadata is missing for interface ${typeName}.`);

      return {
        ...nodeAST,
        fields: addArgsToFields(fields, {...context, parent, filterArguments})
      };
    },

    ObjectTypeDefinition: nodeAST => {
      const filterArguments = accumulator.filterArguments;
      const typeName = nodeAST.name.value;
      const fields = nodeAST.fields;
      const parent = context.schema[typeName];
      invariant(parent, `Metadata is missing for type ${typeName}.`);

      // if this is an edge of a connection, add fields to accumulator:
      if (context.connections.some(c => c.edgeType === typeName)) {
        accumulator.edgeTypeFields[typeName] = fields;
      }

      return {
        ...nodeAST,
        fields: addArgsToFields(fields, {...context, parent, filterArguments})
      };
    }
  };
}

function addArgsToFields(fieldASTs, context) {
  const { parent, schema, filterArguments } = context;

  return fieldASTs.map(fieldAST => {
    const name = fieldAST.name.value;
    const field = parent.fields.filter(f => f.name === name)[0];
    invariant(field, `Metadata is missing for field ${name} in ${parent.name}`);

    const edgeTypeSlug = field.edgeType ? ', ' + field.edgeType : '';
    const filterName =
      field.isNodeList || field.isObjectList || field.isScalarList ?
        `Filter#[${field.type}]` :
      field.isNodeConnection ?
        `Filter#NodeConnection(${field.type}${edgeTypeSlug})` :
      field.isObjectConnection ?
        `Filter#ObjectConnection(${field.type}${edgeTypeSlug})` :
      field.isScalarConnection ?
        `Filter#ScalarConnection(${field.type}${edgeTypeSlug})` :
      '#undefined#';
    const filter = schema[filterName];

    const orderName =
      field.isNodeList || field.isObjectList ?
        `Order#[${field.type}]` :
      field.isNodeConnection ?
        `Order#NodeConnection(${field.type}${edgeTypeSlug})` :
      field.isObjectConnection ?
        `Order#ObjectConnection(${field.type}${edgeTypeSlug})` :
      field.isScalarConnection ?
        `Order#ScalarConnection(${field.type}${edgeTypeSlug})` :
      '#undefined#';
    const order = schema[orderName];

    const typeName = field.type;
    const type = schema[typeName];
    const edgeTypeName = field.edgeType || '';
    const edgeType = schema[field.edgeType];
    const edgeHasScalarFields =
      edgeType && edgeType.fields && edgeType.fields.some(f => f.isScalar);
    const nodeHasScalarFields =
      type && type.fields && type.fields.some(f => f.isScalar);
    const hasScalarFields = edgeHasScalarFields || nodeHasScalarFields;
    const isList = field.isNodeList || field.isObjectList || field.isScalarList;
    const isConnection = field.isNodeConnection ||
                         field.isObjectConnection ||
                         field.isScalarConnection;

    const pagingArguments =
      isList ? [
        makeInput('first', 'Int'),
        makeInput('last', 'Int') ] :
      isConnection ? [
        makeInput('first', 'Int'),
        makeInput('last', 'Int'),
        makeInput('after', 'String'),
        makeInput('before', 'String') ] :
        [ ];

    const filterArgument =
      filter && filter.kind === 'filter' && filter.conditions.length ?
        [
          makeInput('filter',
            isList ?
              `_${typeName}_ListFilterKeys` :
              `_${typeName}_${edgeTypeName}_ConnectionFilterKeys`),
          ...(filterArguments[filterName] || [ ])
        ] :
        [ ];

    const filterByArgument =
      isList ?
        [ makeInput('filterBy', `_${typeName}_Filter`) ] :
      isConnection ?
        [ makeInput('filterBy', `_${typeName}_${edgeTypeName}_EdgeFilter`) ] :
        [ ];

    const orderArgument =
      order && order.kind === 'order' && order.expressions.length ? [
        makeInput('order',
          isList ?
            `_${typeName}_ListOrderKeys` :
            `_${typeName}_${edgeTypeName}_ConnectionOrderKeys`) ] :
        [ ];

    const orderByArgument =
      field.isScalarList ?
        [ makeInput('orderBy', `_Order`) ] :
      field.isNodeList || field.isObjectList && hasScalarFields ?
        [ makeListReqInput('orderBy', `_${typeName}_Order`) ] :
      field.isScalarConnection && !edgeHasScalarFields ?
        [ makeInput('orderBy', `_${typeName}_${edgeTypeName}_EdgeOrder`) ] :
      field.isScalarConnection && edgeHasScalarFields ||
      field.isNodeConnection ||
      field.isObjectConnection && hasScalarFields ?
        [
          makeListReqInput('orderBy', `_${typeName}_${edgeTypeName}_EdgeOrder`)
        ] :
        [ ];

    const aggregationArgument =
      field.isScalarList && NUMERIC_TYPES.includes(typeName) ?
        [ makeInput('aggregate', '_NumericAggregate') ] :
        [ ];

    return {
      ...fieldAST,
      arguments: [
        ...pagingArguments,
        ...filterByArgument,
        ...filterArgument,
        ...orderByArgument,
        ...orderArgument,
        ...aggregationArgument,
      ]
    };
  });
}
