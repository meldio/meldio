import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import { MongoClient } from 'mongodb';
import { newGlobalId } from '../../jsutils/globalId';
import {
  parse,
  analyzeAST,
  validate,
} from '../../schema';
import { SecurityApi } from '../SecurityApi';
import { Auth } from '../../resolvers/mongodb/auth';

chai.use(chaiAsPromised);

let db;
let security;
let badSec;
const dbName = 'SecurityApiTest';

const schemaDef = `
  type User implements Node @rootViewer(field: "viewer") {
    id: ID!
    firstName: String
    lastName: String
    emails: [String]!
    profilePictureUrl: String
  }
`;

const badSchemaDef = `
  ## this schema does not define root viewer, so security API cannot be
  ## used. This will be caught by the build tool, but this test is to ensure
  ## that security API catches this as well.

  type User implements Node {
    id: ID!
    firstName: String
    lastName: String
    emails: [String]!
    profilePictureUrl: String
  }
`;

const authProviderId = newGlobalId('_AuthProvider');
const viewerId = '-KDJVLK5k5NI3MADFvre-kJ5I';

/* eslint no-unused-expressions: 0 */
/* eslint max-len:0 */

describe('security / SecurityApi:', () => {
  before(async () => {
    db = await MongoClient.connect(`mongodb://localhost:27017/${dbName}`);

    await db.collection('_AuthProvider').insertOne({
      id: authProviderId,
      viewerId,
      provider: 'facebook',
      providerId: 'fb-id-12345',
      profile: { facebookprops: '...' },
      accessToken: 'fb-access-token',
    });

    await db.collection('_AuthProvider').insertOne({
      id: newGlobalId('_AuthProvider'),
      viewerId: newGlobalId('User'),
      provider: 'password',
      providerId: 'invalid@bar.com',
    });

    const ast = parse(schemaDef);
    const schema = analyzeAST(ast);
    const results = validate(schema);
    expect(results).to.have.length(0);

    const badAST = parse(badSchemaDef);
    const badSchema = analyzeAST(badAST);
    const badResults = validate(badSchema);
    expect(badResults).to.have.length(0);

    const auth = new Auth({ db, config: { } });
    const mutation = {
      name: 'addUser',
      clientMutationId: 'Test001',
      globalIds: [ ],
    };
    const passwordHashStrength = 10;

    security = new SecurityApi({
      schema,
      auth,
      mutation,
      passwordHashStrength
    });

    badSec = SecurityApi({
      schema: badSchema,
      auth,
      mutation,
      passwordHashStrength
    });
  });

  after(async function() {
    await db.dropDatabase(dbName);
    db.close();
  });

  // if viewer is not specified, each method will fail:
  it('each method requires that root viewer is expecified', async () => {
    const provider = 'facebook';
    const loginId = 'foo@bar.com';
    const password = 'Tr0ub4dor&3';
    const newLoginId = 'baz@bar.com';
    const length = 10;
    const numeric = false;
    const passwordOrToken = password;
    const newPassword = 'correcthorsebatterystaple';
    const missingRootViewer = /Schema must define @rootViewer/;

    return Promise.all([
      expect(badSec.getOAuthAccessToken(viewerId, provider))
        .to.eventually.be.rejectedWith(missingRootViewer),
      expect(badSec.removeOAuthProvider(viewerId, provider))
        .to.eventually.be.rejectedWith(missingRootViewer),
      expect(badSec.createPasswordAuth(viewerId, loginId, password))
        .to.eventually.be.rejectedWith(missingRootViewer),
      expect(badSec.changePasswordAuth(viewerId, newLoginId))
        .to.eventually.be.rejectedWith(missingRootViewer),
      expect(badSec.removePasswordAuth(viewerId))
        .to.eventually.be.rejectedWith(missingRootViewer),
      expect(badSec.createPasswordResetToken(loginId, length, numeric))
        .to.eventually.be.rejectedWith(missingRootViewer),
      expect(badSec.changePassword(loginId, passwordOrToken, newPassword))
        .to.eventually.be.rejectedWith(missingRootViewer),
    ]);
  });

  // getOAuthAccessToken(viewerId, provider):
  it('getOAuthAccessToken throws if argments are not passed', async () => {
    return expect(security.getOAuthAccessToken()).to.eventually.be.rejectedWith(
      /Must pass a viewerId to security\.getOAuthAccessToken/);
  });

  it('getOAuthAccessToken throws if viewerId is invalid', async () => {
    const invalidViewerId = newGlobalId('Foo');
    return expect(security.getOAuthAccessToken(invalidViewerId)).to.eventually.be.rejectedWith(
      /viewerId passed to security.getOAuthAccessToken must be of type "User"/);
  });

  it('getOAuthAccessToken throws if provider is invalid', async () => {
    const invalidProvider = 'boom';
    return expect(security.getOAuthAccessToken(viewerId, invalidProvider)).to.eventually.be.rejectedWith(
      /Parameter provider of security.getOAuthAccessToken must be one of: "facebook", "google", "github"/);
  });

  it('getOAuthAccessToken returns access token', async () => {
    const provider = 'facebook';
    const token = await security.getOAuthAccessToken(viewerId, provider);
    expect(token).to.equal('fb-access-token');
  });

  // removeOAuthProvider(viewerId, provider):
  it('removeOAuthProvider throws if argments are not passed', async () => {
    return expect(security.removeOAuthProvider()).to.eventually.be.rejectedWith(
      /Must pass a viewerId to security\.removeOAuthProvider/);
  });

  it('removeOAuthProvider throws if viewerId is invalid', async () => {
    const invalidViewerId = newGlobalId('Foo');
    return expect(security.removeOAuthProvider(invalidViewerId)).to.eventually.be.rejectedWith(
      /viewerId passed to security.removeOAuthProvider must be of type "User"/);
  });

  it('removeOAuthProvider throws if provider is invalid', async () => {
    const invalidProvider = 'boom';
    return expect(security.removeOAuthProvider(viewerId, invalidProvider)).to.eventually.be.rejectedWith(
      /Parameter provider of security.removeOAuthProvider must be one of: "facebook", "google", "github"/);
  });

  it('removeOAuthProvider returns false if provider doesnt exist', async () => {
    const missingViewerId = newGlobalId('User');
    const missingProvider = 'google';
    const provider = 'facebook';
    let res = await security.removeOAuthProvider(missingViewerId, provider);
    expect(res).to.equal(false);

    res = await security.removeOAuthProvider(viewerId, missingProvider);
    expect(res).to.equal(false);
  });

  it('removeOAuthProvider removes provider', async () => {
    const provider = 'facebook';
    const res = await security.removeOAuthProvider(viewerId, provider);
    expect(res).to.equal(true);
    const providers = await db
      .collection('_AuthProvider')
      .find({ _id: authProviderId })
      .toArray();
    expect(providers).to.have.length(0);
  });

  // createPasswordAuth:
  it('createPasswordAuth throws if argments are not passed', async () => {
    return expect(security.createPasswordAuth()).to.eventually.be.rejectedWith(
      /Must pass a viewerId to security\.createPasswordAuth/);
  });

  it('createPasswordAuth throws if viewerId is invalid', async () => {
    const invalidViewerId = newGlobalId('Foo');
    return expect(security.createPasswordAuth(invalidViewerId)).to.eventually.be.rejectedWith(
      /viewerId passed to security.createPasswordAuth must be of type "User"/);
  });

  it('createPasswordAuth throws if loginId is invalid', async () => {
    return expect(security.createPasswordAuth(viewerId, 123)).to.eventually.be.rejectedWith(
      /Parameter loginId of security.createPasswordAuth must be a string/);
  });

  it('createPasswordAuth throws if password is invalid', async () => {
    return expect(security.createPasswordAuth(viewerId, 'foo@bar.com', 123)).to.eventually.be.rejectedWith(
      /Parameter password of security.createPasswordAuth must be a string/);
  });

  it('createPasswordAuth adds password auth provider', async () => {
    const password = 'secret';
    const isAdded = await security.createPasswordAuth(
      viewerId,
      'foo@bar.com',
      password);
    expect(isAdded).to.be.true;
    const provider = await db
      .collection('_AuthProvider')
      .find({ viewerId, provider: 'password' })
      .toArray();
    expect(provider).to.have.length(1);
    expect(provider[0].password).to.be.a('string');
    // make sure password is hashed
    expect(provider[0].password).to.not.equal(password);
  });

  // changePasswordAuth(viewerId, newLoginId)
  it('changePasswordAuth throws if argments are not passed', async () => {
    return expect(security.changePasswordAuth()).to.eventually.be.rejectedWith(
      /Must pass a viewerId to security\.changePasswordAuth/);
  });

  it('changePasswordAuth throws if viewerId is invalid', async () => {
    const invalidViewerId = newGlobalId('Foo');
    return expect(security.changePasswordAuth(invalidViewerId)).to.eventually.be.rejectedWith(
      /viewerId passed to security.changePasswordAuth must be of type "User"/);
  });

  it('changePasswordAuth throws if loginId is invalid', async () => {
    return expect(security.changePasswordAuth(viewerId, 123)).to.eventually.be.rejectedWith(
      /Parameter newLoginId of security.changePasswordAuth must be a string/);
  });

  it('changePasswordAuth returns false if viewer is missing', async () => {
    const missingViewerId = newGlobalId('User');
    const isChanged = await security.changePasswordAuth(missingViewerId, 'baz@bar.com');
    expect(isChanged).to.be.false;
  });

  it('changePasswordAuth changes login id', async () => {
    const newLoginId = 'baz@bar.com';
    const isChanged = await security.changePasswordAuth(viewerId, newLoginId);
    expect(isChanged).to.be.true;
    const providers = await db
      .collection('_AuthProvider')
      .find({ viewerId, provider: 'password' })
      .toArray();
    expect(providers).to.have.length(1);
    expect(providers[0].providerId).to.equal(newLoginId);
  });

  // createPasswordResetToken (loginId, length, numeric = false)
  it('createPasswordResetToken throws if argments are not passed', async () => {
    return expect(security.createPasswordResetToken()).to.eventually.be.rejectedWith(
      /Parameter loginId of security.createPasswordResetToken is required/);
  });

  it('createPasswordResetToken throws if loginId is invalid', async () => {
    return expect(security.createPasswordResetToken(123)).to.eventually.be.rejectedWith(
      /Parameter loginId of security.createPasswordResetToken must be a string/);
  });

  it('createPasswordResetToken throws if length is invalid', async () => {
    return expect(security.createPasswordResetToken('baz@bar.com', '123')).to.eventually.be.rejectedWith(
      /Parameter length of security.createPasswordResetToken must be a number/);
  });

  it('createPasswordResetToken throws if numeric is invalid', async () => {
    return expect(security.createPasswordResetToken('baz@bar.com', 12, 'foo')).to.eventually.be.rejectedWith(
      /Parameter numeric of security.createPasswordResetToken must be a boolean/);
  });

  it('createPasswordResetToken returns null if login is not found', async () => {
    const token = await security.createPasswordResetToken('foo@bar.com', 12);
    expect(token).to.be.null;
  });

  it('createPasswordResetToken returns token if login is found', async () => {
    let token = await security.createPasswordResetToken('baz@bar.com', 6, true);
    expect(token).to.be.a('string');
    expect(token).to.have.length(6);
    expect(token).to.match(/^[0-9]{6}$/);

    let provider = await db
      .collection('_AuthProvider')
      .find({ providerId: 'baz@bar.com', provider: 'password' })
      .toArray();
    expect(provider).to.have.length(1);
    expect(provider[0].passwordToken).to.be.a('string');
    // make sure token is hashed
    expect(provider[0].passwordToken).to.not.equal(token);

    token = await security.createPasswordResetToken('baz@bar.com', 12);
    expect(token).to.be.a('string');
    expect(token).to.have.length(12);
    expect(token).to.match(/^[0-9a-zA-Z]{12}$/);

    provider = await db
      .collection('_AuthProvider')
      .find({ providerId: 'baz@bar.com', provider: 'password' })
      .toArray();
    expect(provider).to.have.length(1);
    expect(provider[0].passwordToken).to.be.a('string');
    // make sure token is hashed
    expect(provider[0].passwordToken).to.not.equal(token);
  });

  // changePassword(loginId, passwordOrToken, newPassword)
  it('changePassword throws if argments are not passed', async () => {
    return expect(security.changePassword()).to.eventually.be.rejectedWith(
      /Parameter loginId of security.changePassword is required/);
  });

  it('changePassword throws if loginId is invalid', async () => {
    return expect(security.changePassword(123)).to.eventually.be.rejectedWith(
      /Parameter loginId of security.changePassword must be a string/);
  });

  it('changePassword throws if passwordOrToken is invalid', async () => {
    return expect(security.changePassword('baz@bar.com', 123)).to.eventually.be.rejectedWith(
      /Parameter passwordOrToken of security.changePassword must be a string/);
  });

  it('changePassword throws if newPassword is invalid', async () => {
    return expect(security.changePassword('baz@bar.com', 'secret', 123)).to.eventually.be.rejectedWith(
      /Parameter newPassword of security.changePassword must be a string/);
  });

  it('changePassword returns false if provider is missing', async () => {
    const isChanged = await security.changePassword('foo@bar.com', 'secret', '123');
    expect(isChanged).to.be.false;
  });

  it('changePassword returns false if provider doesnt have password hash', async () => {
    const isChanged = await security.changePassword('invalid@bar.com', 'secret', '123');
    expect(isChanged).to.be.false;
  });

  it('changePassword returns false if password doesnt match', async () => {
    const isChanged = await security.changePassword('baz@bar.com', 'not-a-secret', '123');
    expect(isChanged).to.be.false;
  });

  it('changePassword returns true if password is reset using a token', async () => {
    const newPassword = 'new-secret';
    const token = await security.createPasswordResetToken('baz@bar.com', 12);

    const isChanged = await security.changePassword('baz@bar.com', token, newPassword);
    expect(isChanged).to.be.true;

    const provider = await db
      .collection('_AuthProvider')
      .find({ providerId: 'baz@bar.com', provider: 'password' })
      .toArray();
    expect(provider).to.have.length(1);
    // make sure token is reset to null
    expect(provider[0].passwordToken).to.be.null;
    // make sure token is hashed
    expect(provider[0].password).to.not.equal(newPassword);
  });

  it('changePassword returns true if password is reset using a current password', async () => {
    let provider = await db
      .collection('_AuthProvider')
      .find({ providerId: 'baz@bar.com', provider: 'password' })
      .toArray();
    expect(provider).to.have.length(1);
    const oldHash = provider[0].password;

    const newPassword = 'newest-secret';
    const token = await security.createPasswordResetToken('baz@bar.com', 12);

    const isChanged = await security.changePassword('baz@bar.com', token, newPassword);
    expect(isChanged).to.be.true;

    provider = await db
      .collection('_AuthProvider')
      .find({ providerId: 'baz@bar.com', provider: 'password' })
      .toArray();
    expect(provider).to.have.length(1);
    // make sure token is reset to null
    expect(provider[0].passwordToken).to.be.null;
    // make sure token is hashed
    expect(provider[0].password).to.not.equal(newPassword);
    expect(provider[0].password).to.not.equal(oldHash);
  });

  // removePasswordAuth(viewerId)
  it('removePasswordAuth throws if argments are not passed', async () => {
    return expect(security.removePasswordAuth()).to.eventually.be.rejectedWith(
      /Must pass a viewerId to security\.removePasswordAuth/);
  });

  it('removePasswordAuth throws if viewerId is invalid', async () => {
    const invalidViewerId = newGlobalId('Foo');
    return expect(security.removePasswordAuth(invalidViewerId)).to.eventually.be.rejectedWith(
      /viewerId passed to security.removePasswordAuth must be of type "User"/);
  });

  it('removePasswordAuth returns false if viewer is missing', async () => {
    const missingViewerId = newGlobalId('User');
    const isRemoved = await security.removePasswordAuth(missingViewerId);
    expect(isRemoved).to.be.false;
  });

  it('removePasswordAuth removes password auth', async () => {
    const isRemoved = await security.removePasswordAuth(viewerId);
    expect(isRemoved).to.be.true;
    const providers = await db
      .collection('_AuthProvider')
      .find({ viewerId, provider: 'password' })
      .toArray();
    expect(providers).to.have.length(0);
  });


  // createRandomToken(length, numeric = false)
  it('createRandomToken throws if argments are not passed', async () => {
    return expect(security.createRandomToken()).to.eventually.be.rejectedWith(
      /Parameter length of security.createRandomToken is required/);
  });

  it('createRandomToken throws if length is invalid', async () => {
    return expect(security.createRandomToken('12')).to.eventually.be.rejectedWith(
      /Parameter length of security.createRandomToken must be a number/);
  });

  it('createRandomToken throws if numeric is invalid', async () => {
    return expect(security.createRandomToken(12, 'foo')).to.eventually.be.rejectedWith(
      /Parameter numeric of security.createRandomToken must be a boolean/);
  });

  it('createRandomToken returns numeric tokens', async () => {
    const lengths = Array.apply(null, { length: 20 }).map( (_, i) => i + 1 );
    const tokens = await Promise.all(lengths.map(length =>
      security.createRandomToken(length, true)));

    expect(tokens).to.have.length(20);
    tokens.forEach((token, i) => {
      expect(token).to.be.a('string');
      expect(token).to.have.length(i + 1);
      expect(token).to.match(new RegExp(`^[0-9]{${i + 1}}$`));
    });
  });

  it('createRandomToken returns alpha numeric tokens', async () => {
    const lengths = Array.apply(null, { length: 20 }).map( (_, i) => i + 1 );
    const tokens = await Promise.all(lengths.map(length =>
      security.createRandomToken(length, false)));

    expect(tokens).to.have.length(20);
    tokens.forEach((token, i) => {
      expect(token).to.be.a('string');
      expect(token).to.have.length(i + 1);
      expect(token).to.match(new RegExp(`^[0-9a-zA-Z]{${i + 1}}$`));
    });
  });

});
