import invariant from '../../../jsutils/invariant';
import atMostOneOf from '../../../jsutils/atMostOneOf';
import { ListFilter } from './ListFilter';
import { ListOrder } from './ListOrder';
import { SCALAR_TYPES } from '../../../schema/analyzer';
import { GraphQLError } from 'graphql/error';
import { isValidJSValue, valueFromAST } from 'graphql/utilities';

export function ScalarList({
  schema,
  typeName,
  field,
  filterInputObjectDefinition,
}) {
  const isScalarType =
    SCALAR_TYPES.includes(typeName) ||
    schema[typeName] && schema[typeName].kind === 'enum';
  invariant(isScalarType, 'scalar type must be passed to resolver');

  const filterName = `Filter#[${typeName}]`;
  const filterConditions =
    schema[filterName] ?
      schema[filterName].conditions
        .reduce( (acc, cond) => ({...acc, [cond.key]: cond.conditionAST}), {}) :
      { };

  const filterList = ListFilter({ schema, typeName });
  const orderList = ListOrder({ schema, typeName });

  return async function (parent, args) {
    const { first, last, filterBy, filter, orderBy, aggregate } = args;

    const scalars = parent[field];

    if (!scalars) {
      return null;
    }
    if (!scalars.length) {
      return [ ];
    }

    let list = [ ...scalars ];

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
    list = orderBy ? orderList(orderBy, list) : list;
    list = first ? list.slice(0, first) : list;
    list = last ? list.slice(-last) : list;
    list =
      aggregate === 'SUM' ?
        [ list.reduce((acc, item) => acc + item, 0) ] :
      aggregate === 'COUNT' ?
        [ list.length ] :
      aggregate === 'MIN' ? [
        list.slice(1)
          .reduce((acc, item) => item < acc ? item : acc, list[0]) ] :
      aggregate === 'MAX' ? [
        list.slice(1)
          .reduce((acc, item) => item > acc ? item : acc, list[0]) ] :
      aggregate === 'AVERAGE' ?
        [ list.reduce((acc, item) => acc + item, 0) / list.length ] :
        list;

    return list;
  };
}
