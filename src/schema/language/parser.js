/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import { Source } from './source';
import { syntaxError } from './syntaxError';
import { lex, TokenKind, getTokenKindDesc, getTokenDesc } from './lexer';
import type { Token } from './lexer';
import type {
  Variable,
  Document,

  ObjectTypeDefinition,
  FieldDefinition,
  InputValueDefinition,
  InterfaceTypeDefinition,
  UnionTypeDefinition,
  ScalarTypeDefinition,
  EnumTypeDefinition,
  EnumValueDefinition,
  InputObjectTypeDefinition,
  TypeExtensionDefinition,
  MutationDefinition,
  FilterDefinition,
  FilterCondition,
  OrderDefinition,
  OrderExpression,
  NodeConnectionDefinition,
  ScalarConnectionDefinition,
  ObjectConnectionDefinition,
  EdgeDefinition,
  Directive,

  Value,
  ListValue,
  ObjectValue,
  ObjectField,

  Name,
  NamedType,

  TypeDefinition,
  Type,
  Argument,
} from './ast';

import {
  NAME,
  VARIABLE,
  DOCUMENT,

  INT,
  FLOAT,
  STRING,
  BOOLEAN,
  ENUM,
  LIST,
  OBJECT,
  OBJECT_FIELD,

  DIRECTIVE,

  NAMED_TYPE,
  LIST_TYPE,
  NON_NULL_TYPE,
  ARGUMENT,

  OBJECT_TYPE_DEFINITION,
  FIELD_DEFINITION,
  INPUT_VALUE_DEFINITION,
  INTERFACE_TYPE_DEFINITION,
  UNION_TYPE_DEFINITION,
  SCALAR_TYPE_DEFINITION,
  ENUM_TYPE_DEFINITION,
  ENUM_VALUE_DEFINITION,
  INPUT_OBJECT_TYPE_DEFINITION,

  TYPE_EXTENSION_DEFINITION,

  MUTATION_DEFINITION,
  NODE_CONNECTION_DEFINITION,
  SCALAR_CONNECTION_DEFINITION,
  OBJECT_CONNECTION_DEFINITION,
  EDGE_DEFINITION,

  FILTER_DEFINITION,
  FILTER_CONDITION,
  ORDER_DEFINITION,
  ORDER_EXPRESSION,

} from './kinds';


/**
 * Configuration options to control parser behavior
 */
export type ParseOptions = {
  /**
   * By default, the parser creates AST nodes that know the location
   * in the source that they correspond to. This configuration flag
   * disables that behavior for performance or testing.
   */
  noLocation?: boolean,

  /**
   * By default, the parser creates AST nodes that contain a reference
   * to the source that they were created from. This configuration flag
   * disables that behavior for performance or testing.
   */
  noSource?: boolean,
}

/**
 * Given a GraphQL source, parses it into a Document.
 * Throws GraphQLError if a syntax error is encountered.
 */
export function parse(
  source: Source | string,
  options?: ParseOptions
): Document {
  const sourceObj = source instanceof Source ? source : new Source(source);
  const parser = makeParser(sourceObj, options || {});
  return parseDocument(parser);
}

/**
 * Given a string containing a GraphQL value, parse the AST for that value.
 * Throws GraphQLError if a syntax error is encountered.
 *
 * This is useful within tools that operate upon GraphQL Values directly and
 * in isolation of complete GraphQL documents.
 */
export function parseValue(
  source: Source | string,
  options?: ParseOptions
): Value {
  const sourceObj = source instanceof Source ? source : new Source(source);
  const parser = makeParser(sourceObj, options || {});
  return parseValueLiteral(parser);
}

/**
 * Variable : $ Name
 */
function parseVariable(parser): Variable {
  const start = parser.token.start;
  expect(parser, TokenKind.DOLLAR);
  return {
    kind: VARIABLE,
    name: parseName(parser),
    loc: loc(parser, start)
  };
}

/**
 * Converts a name lex token into a name parse node.
 */
function parseName(parser): Name {
  const token = expect(parser, TokenKind.NAME);
  return {
    kind: NAME,
    value: token.value,
    loc: loc(parser, token.start)
  };
}

// Implements the parsing rules in the Document section.

/**
 * Document : Definition+
 */
function parseDocument(parser): Document {
  const start = parser.token.start;

  const definitions = [];
  do {
    definitions.push(parseTypeDefinition(parser));
  } while (!skip(parser, TokenKind.EOF));

  return {
    kind: DOCUMENT,
    definitions,
    loc: loc(parser, start)
  };
}

/**
 * Arguments : ( Argument+ )
 */
function parseArguments(parser): Array<Argument> {
  return peek(parser, TokenKind.PAREN_L) ?
    many(parser, TokenKind.PAREN_L, parseArgument, TokenKind.PAREN_R) :
    [];
}

/**
 * Argument : Name : Value
 */
function parseArgument(parser): Argument {
  const start = parser.token.start;
  return {
    kind: ARGUMENT,
    name: parseName(parser),
    value: (expect(parser, TokenKind.COLON), parseValueLiteral(parser, false)),
    loc: loc(parser, start)
  };
}



// Implements the parsing rules in the Values section.

/**
 * Value[Const] :
 *   - [~Const] Variable
 *   - IntValue
 *   - FloatValue
 *   - StringValue
 *   - BooleanValue
 *   - EnumValue
 *   - ListValue[?Const]
 *   - ObjectValue[?Const]
 *
 * BooleanValue : one of `true` `false`
 *
 * EnumValue : Name but not `true`, `false` or `null`
 */
function parseValueLiteral(parser, isConst: boolean): Value {
  const token = parser.token;
  switch (token.kind) {
    case TokenKind.BRACKET_L:
      return parseList(parser, isConst);
    case TokenKind.BRACE_L:
      return parseObject(parser, isConst);
    case TokenKind.INT:
      advance(parser);
      return {
        kind: INT,
        value: token.value,
        loc: loc(parser, token.start)
      };
    case TokenKind.FLOAT:
      advance(parser);
      return {
        kind: FLOAT,
        value: token.value,
        loc: loc(parser, token.start)
      };
    case TokenKind.STRING:
      advance(parser);
      return {
        kind: STRING,
        value: token.value,
        loc: loc(parser, token.start)
      };
    case TokenKind.NAME:
      if (token.value === 'true' || token.value === 'false') {
        advance(parser);
        return {
          kind: BOOLEAN,
          value: token.value === 'true',
          loc: loc(parser, token.start)
        };
      } else if (token.value !== 'null') {
        advance(parser);
        return {
          kind: ENUM,
          value: token.value,
          loc: loc(parser, token.start)
        };
      }
      break;
    case TokenKind.DOLLAR:
      if (!isConst) {
        return parseVariable(parser);
      }
      break;
  }
  throw unexpected(parser);
}

export function parseConstValue(parser): Value {
  return parseValueLiteral(parser, true);
}

function parseValueValue(parser): Value {
  return parseValueLiteral(parser, false);
}

/**
 * ListValue[Const] :
 *   - [ ]
 *   - [ Value[?Const]+ ]
 */
function parseList(parser, isConst: boolean): ListValue {
  const start = parser.token.start;
  const item = isConst ? parseConstValue : parseValueValue;
  return {
    kind: LIST,
    values: any(parser, TokenKind.BRACKET_L, item, TokenKind.BRACKET_R),
    loc: loc(parser, start)
  };
}

/**
 * ObjectValue[Const] :
 *   - { }
 *   - { ObjectField[?Const]+ }
 */
function parseObject(parser, isConst: boolean): ObjectValue {
  const start = parser.token.start;
  expect(parser, TokenKind.BRACE_L);
  const fieldNames = {};
  const fields = [];
  while (!skip(parser, TokenKind.BRACE_R)) {
    fields.push(parseObjectField(parser, isConst, fieldNames));
  }
  return {
    kind: OBJECT,
    fields,
    loc: loc(parser, start)
  };
}

/**
 * ObjectField[Const] : Name : Value[?Const]
 */
function parseObjectField(
  parser,
  isConst: boolean,
  fieldNames: {[name: string]: boolean}
): ObjectField {
  const start = parser.token.start;
  const name = parseName(parser);
  if (fieldNames.hasOwnProperty(name.value)) {
    throw syntaxError(
      parser.source,
      start,
      `Duplicate input object field ${name.value}.`
    );
  }
  fieldNames[name.value] = true;
  return {
    kind: OBJECT_FIELD,
    name,
    value:
      (expect(parser, TokenKind.COLON), parseValueLiteral(parser, isConst)),
    loc: loc(parser, start)
  };
}


// Implements the parsing rules in the Directives section.

/**
 * Directives : Directive+
 */
function parseDirectives(parser): Array<Directive> {
  const directives = [];
  while (peek(parser, TokenKind.AT)) {
    directives.push(parseDirective(parser));
  }
  return directives;
}

/**
 * Directive : @ Name Arguments?
 */
function parseDirective(parser): Directive {
  const start = parser.token.start;
  expect(parser, TokenKind.AT);
  return {
    kind: DIRECTIVE,
    name: parseName(parser),
    arguments: parseArguments(parser),
    loc: loc(parser, start)
  };
}


// Implements the parsing rules in the Types section.

/**
 * Type :
 *   - NamedType
 *   - ListType
 *   - NonNullType
 */
export function parseType(parser): Type {
  const start = parser.token.start;
  let type;
  if (skip(parser, TokenKind.BRACKET_L)) {
    type = parseType(parser);
    expect(parser, TokenKind.BRACKET_R);
    type = {
      kind: LIST_TYPE,
      type,
      loc: loc(parser, start)
    };
  } else {
    type = parseNamedType(parser);
  }
  if (skip(parser, TokenKind.BANG)) {
    return {
      kind: NON_NULL_TYPE,
      type,
      loc: loc(parser, start)
    };
  }
  return type;
}

/**
 * FieldDefinitionType :
 *   - NamedType
 *   - ListType
 *   - NonNullType
 *   - NodeConnection
 *   - ScalarConnection
 *   - ObjectConnection
 */
export function parseFieldDefinitionType(parser): Type {
  const start = parser.token.start;
  let type;
  if (skip(parser, TokenKind.BRACKET_L)) {
    type = parseType(parser);
    expect(parser, TokenKind.BRACKET_R);
    type = {
      kind: LIST_TYPE,
      type,
      loc: loc(parser, start)
    };
  } else if (parser.token.kind === TokenKind.NAME &&
        parser.token.value === 'NodeConnection') {
    type = parseNodeConnectionDefinition(parser);
  } else if (parser.token.kind === TokenKind.NAME &&
        parser.token.value === 'ScalarConnection') {
    type = parseScalarConnectionDefinition(parser);
  } else if (parser.token.kind === TokenKind.NAME &&
        parser.token.value === 'ObjectConnection') {
    type = parseObjectConnectionDefinition(parser);
  } else if (parser.token.kind === TokenKind.NAME &&
        parser.token.value === 'Edge') {
    type = parseEdgeDefinition(parser);
  } else {
    type = parseNamedType(parser);
  }
  if (skip(parser, TokenKind.BANG)) {
    return {
      kind: NON_NULL_TYPE,
      type,
      loc: loc(parser, start)
    };
  }
  return type;
}

function parseNodeConnectionDefinition(
  parser,
  skipRelatedField = false
): NodeConnectionDefinition {
  const start = parser.token.start;
  expectKeyword(parser, 'NodeConnection');
  expect(parser, TokenKind.PAREN_L);
  const type = parseNamedType(parser);
  const relatedField = skipRelatedField ? null : parseName(parser);
  let edgeType = null;
  if (!peek(parser, TokenKind.PAREN_R)) {
    edgeType = parseNamedType(parser);
  }
  expect(parser, TokenKind.PAREN_R);
  return {
    kind: NODE_CONNECTION_DEFINITION,
    type,
    relatedField,
    edgeType,
    loc: loc(parser, start),
  };
}

function parseScalarConnectionDefinition(parser): ScalarConnectionDefinition {
  const start = parser.token.start;
  expectKeyword(parser, 'ScalarConnection');
  expect(parser, TokenKind.PAREN_L);
  const type = parseNamedType(parser);
  let edgeType = null;
  if (!peek(parser, TokenKind.PAREN_R)) {
    edgeType = parseNamedType(parser);
  }
  expect(parser, TokenKind.PAREN_R);
  return {
    kind: SCALAR_CONNECTION_DEFINITION,
    type,
    edgeType,
    loc: loc(parser, start),
  };
}

function parseObjectConnectionDefinition(parser): ObjectConnectionDefinition {
  const start = parser.token.start;
  expectKeyword(parser, 'ObjectConnection');
  expect(parser, TokenKind.PAREN_L);
  const type = parseNamedType(parser);
  let edgeType = null;
  if (!peek(parser, TokenKind.PAREN_R)) {
    edgeType = parseNamedType(parser);
  }
  expect(parser, TokenKind.PAREN_R);
  return {
    kind: OBJECT_CONNECTION_DEFINITION,
    type,
    edgeType,
    loc: loc(parser, start),
  };
}

function parseEdgeDefinition(parser): EdgeDefinition {
  const start = parser.token.start;
  expectKeyword(parser, 'Edge');
  expect(parser, TokenKind.PAREN_L);
  const type = parseNamedType(parser);
  let edgeType = null;
  if (!peek(parser, TokenKind.PAREN_R)) {
    edgeType = parseNamedType(parser);
  }
  expect(parser, TokenKind.PAREN_R);
  return {
    kind: EDGE_DEFINITION,
    type,
    edgeType,
    loc: loc(parser, start),
  };
}

/**
 * NamedType : Name
 */
export function parseNamedType(parser): NamedType {
  const start = parser.token.start;
  return {
    kind: NAMED_TYPE,
    name: parseName(parser),
    loc: loc(parser, start)
  };
}


// Implements the parsing rules in the Type Definition section.

/**
 * TypeDefinition :
 *   - ObjectTypeDefinition
 *   - InterfaceTypeDefinition
 *   - UnionTypeDefinition
 *   - ScalarTypeDefinition
 *   - EnumTypeDefinition
 *   - InputObjectTypeDefinition
 *   - TypeExtensionDefinition
 *   - MutationDefinition
 */
function parseTypeDefinition(parser): TypeDefinition {
  if (!peek(parser, TokenKind.NAME)) {
    throw unexpected(parser);
  }
  switch (parser.token.value) {
    case 'type':
      return parseObjectTypeDefinition(parser);
    case 'interface':
      return parseInterfaceTypeDefinition(parser);
    case 'union':
      return parseUnionTypeDefinition(parser);
    case 'scalar':
      return parseScalarTypeDefinition(parser);
    case 'enum':
      return parseEnumTypeDefinition(parser);
    case 'input':
      return parseInputObjectTypeDefinition(parser);
    case 'extend':
      return parseTypeExtensionDefinition(parser);
    case 'mutation':
      return parseMutationDefinition(parser);
    case 'filter':
      return parseFilterDefinition(parser);
    case 'order':
      return parseOrderDefinition(parser);
    default:
      throw unexpected(parser);
  }
}

/**
 * ObjectTypeDefinition : type Name ImplementsInterfaces? { FieldDefinition+ }
 */
function parseObjectTypeDefinition(parser): ObjectTypeDefinition {
  const start = parser.token.start;
  expectKeyword(parser, 'type');
  const name = parseName(parser);
  const interfaces = parseImplementsInterfaces(parser);
  const directives = parseDirectives(parser);
  const fields = any(
    parser,
    TokenKind.BRACE_L,
    parseFieldDefinition,
    TokenKind.BRACE_R
  );
  return {
    kind: OBJECT_TYPE_DEFINITION,
    name,
    interfaces,
    fields,
    directives,
    loc: loc(parser, start),
  };
}

/**
 * ImplementsInterfaces : implements NamedType+
 */
function parseImplementsInterfaces(parser): Array<NamedType> {
  const types = [];
  if (parser.token.value === 'implements') {
    advance(parser);
    do {
      types.push(parseNamedType(parser));
    } while (
      !peek(parser, TokenKind.BRACE_L) &&
      !peek(parser, TokenKind.AT) );
  }
  return types;
}

/**
 * FieldDefinition : Name ArgumentsDefinition? : Type
 */
function parseFieldDefinition(parser): FieldDefinition {
  const start = parser.token.start;
  const name = parseName(parser);
  const args = parseArgumentDefs(parser);
  expect(parser, TokenKind.COLON);
  const type = parseFieldDefinitionType(parser);
  const directives = parseDirectives(parser);
  return {
    kind: FIELD_DEFINITION,
    name,
    arguments: args,
    type,
    directives,
    loc: loc(parser, start),
  };
}

/**
 * ArgumentsDefinition : ( InputValueDefinition+ )
 */
function parseArgumentDefs(parser): Array<InputValueDefinition> {
  if (!peek(parser, TokenKind.PAREN_L)) {
    return [];
  }
  return many(parser, TokenKind.PAREN_L, parseInputValueDef, TokenKind.PAREN_R);
}

/**
 * InputValueDefinition : Name : Type = DefaultValue?
 */
function parseInputValueDef(parser): InputValueDefinition {
  const start = parser.token.start;
  const name = parseName(parser);
  expect(parser, TokenKind.COLON);
  const type = parseType(parser, false);
  let defaultValue = null;
  if (skip(parser, TokenKind.EQUALS)) {
    defaultValue = parseConstValue(parser);
  }
  return {
    kind: INPUT_VALUE_DEFINITION,
    name,
    type,
    defaultValue,
    loc: loc(parser, start),
  };
}

/**
 * InterfaceTypeDefinition : interface Name { FieldDefinition+ }
 */
function parseInterfaceTypeDefinition(parser): InterfaceTypeDefinition {
  const start = parser.token.start;
  expectKeyword(parser, 'interface');
  const name = parseName(parser);
  const directives = parseDirectives(parser);
  const fields = any(
    parser,
    TokenKind.BRACE_L,
    parseFieldDefinition,
    TokenKind.BRACE_R
  );
  return {
    kind: INTERFACE_TYPE_DEFINITION,
    name,
    fields,
    directives,
    loc: loc(parser, start),
  };
}

/**
 * UnionTypeDefinition : union Name = UnionMembers
 */
function parseUnionTypeDefinition(parser): UnionTypeDefinition {
  const start = parser.token.start;
  expectKeyword(parser, 'union');
  const name = parseName(parser);
  expect(parser, TokenKind.EQUALS);
  const types = parseUnionMembers(parser);
  const directives = parseDirectives(parser);
  return {
    kind: UNION_TYPE_DEFINITION,
    name,
    types,
    directives,
    loc: loc(parser, start),
  };
}

/**
 * UnionMembers :
 *   - NamedType
 *   - UnionMembers | NamedType
 */
function parseUnionMembers(parser): Array<NamedType> {
  const members = [];
  do {
    members.push(parseNamedType(parser));
  } while (skip(parser, TokenKind.PIPE));
  return members;
}

/**
 * ScalarTypeDefinition : scalar Name
 */
function parseScalarTypeDefinition(parser): ScalarTypeDefinition {
  const start = parser.token.start;
  expectKeyword(parser, 'scalar');
  const name = parseName(parser);
  return {
    kind: SCALAR_TYPE_DEFINITION,
    name,
    loc: loc(parser, start),
  };
}

/**
 * EnumTypeDefinition : enum Name { EnumValueDefinition+ }
 */
function parseEnumTypeDefinition(parser): EnumTypeDefinition {
  const start = parser.token.start;
  expectKeyword(parser, 'enum');
  const name = parseName(parser);
  const values = many(
    parser,
    TokenKind.BRACE_L,
    parseEnumValueDefinition,
    TokenKind.BRACE_R
  );
  return {
    kind: ENUM_TYPE_DEFINITION,
    name,
    values,
    loc: loc(parser, start),
  };
}

/**
 * EnumValueDefinition : EnumValue
 *
 * EnumValue : Name
 */
function parseEnumValueDefinition(parser) : EnumValueDefinition {
  const start = parser.token.start;
  const name = parseName(parser);
  return {
    kind: ENUM_VALUE_DEFINITION,
    name,
    loc: loc(parser, start),
  };
}

/**
 * InputObjectTypeDefinition : input Name { InputValueDefinition+ }
 */
function parseInputObjectTypeDefinition(parser): InputObjectTypeDefinition {
  const start = parser.token.start;
  expectKeyword(parser, 'input');
  const name = parseName(parser);
  const fields = any(
    parser,
    TokenKind.BRACE_L,
    parseInputValueDef,
    TokenKind.BRACE_R
  );
  return {
    kind: INPUT_OBJECT_TYPE_DEFINITION,
    name,
    fields,
    loc: loc(parser, start),
  };
}

/**
 * TypeExtensionDefinition : extend ObjectTypeDefinition
 */
function parseTypeExtensionDefinition(parser): TypeExtensionDefinition {
  const start = parser.token.start;
  expectKeyword(parser, 'extend');
  const definition = parseObjectTypeDefinition(parser);
  return {
    kind: TYPE_EXTENSION_DEFINITION,
    definition,
    loc: loc(parser, start),
  };
}

function parseMutationDefinition(parser): MutationDefinition {
  const start = parser.token.start;
  expectKeyword(parser, 'mutation');
  const name = parseName(parser);
  const args = parseArgumentDefs(parser);
  const directives = parseDirectives(parser);
  const fields = any(
    parser,
    TokenKind.BRACE_L,
    parseFieldDefinition,
    TokenKind.BRACE_R
  );
  return {
    kind: MUTATION_DEFINITION,
    name,
    arguments: args,
    fields,
    directives,
    loc: loc(parser, start),
  };
}

function parseFilterDefinition(parser): FilterDefinition {
  const start = parser.token.start;
  expectKeyword(parser, 'filter');
  expectKeyword(parser, 'on');

  let type;
  if (skip(parser, TokenKind.BRACKET_L)) {
    type = parseType(parser);
    expect(parser, TokenKind.BRACKET_R);
    type = {
      kind: LIST_TYPE,
      type,
      loc: loc(parser, start)
    };
  } else if (parser.token.kind === TokenKind.NAME &&
             parser.token.value === 'NodeConnection') {
    type = parseNodeConnectionDefinition(parser, true);
  } else if (parser.token.kind === TokenKind.NAME &&
             parser.token.value === 'ScalarConnection') {
    type = parseScalarConnectionDefinition(parser);
  } else if (parser.token.kind === TokenKind.NAME &&
             parser.token.value === 'ObjectConnection') {
    type = parseObjectConnectionDefinition(parser);
  } else {
    throw unexpected(parser);
  }

  const conditions = any(
    parser,
    TokenKind.BRACE_L,
    parseFilterCondition,
    TokenKind.BRACE_R
  );

  return {
    kind: FILTER_DEFINITION,
    type,
    conditions,
    loc: loc(parser, start),
  };
}

function parseFilterCondition(parser): FilterCondition {
  const start = parser.token.start;

  const key = parseEnumValueDefinition(parser);
  expect(parser, TokenKind.COLON);
  const args = parseArgumentDefs(parser);
  const condition = parseObject(parser, false);
  return {
    kind: FILTER_CONDITION,
    key,
    arguments: args,
    condition,
    loc: loc(parser, start),
  };
}

function parseOrderDefinition(parser): OrderDefinition {
  const start = parser.token.start;
  expectKeyword(parser, 'order');
  expectKeyword(parser, 'on');

  let type;
  if (skip(parser, TokenKind.BRACKET_L)) {
    type = parseType(parser);
    expect(parser, TokenKind.BRACKET_R);
    type = {
      kind: LIST_TYPE,
      type,
      loc: loc(parser, start)
    };
  } else if (parser.token.kind === TokenKind.NAME &&
             parser.token.value === 'NodeConnection') {
    type = parseNodeConnectionDefinition(parser, true);
  } else if (parser.token.kind === TokenKind.NAME &&
             parser.token.value === 'ScalarConnection') {
    type = parseScalarConnectionDefinition(parser);
  } else if (parser.token.kind === TokenKind.NAME &&
             parser.token.value === 'ObjectConnection') {
    type = parseObjectConnectionDefinition(parser);
  } else {
    throw unexpected(parser);
  }

  const expressions = any(
    parser,
    TokenKind.BRACE_L,
    parseOrderExpression,
    TokenKind.BRACE_R
  );

  return {
    kind: ORDER_DEFINITION,
    type,
    expressions,
    loc: loc(parser, start),
  };
}

function parseOrderExpression(parser): OrderExpression {
  const parseOrderObject = p => parseObject(p, false);
  const start = parser.token.start;

  const key = parseEnumValueDefinition(parser);
  expect(parser, TokenKind.COLON);
  const expression = many(
    parser,
    TokenKind.BRACKET_L,
    parseOrderObject,
    TokenKind.BRACKET_R
  );
  return {
    kind: ORDER_EXPRESSION,
    key,
    expression,
    loc: loc(parser, start),
  };
}


// Core parsing utility functions

/**
 * Returns the parser object that is used to store state throughout the
 * process of parsing.
 */
function makeParser(source: Source, options: ParseOptions) {
  const _lexToken = lex(source);
  return {
    _lexToken,
    source,
    options,
    prevEnd: 0,
    token: _lexToken(),
  };
}

/**
 * Returns a location object, used to identify the place in
 * the source that created a given parsed object.
 */
function loc(parser, start: number) {
  if (parser.options.noLocation) {
    return null;
  }
  if (parser.options.noSource) {
    return { start, end: parser.prevEnd };
  }
  return { start, end: parser.prevEnd, source: parser.source };
}

/**
 * Moves the internal parser object to the next lexed token.
 */
function advance(parser): void {
  const prevEnd = parser.token.end;
  parser.prevEnd = prevEnd;
  parser.token = parser._lexToken(prevEnd);
}

/**
 * Determines if the next token is of a given kind
 */
function peek(parser, kind: string): boolean {
  return parser.token.kind === kind;
}

/**
 * If the next token is of the given kind, return true after advancing
 * the parser. Otherwise, do not change the parser state and return false.
 */
function skip(parser, kind: string): boolean {
  const match = parser.token.kind === kind;
  if (match) {
    advance(parser);
  }
  return match;
}

/**
 * If the next token is of the given kind, return that token after advancing
 * the parser. Otherwise, do not change the parser state and return false.
 */
function expect(parser, kind: string): Token {
  const token = parser.token;
  if (token.kind === kind) {
    advance(parser);
    return token;
  }
  throw syntaxError(
    parser.source,
    token.start,
    `Expected ${getTokenKindDesc(kind)}, found ${getTokenDesc(token)}`
  );
}

/**
 * If the next token is a keyword with the given value, return that token after
 * advancing the parser. Otherwise, do not change the parser state and return
 * false.
 */
function expectKeyword(parser, value: string): Token {
  const token = parser.token;
  if (token.kind === TokenKind.NAME && token.value === value) {
    advance(parser);
    return token;
  }
  throw syntaxError(
    parser.source,
    token.start,
    `Expected "${value}", found ${getTokenDesc(token)}`
  );
}

/**
 * Helper function for creating an error when an unexpected lexed token
 * is encountered.
 */
function unexpected(parser, atToken?: ?Token): Error {
  const token = atToken || parser.token;
  return syntaxError(
    parser.source,
    token.start,
    `Unexpected ${getTokenDesc(token)}`
  );
}

/**
 * Returns a possibly empty list of parse nodes, determined by
 * the parseFn. This list begins with a lex token of openKind
 * and ends with a lex token of closeKind. Advances the parser
 * to the next lex token after the closing token.
 */
function any<T>(
  parser,
  openKind: string,
  parseFn: (parser: any) => T,
  closeKind: string
): Array<T> {
  expect(parser, openKind);
  const nodes = [];
  while (!skip(parser, closeKind)) {
    nodes.push(parseFn(parser));
  }
  return nodes;
}

/**
 * Returns a non-empty list of parse nodes, determined by
 * the parseFn. This list begins with a lex token of openKind
 * and ends with a lex token of closeKind. Advances the parser
 * to the next lex token after the closing token.
 */
function many<T>(
  parser,
  openKind: string,
  parseFn: (parser: any) => T,
  closeKind: string
): Array<T> {
  expect(parser, openKind);
  const nodes = [ parseFn(parser) ];
  while (!skip(parser, closeKind)) {
    nodes.push(parseFn(parser));
  }
  return nodes;
}
