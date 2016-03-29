import invariant from '../../jsutils/invariant';
import isNullish from '../../jsutils/isNullish';

export function validateChoices(context, value) {
  invariant(context, 'must pass context to validateChoices.');
  const { function: func, parameter, choices } = context;
  invariant(func, 'must pass function to context of validateChoices.');
  invariant(parameter, 'must pass parameter to context of validateChoices.');
  invariant(choices, 'must pass choices to context of validateChoices.');
  invariant(Array.isArray(choices),
    'choices passed to context of validateChoices must be an array.');

  const list = choices.map(c => `"${c}"`).join(`, `);
  const results =
    !isNullish(value) && !choices.includes(value) ?
      [ `Parameter ${parameter} of ${func} must be one of: ${list}.` ] :
      [ ];

  return { context, results };
}
