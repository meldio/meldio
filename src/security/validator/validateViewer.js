import invariant from '../../jsutils/invariant';
import isNullish from '../../jsutils/isNullish';

export function validateViewer(context, viewerType) {
  invariant(context, 'must pass context to validateViewerId.');
  const { function: func } = context;
  invariant(func, 'must pass function to context of validateViewer.');

  const results =
    isNullish(viewerType) || !viewerType ?
      [ `Schema must define @rootViewer for ${func} to be invoked.` ] :
      [ ];

  return { context, results };
}
