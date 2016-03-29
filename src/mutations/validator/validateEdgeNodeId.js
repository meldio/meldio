
import invariant from '../../jsutils/invariant';
import strip from '../../jsutils/strip';
import isNullish from '../../jsutils/isNullish';
import { typeFromGlobalId, isGlobalId} from '../../jsutils/globalId';

export function validateEdgeNodeId(context, id) {
  invariant(context, 'must pass context to validateEdgeNodeId.');
  const { function: func, field: { type: typeName } } = context;
  invariant(
    context.schema &&
    context.schema[typeName] && (
      context.schema[typeName].kind === 'type' ||
      context.schema[typeName].kind === 'interface' ||
      context.schema[typeName].kind === 'union'
    ), 'must pass correct context to validateEdgeNodeId.');

  const results =
    isNullish(id) ?
      [ `Must pass an id to ${func}.` ] :
    !isGlobalId(id) ?
      [ `Id passed to ${func} is invalid.` ] :
    context.schema[typeName].kind === 'type' &&
    typeFromGlobalId(id) !== typeName ?
      [ `Id passed to ${func} must be of type "${typeName}".` ] :
    context.schema[typeName].kind === 'interface' &&
    !context.schema[typeName].implementations.includes(typeFromGlobalId(id)) ?
      [ strip`Id passed to ${func} must be for implementation of
             ~ "${typeName}" interface.` ] :
    context.schema[typeName].kind === 'union' &&
    !context.schema[typeName].typeNames.includes(typeFromGlobalId(id)) ?
      [ strip`Id passed to ${func} must be for a member of
             ~ "${typeName}" union.` ] :
    [ ];

  return { context, results };
}
