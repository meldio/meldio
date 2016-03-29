/* @flow */

import { ASTHelpers } from './utils';

import type {
  AnalyzerContext,
  ArgumentMapper,
  ArgumentDefinition
} from '../types';

import type { InputValueDefinition } from '../../language/ast';

export function Argument(context: AnalyzerContext): ArgumentMapper {
  const {
    isRequiredField,
    isScalarField, getScalarType,
    isNumericField, getNumericType,
    isObjectField, getObjectType,
    getListType,
    isListOfScalarField,
    isListOfObjectField,
  } = ASTHelpers(context);

  return function (argumentAST: InputValueDefinition): ArgumentDefinition {
    return {
      kind: 'argument',
      name: argumentAST.name.value,
      ...!context.noLocation && argumentAST.loc ? {
        loc: {
          kind: 'location',
          start: argumentAST.loc.start,
          end: argumentAST.loc.end } } : {},
      isRequired: isRequiredField(argumentAST),
      ...isScalarField(argumentAST, context.schema) ? {
        isScalar: true,
        type: getScalarType(argumentAST) } : {},
      ...isNumericField(argumentAST) ? {
        isNumeric: true,
        type: getNumericType(argumentAST) } : {},
      ...isObjectField(argumentAST) ? {
        isObject: true,
        type: getObjectType(argumentAST) } : {},
      ...isListOfScalarField(argumentAST) ? {
        isScalarList: true,
        type: getScalarType(getListType(argumentAST)) } : {},
      ...isListOfObjectField(argumentAST) ? {
        isObjectList: true,
        type: getObjectType(getListType(argumentAST)) } : {},
    };
  };
}
