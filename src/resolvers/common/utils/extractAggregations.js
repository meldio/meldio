import { visit, QueryDocumentKeys } from 'graphql/language/visitor';
import { valueFromAST } from 'graphql/utilities';
import {
  AGGREGATION_FIELD_NAMES
} from '../../../schema/validator/definitions';

export function extractAggregations(
  fieldASTs,
  aggFieldDefinitions,
  variableValues
) {
  const result = [ ];
  const visitor = {
    Field: node => {
      const fieldName = node.name.value;
      if ([ 'edges', 'pageInfo' ].includes(fieldName)) {
        return false; // don't follow into these nodes
      } else if (AGGREGATION_FIELD_NAMES.includes(fieldName)) {
        result.push({
          name: fieldName,
          alias: node.alias ? node.alias.value : null,
          arguments: node.arguments.map(arg => ({
            name: arg.name.value,
            value: valueFromAST(
              arg.value,
              aggFieldDefinitions[fieldName][arg.name.value],
              variableValues)
          })) });
        return undefined; // leave node as is
      }
    }
  };
  visit(fieldASTs, visitor, QueryDocumentKeys);
  return result;
}
