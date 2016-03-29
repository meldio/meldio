/* @flow */

import values from '../../../../jsutils/values';
import keyMap from '../../../../jsutils/keyMap';
import type { TransformerAccumulator } from '../../types';
import type { VisitorMap } from '../../../analyzer';
import { print } from '../../../language';

export function RemoveFilterDefs(
  accumulator: TransformerAccumulator
): VisitorMap {
  return {
    FilterDefinition: nodeAST => {

      const name = 'Filter#' + print(nodeAST.type);

      const argASTs = [ ].concat(
        ...nodeAST.conditions.map(cond => cond.arguments));

      const uniqueArgs = values(keyMap(argASTs, ast => ast.name.value));

      // save the AST elements in the accumulator before removing the node
      accumulator.filterArguments[name] = uniqueArgs;

      return null; // deletes FilterDefinition ast node
    }
  };
}
