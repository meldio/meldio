/* @flow */

import { Field, Directive } from '../mappers';
import type { AnalyzerContext, VisitorMap } from '../types';

export function ObjectTypeDefinition(context: AnalyzerContext): VisitorMap {
  return {
    ObjectTypeDefinition:
      node => {
        const typeName = node.name.value;

        if (context.schema[typeName]) {
          throw new Error(`Name "${typeName}" cannot be redefined.`);
        }

        node.interfaces.forEach(namedTypeAST =>
            context.implementations[namedTypeAST.name.value] =
              (context.implementations[namedTypeAST.name.value] || [])
                .concat(typeName));

        context.schema[typeName] = {
          kind: 'type',
          name: typeName,
          ...!context.noLocation && node.loc ? {
            loc: {
              kind: 'location',
              start: node.loc.start,
              end: node.loc.end } } : {},
          implementsInterfaces: node.interfaces
            .map(namedTypeAST => namedTypeAST.name.value),
          implementsNode: node.interfaces
            .map(namedTypeAST => namedTypeAST.name.value)
            .includes('Node'),
          memberOfUnions: [ ], // will be pupulated in the susequent pass
          fields: node.fields.map(Field(context)),
          directives: node.directives.map(Directive(context))
        };
        return undefined; // node remains unchanged
      }
  };
}
