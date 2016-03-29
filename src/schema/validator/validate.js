/* @flow */

import isNullish from '../../jsutils/isNullish';
import values from '../../jsutils/values';
import flatten from '../../jsutils/flatten2';
import type { Schema } from '../analyzer';
import type { ValidationContext, ValidationResult, Rules } from './types';
import { rootQueryFieldNames } from './utils';
import { allConnections } from '../analyzer';

import {
  validateEnum,
  validateInput,
  validateInterface,
  validateMutation,
  validateSchema,
  validateType,
  validateUnion,
  validateFilter,
  validateOrder,
} from './validators';

import {
  TYPE_RESERVED_WORDS,
  FIELD_RESERVED_WORDS,
  TYPE_RESERVED_SUFFIXES,
  ARGUMENT_RESERVED_WORDS,
} from './definitions';

import { rules as defaultRules } from './rules';

export function validate(
  schema: Schema,
  rules: Rules = defaultRules
): ValidationResult {
  if (isNullish(schema)) {
    throw new Error(`must pass schema.`);
  }

  const context: ValidationContext = {
    schema,
    TYPE_RESERVED_WORDS,
    FIELD_RESERVED_WORDS,
    TYPE_RESERVED_SUFFIXES,
    ARGUMENT_RESERVED_WORDS,
    rootQueryFieldNames: rootQueryFieldNames(schema),
    connections: allConnections(schema)
  };

  return [
    ...validateSchema(context, rules),
    ...flatten(values(schema).map(definition =>
      definition.kind === 'enum' ?
        validateEnum(definition, context, rules) :
      definition.kind === 'input' ?
        validateInput(definition, context, rules) :
      definition.kind === 'interface' ?
        validateInterface(definition, context, rules) :
      definition.kind === 'mutation' ?
        validateMutation(definition, context, rules) :
      definition.kind === 'type' ?
        validateType(definition, context, rules) :
      definition.kind === 'union' ?
        validateUnion(definition, context, rules) :
      definition.kind === 'filter' ?
        validateFilter(definition, context, rules) :
      definition.kind === 'order' ?
        validateOrder(definition, context, rules) :
      [ ]))
  ];
}
