/* @flow */

import { OrderExpression } from '../mappers';
import type { AnalyzerContext, VisitorMap } from '../types';
import { ASTHelpers } from '../mappers/utils';
import { print } from '../../language';

export function OrderDefinition(context: AnalyzerContext): VisitorMap {
  const {
    isNodeConnectionField, isObjectConnectionField, isScalarConnectionField,
    getConnectionType, getConnectionEdgeType,
    isListOfScalarField,
    isListOfObjectField,
    getScalarType, getListType, getObjectType,
  } = ASTHelpers(context);

  return {
    OrderDefinition: node => {
      const isNode = typeName =>
        context.schema[typeName] &&
        (context.schema[typeName].implementsNode ||
         context.schema[typeName].everyTypeImplementsNode);

      const orderName = `Order#${ print(node.type) }`;

      if (context.schema[orderName]) {
        throw new Error(`Order on ${print(node.type)} cannot be redefined.`);
      }

      context.schema[orderName] = {
        kind: 'order',
        name: orderName,
        ...!context.noLocation && node.loc ? {
          loc: {
            kind: 'location',
            start: node.loc.start,
            end: node.loc.end } } : {},
        ...isNodeConnectionField(node) ? {
          isNodeConnection: true,
          type: getObjectType(getConnectionType(node)),
          edgeType: getConnectionEdgeType(node) } : {},
        ...isObjectConnectionField(node) ? {
          isObjectConnection: true,
          type: getObjectType(getConnectionType(node)),
          edgeType: getConnectionEdgeType(node) } : {},
        ...isScalarConnectionField(node) ? {
          isScalarConnection: true,
          type: getScalarType(getConnectionType(node)),
          edgeType: getConnectionEdgeType(node) } : {},
        ...isListOfScalarField(node) ? {
          isScalarList: true,
          type: getScalarType(getListType(node)) } : {},
        ...isListOfObjectField(node) &&
           isNode(getObjectType(getListType(node))) ? {
             isNodeList: true,
             type: getObjectType(getListType(node)) } : {},
        ...isListOfObjectField(node) &&
           !isNode(getObjectType(getListType(node))) ? {
             isObjectList: true,
             type: getObjectType(getListType(node)) } : {},
        expressions: node.expressions.map(OrderExpression(context)),
      };
      return undefined; // node remains unchanged
    }
  };
}
