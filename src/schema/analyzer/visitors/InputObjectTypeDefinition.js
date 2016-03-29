/* @flow */

import { Argument } from '../mappers';
import type { AnalyzerContext, VisitorMap } from '../types';

export function InputObjectTypeDefinition(
  context: AnalyzerContext
) : VisitorMap {
  return {
    InputObjectTypeDefinition:
      node => {
        const inputObjectName = node.name.value;

        if (context.schema[inputObjectName]) {
          throw new Error(`Name "${inputObjectName}" cannot be redefined.`);
        }

        context.schema[inputObjectName] = {
          kind: 'input',
          name: inputObjectName,
          ...!context.noLocation && node.loc ? {
            loc: {
              kind: 'location',
              start: node.loc.start,
              end: node.loc.end } } : {},
          arguments: node.fields.map(Argument(context)) };
        return undefined; // node remains unchanged
      }
  };
}
