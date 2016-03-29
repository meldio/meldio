import invariant from '../../jsutils/invariant';
import isNullish from '../../jsutils/isNullish';
import { typeFromGlobalId, isGlobalId } from '../../jsutils/globalId';

export function validateViewerId(context, id) {
  invariant(context, 'must pass context to validateViewerId.');
  const { function: func, viewerType } = context;
  invariant(func, 'must pass function to context of validateViewerId.');

  const results =
    isNullish(viewerType) ?
      [ ] :
    isNullish(id) ?
      [ `Must pass a viewerId to ${func}.` ] :
    !isGlobalId(id) ?
      [ `viewerId passed to ${func} is invalid.` ] :
    typeFromGlobalId(id) !== viewerType ?
      [ `viewerId passed to ${func} must be of type "${viewerType}".` ] :
      [ ];

  return { context, results };
}
