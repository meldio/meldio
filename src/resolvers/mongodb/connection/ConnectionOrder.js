/* @flow */
import type { ResolverContext } from '../../types';
import { SCALAR_TYPES } from '../../../schema/analyzer';

type OrderExpression = any;
type MongoSortExpression = any;
type Order = (order: OrderExpression) => MongoSortExpression;

export function ConnectionOrder(context: ResolverContext): Order {
  const { schema, edge, node } = context;

  const nodeIsScalar =
    SCALAR_TYPES.includes(node) ||
    schema[node] && schema[node].kind === 'enum';

  const edgeHasScalarFields = schema[edge] && schema[edge].fields &&
    schema[edge].fields.some(f => f.isScalar);

  if (nodeIsScalar && !edgeHasScalarFields) {
    return function (order) {
      return order && order.node ?
        { node: direction(order.node) } :
        { };
    };
  }

  if (nodeIsScalar && edgeHasScalarFields) {
    return function (order) {
      return order
        .map(o => ({
          ...o.node ? { node: direction(o.node) } : { },
          ...objectOrder(o, edge, 'edgeProps') }))
        .reduce( (acc, o) => ({ ...acc, ...o }), { });
    };
  }

  return function (order) {
    return order
      .map(o => ({
        ...objectOrder(o.node, node, 'node'),
        ...objectOrder(o, edge, 'edgeProps') }))
      .reduce( (acc, o) => ({ ...acc, ...o }), { });
  };

  function objectOrder(order, typeName: string, parentPath: string) {
    // istanbul ignore if
    if (!typeName || !schema[typeName] || !order) {
      return { };
    }

    const type = schema[typeName];
    const idPath = parentPath ? `${parentPath}._id` : `_id`;

    if (type.kind === 'type' && type.implementsNode) {
      return {
        ...order.id ? { [idPath]: direction(order.id) } : { },
        ...fieldsOrder({ ...order, id: undefined }, type.fields, parentPath)
      };
    } else if (type.kind === 'type') {
      return fieldsOrder(order, type.fields, parentPath);
    } else if (type.kind === 'union' && type.everyTypeImplementsNode) {
      return {
        ...order.id ? { [idPath]: direction(order.id) } : { },
      };
    } else if (type.kind === 'union') {
      // istanbul ignore next
      return { };
    } else if (type.kind === 'interface' && type.everyTypeImplementsNode) {
      return {
        ...order.id ? { [idPath]: direction(order.id) } : { },
        ...fieldsOrder({ ...order, id: undefined }, type.fields, parentPath)
      };
    } else if (type.kind === 'interface') {
      return fieldsOrder(order, type.fields, parentPath);
    }
    // istanbul ignore next
    return { };
  }

  function fieldsOrder(order, fields, parentPath: string): Object {
    return fields
      .filter(field => field.isScalar && order[field.name])
      .map(field => ({
        [parentPath ? `${parentPath}.${field.name}` : field.name]:
          direction(order[field.name]) }))
      .reduce( (acc, fld) => ({ ...acc, ...fld }), { });
  }

  function direction(order) {
    return order === 'ASCENDING' ? 1 : -1;
  }
}
