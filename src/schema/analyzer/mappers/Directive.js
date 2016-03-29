/* @flow */

import type { AnalyzerContext, DirectiveMapper } from '../types';

const SCALAR_KINDS = {
  IntValue: 'Int',
  FloatValue: 'Float',
  StringValue: 'String',
  BooleanValue: 'Boolean',
  EnumValue: 'Enum'
};

export function Directive(context: AnalyzerContext): DirectiveMapper {
  return directiveAST => ({
    kind: 'directive',
    name: directiveAST.name.value,
    ...!context.noLocation && directiveAST.loc ? {
      loc: {
        kind: 'location',
        start: directiveAST.loc.start,
        end: directiveAST.loc.end } } : {},
    arguments: (directiveAST.arguments || [ ])
      .map(argument => ({
        kind: 'directive-argument',
        name: argument.name.value,
        ...argument.value.kind === 'IntValue' ||
           argument.value.kind === 'FloatValue' ||
           argument.value.kind === 'EnumValue' ||
           argument.value.kind === 'StringValue' ||
           argument.value.kind === 'BooleanValue' ? {
             type: SCALAR_KINDS[argument.value.kind],
             value: argument.value.value
           } : {
             type: undefined,
             value: undefined
           }
      }))
  });
}
