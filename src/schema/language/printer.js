/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import { visit } from './visitor';

/**
 * Converts an AST into a string, using one set of reasonable
 * formatting rules.
 */
export function print(ast) {
  return visit(ast, { leave: printDocASTReducer });
}

const printDocASTReducer = {
  Name: node => node.value,
  Variable: node => '$' + node.name,

  // Document

  Document: node => join(node.definitions, '\n\n') + '\n',

  OperationDefinition(node) {
    const op = node.operation;
    const name = node.name;
    const defs = wrap('(', join(node.variableDefinitions, ', '), ')');
    const directives = join(node.directives, ' ');
    const selectionSet = node.selectionSet;
    return !name ? selectionSet :
      join([ op, join([ name, defs ]), directives, selectionSet ], ' ');
  },

  VariableDefinition: ({ variable, type, defaultValue }) =>
    variable + ': ' + type + wrap(' = ', defaultValue),

  SelectionSet: ({ selections }) => block(selections),

  Field: ({ alias, name, arguments: args, directives, selectionSet }) =>
    join([
      wrap('', alias, ': ') + name + wrap('(', join(args, ', '), ')'),
      join(directives, ' '),
      selectionSet
    ], ' '),

  Argument: ({ name, value }) => name + ': ' + value,

  // Fragments

  FragmentSpread: ({ name, directives }) =>
    '...' + name + wrap(' ', join(directives, ' ')),

  InlineFragment: ({ typeCondition, directives, selectionSet }) =>
    `... on ${typeCondition} ` +
    wrap('', join(directives, ' '), ' ') +
    selectionSet,

  FragmentDefinition: ({ name, typeCondition, directives, selectionSet }) =>
    `fragment ${name} on ${typeCondition} ` +
    wrap('', join(directives, ' '), ' ') +
    selectionSet,

  // Value

  IntValue: ({ value }) => value,
  FloatValue: ({ value }) => value,
  StringValue: ({ value }) => JSON.stringify(value),
  BooleanValue: ({ value }) => JSON.stringify(value),
  EnumValue: ({ value }) => value,
  ListValue: ({ values }) => '[' + join(values, ', ') + ']',
  ObjectValue: ({ fields }) => '{' + join(fields, ', ') + '}',
  ObjectField: ({ name, value }) => name + ': ' + value,

  // Directive

  Directive: ({ name, arguments: args }) =>
    '@' + name + wrap('(', join(args, ', '), ')'),

  // Type

  NamedType: ({ name }) => name,
  ListType: ({ type }) => '[' + type + ']',
  NonNullType: ({ type }) => type + '!',

  // Type Definitions

  ObjectTypeDefinition: ({ name, interfaces, fields }) =>
    'type ' + name + ' ' +
    wrap('implements ', join(interfaces, ', '), ' ') +
    block(fields),

  FieldDefinition: ({ name, arguments: args, type }) =>
    name + wrap('(', join(args, ', '), ')') + ': ' + type,

  InputValueDefinition: ({ name, type, defaultValue }) =>
    name + ': ' + type + wrap(' = ', defaultValue),

  InterfaceTypeDefinition: ({ name, fields }) =>
    `interface ${name} ${block(fields)}`,

  UnionTypeDefinition: ({ name, types }) =>
    `union ${name} = ${join(types, ' | ')}`,

  ScalarTypeDefinition: ({ name }) =>
    `scalar ${name}`,

  EnumTypeDefinition: ({ name, values }) =>
    `enum ${name} ${block(values)}`,

  EnumValueDefinition: ({ name }) => name,

  InputObjectTypeDefinition: ({ name, fields }) =>
    `input ${name} ${block(fields)}`,

  TypeExtensionDefinition: ({ definition }) => `extend ${definition}`,

  MutationDefinition: ({ name, arguments: args, fields }) =>
    `mutation ${name}${wrap('(', join(args, ', '), ')')} ` +
      `${block(fields)}`,

  NodeConnectionDefinition: ({ type, relatedField, edgeType }) =>
    type === 'Node' ?
      `NodeConnection` :
      `NodeConnection(${type}${
        wrap(', ', relatedField, '')}${wrap(', ', edgeType, '')})`,

  ObjectConnectionDefinition: ({ type, edgeType }) =>
    edgeType ?
      `ObjectConnection(${type}, ${edgeType})` :
      `ObjectConnection(${type})`,

  ScalarConnectionDefinition: ({ type, edgeType }) =>
    edgeType ?
      `ScalarConnection(${type}, ${edgeType})` :
      `ScalarConnection(${type})`,

  EdgeDefinition: ({ type, edgeType }) =>
    edgeType ?
      `Edge(${type}, ${edgeType})` :
      `Edge(${type})`,

  FilterDefinition: ({ type, conditions }) =>
    `filter on ${type} ${block(conditions, true)}`,

  FilterCondition: ({ key, arguments: args, condition }) =>
    `${key}: ${wrap('(', join(args, ', '), ') ')}${condition}`,

  OrderDefinition: ({ type, expressions }) =>
    `order on ${type} ${block(expressions, true)}`,

  OrderExpression: ({ key, expression }) =>
    `${key}: ${wrap('[', join(expression, ', '), ']')}`,

};

/**
 * Given maybeArray, print an empty string if it is null or empty, otherwise
 * print all items together separated by separator if provided
 */
function join(maybeArray, separator) {
  return maybeArray ? maybeArray.filter(x => x).join(separator || '') : '';
}

/**
 * Given maybeArray, print an empty string if it is null or empty, otherwise
 * print each item on it's own line, wrapped in an indented "{ }" block.
 */
function block(maybeArray, forceCurlies = false) {
  return length(maybeArray) ?
    indent('{\n' + join(maybeArray, '\n')) + '\n}' :
    forceCurlies ? '{}' : '';
}

/**
 * If maybeString is not null or empty, then wrap with start and end, otherwise
 * print an empty string.
 */
function wrap(start, maybeString, end) {
  return maybeString ?
    start + maybeString + (end || '') :
    '';
}

function indent(maybeString) {
  return maybeString && maybeString.replace(/\n/g, '\n  ');
}

function length(maybeArray) {
  return maybeArray ? maybeArray.length : 0;
}
