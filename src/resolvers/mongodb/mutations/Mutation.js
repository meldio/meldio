import invariant from '../../../jsutils/invariant';
import { processMutationResults } from '../../../mutations';
import { GraphQLError } from 'graphql';
import { makeMutationContext, makePermissionContext } from '../common';

export function Mutation({ schema }) {
  invariant(schema, 'schema must be passed to resolver');

  return async function(parent, args, info) {

    const { fieldName: name, rootValue } = info;
    const { mutations, config, permissions } = rootValue;
    const { input } = args;
    const { clientMutationId, ...executionArgs } = input;

    const ctx = makeMutationContext(schema, rootValue, name, clientMutationId);
    const permissionCtx = makePermissionContext(schema, rootValue, name);

    const permission = config.enabledAuth.length === 0 || (
      permissions && permissions[name] ?
        await permissions[name].apply(permissionCtx, [ executionArgs ]) :
        false);

    if (!permission) {
      throw new GraphQLError(
        `Permission denied. Can not execute mutation "${name}".`);
    }

    const mutation = mutations[name];
    const result = await mutation.apply(ctx, [ executionArgs ]);
    const output = await processMutationResults(result);

    return { ...output, clientMutationId };
  };
}
