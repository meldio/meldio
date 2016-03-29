/* @flow */

export type Schema = {
  [name: string]: Definition
};

export type VisitorMap = {
  [key: string]: Function
}

export type AnalyzerContext = {
  schema: Schema,
  implementations: { [interfaceName: string]: Array<string> },
  unionMembership: { [typeName: string]: Array<string> },
  noLocation: boolean
};

export type Location = {
  kind: 'location',
  start: number,
  end: number
}

export type Definition = TypeDefinition |
                         InterfaceDefinition |
                         UnionDefinition |
                         MutationDefinition |
                         InputDefinition |
                         EnumDefinition |
                         FilterDefinition |
                         OrderDefinition;

export type TypeDefinition = {
  kind: 'type',
  name: string,
  loc?: ?Location,
  implementsInterfaces: Array<string>,
  implementsNode: boolean,
  memberOfUnions: Array<string>,
  fields: Array<FieldDefinition>,
  directives: Array<DirectiveDefinition>,
};

export type InterfaceDefinition = {
  kind: 'interface',
  name: string,
  loc?: ?Location,
  implementations: Array<string>,
  everyTypeImplementsNode: boolean,
  noTypeImplementsNode: boolean,
  fields: Array<FieldDefinition>,
  isSystemDefined?: boolean,
  directives: Array<DirectiveDefinition>,
};

export type UnionDefinition = {
  kind: 'union',
  name: string,
  loc?: ?Location,
  typeNames: Array<string>,
  everyTypeImplementsNode: boolean,
  noTypeImplementsNode: boolean,
  directives: Array<DirectiveDefinition>,
};

export type MutationDefinition = {
  kind: 'mutation',
  name: string,
  loc?: ?Location,
  arguments: Array<ArgumentDefinition>,
  fields: Array<FieldDefinition>,
  directives: Array<DirectiveDefinition>,
};

export type InputDefinition = {
  kind: 'input',
  name: string,
  loc?: ?Location,
  arguments: Array<ArgumentDefinition>,
};

export type EnumDefinition = {
  kind: 'enum',
  name: string,
  loc?: ?Location,
  values: Array<string>,
};

export type FilterDefinition = {
  kind: 'filter',
  name: string,
  loc?: ?Location,
  isNodeConnection?: ?boolean,
  isObjectConnection?: ?boolean,
  isScalarConnection?: ?boolean,
  isNodeList?: ?boolean,
  isObjectList?: ?boolean,
  isScalarList?: ?boolean,
  type: string,
  edgeType?: ?string,
  conditions: Array<FilterConditionDefinition>,
};

import type { ObjectValue } from '../language/ast';

export type FilterConditionDefinition = {
  kind: 'filter-condition',
  key: string,
  loc?: ?Location,
  arguments: Array<ArgumentDefinition>,
  conditionAST: ObjectValue,
}

export type OrderDefinition = {
  kind: 'order',
  name: string,
  loc?: ?Location,
  isNodeConnection?: ?boolean,
  isObjectConnection?: ?boolean,
  isScalarConnection?: ?boolean,
  isNodeList?: ?boolean,
  isObjectList?: ?boolean,
  isScalarList?: ?boolean,
  type: string,
  edgeType?: ?string,
  expressions: Array<OrderExpressionDefinition>,
};

export type OrderExpressionDefinition = {
  kind: 'order-expression',
  loc?: ?Location,
  key: string,
  expressionASTs: Array<ObjectValue>,
}

export type FieldDefinition = {
  kind: 'field',
  name: string,
  loc?: ?Location,
  isRequired: boolean,
  isScalar?: ?boolean,
  isNumeric?: ?boolean,
  isObject?: ?boolean,
  isNode?: ?boolean,
  isNodeConnection?: ?boolean,
  isObjectConnection?: ?boolean,
  isScalarConnection?: ?boolean,
  isEdge?: ?boolean,
  isNodeList?: ?boolean,
  isObjectList?: ?boolean,
  isScalarList?: ?boolean,
  type: string,
  relatedField?: ?string,
  edgeType?: ?string,
  hasArguments: boolean,
  directives: Array<DirectiveDefinition>,
};

export type ArgumentDefinition = {
  kind: 'argument',
  name: string,
  loc?: ?Location,
  isRequired: boolean,
  isScalar?: ?boolean,
  isNumeric?: ?boolean,
  isObject?: ?boolean,
  isScalarList?: ?boolean,
  isObjectList?: ?boolean,
  type: string,
};

export type DirectiveDefinition = {
  kind: 'directive',
  name: string,
  loc?: ?Location,
  arguments: Array<DirectiveArgumentDefinition>,
};

export type DirectiveArgumentDefinition = {
  kind: 'directive-argument',
  name: string,
  type?: string,
  value: (boolean | string | number | void)
};

// // // // // //

export type TypeDirectiveDefinition = {
  kind: 'directive',
  name: string,
  parentTypeName: string,
  arguments: Array<DirectiveArgumentDefinition>,
};

export type FieldDirectiveDefinition = {
  kind: 'directive',
  name: string,
  parentTypeName: string,
  parentFieldName: string,
  parentFieldType: string,
  arguments: Array<DirectiveArgumentDefinition>,
};

import type { Directive } from '../language/ast';
export type DirectiveMapper = (directiveAST: Directive) => DirectiveDefinition;

import type { InputValueDefinition } from '../language/ast';
export type ArgumentMapper =
  (argumentAST: InputValueDefinition) => ArgumentDefinition;

import type { Field } from '../language/ast';
export type FieldMapper = (fieldAST: Field) => FieldDefinition;

import type { FilterCondition } from '../language/ast';
export type FilterConditionMapper =
  (filterConditionAST: FilterCondition) => FilterConditionDefinition;

import type { OrderExpression } from '../language/ast';
export type OrderExpressionMapper =
  (orderExpressionAST: OrderExpression) => OrderExpressionDefinition;

export type ListDefinition = {
  kind: ('ScalarList' | 'ObjectList' | 'NodeList'),
  type: string,
};

export type ConnectionDefinition = {
  kind: ('ScalarConnection' | 'ObjectConnection' | 'NodeConnection'),
  name: string,
  edgeType: string,
  type: string,
};
