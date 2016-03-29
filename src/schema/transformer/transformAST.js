/* @flow */

import isNullish from '../../jsutils/isNullish';
import type { Document } from '../language/ast';
import type { Schema } from '../analyzer';
import { visitAST } from '../visitor';
import type { TransformerContext, TransformerAccumulator } from './types';
import { allConnections, declaredLists } from '../analyzer';
import { makeVisitors, makeDefinitions } from './tasks';

export function transformAST(
  ast: Document,
  schema: Schema
): Document {
  if (isNullish(ast) || isNullish(schema)) {
    throw new Error('must pass ast and schema metadata.');
  }

  // accumulator is mutated by visitors
  const accumulator: TransformerAccumulator = {
    mutations: [ ],
    edgeTypeFields: { },
    filterArguments: { },
  };

  const context: TransformerContext = {
    schema,
    connections: allConnections(schema),
    lists: declaredLists(schema),
  };
  const visitedAst = makeVisitors(accumulator, context)
    .reduce(
      (intermediateAst, visitor) => visitAST(intermediateAst, {leave: visitor}),
      ast);

  return {
    ...visitedAst,
    definitions:
      visitedAst.definitions
        .concat(makeDefinitions(accumulator, context))
  };
}
