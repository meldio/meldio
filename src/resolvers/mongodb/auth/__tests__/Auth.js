import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import { MongoClient } from 'mongodb';
import { newGlobalId } from '../../../../jsutils/globalId';
import { Auth } from '../Auth';

let db;
let auth;
const dbName = 'AuthTest';
const userId = newGlobalId('User');

/* eslint no-unused-expressions: 0 */

describe('Mongo Resolvers / Auth:', () => {
  before(async () => {
    db = await MongoClient.connect(`mongodb://localhost:27017/${dbName}`);
    auth = new Auth({ db, config: { } });
  });

  after(async function() {
    await db.dropDatabase(dbName);
    db.close();
  });

  it('addAuthProvider adds an auth provider', async () => {
    const isAdded = await auth.addAuthProvider({
      viewerId: userId,
      provider: 'facebook',
      providerId: '121212',
    });
    expect(isAdded).to.be.true;
  });

  it('getAuthProvider retrieves an auth provider', async () => {
    const authProvider = await auth.getAuthProvider({
      viewerId: userId
    });
    expect(authProvider).to.not.be.null;
    expect(authProvider).to.deep.equal({
      id: authProvider.id,
      viewerId: userId,
      provider: 'facebook',
      providerId: '121212',
    });
  });

  it('getAuthProvider returns null if auth provider doesnt exist', async () => {
    const authProvider = await auth.getAuthProvider({
      viewerId: newGlobalId('User')
    });
    expect(authProvider).to.be.null;
  });

  it('updateAuthProvider updates an auth provider', async () => {
    const isUpdated = await auth.updateAuthProvider(
      { viewerId: userId },
      { providerId: '212121' },
    );
    expect(isUpdated).to.be.true;

    const authProvider = await auth.getAuthProvider({
      viewerId: userId
    });
    expect(authProvider).to.deep.equal({
      id: authProvider.id,
      viewerId: userId,
      provider: 'facebook',
      providerId: '212121',
    });
  });

  it('updateAuthProvider returns false if provider is not found', async () => {
    const isUpdated = await auth.updateAuthProvider(
      { viewerId: newGlobalId('User') },
      { providerId: '212121' },
    );
    expect(isUpdated).to.be.false;
  });

  it('deleteAuthProviders deletes an auth provider', async () => {
    let delCount = await auth.deleteAuthProviders({ viewerId: userId });
    expect(delCount).to.equal(1);

    delCount = await auth.deleteAuthProviders({ viewerId: userId });
    expect(delCount).to.equal(0);

    const authProvider = await auth.getAuthProvider({ viewerId: userId });
    expect(authProvider).to.be.null;
  });
});
