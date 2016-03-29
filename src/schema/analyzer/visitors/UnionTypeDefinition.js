/* @flow */

import { Directive } from '../mappers';
import type { AnalyzerContext, VisitorMap } from '../types';

export function UnionTypeDefinition(context: AnalyzerContext): VisitorMap {
  return {
    UnionTypeDefinition: node => {

      if (context.schema[node.name.value]) {
        throw new Error(`Name "${node.name.value}" cannot be redefined.`);
      }

      node.types.forEach(namedTypeAST =>
        context.unionMembership[namedTypeAST.name.value] =
          (context.unionMembership[namedTypeAST.name.value] || [])
            .concat(node.name.value));

      context.schema[node.name.value] = {
        kind: 'union',
        name: node.name.value,
        ...!context.noLocation && node.loc ? {
          loc: {
            kind: 'location',
            start: node.loc.start,
            end: node.loc.end } } : {},
        typeNames: node.types
          .map(namedTypeAST => namedTypeAST.name.value),
        everyTypeImplementsNode: node.types
          .map(namedTypeAST => namedTypeAST.name.value)
          .every(typeName =>
            context.schema[typeName] &&
            context.schema[typeName].kind === 'type' &&
            context.schema[typeName].implementsNode),
        noTypeImplementsNode: node.types
          .map(namedTypeAST => namedTypeAST.name.value)
          .every(typeName =>
            context.schema[typeName] &&
            context.schema[typeName].kind === 'type' &&
            !context.schema[typeName].implementsNode),
        directives: node.directives.map(Directive(context))
      };
    }
  };
}
