/* @flow */

import type { VisitorMap } from '../../../analyzer';

import { makeNamedType } from '../../../ast';
import { getConnectionName } from '../../../analyzer';

export function ReplaceScalarConnectionDefs(): VisitorMap {
  return {
    ScalarConnectionDefinition: nodeAST => {
      const type = nodeAST.type.name.value;
      const edgeType = nodeAST.edgeType ?
        nodeAST.edgeType.name.value :
        null;
      const name = getConnectionName(type, edgeType);

      // replace ScalarConnectionDefinition ast node with NamedType node
      return makeNamedType(name);
    }
  };
}
