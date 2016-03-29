/* @flow */

import type { TransformerAccumulator, TransformerContext } from '../types';
import type { TypeDefinition } from '../../language/ast';

import {
  makeType,
  makeField,
  makeRequiredInput,
  makeListReqInput,
  makePluralIdField,
  makeInput,
} from '../../ast';

import {
  rootConnectionDirectives,
  rootPluralIdDirectives,
  implicitRootPluralIdTypes,
  rootViewerDirectives,
  getConnectionName
} from '../../analyzer';

export function MakeRootQueryType(
  accumulator: TransformerAccumulator,
  context: TransformerContext
): Array<TypeDefinition> {

  const getArgValue = (directive, name) =>
    directive.arguments
      .filter(arg => arg.name === name)
      .map(arg => String(arg.value))[0];

  const filterByArg = directive =>
    makeInput('filterBy', `_${directive.parentTypeName}__EdgeFilter`);

  const filterArgs = directive => {
    const filterName = `Filter#NodeConnection(${directive.parentTypeName})`;
    const filter = context.schema[filterName];

    return filter && filter.kind === 'filter' && filter.conditions.length ? [
      makeInput('filter', `_${directive.parentTypeName}__ConnectionFilterKeys`),
      ...(accumulator.filterArguments[filterName] || [ ]) ] :
      [ ];
  };

  const orderByArg = directive =>
    makeListReqInput('orderBy', `_${directive.parentTypeName}__EdgeOrder`);

  const orderArgs = directive => {
    const orderName = `Order#NodeConnection(${directive.parentTypeName})`;
    const order = context.schema[orderName];
    return order && order.kind === 'order' && order.expressions.length ?
      [
        makeInput('order', `_${directive.parentTypeName}__ConnectionOrderKeys`)
      ] :
      [ ];
  };

  // implicit plural id root fields for each Node type, union and interface:
  const implicitRootPluralIdFields = implicitRootPluralIdTypes(context.schema)
    .map(type => makePluralIdField(type.name));

  // fields defined explicitly with @rootConnection directive:
  const rootConnectionFields = rootConnectionDirectives(context.schema)
    .map(directive =>
      makeField(
        getArgValue(directive, 'field'), [
          makeInput('first', 'Int'),
          makeInput('last', 'Int'),
          makeInput('after', 'String'),
          makeInput('before', 'String'),
          filterByArg(directive),
          ...filterArgs(directive),
          orderByArg(directive),
          ...orderArgs(directive),
        ],
        getConnectionName(directive.parentTypeName)));

  // fields defined explicitly with @rootPluralId directive:
  const rootPluralIdFields = rootPluralIdDirectives(context.schema)
    .map(directive =>
      makePluralIdField(
        directive.arguments[0].value,
        directive.parentTypeName,
        directive.parentFieldName,
        directive.parentFieldType));

  // viewer field:
  const viewerField = rootViewerDirectives(context.schema)
    .map(directive =>
      makeField(
        directive.arguments[0].value,
        [ ],
        directive.parentTypeName));

  const fields = [
    makeField('node', [ makeRequiredInput('id', 'ID') ], 'Node'),
    ...viewerField,
    ...implicitRootPluralIdFields,
    ...rootPluralIdFields,
    ...rootConnectionFields,
  ];

  return [ makeType('_Query', [ ], fields) ];
}
