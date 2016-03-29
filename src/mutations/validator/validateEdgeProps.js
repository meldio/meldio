import invariant from '../../jsutils/invariant';
import strip from '../../jsutils/strip';
import isNullish from '../../jsutils/isNullish';
import { objectValidator } from './validateNode';

export function validateEdgeProps(context, edgeProps) {
  invariant(context, 'must pass context to validateEdgeNode.');
  invariant(
    context.function &&
    context.field &&
    context.field.name &&
    context.schema, 'must pass correct context to validateEdgeNode.');

  const {
    function: func,
    schema,
    field: {
      name: fieldName,
      edgeType: edgeTypeName
    }
  } = context;

  const options = { prefix: `Edge properties passed to ${func}` };
  const results =
    !edgeTypeName && !isNullish(edgeProps) ?
      [ strip`Edge properties cannot be passed to ${func} because connection
            ~ defined in "${fieldName}" field does not specify edge props.` ] :
    edgeTypeName ?
      objectValidator(schema, edgeTypeName, edgeProps || { }, '', options) :
      [ ];

  return { context, results };
}
