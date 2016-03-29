/* @flow */

import { Directive } from './Directive';
import { ASTHelpers } from './utils';

import type { AnalyzerContext, FieldMapper } from '../types';

export function Field(context: AnalyzerContext): FieldMapper {
  const directivesMapper = Directive(context);
  const {
    isRequiredField,
    isScalarField, getScalarType,
    isNumericField, getNumericType,
    isObjectField, getObjectType,
    isNodeConnectionField, isObjectConnectionField, isScalarConnectionField,
    getConnectionType, getConnectionRelatedField, getConnectionEdgeType,
    isEdgeField, getEdgeFieldType, getEdgeFieldEdgeType,
    getListType,
    isListOfScalarField,
    isListOfObjectField,
  } = ASTHelpers(context);

  return field => ({
    kind: 'field',
    name: field.name.value,
    ...!context.noLocation && field.loc ? {
      loc: {
        kind: 'location',
        start: field.loc.start,
        end: field.loc.end } } : {},
    isRequired: isRequiredField(field),
    ...isScalarField(field, context.schema) ? {
      isScalar: true,
      type: getScalarType(field) } : {},
    ...isNumericField(field) ? {
      isNumeric: true,
      type: getNumericType(field) } : {},
    ...isObjectField(field) ? {
      isObject: true,
      type: getObjectType(field) } : {},
    ...isNodeConnectionField(field) ? {
      isNodeConnection: true,
      type: getObjectType(getConnectionType(field)),
      relatedField: getConnectionRelatedField(field),
      edgeType: getConnectionEdgeType(field) } : {},
    ...isObjectConnectionField(field) ? {
      isObjectConnection: true,
      type: getObjectType(getConnectionType(field)),
      edgeType: getConnectionEdgeType(field) } : {},
    ...isScalarConnectionField(field) ? {
      isScalarConnection: true,
      type: getScalarType(getConnectionType(field)),
      edgeType: getConnectionEdgeType(field) } : {},
    ...isEdgeField(field) ? {
      isEdge: true,
      type: getEdgeFieldType(field),
      edgeType: getEdgeFieldEdgeType(field) } : {},
    ...isListOfScalarField(field) ? {
      isScalarList: true,
      type: getScalarType(getListType(field)) } : {},
    ...isListOfObjectField(field) ? {
      isObjectList: true,
      type: getObjectType(getListType(field)) } : {},
    hasArguments: Boolean(field.arguments && field.arguments.length),
    directives: (field.directives || []).map(directivesMapper)
  });
}
