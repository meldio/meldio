/* @flow */

import {
  NAMED_TYPE,
  NODE_CONNECTION_DEFINITION,
  SCALAR_CONNECTION_DEFINITION,
  OBJECT_CONNECTION_DEFINITION,
  EDGE_DEFINITION,
  LIST_TYPE,
  NON_NULL_TYPE,
} from '../../language/kinds';

import {
  NUMERIC_TYPES,
  SCALAR_TYPES,
} from '../definitions';

import type { AnalyzerContext } from '../types';


export function ASTHelpers(
  context: AnalyzerContext
): {
  isRequiredField: Function,
  isEnumField: Function,
  isScalarField: Function,
  getScalarType: Function,
  isNumericField: Function,
  getNumericType: Function,
  isEdgeField: Function,
  getEdgeFieldType: Function,
  getEdgeFieldEdgeType: Function,
  isConnectionField: Function,
  getConnectionType: Function,
  getConnectionRelatedField: Function,
  getConnectionEdgeType: Function,
  isScalarConnectionField: Function,
  isObjectConnectionField: Function,
  isNodeConnectionField: Function,
  isListField: Function,
  isObjectField: Function,
  getListType: Function,
  getObjectType: Function,
  isListOfScalarField: Function,
  isListOfObjectField: Function,
} {

  const isRequiredField = fieldAST =>
    fieldAST.type.kind === NON_NULL_TYPE;

  const isEnumField = fieldAST =>
    fieldAST.type.kind === NAMED_TYPE &&
        context.schema[fieldAST.type.name.value] &&
        context.schema[fieldAST.type.name.value].kind === 'enum' ||
    fieldAST.type.kind === NON_NULL_TYPE &&
       isEnumField(fieldAST.type);

  // scalars are SCALAR_TYPES, enums and NonNull instances of those two
  const isScalarField = fieldAST =>
    fieldAST.type.kind === NAMED_TYPE && (
        SCALAR_TYPES.includes(fieldAST.type.name.value) ||
        isEnumField(fieldAST)) ||
    fieldAST.type.kind === NON_NULL_TYPE &&
       isScalarField(fieldAST.type);

  const getScalarType = fieldAST => {
    if (fieldAST.type.kind === NON_NULL_TYPE) {
      return getScalarType(fieldAST.type);
    } // else if (fieldAST.type.kind === NAMED_TYPE) {
    return fieldAST.type.name.value;
  };

  // numerics are Int, Float and NonNull insances of those
  const isNumericField = fieldAST =>
    fieldAST.type.kind === NAMED_TYPE &&
      NUMERIC_TYPES.includes(fieldAST.type.name.value) ||
    fieldAST.type.kind === NON_NULL_TYPE &&
      isNumericField(fieldAST.type);

  const getNumericType = fieldAST => {
    if (fieldAST.type.kind === NON_NULL_TYPE) {
      return getNumericType(fieldAST.type);
    } // else if (fieldAST.type.kind === NAMED_TYPE) {
    return fieldAST.type.name.value;
  };

  const isEdgeField = fieldAST =>
    fieldAST.type.kind === EDGE_DEFINITION ||
    fieldAST.type.kind === NON_NULL_TYPE && isEdgeField(fieldAST.type);

  const getEdgeFieldType = fieldAST => {
    if (fieldAST.type.kind === NON_NULL_TYPE) {
      return getEdgeFieldType(fieldAST.type);
    }
    return fieldAST.type.type.name.value;
  };

  const getEdgeFieldEdgeType = fieldAST => {
    if (fieldAST.type.kind === NON_NULL_TYPE) {
      return getEdgeFieldEdgeType(fieldAST.type);
    }
    return fieldAST.type.edgeType ?
      fieldAST.type.edgeType.name.value :
      null;
  };

  const CONNECTION_DEFINITION_KINDS = [
    NODE_CONNECTION_DEFINITION,
    SCALAR_CONNECTION_DEFINITION,
    OBJECT_CONNECTION_DEFINITION,
  ];

  // Connection can be NodeConnection, ObjectConnection or ScalarConnection
  const isConnectionField = fieldAST =>
    CONNECTION_DEFINITION_KINDS.includes(fieldAST.type.kind) ||
    fieldAST.type.kind === NON_NULL_TYPE && isConnectionField(fieldAST.type);

  const getConnectionType = fieldAST => {
    if (fieldAST.type.kind === NON_NULL_TYPE) {
      return getConnectionType(fieldAST.type);
    } // else if (fieldAST.type.kind in CONNECTION_DEFINITION_KINDS)
    return fieldAST.type;
  };

  const getConnectionRelatedField = fieldAST => {
    if (fieldAST.type.kind === NON_NULL_TYPE) {
      return getConnectionRelatedField(fieldAST.type);
    }
    return fieldAST.type.relatedField ?
      fieldAST.type.relatedField.value :
      null;
  };

  const getConnectionEdgeType = fieldAST => {
    if (fieldAST.type.kind === NON_NULL_TYPE) {
      return getConnectionEdgeType(fieldAST.type);
    }
    return fieldAST.type.edgeType ?
      fieldAST.type.edgeType.name.value :
      null;
  };

  const isScalarConnectionField = fieldAST =>
    fieldAST.type.kind === SCALAR_CONNECTION_DEFINITION ||
    fieldAST.type.kind === NON_NULL_TYPE &&
      isScalarConnectionField(fieldAST.type);

  const isObjectConnectionField = fieldAST =>
    fieldAST.type.kind === OBJECT_CONNECTION_DEFINITION ||
    fieldAST.type.kind === NON_NULL_TYPE &&
      isObjectConnectionField(fieldAST.type);

  const isNodeConnectionField = fieldAST =>
    fieldAST.type.kind === NODE_CONNECTION_DEFINITION ||
    fieldAST.type.kind === NON_NULL_TYPE &&
      isNodeConnectionField(fieldAST.type);

  const isListField = fieldAST =>
    fieldAST.type.kind === LIST_TYPE ||
    fieldAST.type.kind === NON_NULL_TYPE && isListField(fieldAST.type);

  const isObjectField = fieldAST =>
    !isConnectionField(fieldAST) &&
    !isEdgeField(fieldAST) &&
    !isListField(fieldAST) &&
    !isScalarField(fieldAST);

  const getListType = fieldAST => {
    if (fieldAST.type.kind === NON_NULL_TYPE) {
      return getListType(fieldAST.type);
    } // else if (fieldAST.type.kind === LIST_TYPE)
    return fieldAST.type;
  };

  const getObjectType = fieldAST => {
    if (fieldAST.type.kind === NAMED_TYPE) {
      return fieldAST.type.name.value;
    } else if (fieldAST.type.kind === NON_NULL_TYPE) {
      return getObjectType(fieldAST.type);
    }
  };

  const isListOfScalarField = fieldAST =>
    isListField(fieldAST) &&
    isScalarField(getListType(fieldAST));

  // this will catch lists of lists (on purpose), interfaces, types and unions
  const isListOfObjectField = fieldAST =>
    isListField(fieldAST) &&
    !isScalarField(getListType(fieldAST));

  return {
    isRequiredField,
    isEnumField,
    isScalarField,
    getScalarType,
    isNumericField,
    getNumericType,
    isEdgeField,
    getEdgeFieldType,
    getEdgeFieldEdgeType,
    isConnectionField,
    getConnectionType,
    getConnectionRelatedField,
    getConnectionEdgeType,
    isScalarConnectionField,
    isObjectConnectionField,
    isNodeConnectionField,
    isListField,
    isObjectField,
    getListType,
    getObjectType,
    isListOfScalarField,
    isListOfObjectField,
  };
}
