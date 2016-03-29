/* @flow */

import isNullish from '../../jsutils/isNullish';
import { visitAST } from '../visitor';
import {
  EnumTypeDefinition,
  ObjectTypeDefinition,
  InterfaceTypeDefinition,
  UnionTypeDefinition,
  InputObjectTypeDefinition,
  MutationDefinition,
  FilterDefinition,
  OrderDefinition,
} from './visitors';

import type { Document } from '../language/ast';
import type { Schema, AnalyzerContext } from './types';

/**
 * Configuration options to control parser behavior
 */
export type AnalyzerOptions = {
  /**
   * By default, analyzer trensfer location information from AST. This can
   * be disabled for testing or performance.
   */
  noLocation?: boolean,
};

const defaultOptions: AnalyzerOptions = {
  noLocation: false
};

export function analyzeAST(ast: Document, options?: AnalyzerOptions): Schema {
  if (isNullish(ast)) {
    throw new Error('must pass ast.');
  }

  const context: AnalyzerContext = {
    schema: { },
    implementations: { },
    unionMembership: { },
    noLocation: Boolean((options || defaultOptions).noLocation)
  };

  // First pass:
  // Visit type definitions and pick up schema information:
  visitAST(ast, EnumTypeDefinition(context));
  visitAST(ast, ObjectTypeDefinition(context));
  addNodeDefinition(context);
  visitAST(ast, InterfaceTypeDefinition(context));
  visitAST(ast, UnionTypeDefinition(context));
  visitAST(ast, InputObjectTypeDefinition(context));
  visitAST(ast, MutationDefinition(context));
  visitAST(ast, FilterDefinition(context));
  visitAST(ast, OrderDefinition(context));

  // Second pass:
  // 1. Go over types and interfaces and if field has isObject or isObjectList
  //    flags and the target implements Node, set isNode or isNodeList flags.
  // 2. Set memberOfUnions for each type using context.unionMembership map

  Object.keys(context.schema)
    .forEach(name => {
      const type = context.schema[name];
      if (type.kind === 'type' || type.kind === 'interface') {
        type.fields = type.fields.map(field => {
          const target = context.schema[field.type];
          if (Boolean(target) &&
                (target.implementsNode || target.everyTypeImplementsNode)) {
            if (field.isObject) {
              delete field.isObject;
              return { ...field, isNode: true };
            } else if (field.isObjectList) {
              delete field.isObjectList;
              return { ...field, isNodeList: true };
            }
          }
          return field;
        });
      }
      if (type.kind === 'type') {
        type.memberOfUnions = context.unionMembership[name] || [ ];
      }
    });

  return context.schema;
}

function addNodeDefinition(context: AnalyzerContext) {
  if (context.schema['Node']) {
    throw new Error(`Name "Node" cannot be redefined.`);
  }
  context.schema['Node'] = {
    kind: 'interface',
    name: 'Node',
    implementations: context.implementations['Node'] || [ ],
    everyTypeImplementsNode: true,
    noTypeImplementsNode: false,
    fields: [ {
      kind: 'field',
      name: 'id',
      isRequired: true,
      isScalar: true,
      type: 'ID',
      hasArguments: false,
      directives: [ ] } ],
    isSystemDefined: true,
    directives: [ ]
  };
}
