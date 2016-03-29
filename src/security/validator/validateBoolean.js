import invariant from '../../jsutils/invariant';
import isNullish from '../../jsutils/isNullish';

export function validateBoolean(context, value) {
  invariant(context, 'must pass context to validateBoolean.');
  const { function: func, parameter } = context;
  invariant(func, 'must pass function to context of validateBoolean.');
  invariant(parameter, 'must pass parameter to context of validateBoolean.');

  const results =
    !isNullish(value) && typeof value !== 'boolean' ?
      [ `Parameter ${parameter} of ${func} must be a boolean.` ] :
      [ ];

  return { context, results };
}
