import invariant from '../../jsutils/invariant';
import isNullish from '../../jsutils/isNullish';
import strip from '../../jsutils/strip';
import { validateObjectFilter } from './validateFilter';

export function validateEdgeFilter(context, filter) {
  invariant(context, 'must pass context to validateEdgeFilter.');
  invariant(
    context.function &&
    context.field &&
    context.field.name &&
    context.schema, 'must pass correct context to validateEdgeFilter.');

  const {
    schema,
    field: {
      name: fieldName,
      type: typeName,
      edgeType: edgeTypeName
    }
  } = context;

  const options = { prefix: `Edge filter` };

  if (isNullish(filter) || typeof filter !== 'object' ||
      Array.isArray(filter)) {
    return {
      context,
      results:
        [ strip`${options.prefix} must be an object expression.` ]
    };
  }

  const nodeFilter = filter.node || { };
  const edgeFilter = { ...filter };
  delete edgeFilter.node;

  const results =
    !edgeTypeName && Object.keys(edgeFilter).length !== 0 ?
      [ strip`${options.prefix} cannot reference edge properties because
             ~ connection defined in "${fieldName}" field does not specify
             ~ edge props.` ] :
      [
        ...validateObjectFilter(schema, typeName, nodeFilter, 'node', options),
        ...edgeTypeName ?
          validateObjectFilter(schema, edgeTypeName, edgeFilter, '', options) :
          [ ],
      ];

  return { context, results };
}
