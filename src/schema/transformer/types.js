/* @flow */

import type { Schema, ConnectionDefinition, ListDefinition } from '../analyzer';
import type { Field, Argument, InputValueDefinition } from '../language/ast';

export type TransformerContext = {
  schema: Schema,
  connections: Array<ConnectionDefinition>,
  lists: Array<ListDefinition>,
};

type AccumulatedMutation = {
  name: string,
  argumentASTs: Array<Argument>,
  fieldASTs: Array<Field>
}

export type TransformerAccumulator = {
  mutations: Array<AccumulatedMutation>,
  edgeTypeFields: { [typeName: string]: Array<Field> },
  filterArguments: { [filterName: string]: Array<InputValueDefinition> },
}
