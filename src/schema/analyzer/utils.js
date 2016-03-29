/* @flow */

import keyMap from '../../jsutils/keyMap';
import { visit } from '../language';
import type { ObjectValue } from '../language/ast';

import type {
  Schema,
  ListDefinition,
  ConnectionDefinition,
  TypeDirectiveDefinition,
  FieldDirectiveDefinition,
  Definition,
} from './types';

export function getConnectionName(type: string, edgeType?: ?string): string {
  return `${type}${edgeType || ''}Connection`;
}

export function getEdgeName(type: string, edgeType?: ?string): string {
  return `${type}${edgeType || ''}Edge`;
}

export function declaredLists(schema: Schema): Array<ListDefinition> {
  const lists = [ ]
    .concat(...Object.keys(schema)
      .map(key => schema[key])
      .filter(value =>
        value.kind === 'type' ||
        value.kind === 'interface' ||
        value.kind === 'mutation')
      .map(target =>
        (target.fields || []) // flowism
          .filter(field =>
            field.isScalarList || field.isObjectList || field.isNodeList)
          .map(field => ({
            kind:
              field.isScalarList ? 'ScalarList' :
              field.isObjectList ? 'ObjectList' :
              'NodeList', // field.isNodeList
            type: field.type
          }))));

  const map = keyMap(lists, l => l.type);
  const uniqueLists = Object.keys(map).map(key => map[key]);
  return uniqueLists;
}

function uniqueConnections(connections) {
  const map = keyMap(connections, conn =>
    conn.name + '#' + conn.type + '#' + (conn.edgeType || '') );
  return Object.keys(map).map(key => map[key]);
}

export function declaredConnections(
  schema: Schema
): Array<ConnectionDefinition> {
  const typesAndInterfaces = Object.keys(schema)
    .map(key => schema[key])
    .filter(value => value.kind === 'type' || value.kind === 'interface');

  const connections = [ ]
    .concat(...typesAndInterfaces.map(type =>
      (type.fields || []) // flowism
        .filter(field =>
          field.isScalarConnection ||
          field.isObjectConnection ||
          field.isNodeConnection)
        .map(field => ({
          kind:
            field.isScalarConnection ? 'ScalarConnection' :
            field.isObjectConnection ? 'ObjectConnection' :
            'NodeConnection', // field.isNodeConnection
          name: getConnectionName(field.type, field.edgeType),
          edgeType: field.edgeType || '',
          type: field.type
        }))));

  return uniqueConnections(connections);
}

export function rootConnectionDirectives(
  schema: Schema
): Array<TypeDirectiveDefinition> {
  const isRootConnection = directive =>
    Boolean(
      directive.name === 'rootConnection' &&
      directive.arguments &&
      directive.arguments.some(arg =>
        arg.name === 'field' &&
        arg.type === 'String' &&
        arg.value)
    );

  return [ ]
    .concat(
      ...Object.keys(schema)
        .map(key => schema[key])
        .filter(definition => definition.kind === 'type')
        .map(definition =>
          (definition.directives || [ ]) // flowism
            .map(directive => ({
              ...directive,
              parentTypeName: definition.name
            }))))
    .filter(directive => isRootConnection(directive));
}

export function directiveConnections(
  schema: Schema
): Array<ConnectionDefinition> {
  const connections = rootConnectionDirectives(schema)
    .map(directive => ({
      kind: 'NodeConnection',
      name: getConnectionName(directive.parentTypeName),
      edgeType: '',
      type: directive.parentTypeName
    }));
  return uniqueConnections(connections);
}

export function allConnections(schema: Schema): Array<ConnectionDefinition> {
  const connections = [
    ...declaredConnections(schema),
    ...directiveConnections(schema)
  ];
  return uniqueConnections(connections);
}

export function rootPluralIdDirectives(
  schema: Schema
): Array<FieldDirectiveDefinition> {
  return [ ]
    .concat(
      ...Object.keys(schema)
        .map(key => schema[key])
        .filter(definition => definition.kind === 'type')
        .map(type =>
          [ ].concat(...(type.fields || []).map(field =>
            field.directives
              .map(directive => ({
                ...directive,
                parentTypeName: type.name,
                parentFieldName: field.name,
                parentFieldType: field.type
              }))))))
    .filter(directive =>
        directive.name === 'rootPluralId' &&
        directive.arguments &&
        directive.arguments.length === 1);
}

export function implicitRootPluralIdTypes(
  schema: Schema
): Array<Definition> {
  return Object.keys(schema)
    .map(key => schema[key])
    .filter(definition =>
      definition.kind === 'type' &&
        definition.implementsNode ||
      definition.kind === 'interface' &&
        definition.name !== 'Node' && definition.everyTypeImplementsNode ||
      definition.kind === 'union' &&
        definition.everyTypeImplementsNode);
}

export function rootViewerDirectives(
  schema: Schema
): Array<TypeDirectiveDefinition> {
  return [ ]
    .concat(
      ...Object.keys(schema)
        .map(key => schema[key])
        .filter(definition => definition.kind === 'type')
        .map(definition =>
          (definition.directives || [ ]) // flowism
            .map(directive => ({
              ...directive,
              parentTypeName: definition.name
            }))))
    .filter(directive =>
      directive.name === 'rootViewer' &&
      directive.arguments &&
      directive.arguments.length === 1);
}

export function extractVariablesFromObjectValues(
  values: [ObjectValue]
): Array<string> {
  const variables = values
    .reduce( (acc, objectValue) => {
      const result = [ ];
      const visitor = {
        Variable: node => {
          result.push(node.name.value);
          return undefined;
        }
      };
      visit(objectValue, visitor);
      return acc.concat(result);
    }, [ ]);
  return Object.keys(
    variables.reduce( (acc, variable) => ({...acc, [variable]: true}), {}));
}
