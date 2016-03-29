import invariant from '../../jsutils/invariant';
import isNullish from '../../jsutils/isNullish';

export function validateString(context, value) {
  invariant(context, 'must pass context to validateString.');
  const { function: func, parameter } = context;
  invariant(func, 'must pass function to context of validateString.');
  invariant(parameter, 'must pass parameter to context of validateString.');

  const results =
    !isNullish(value) && typeof value !== 'string' ?
      [ `Parameter ${parameter} of ${func} must be a string.` ] :
      [ ];

  return { context, results };
}
