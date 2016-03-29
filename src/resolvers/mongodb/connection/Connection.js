import isNullish from '../../../jsutils/isNullish';
import atMostOneOf from '../../../jsutils/atMostOneOf';
import { encode } from '../../../jsutils/globalId';
import { offsetToCursor, extractAggregations } from '../../common';
import { permissionFilter } from '../common';
import { ConnectionFilter } from './ConnectionFilter';
import { ConnectionCountFilter } from './ConnectionCountFilter';
import { ConnectionOrder } from './ConnectionOrder';
import { pagingBuilder } from './pagingBuilder';
import { aggregationBuilder } from './aggregationBuilder';
import { Kind } from 'graphql/language';
import { GraphQLError } from 'graphql/error';
import { GraphQLList } from 'graphql';
import { isValidJSValue, valueFromAST } from 'graphql/utilities';
import {
  MAJORITY_READ_OPTIONS,
  LOCAL_READ_OPTIONS,
} from '../common';

export function Connection({
  schema,
  kind,
  node,
  edge,
  InitialStages,
  collection,
  aggFieldDefinitions,
  filterInputObjectDefinition,
  orderInputObjectDefinition,
}) {
  const filterBuilder = ConnectionFilter({ schema, node, edge });
  const countFilterBuilder = ConnectionCountFilter({ schema, node, edge });
  const orderBuilder = ConnectionOrder({ schema, node, edge });

  const filterName = `Filter#${kind}(${node}${edge ? `, ${edge}` : ``})`;
  const filterConditions =
    schema[filterName] ?
      schema[filterName].conditions
        .reduce( (acc, cond) => ({...acc, [cond.key]: cond.conditionAST}), {}) :
      { };
  const orderName = `Order#${kind}(${node}${edge ? `, ${edge}` : ``})`;
  const orderExpressions =
    schema[orderName] ?
      schema[orderName].expressions
        .reduce( (acc, exp) => ({...acc, [exp.key]: exp.expressionASTs}), {}) :
      { };

  const isNode =
    schema[node] && schema[node].kind === 'type' ?
      schema[node].implementsNode :
    schema[node] && (schema[node].kind === 'union' ||
                     schema[node].kind === 'interface') ?
      schema[node].everyTypeImplementsNode :
      false;

  const typeNames =
    schema[node] && schema[node].kind === 'type' ? [ schema[node].name ] :
    schema[node] && schema[node].kind === 'union' ? schema[node].typeNames :
    schema[node] && schema[node].kind === 'interface' ?
      schema[node].implementations :
      [ ];

  return async function (parent, args, info) {
    const { rootValue, fieldASTs, variableValues } = info;
    const { db, config } = rootValue;
    const {first, last, after, before, filterBy, filter, orderBy, order} = args;
    const pagingArgs = { first, last, after, before };

    const id = parent._id || parent.id;

    const readOptions = config.committedReads ?
      MAJORITY_READ_OPTIONS :
      LOCAL_READ_OPTIONS;

    // construct permissions filter for node connections:
    let permFilter = [ ];
    if (isNode) {
      permFilter = await Promise.all(
        typeNames.map(async typeName => {
          const encodedTypeName = encode(typeName);
          const f = await permissionFilter(schema, rootValue, typeName, 'node');
          return {
            $or: [
              { __encodedNodeType: { $ne: encodedTypeName } },
              ...f ?
                [ { $and: f.length ? f : [ { } ] } ] :
                [ ]
            ]
          };
        }));
    }

    if (!atMostOneOf(filterBy, filter)) {
      throw new GraphQLError('Connection cannot specify more than one filter.');
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
        throw new GraphQLError(`Filter validation failed:\n` +
                               validationResults.join('\n'));
      }
    }

    if (!atMostOneOf(orderBy, order)) {
      throw new GraphQLError('Connection cannot specify more than one order.');
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
        throw new GraphQLError(`Order validation failed:\n` +
                               validationResults.join('\n'));
      }
    }

    const mongoFilter = filterValue ? filterBuilder(filterValue) : null;
    const mongoSort = orderValue ? orderBuilder(orderValue) : null;

    const filterStages = [
      ...InitialStages(id),
      ...(mongoFilter || permFilter.length ? [
        {
          $match: {
            $and: [
              mongoFilter ? mongoFilter : { },
              ...permFilter.length ? permFilter : [ { } ],
            ]
          }
        } ] :
        [ ])
    ];

    if (!isNullish(first) && first <= 0) {
      throw new GraphQLError(`Argument "first" has invalid value ${first}.\n` +
                             `Expected a positive integer, found ${first}.`);
    }
    if (!isNullish(last) && last <= 0) {
      throw new GraphQLError(`Argument "last" has invalid value ${last}.\n` +
                             `Expected a positive integer, found ${last}.`);
    }

    // need length of the result set to satisfy Relay spec that before / after
    // arguments with invalid cursor (< 0 or >= length) are ignored.
    // TODO: explore alternatives to another aggregation query to get the count
    const lengthStages = filterStages
      .concat({ $group: { _id: null, length: { $sum: 1 } }});
    const lengthResult = await db
      .collection(collection, readOptions)
      .aggregate(lengthStages)
      .toArray();
    const length = lengthResult && lengthResult[0] && lengthResult[0].length ?
      lengthResult[0].length : 0;
    const { skipOffset, stages: pgStages } = pagingBuilder(pagingArgs, length);

    const edgeStages = filterStages
      .concat(
        mongoSort && Object.keys(mongoSort).length ?
          [ { $sort: mongoSort } ] :
          [ ])
      .concat(pgStages);

    const aggregations =
      extractAggregations(fieldASTs, aggFieldDefinitions, variableValues);

    const aggregationStages = aggregations.length ? [
      ...filterStages,
      aggregationBuilder(
        kind,
        aggregations,
        countFilterBuilder,
        filterConditions,
        filterInputObjectDefinition)
    ] : [ ];

    const [ edgeData, aggregationData ] = await Promise.all([
      db.collection(collection, readOptions).aggregate(edgeStages).toArray(),
      ...aggregations.length ? [
        db.collection(collection, readOptions)
          .aggregate(aggregationStages)
          .toArray()
      ] : [ ]
    ]);

    let aggregationValues = { };
    if (aggregationData && aggregationData.length) {
      delete aggregationData[0]._id;
      aggregationValues = aggregationData[0];
    }

    const edges = edgeData.map((obj, index) => ({
      cursor: offsetToCursor(skipOffset + index),
      ...obj.edgeProps || { },
      node: obj.node
    }));

    const firstEdge = edges[0];
    const lastEdge = edges[edges.length - 1];
    const hasPreviousPage = !isNullish(last) ? skipOffset !== 0 : false;
    const hasNextPage = !isNullish(first) ?
      skipOffset + edges.length < length : false;
    const startCursor = firstEdge ? firstEdge.cursor : null;
    const endCursor = lastEdge ? lastEdge.cursor : null;


    return {
      ...aggregationValues,
      edges,
      pageInfo: { hasPreviousPage, hasNextPage, startCursor, endCursor }
    };
  };
}
