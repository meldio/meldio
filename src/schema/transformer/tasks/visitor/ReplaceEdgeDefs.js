/* @flow */

import type { VisitorMap } from '../../../analyzer';

import { makeNamedType } from '../../../ast';
import { getEdgeName } from '../../../analyzer';

export function ReplaceEdgeDefs(): VisitorMap {
  return {
    EdgeDefinition: nodeAST => {
      const type = nodeAST.type.name.value;
      const edgeType = nodeAST.edgeType ?
        nodeAST.edgeType.name.value :
        null;
      const name = getEdgeName(type, edgeType);

      // replace EdgeDefinition ast node with NamedType node
      return makeNamedType(name);
    }
  };
}
