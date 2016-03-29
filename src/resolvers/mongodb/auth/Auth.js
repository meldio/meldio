import invariant from '../../../jsutils/invariant';
import { newGlobalId } from '../../../jsutils/globalId';
import {
  AUTH_PROVIDER_COLLECTION,
  MAJORITY_READ_OPTIONS,
  LOCAL_READ_OPTIONS,
  DEFAULT_WRITE_OPTIONS,
} from '../common';

export function Auth(context) {
  const { db, config } = context;
  invariant(db, 'Must pass database connection to Auth context.');
  invariant(config, 'Must pass config to Auth context.');

  const readOptions = config.committedReads ?
    MAJORITY_READ_OPTIONS :
    LOCAL_READ_OPTIONS;
  const writeOptions = DEFAULT_WRITE_OPTIONS;

  const mongoToNodeId = mongoObject => {
    const node = { id: mongoObject._id, ...mongoObject };
    delete node._id;
    return node;
  };

  return {
    async addAuthProvider(obj) {
      invariant(obj, 'Must pass object to addAuthProvider resolver.');
      invariant(obj.viewerId && typeof obj.viewerId === 'string',
        'Must pass object with viewerId to addAuthProvider resolver.');
      invariant(obj.provider && typeof obj.provider === 'string',
        'Must pass object with provider to addAuthProvider resolver.');
      invariant(obj.providerId && typeof obj.providerId === 'string',
        'Must pass object with providerId to addAuthProvider resolver.');

      obj._id = newGlobalId(AUTH_PROVIDER_COLLECTION);
      const result = await db
        .collection(AUTH_PROVIDER_COLLECTION)
        .insertOne(obj, writeOptions);

      return result.insertedId === obj._id;
    },

    async getAuthProvider(condition) {
      invariant(condition,
        'Must pass condition to getAuthProvider resolver.');

      const result = await db
        .collection(AUTH_PROVIDER_COLLECTION, readOptions)
        .find(condition)
        .map(mongoToNodeId)
        .toArray();

      if (result.length) {
        return result[0];
      }
      return null;
    },

    async deleteAuthProviders(condition) {
      invariant(condition,
        'Must pass condition to deleteAuthProviders resolver.');

      const result = await db
        .collection(AUTH_PROVIDER_COLLECTION)
        .deleteMany(condition, writeOptions);

      return result.deletedCount;
    },

    async updateAuthProvider(condition, update) {
      invariant(condition,
        'Must pass condition to updateAuthProvider resolver.');
      invariant(update, 'Must pass update to updateAuthProvider resolver.');

      const result = await db
        .collection(AUTH_PROVIDER_COLLECTION)
        .updateOne(condition, { $set: update }, writeOptions);

      return result.result &&
             result.result.ok === 1 &&
             result.matchedCount === 1;
    },
  };
}
