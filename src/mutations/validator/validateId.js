import invariant from '../../jsutils/invariant';
import isNullish from '../../jsutils/isNullish';
import { isGlobalId, typeFromGlobalId } from '../../jsutils/globalId';

export function validateId(context, id) {
  invariant(context, 'must pass context to validateId.');
  const { function: func, type } = context;

  const results =
    isNullish(id) ?
      [ `Must pass an id to ${context.function}.` ] :
    !isGlobalId(id) ?
      [ `Id passed to ${func} is invalid.` ] :
    typeFromGlobalId(id) !== type ?
      [ `Id passed to ${func} must be of type "${type}".` ] :
      [ ];

  return { context, results };
}
