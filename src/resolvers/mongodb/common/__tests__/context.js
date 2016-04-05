import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import {
  makeMutationContext,
  makeHookContext,
  makePermissionContext
} from '../context';
import { connect } from '../connect';
import {
  parse,
  analyzeAST,
  validate,
} from '../../../../schema';
import { Node } from '../../../../mutations/Node';
import { Model } from '../../../../mutations/Model';
import { SecurityApi } from '../../../../security/SecurityApi';
import { newGlobalId } from '../../../../jsutils/globalId';

chai.use(chaiAsPromised);

/* eslint no-unused-expressions: 0 */

const dbName = `ContextTest`;
const config = { dbConnectionUri: `mongodb://localhost:27017/${dbName}` };
const name = 'myRightHook';
let db;
let schema;

const schemaDef = `
  type User implements Node @rootViewer(field: "viewer") {
    id: ID!
    firstName: String
    lastName: String
    emails: [String]!
    profilePictureUrl: String
  }
`;

describe('resolvers / mongodb / common / context:', () => {
  before(async () => {
    const ast = parse(schemaDef);
    schema = analyzeAST(ast);
    const results = validate(schema);
    expect(results).to.have.length(0);

    db = await connect(config, schema);
  });

  after(async function() {
    await db.dropDatabase(dbName);
    db.close();
  });

  it('makeHookContext creates hook context', async () => {
    const rootValue = {
      db,
      env: { masterSecret: 'foobar' },
      config,
      viewerId: newGlobalId('User'),
    };

    const context = makeHookContext(schema, rootValue, name);
    expect(context).to.be.a('object');
    expect(context.model).to.be.instanceof(Model);
    expect(context.timestamp).to.be.a('number');
    expect(context.viewer).to.be.instanceof(Node);
    expect(context.viewer.id).to.equal(rootValue.viewerId);
    expect(context.env).to.deep.equal(rootValue.env);
    expect(context.config).to.deep.equal(config);
    expect(context.security).to.be.instanceof(SecurityApi);
  });

  it('makePermissionContext creates permissions context', async () => {
    const rootValue = {
      db,
      env: { masterSecret: 'foobar' },
      config,
      viewerId: newGlobalId('User'),
    };

    const context = makePermissionContext(schema, rootValue, name);
    expect(context).to.be.a('object');
    expect(context.model).to.be.instanceof(Model);
    expect(context.timestamp).to.be.a('number');
    expect(context.viewer).to.be.instanceof(Node);
    expect(context.viewer.id).to.equal(rootValue.viewerId);
    expect(context.env).to.deep.equal(rootValue.env);
    expect(context.config).to.deep.equal(config);
    expect(context.security).to.be.instanceof(SecurityApi);
  });

  it('makeMutationContext creates mutations context', async () => {
    const clientMutationId = 'client-id-1';
    const rootValue = {
      db,
      env: { masterSecret: 'foobar' },
      config,
      viewerId: newGlobalId('User'),
    };

    const context =
      makeMutationContext(schema, rootValue, name, clientMutationId);
    expect(context).to.be.a('object');
    expect(context.model).to.be.instanceof(Model);
    expect(context.timestamp).to.be.a('number');
    expect(context.viewer).to.be.instanceof(Node);
    expect(context.viewer.id).to.equal(rootValue.viewerId);
    expect(context.env).to.deep.equal(rootValue.env);
    expect(context.config).to.deep.equal(config);
    expect(context.security).to.be.instanceof(SecurityApi);
  });


});
