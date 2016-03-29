/* @flow */

import type { TransformerAccumulator, TransformerContext} from '../types';
import type { ConnectionDefinition } from '../../analyzer';
import type { TypeDefinition } from '../../language/ast';

import {
  makeField, makeListField, makeRequiredField, makeInput, makeType,
} from '../../ast';

import { getEdgeName, NUMERIC_TYPES } from '../../analyzer';

export function MakeConnectionTypes(
  accumulator: TransformerAccumulator,
  context: TransformerContext
): Array<TypeDefinition> {
  const empty: Array<TypeDefinition> = [ ];
  return context.connections
    .map(connection => [
      makeConnectionType(connection, accumulator, context),
      makeEdgeType(connection, accumulator, context),
    ])
    .reduce( (acc, defs) => [ ...acc, ...defs ], empty);
}

function makeConnectionType(
  connection: ConnectionDefinition,
  accumulator: TransformerAccumulator,
  context: TransformerContext
): TypeDefinition {
  const { schema } = context;

  const hasNumericFields = typeName =>
    schema[typeName] && schema[typeName].fields &&
    schema[typeName].fields.some(field => field.isNumeric);

  const { kind, name, edgeType, type } = connection;

  const edgeHasNumericFields = hasNumericFields(edgeType);
  const nodeHasNumericFields = hasNumericFields(type);

  const filterName =
    `Filter#${kind}(${type}${edgeType ? `, ${edgeType}` : ''})`;
  const filter = schema[filterName];

  const edgeFilterName = `_${type}_${edgeType}_EdgeFilter`;

  const countFieldArgs = [
    makeInput('filterBy', edgeFilterName),
    ...filter ? [
      makeInput('filter', `_${type}_${edgeType}_ConnectionFilterKeys`),
      ...(accumulator.filterArguments[filterName] || [ ])
    ] : [ ]
  ];

  const countField = makeField('count', countFieldArgs, 'Int');

  const aggregationSelectorArgs = [
    ...edgeHasNumericFields ?
      [ makeInput('edges', `_${edgeType}_NumericFields`) ] :
      [ ],
    ...nodeHasNumericFields ?           // type or interface connection
      [ makeInput('node', `_${type}_NumericFields`) ] :
      [ ],
    ...NUMERIC_TYPES.includes(type) ?   // scalar connection
      [ makeInput('node', `_NodeValue`) ] :
      [ ]
  ];

  const aggregationFields =
    aggregationSelectorArgs.length ?
      [
        makeField('sum', aggregationSelectorArgs, 'Float'),
        makeField('average', aggregationSelectorArgs, 'Float'),
        makeField('min', aggregationSelectorArgs, 'Float'),
        makeField('max', aggregationSelectorArgs, 'Float')
      ] :
      [ ];

  const fields = [
    makeListField('edges', [ ], getEdgeName(type, edgeType)),
    makeRequiredField('pageInfo', [ ], 'PageInfo'),
    countField,
    ...aggregationFields
  ];

  return makeType(name, [ ], fields);
}

function makeEdgeType(
  connection: ConnectionDefinition,
  accumulator: TransformerAccumulator,
): TypeDefinition {
  const { edgeType: edgeTypeName, type: typeName } = connection;
  const edgeTypeFields = accumulator.edgeTypeFields[edgeTypeName];

  const fields = [
    makeField('node', [ ], typeName),
    makeField('cursor', [ ], 'String'),
    ...edgeTypeName && edgeTypeFields ?
      edgeTypeFields :
      [ ]
  ];

  return makeType(getEdgeName(typeName, edgeTypeName), [ ], fields);
}
