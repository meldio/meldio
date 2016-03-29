/* @flow */

import type { TransformerAccumulator, TransformerContext} from '../types';
import type { TypeDefinition } from '../../language/ast';

import {
  makeInput, makeInputObject, makeEnum, makeListReqInput,
} from '../../ast';

export function MakeFilterInputTypes(
  accumulator: TransformerAccumulator,
  context: TransformerContext
): Array<TypeDefinition> {
  const { schema, connections, lists } = context;
  const filters = { };
  const typeEnums = { };

  const makeFieldFilters = fields => {
    return fields
      .filter(field =>
        !field.isNodeConnection &&
        !field.isObjectConnection &&
        !field.isScalarConnection )
      .map(field =>
        field.isNode ?
          makeInput(field.name, `_ID_Filter`) :
        field.isNodeList ?
          makeInput(field.name, `_ID_ListFilter`) :
        field.isObjectList || field.isScalarList ?
          makeInput(field.name, `_${field.type}_ListFilter`) :
        makeInput(field.name, `_${field.type}_Filter`)
      );
  };

  const makeFieldTypeFilters = fields => {
    fields
      .filter(field =>
        !field.isNodeConnection &&
        !field.isObjectConnection &&
        !field.isScalarConnection )
      .forEach(field => {
        if (field.isNode) {
          makeTypeFilter('ID');
        } else if (field.isNodeList) {
          makeListTypeFilter('ID');
        } else if (field.isObjectList || field.isScalarList) {
          makeListTypeFilter(field.type);
        } else {
          makeTypeFilter(field.type);
        }
      });
  };

  const makeListTypeFilter = typeName => {
    const listTypeName = `[${typeName}]`;

    if (filters[listTypeName]) {
      return;
    }

    filters[listTypeName] =
      makeInputObject(`_${typeName}_ListFilter`, [
        makeInput('exists', `Boolean`),
        makeInput('length', `Int`),
        makeInput('empty', `Boolean`),
        makeInput('some', `_${typeName}_Filter`),
        makeInput('every', `_${typeName}_Filter`),
        makeInput('none', `_${typeName}_Filter`),
      ]);
    makeTypeFilter(typeName);
  };

  const makeEdgeFilter = (typeName, edgeTypeName) => {
    const edgeType = schema[edgeTypeName];

    if (edgeType && edgeType.fields) {
      makeFieldTypeFilters(edgeType.fields);
    }

    return makeInputObject(`_${typeName}_${edgeTypeName}_EdgeFilter`, [
      ...edgeType && edgeType.fields ?
        makeFieldFilters(edgeType.fields) :
        [ ],
      makeInput('node', `_${typeName}_Filter`)
    ]);
  };

  const makeTypesEnumFilter = (typeName, values) => {
    const enumTypeName = `_${typeName}_Types`;
    if (typeEnums[typeName]) {
      return;
    }

    typeEnums[typeName] = makeEnum(enumTypeName, values);
    filters[enumTypeName] =
      makeInputObject(`${enumTypeName}_Filter`, [
        makeListReqInput('eq', enumTypeName),
        makeListReqInput('ne', enumTypeName)
      ]);
  };

  const makeTypeFilter = typeName => {
    if (filters[typeName]) {
      return;
    }
    const type = schema[typeName];

    if (scalarFilters[typeName]) {
      filters[typeName] = scalarFilters[typeName];

    } else if (type && type.kind === 'enum') {
      filters[typeName] =
        makeInputObject(`_${typeName}_Filter`, [
          makeListReqInput('eq', typeName),
          makeListReqInput('ne', typeName),
          makeInput('exists', 'Boolean'),
        ]);
    } else if (type && type.kind === 'union') {
      const isNode = type.everyTypeImplementsNode;

      filters[typeName] =
        makeInputObject(`_${typeName}_Filter`, [
          makeInput('exists', `Boolean`),
          ...isNode ?
            [ makeInput('id', `_ID_Filter`) ] :
            [ ],
          makeInput('type', `_${typeName}_Types_Filter`)
        ]);

      if (isNode) {
        makeTypeFilter('ID');
      }

      makeTypesEnumFilter(typeName, type.typeNames);
    } else if (type && type.kind === 'interface') {
      const isNode = type.everyTypeImplementsNode;
      const fields = type.fields;

      filters[typeName] =
        makeInputObject(`_${typeName}_Filter`, [
          makeInput('exists', `Boolean`),
          ...isNode && !fields.some(f => f.name === 'id') ?
            [ makeInput('id', `_ID_Filter`) ] :
            [ ],
          makeInput('type', `_${typeName}_Types_Filter`),
          ...makeFieldFilters(fields)
        ]);

      if (isNode && !fields.some(f => f.name === 'id')) {
        makeTypeFilter('ID');
      }

      makeFieldTypeFilters(fields);

      makeTypesEnumFilter(typeName, type.implementations);
    } else if (type && type.kind === 'type') {
      const fields = type.fields;

      filters[typeName] =
        makeInputObject(`_${typeName}_Filter`, [
          makeInput('exists', `Boolean`),
          ...makeFieldFilters(fields)
        ]);

      makeFieldTypeFilters(fields);
    }
  };

  lists.forEach(list => {
    if (!filters[list.type]) {
      makeTypeFilter(list.type);
    }
  });

  connections.forEach(connection => {
    if (!filters[connection.type]) {
      makeTypeFilter(connection.type);
    }
  });

  const edgeFilters = connections
    .map(connection => makeEdgeFilter(connection.type, connection.edgeType) );

  return [
    ...edgeFilters,
    ...Object.keys(filters).map(key => filters[key]),
    ...Object.keys(typeEnums).map(key => typeEnums[key])
  ];
}

const scalarFilters = {
  Int:
    makeInputObject('_Int_Filter', [
      makeListReqInput('eq', 'Int'),
      makeListReqInput('ne', 'Int'),
      makeInput('lt', 'Int'),
      makeInput('gt', 'Int'),
      makeInput('lte', 'Int'),
      makeInput('gte', 'Int'),
      makeInput('exists', 'Boolean') ]),
  Float:
    makeInputObject('_Float_Filter', [
      makeListReqInput('eq', 'Float'),
      makeListReqInput('ne', 'Float'),
      makeInput('lt', 'Float'),
      makeInput('gt', 'Float'),
      makeInput('lte', 'Float'),
      makeInput('gte', 'Float'),
      makeInput('exists', 'Boolean') ]),
  String:
    makeInputObject('_String_Filter', [
      makeListReqInput('eq', 'String'),
      makeListReqInput('ne', 'String'),
      makeInput('lt', 'String'),
      makeInput('gt', 'String'),
      makeInput('lte', 'String'),
      makeInput('gte', 'String'),
      makeInput('matches', 'String'),
      makeInput('exists', 'Boolean') ]),
  Boolean:
    makeInputObject('_Boolean_Filter', [
      makeInput('eq', 'Boolean'),
      makeInput('ne', 'Boolean'),
      makeInput('exists', 'Boolean') ]),
  ID:
    makeInputObject('_ID_Filter', [
      makeListReqInput('eq', 'ID'),
      makeListReqInput('ne', 'ID'),
      makeInput('lt', 'ID'),
      makeInput('gt', 'ID'),
      makeInput('lte', 'ID'),
      makeInput('gte', 'ID'),
      makeInput('exists', 'Boolean') ]),
};
