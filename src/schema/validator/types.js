/* @flow */
import type {
  Location, Schema, ConnectionDefinition,
  TypeDefinition, InterfaceDefinition, UnionDefinition,
  MutationDefinition, InputDefinition, EnumDefinition,
  FieldDefinition, ArgumentDefinition, DirectiveDefinition,
  FilterDefinition, FilterConditionDefinition,
  OrderDefinition, OrderExpressionDefinition,
 } from '../analyzer';

export type ValidationContext = {
  schema: Schema,
  TYPE_RESERVED_WORDS: Array<string>,
  FIELD_RESERVED_WORDS: Array<string>,
  TYPE_RESERVED_SUFFIXES: Array<string>,
  ARGUMENT_RESERVED_WORDS: Array<string>,
  rootQueryFieldNames: Array<string>,
  connections: Array<ConnectionDefinition>,
  type?: TypeDefinition,
  interface?: InterfaceDefinition,
  union?: UnionDefinition,
  mutation?: MutationDefinition,
  input?: InputDefinition,
  enum?: EnumDefinition,
  field?: FieldDefinition,
  argument?: ArgumentDefinition,
  directive?: DirectiveDefinition,
  filter?: FilterDefinition,
  condition?: FilterConditionDefinition,
  order?: OrderDefinition,
  expression?: OrderExpressionDefinition,
};

export type Warning = {
  kind: 'warning',
  description: string,
  loc?: ?Location
};

export type Error = {
  kind: 'error',
  description: string,
  loc?: ?Location
};

export type RuleResult = Array<Warning | Error> | Warning | Error | void;
export type ValidationResult = Array<Warning | Error>;

export type Rule = (context: ValidationContext) => RuleResult;
export type Rules = { [path: string]: Array<Rule> };
