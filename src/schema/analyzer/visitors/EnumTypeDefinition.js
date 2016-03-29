/* @flow */

import type { AnalyzerContext, VisitorMap } from '../types';

export function EnumTypeDefinition(context: AnalyzerContext): VisitorMap {
  return {
    EnumTypeDefinition:
      node => {
        if (context.schema[node.name.value]) {
          throw new Error(`Name "${node.name.value}" cannot be redefined.`);
        }
        context.schema[node.name.value] = {
          kind: 'enum',
          name: node.name.value,
          ...!context.noLocation && node.loc ? {
            loc: {
              kind: 'location',
              start: node.loc.start,
              end: node.loc.end } } : {},
          values: node.values.map(valDefAST => valDefAST.name.value)
        };
        return undefined; // node remains unchanged
      }
  };
}
