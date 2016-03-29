import invariant from '../../jsutils/invariant';
import isNullish from '../../jsutils/isNullish';

export function validateRequired(context, value) {
  invariant(context, 'must pass context to validateRequired.');
  const { function: func, parameter } = context;
  invariant(func, 'must pass function to context of validateRequired.');
  invariant(parameter, 'must pass parameter to context of validateRequired.');

  const results =
    isNullish(value) || value === '' ?
      [ `Parameter ${parameter} of ${func} is required.` ] :
      [ ];

  return { context, results };
}
