/* @flow */

import type { TransformerAccumulator } from '../../types';
import type { VisitorMap } from '../../../analyzer';

export function RemoveMutationDefs(
  accumulator: TransformerAccumulator
): VisitorMap {
  return {
    MutationDefinition: nodeAST => {

      const name = nodeAST.name.value;
      const argumentASTs = nodeAST.arguments;
      const fieldASTs = nodeAST.fields;

      // save the AST elements in the accumulator before removing the node
      accumulator.mutations.push({ name, argumentASTs, fieldASTs });

      return null; // deletes MutationDefinition ast node
    }
  };
}
