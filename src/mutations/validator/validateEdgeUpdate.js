import invariant from '../../jsutils/invariant';
import isNullish from '../../jsutils/isNullish';
import strip from '../../jsutils/strip';
import { validateObjectUpdate } from './validateUpdate';

export function validateEdgeUpdate(context, update) {
  invariant(context, 'must pass context to validateEdgeUpdate.');
  invariant(
    context.function &&
    context.field &&
    context.field.name &&
    context.schema, 'must pass correct context to validateEdgeUpdate.');

  const {
    schema,
    field: {
      name: fieldName,
      edgeType: edgeTypeName
    }
  } = context;

  const options = { prefix: `Edge props update` };

  const results =
    !edgeTypeName ?
      [ strip`Edge properties cannot be updated because connection
             ~ defined in "${fieldName}" field does not specify edge props.` ] :
    isNullish(update) || typeof update !== 'object' || Array.isArray(update) ?
      [ strip`${options.prefix} must be an object expression.` ] :
      validateObjectUpdate(schema, edgeTypeName, update, '', options);

  return { context, results };
}
