import { typeFromGlobalId, isGlobalId } from '../../../jsutils/globalId';
import keyMap from '../../../jsutils/keyMap';
import invariant from '../../../jsutils/invariant';
import flatten from '../../../jsutils/flatten2';
import atMostOneOf from '../../../jsutils/atMostOneOf';
import { permissionFilter } from '../common';
import { ListFilter } from './ListFilter';
import { ListOrder } from './ListOrder';
import { Kind } from 'graphql/language';
import { GraphQLError } from 'graphql/error';
import { GraphQLList } from 'graphql';
import { isValidJSValue, valueFromAST } from 'graphql/utilities';
import {
  MAJORITY_READ_OPTIONS,
  LOCAL_READ_OPTIONS,
} from '../common';

export function NodeList({
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

  const typeNames = type.kind === 'type' ? [ type.name ] :
    type.kind === 'union' ? type.typeNames :
    type.kind === 'interface' ? type.implementations : [ ];
  invariant(typeNames.length, 'union or interface must have implementations');

  const filterList = ListFilter({ schema, typeName });
  const orderList = ListOrder({ schema, typeName });

  return async function (parent, args, info) {
    const { rootValue } = info;
    const { db, config } = rootValue;
    const { first, last, filterBy, filter, orderBy, order } = args;

    const readOptions = config.committedReads ?
      MAJORITY_READ_OPTIONS :
      LOCAL_READ_OPTIONS;

    const ids = parent[field];

    if (!ids) {
      return null;
    }

    if (!ids.length) {
      return [ ];
    }

    const idMap = ids
      .filter(id => isGlobalId(id))
      .reduce((acc, id) =>
        typeNames.includes(typeFromGlobalId(id)) ?
          {
            ...acc,
            [typeFromGlobalId(id)]:
              (acc[typeFromGlobalId(id)] || [ ]).concat(id)
          } :
          acc,
        { });

    if (!Object.keys(idMap).length) {
      return [ ];
    }
    const queries = Object.keys(idMap).map(async coll => {
      const permFilter = await permissionFilter(schema, rootValue, coll);
      if (!permFilter) {
        return [ ];
      }

      const query = {
        $and: [
          ...permFilter,
          {
            _id:
              idMap[coll].length === 1 ?
                idMap[coll][0] :
                { $in: idMap[coll] }
          }
        ]};

      return db.collection(coll, readOptions)
        .find(query)
        .toArray();
    });

    const results = await Promise.all(queries);
    const resultsMap = keyMap(flatten(results), res => res._id);
    let list = ids.map(id => resultsMap[id] || null);

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
