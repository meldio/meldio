import isNullish from '../../jsutils/isNullish';
// import invariant from '../../jsutils/invariant';
// import keyMap from '../../jsutils/keyMap';
import values from '../../jsutils/values';
import { camelCase } from '../../jsutils/casing';

import type { Document } from '../language/ast';
import { GraphQLSchema } from 'graphql/type';
import { buildASTSchema } from 'graphql/utilities';

import {
  implicitRootPluralIdTypes,
  rootPluralIdDirectives,
  rootConnectionDirectives,
  allConnections,
  rootViewerDirectives,
} from '../analyzer';

import { AGGREGATION_FIELD_NAMES } from '../validator/definitions';

function extractAggFieldDefinitions(fields) {
  return Object.values(fields)
    .filter(field => AGGREGATION_FIELD_NAMES.includes(field.name))
    .map(aggField => ({
      [aggField.name]:
        aggField.args
          .map(arg => ({ [arg.name]: arg.type }))
          .reduce( (acc, arg) => ({...acc, ...arg}), { } ) }))
    .reduce( (acc, field) => ({...acc, ...field}), { } );
}

function extractFilterInputObjectDefinition(typeMap, node, edge) {
  const filterInputObjectName = `_${node}_${edge || ''}_EdgeFilter`;
  return typeMap[filterInputObjectName];
}

function extractOrderInputObjectDefinition(typeMap, node, edge) {
  const orderInputObjectName = `_${node}_${edge || ''}_EdgeOrder`;
  return typeMap[orderInputObjectName];
}

function extractListFilterInputObjectDefinition(typeMap, typeName) {
  const filterInputObjectName = `_${typeName}_Filter`;
  return typeMap[filterInputObjectName];
}

function extractListOrderInputObjectDefinition(typeMap, typeName) {
  const filterInputObjectName = `_${typeName}_Order`;
  return typeMap[filterInputObjectName];
}

// Simplified generator that  uses GraphQL's buildASTSchema and mokeypatches
// resolvers.  TODO: replace with proper codegen
export function generate(
  transformedAST: Document,
  schema: any,
  resolvers: any
): GraphQLSchema {
  if (isNullish(transformedAST) || isNullish(schema) || isNullish(resolvers)) {
    throw new Error('must pass transformedAST, schema and resolvers.');
  }

  const {
    ConnectionField,
    InterfacePluralIdField,
    NodeField,
    TypePluralIdField,
    UnionPluralIdField,
    IDField,
    ResolveType,
    IsTypeOf,
    NodeConnection,
    ObjectConnection,
    ScalarConnection,
    Node,
    NodeList,
    ObjectList,
    ScalarList,
    AggregationField,
    Mutation,
    ViewerField,
  } = resolvers;

  const hasMutations = values(schema).some( type => type.kind === 'mutation');
  // const hasSubscriptions = false;
  const rootTypes = [
    '_Query',
    hasMutations ? '_Mutations' : undefined,
    // hasSubscriptions ? '_Subscriptions' : undefined,
  ];


  const result = buildASTSchema(transformedAST, ...rootTypes);

  // 1. Setup resolvers for root _Query type:
  // ... node field:
  result._typeMap._Query._fields['node'].resolve = NodeField({ schema });
  // ... implicit plural id fields:
  implicitRootPluralIdTypes(schema)
    .forEach(definition => {
      const name = definition.name;
      const fieldName = camelCase(definition.name);

      result._typeMap._Query._fields[fieldName]
        .resolve = definition.kind === 'type' ?
                     TypePluralIdField({ schema, name, field: 'id' }) :
                   definition.kind === 'union' ?
                     UnionPluralIdField({ schema, name }) :
                   definition.kind === 'interface' ?
                     InterfacePluralIdField({ schema, name }) :
                     // istanbul ignore next
                     () => null;
    });
  // ... explicit plural id fields:
  rootPluralIdDirectives(schema)
    .forEach(directive => {
      const fieldName = directive.arguments[0].value;
      const name = directive.parentTypeName;
      const field = directive.parentFieldName;
      result._typeMap._Query._fields[fieldName]
        .resolve = TypePluralIdField({ schema, name, field });
    });
  // ... root connections:
  rootConnectionDirectives(schema)
    .map(directive => {
      const fieldName = directive.arguments[0].value;
      const node = directive.parentTypeName;

      const fields = result._typeMap._Query._fields[fieldName].type._fields;
      const aggFieldDefinitions = extractAggFieldDefinitions(fields);
      const filterInputObjectDefinition =
        extractFilterInputObjectDefinition(result._typeMap, node);
      const orderInputObjectDefinition =
        extractOrderInputObjectDefinition(result._typeMap, node);

      result._typeMap._Query._fields[fieldName]
        .resolve = ConnectionField({
          schema,
          node,
          aggFieldDefinitions,
          filterInputObjectDefinition,
          orderInputObjectDefinition,
        });
    });

  // 2. Setup type resolvers on each Union:
  values(schema)
    .filter(def => def.kind === 'union')
    .forEach(union => {

      result._typeMap[union.name].resolveType =
        result._typeMap[union.name]._typeConfig.resolveType =
          ResolveType({ typeMap: result._typeMap });
    });

  // 3. Setup type resolvers on each Interface:
  values(schema)
    .filter(def => def.kind === 'interface')
    .forEach(inter => {
      result._typeMap[inter.name].resolveType =
        ResolveType({ typeMap: result._typeMap });
    });

  // 4. Setup isTypeOf resolvers on each type that is in the generalted
  // GraphQL schema typeMap. Latter condition (result._typeMap[def.name]) is
  // neccessary because EdgeProps will be in Meldio schema, but not in
  // generated GraphQL schema instance.
  values(schema)
    .filter(def =>
      def.kind === 'type' &&
      result._typeMap[def.name])
    .forEach(type => {
      result._typeMap[type.name].isTypeOf = IsTypeOf({ name: type.name });

      // setup resolver for id fields on nodes:
      if (type.implementsNode) {
        result._typeMap[type.name]._fields.id.resolve = IDField();
      }

      type.fields.forEach(field => {
        if (field.isNodeConnection) {
          const node = field.type;
          const edge = field.edgeType;
          const fields =
            result._typeMap[type.name]._fields[field.name].type._fields;
          const aggFieldDefinitions = extractAggFieldDefinitions(fields);
          const filterInputObjectDefinition =
            extractFilterInputObjectDefinition(result._typeMap, node, edge);
          const orderInputObjectDefinition =
            extractOrderInputObjectDefinition(result._typeMap, node, edge);

          result._typeMap[type.name]._fields[field.name].resolve =
            NodeConnection({
              schema,
              node,
              edge,
              field: field.name,
              relatedField: field.relatedField,
              aggFieldDefinitions,
              filterInputObjectDefinition,
              orderInputObjectDefinition
            });
        } else if (field.isObjectConnection) {
          const node = field.type;
          const edge = field.edgeType;
          const fields =
            result._typeMap[type.name]._fields[field.name].type._fields;
          const aggFieldDefinitions = extractAggFieldDefinitions(fields);
          const filterInputObjectDefinition =
            extractFilterInputObjectDefinition(result._typeMap, node, edge);
          const orderInputObjectDefinition =
            extractOrderInputObjectDefinition(result._typeMap, node, edge);

          result._typeMap[type.name]._fields[field.name].resolve =
            ObjectConnection({
              schema,
              node,
              edge,
              field: field.name,
              aggFieldDefinitions,
              filterInputObjectDefinition,
              orderInputObjectDefinition,
            });
        } else if (field.isScalarConnection) {
          const node = field.type;
          const edge = field.edgeType;
          const fields =
            result._typeMap[type.name]._fields[field.name].type._fields;
          const aggFieldDefinitions = extractAggFieldDefinitions(fields);
          const filterInputObjectDefinition =
            extractFilterInputObjectDefinition(result._typeMap, node, edge);
          const orderInputObjectDefinition =
            extractOrderInputObjectDefinition(result._typeMap, node, edge);

          result._typeMap[type.name]._fields[field.name].resolve =
            ScalarConnection({
              schema,
              node,
              edge,
              field: field.name,
              aggFieldDefinitions,
              filterInputObjectDefinition,
              orderInputObjectDefinition,
            });
        } else if (field.isNode) {
          result._typeMap[type.name]._fields[field.name].resolve =
            Node({ schema, field: field.name });
        } else if (field.isNodeList) {
          const filterInputObjectDefinition =
            extractListFilterInputObjectDefinition(result._typeMap, field.type);
          const orderInputObjectDefinition =
            extractListOrderInputObjectDefinition(result._typeMap, field.type);

          result._typeMap[type.name]._fields[field.name].resolve =
            NodeList({
              schema,
              typeName: field.type,
              field: field.name,
              filterInputObjectDefinition,
              orderInputObjectDefinition,
            });
        } else if (field.isObjectList) {
          const filterInputObjectDefinition =
            extractListFilterInputObjectDefinition(result._typeMap, field.type);
          const orderInputObjectDefinition =
            extractListOrderInputObjectDefinition(result._typeMap, field.type);

          result._typeMap[type.name]._fields[field.name].resolve =
            ObjectList({
              schema,
              typeName: field.type,
              field: field.name,
              filterInputObjectDefinition,
              orderInputObjectDefinition,
            });
        } else if (field.isScalarList) {
          const filterInputObjectDefinition =
            extractListFilterInputObjectDefinition(result._typeMap, field.type);

          result._typeMap[type.name]._fields[field.name].resolve =
            ScalarList({
              schema,
              typeName: field.type,
              field: field.name,
              filterInputObjectDefinition
            });
        }
      });
    });

  // 5. Setup connection aggregation field resolvers
  allConnections(schema)
    .forEach(connection => {
      const name = connection.name;

      // istanbul ignore else
      if (result._typeMap[name]._fields.count) {
        result._typeMap[name]._fields.count.resolve = AggregationField;
      }
      if (result._typeMap[name]._fields.sum) {
        result._typeMap[name]._fields.sum.resolve = AggregationField;
      }
      if (result._typeMap[name]._fields.average) {
        result._typeMap[name]._fields.average.resolve = AggregationField;
      }
      if (result._typeMap[name]._fields.min) {
        result._typeMap[name]._fields.min.resolve = AggregationField;
      }
      if (result._typeMap[name]._fields.max) {
        result._typeMap[name]._fields.max.resolve = AggregationField;
      }
    });

  // 6. Setup mutation resolvers:
  values(schema)
    .filter(def => def.kind === 'mutation')
    .forEach(mutation => {
      result._typeMap._Mutations._fields[mutation.name].resolve =
        Mutation({ schema });
    });

  // 7. Setup resolver for rootViewer field:
  rootViewerDirectives(schema)
    .forEach(directive => {
      const fieldName = directive.arguments[0].value;
      const typeName = directive.parentTypeName;
      result._typeMap._Query._fields[fieldName]
        .resolve = ViewerField({ schema, typeName });
    });

  return result;
}
