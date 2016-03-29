import invariant from '../../jsutils/invariant';
import isNullish from '../../jsutils/isNullish';

export function validateNumeric(context, value) {
  invariant(context, 'must pass context to validateNumeric.');
  const { function: func, parameter } = context;
  invariant(func, 'must pass function to context of validateNumeric.');
  invariant(parameter, 'must pass parameter to context of validateNumeric.');

  const results =
    !isNullish(value) && typeof value !== 'number' ?
      [ `Parameter ${parameter} of ${func} must be a number.` ] :
      [ ];

  return { context, results };
}
