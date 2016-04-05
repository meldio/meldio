import { MongoClient } from 'mongodb';
import strip from '../../../jsutils/strip';
import { MAJORITY_READ_OPTIONS } from './definitions';
import { rootPluralIdDirectives } from '../../../schema/analyzer';

export async function connect(config, schema) {
  const { dbConnectionUri, committedReads } = config;

  const db = await MongoClient.connect(dbConnectionUri);

  const status = await db.admin().serverStatus();
  const info = await db.admin().serverInfo();
  const version = info.versionArray;
  const isInvalidVersion =
      !version ||
      typeof version[0] !== 'number' ||
      typeof version[1] !== 'number' ||
      version[0] < 3 ||
      version[0] === 3 && version[0] < 2;

  // tough to test without mock, not important enough for a mock
  if (isInvalidVersion) {
    const error = new Error('Meldio requires MongoDB 3.2 or later.');
    error.meldio = true;
    throw error;
  }

  // tough to test without mock, not important enough for a mock
  if (committedReads &&
      !status.storageEngine.supportsCommittedReads) {
    const error = new Error(strip`Meldio needs MongoDB to run storage engine
                                ~ that supports majority read concern.`);
    error.meldio = true;
    throw error;
  }

  if (committedReads) {
    try {
      await db.collection('__TEST__', MAJORITY_READ_OPTIONS).find({}).toArray();
    } catch (e) {
      // this is actually tested, but for some reason istanbul doesn't pick it
      // up on the coverage report, possibly because of nested try/catch
      if (e.message && e.message.startsWith('Majority read concern')) {
        const error = new Error(strip`Meldio needs MongoDB to run with
                                     ~ enableMajorityReadConcern enabled.`);
        error.meldio = true;
        error.details = strip`
          |
          | Edit mongod.conf to include the following and restart the mongod
            ~ process:
          |
          |   replication:
          |      enableMajorityReadConcern: true
          |
          | You may also start mongod instance with --enableMajorityReadConcern
            ~ flag
          |
          `;
        throw error;
      } else {
        throw e;
      }
    }
  }

  // ensure required indicies exist on _Edge and _AuthProvider collections:

  await db.collection('_Edge').createIndexes([
    {
      name: '_Edge_Node',
      key: { nodeId: 1, nodeField: 1 }
    },
    {
      name: '_Edge_Related',
      key: { relatedId: 1, relatedField: 1, nodeId: 1, nodeField: 1 },
      unique: true,
      partialFilterExpression: {
        relatedId: { $exists: true },
        relatedField: { $exists: true }
      }
    }
  ]);

  await db.collection('_AuthProvider').createIndexes([
    {
      name: '_AuthProvider_Viewer',
      key: { viewerId: 1 }
    },
    {
      name: '_AuthProvider_Provider',
      key: { provider: 1, providerId: 1 },
      unique: true,
    }
  ]);

  // ensure there is a unique index on each root plural id field:
  if (schema) {
    await Promise.all(
      rootPluralIdDirectives(schema)
        .map(dir =>
          db.collection(dir.parentTypeName).createIndexes([
            {
              name: `_${dir.parentTypeName}_${dir.parentFieldName}_uniqueId`,
              key: { [dir.parentFieldName]: 1 },
              unique: true,
            }
          ])));
  }

  return db;
}
