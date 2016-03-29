import invariant from '../../../jsutils/invariant';
import atMostOneOf from '../../../jsutils/atMostOneOf';
import { ListFilter } from './ListFilter';
import { ListOrder } from './ListOrder';
import { Kind } from 'graphql/language';
import { GraphQLError } from 'graphql/error';
import { GraphQLList } from 'graphql';
import { isValidJSValue, valueFromAST } from 'graphql/utilities';

export function ObjectList({
  schema,
  typeName,
  field,
  filterInputObjectDefinition,
  orderInputObjectDefinition,
}) {
  const type = schema[typeName];
  invariant(type, 'type must be passed to resolver');

  const filterName = `Filter#[${typeName}]`;
  const filterConditions =
    schema[filterName] ?
      schema[filterName].conditions
        .reduce( (acc, cond) => ({...acc, [cond.key]: cond.conditionAST}), {}) :
      { };

  const orderName = `Order#[${typeName}]`;
  const orderExpressions =
    schema[orderName] ?
      schema[orderName].expressions
        .reduce( (acc, exp) => ({...acc, [exp.key]: exp.expressionASTs}), {}) :
      { };

  const filterList = ListFilter({ schema, typeName });
  const orderList = ListOrder({ schema, typeName });

  return async function (parent, args) {
    const { first, last, filterBy, filter, orderBy, order } = args;

    const objects = parent[field];

    if (!objects) {
      return null;
    }

    if (!objects.length) {
      return [ ];
    }

    let list = [ ...objects ];

    if (!atMostOneOf(filterBy, filter)) {
      throw new GraphQLError('List cannot specify more than one filter.');
    }

    let filterValue = null;
    if (filterBy) {
      filterValue = filterBy;
    } else if (filter) {
      const valueAST = filterConditions[filter];
      // TODO: pass only args relevant to given filter key:
      filterValue = valueFromAST(valueAST, filterInputObjectDefinition, args);
      const validationResults =
        isValidJSValue(filterValue, filterInputObjectDefinition);
      if (validationResults.length) {
        throw new GraphQLError(`List filter validation failed:\n` +
                               validationResults.join('\n'));
      }
    }
    list = filterValue ? filterList(filterValue, list) : list;

    if (!atMostOneOf(orderBy, order)) {
      throw new GraphQLError('List cannot specify more than one order.');
    }

    let orderValue = null;
    if (orderBy) {
      orderValue = orderBy;
    } else if (order) {
      const valueAST = {
        kind: Kind.LIST,
        values: orderExpressions[order],
      };
      const orderListType = new GraphQLList(orderInputObjectDefinition);
      orderValue = valueFromAST(valueAST, orderListType);
      const validationResults = isValidJSValue(orderValue, orderListType);
      if (validationResults.length) {
        throw new GraphQLError(`List order validation failed:\n` +
                               validationResults.join('\n'));
      }
    }
    list = orderValue ? orderList(orderValue, list) : list;

    list = first ? list.slice(0, first) : list;
    list = last ? list.slice(-last) : list;

    return list;
  };
}
