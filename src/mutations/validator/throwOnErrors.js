import strip from '../../jsutils/strip';
import { GraphQLError } from 'graphql/error';

export function throwOnErrors({ context, results }) {
  const {
    mutation: {
      name,
      clientMutationId,
      isHook,
      isPermission,
    }
  } = context;

  if (results && results.length) {
    throw new GraphQLError(
      isHook ?
        strip`Hook "${name}" failed:
             |${ results.map( (r, ix) => `${ix + 1}. ${r}` ).join('\n') }` :
      isPermission ?
        strip`Permission function "${name}" failed:
             |${ results.map( (r, ix) => `${ix + 1}. ${r}` ).join('\n') }` :
        strip`Mutation "${name}" with id "${clientMutationId}" failed:
             |${ results.map( (r, ix) => `${ix + 1}. ${r}` ).join('\n') }`);
  }
}
