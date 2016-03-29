/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import { visit, QueryDocumentKeys } from '../language/visitor';


export const SchemaKeys = {
  Document: [ 'definitions' ],

  ObjectTypeDefinition: QueryDocumentKeys.ObjectTypeDefinition,
  FieldDefinition: QueryDocumentKeys.FieldDefinition,
  InputValueDefinition: QueryDocumentKeys.InputValueDefinition,
  InterfaceTypeDefinition: QueryDocumentKeys.InterfaceTypeDefinition,
  UnionTypeDefinition: QueryDocumentKeys.UnionTypeDefinition,
  ScalarTypeDefinition: QueryDocumentKeys.ScalarTypeDefinition,
  EnumTypeDefinition: QueryDocumentKeys.EnumTypeDefinition,
  EnumValueDefinition: QueryDocumentKeys.EnumValueDefinition,
  InputObjectTypeDefinition: QueryDocumentKeys.InputObjectTypeDefinition,
  TypeExtensionDefinition: QueryDocumentKeys.TypeExtensionDefinition,
  MutationDefinition: QueryDocumentKeys.MutationDefinition,
  NodeConnectionDefinition: QueryDocumentKeys.NodeConnectionDefinition,
  ScalarConnectionDefinition: QueryDocumentKeys.ScalarConnectionDefinition,
  ObjectConnectionDefinition: QueryDocumentKeys.ObjectConnectionDefinition,
  EdgeDefinition: QueryDocumentKeys.EdgeDefinition,
  Directive: QueryDocumentKeys.Directive,
  FilterDefinition: QueryDocumentKeys.FilterDefinition,
  FilterCondition: QueryDocumentKeys.FilterCondition,
  OrderDefinition: QueryDocumentKeys.OrderDefinition,
  OrderExpression: QueryDocumentKeys.OrderExpression,

  IntValue: QueryDocumentKeys.IntValue,
  FloatValue: QueryDocumentKeys.FloatValue,
  StringValue: QueryDocumentKeys.StringValue,
  BooleanValue: QueryDocumentKeys.BooleanValue,
  EnumValue: QueryDocumentKeys.EnumValue,
  ListValue: QueryDocumentKeys.ListValue,
  ObjectValue: QueryDocumentKeys.ObjectValue,
  ObjectField: QueryDocumentKeys.ObjectField,

  Name: QueryDocumentKeys.Name,
  NamedType: QueryDocumentKeys.NamedType,
  ListType: QueryDocumentKeys.ListType,
  NonNullType: QueryDocumentKeys.NonNullType,
};

export function visitAST(root, visitor, keys) {
  return visit(root, visitor, keys || SchemaKeys);
}
