import { typeFromGlobalId } from '../../../jsutils/globalId';
import { Node } from '../../../mutations/Node';
import { Model } from '../../../mutations/Model';
import { SecurityApi } from '../../../security/SecurityApi';
import { CRUD } from '../crud/CRUD';
import { Auth } from '../auth/Auth';

export function makeMutationContext(schema, rootValue, name, clientMutationId) {
  const { db, env, config, viewerId } = rootValue;

  const passwordHashStrength = config.passwordHashStrength || 12;
  const mutationInfo = {
    name,
    clientMutationId,
    globalIds: [ ]
  };

  const crud = CRUD({ schema, db, config });
  const auth = Auth({ db, config });
  const model = new Model({ schema, crud, mutation: mutationInfo });
  const security = new SecurityApi({
    schema,
    auth,
    mutation: mutationInfo,
    passwordHashStrength
  });
  const viewer = viewerId ?
    new Node({
      schema,
      crud,
      mutation: mutationInfo,
      type: typeFromGlobalId(viewerId),
      id: viewerId
    }) :
    null;
  const timestamp = new Date().getTime();

  return {
    model,
    timestamp,
    viewer,
    env,
    config,
    security,
  };
}

export function makeHookContext(schema, rootValue, name) {
  const { db, env, config, viewerId } = rootValue;

  const passwordHashStrength = config.passwordHashStrength || 12;
  const mutationInfo = {
    name,
    globalIds: [ ],
    isHook: true,
  };

  const crud = CRUD({ schema, db, config });
  const auth = Auth({ db, config });
  const model = new Model({ schema, crud, mutation: mutationInfo });
  const security = new SecurityApi({
    schema,
    auth,
    mutation: mutationInfo,
    passwordHashStrength
  });
  const viewer = viewerId ?
    new Node({
      schema,
      crud,
      mutation: mutationInfo,
      type: typeFromGlobalId(viewerId),
      id: viewerId
    }) :
    null;
  const timestamp = new Date().getTime();

  return {
    model,
    timestamp,
    viewer,
    env,
    config,
    security,
  };
}

export function makePermissionContext(schema, rootValue, name) {
  const { db, env, config, viewerId } = rootValue;

  const passwordHashStrength = config.passwordHashStrength || 12;
  const mutationInfo = {
    name,
    globalIds: [ ],
    isPermission: true,
  };

  const crud = CRUD({ schema, db, config });
  const auth = Auth({ db, config });
  const model = new Model({ schema, crud, mutation: mutationInfo });
  const security = new SecurityApi({
    schema,
    auth,
    mutation: mutationInfo,
    passwordHashStrength
  });
  const viewer = viewerId ?
    new Node({
      schema,
      crud,
      mutation: mutationInfo,
      type: typeFromGlobalId(viewerId),
      id: viewerId
    }) :
    null;
  const timestamp = new Date().getTime();

  return {
    model,
    timestamp,
    viewer,
    env,
    config,
    security,
  };
}
