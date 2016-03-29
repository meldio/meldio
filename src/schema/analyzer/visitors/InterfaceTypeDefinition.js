/* @flow */

import { Field, Directive } from '../mappers';
import type { AnalyzerContext, VisitorMap } from '../types';

export function InterfaceTypeDefinition(context: AnalyzerContext): VisitorMap {
  return {
    InterfaceTypeDefinition: node => {
      const interfaceName = node.name.value;

      if (context.schema[interfaceName]) {
        throw new Error(`Name "${interfaceName}" cannot be redefined.`);
      }

      context.schema[interfaceName] = {
        kind: 'interface',
        name: interfaceName,
        ...!context.noLocation && node.loc ? {
          loc: {
            kind: 'location',
            start: node.loc.start,
            end: node.loc.end } } : {},
        implementations: context.implementations[interfaceName] || [],
        everyTypeImplementsNode:
          (context.implementations[interfaceName] || []).length ?
            (context.implementations[interfaceName] || [])
              .every(typeName =>
                context.schema[typeName] &&
                context.schema[typeName].kind === 'type' &&
                context.schema[typeName].implementsNode) :
            false,
        noTypeImplementsNode:
          (context.implementations[interfaceName] || [])
            .every(typeName =>
              context.schema[typeName] &&
              context.schema[typeName].kind === 'type' &&
              !context.schema[typeName].implementsNode),
        fields: node.fields.map(Field(context)),
        directives: node.directives.map(Directive(context))
      };
    }
  };
}
