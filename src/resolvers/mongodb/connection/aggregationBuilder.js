import keyMap from '../../../jsutils/keyMap';
import keyValMap from '../../../jsutils/keyValMap';
import atMostOneOf from '../../../jsutils/atMostOneOf';
import { GraphQLError } from 'graphql/error';
import { isValidJSValue, valueFromAST } from 'graphql/utilities';

export function aggregationBuilder(
  kind,
  aggregations,
  countFilterBuilder,
  filterConditions,
  filterInputObjectDefinition,
) {
  // istanbul ignore if
  if (!aggregations || !aggregations.length) {
    return [ ];
  }
  return {
    $group: {
      _id: null,
      ...aggregations
        .map(aggregation => ({
          [aggregation.alias || aggregation.name]:
            aggregation.name === 'sum' ?
              { $sum: getFieldName(aggregation) } :
            aggregation.name === 'min' ?
              { $min: getFieldName(aggregation) } :
            aggregation.name === 'max' ?
              { $max: getFieldName(aggregation) } :
            aggregation.name === 'average' ?
              { $avg: getFieldName(aggregation) } :
            aggregation.name === 'count' ?
              { $sum: getCountExpression(aggregation) } :
            // istanbul ignore next
            { $first: null }
        }))
        .reduce( (acc, agg) => ({ ...acc, ...agg || { } }), { })
    }
  };

  function getCountExpression({ arguments: argsList }) {
    const args = keyValMap(argsList, arg => arg.name, arg => arg.value);
    const { filter, filterBy } = args;
    if (!atMostOneOf(filter, filterBy)) {
      throw new GraphQLError('Count cannot specify more than one filter.');
    }
    if (filterBy) {
      return countFilterBuilder(filterBy);
    } else if (filter) {
      const ast = filterConditions[filter];
      // TODO: pass only args relevant to given filter key:
      const filterValue = valueFromAST(ast, filterInputObjectDefinition, args);
      const validationResults =
        isValidJSValue(filterValue, filterInputObjectDefinition);
      if (validationResults.length) {
        throw new GraphQLError(`Count filter validation failed:\n` +
                               validationResults.join('\n'));
      }
      return countFilterBuilder(filterValue);
    }
    return 1;
  }

  function getFieldName({ name, arguments: args }) {
    const argsMap = keyMap(args, arg => arg.name);
    if (!argsMap.node && !argsMap.edges || argsMap.node && argsMap.edges) {
      throw new GraphQLError(
        `Aggregation "${name}" must specify either node or edges parameter.`);
    }
    if (argsMap.edges) {
      return '$edgeProps.' + argsMap.edges.value;
    }
    if (argsMap.node) {
      if (kind === 'ScalarConnection') {
        return '$node';
      }
      return '$node.' + argsMap.node.value;
    }
    // istanbul ignore next
    return null;
  }
}
