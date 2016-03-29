/* @flow */

import { Argument, Field, Directive } from '../mappers';
import type { AnalyzerContext, VisitorMap } from '../types';

export function MutationDefinition(context: AnalyzerContext): VisitorMap {
  return {
    MutationDefinition: node => {
      const mutationName = node.name.value;

      if (context.schema[mutationName]) {
        throw new Error(`Name "${mutationName}" cannot be redefined.`);
      }

      context.schema[mutationName] = {
        kind: 'mutation',
        name: mutationName,
        ...!context.noLocation && node.loc ? {
          loc: {
            kind: 'location',
            start: node.loc.start,
            end: node.loc.end } } : {},
        arguments: node.arguments.map(Argument(context)),
        fields: node.fields.map(Field(context)),
        directives: node.directives.map(Directive(context))
      };
      return undefined; // node remains unchanged
    }
  };
}
