/* @flow */

import type { VisitorMap } from '../../../analyzer';

import { makeNamedType } from '../../../ast';
import { getConnectionName } from '../../../analyzer';

export function ReplaceObjectConnectionDefs(): VisitorMap {
  return {
    ObjectConnectionDefinition: nodeAST => {
      const type = nodeAST.type.name.value;
      const edgeType = nodeAST.edgeType ?
        nodeAST.edgeType.name.value :
        null;
      const name = getConnectionName(type, edgeType);

      // replace ObjectConnectionDefinition ast node with NamedType node
      return makeNamedType(name);
    }
  };
}
