import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import { permissionFilter } from '../permissionFilter';
import { connect } from '../connect';
import {
  parse,
  analyzeAST,
  validate,
} from '../../../../schema';
import { newGlobalId } from '../../../../jsutils/globalId';

chai.use(chaiAsPromised);

/* eslint no-unused-expressions: 0 */

const dbName = `PermissionFilterTest`;
const config = {
  dbConnectionUri: `mongodb://localhost:27017/${dbName}`,
  enabledAuth: [ 'facebook' ],
};
const typeName = 'User';
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

  type ThePathRarelyTaken implements Node {
    id: ID!
    foo: Int
  }
`;

const threeIds = [
  newGlobalId('ThePathRarelyTaken'),
  newGlobalId('ThePathRarelyTaken'),
  newGlobalId('ThePathRarelyTaken'),
];

const permissions = {
  async User() {
    const { User } = this.model;
    const viewer = this.viewer;

    if (viewer) {
      return User.filter({ id: { eq: viewer.id } });
    }
  },

  async ThePathRarelyTaken() {
    const { ThePathRarelyTaken } = this.model;

    return ThePathRarelyTaken.filter({ }).update({ foo: { mul: 10 } });
  }
};

describe('resolvers / mongodb / common / permissionFilter:', () => {
  before(async () => {
    db = await connect(config);

    db.collection('ThePathRarelyTaken').insertMany(threeIds.map((id, i) => ({
      _id: id,
      foo: i + 1,
    })));

    const ast = parse(schemaDef);
    schema = analyzeAST(ast);
    const results = validate(schema);
    expect(results).to.have.length(0);
  });

  after(async function() {
    await db.dropDatabase(dbName);
    db.close();
  });

  it('returns all if auth is not enabled', async () => {
    const rootValue = {
      db,
      env: { masterSecret: 'foobar' },
      permissions,
      config: { ...config, enabledAuth: [ ] },
    };

    const filter = await permissionFilter(schema, rootValue, typeName);
    expect(filter).to.be.a('object');
    expect(filter).to.deep.equal({ });
  });

  it('returns undefined if filter is not returned', async () => {
    const rootValue = {
      db,
      env: { masterSecret: 'foobar' },
      permissions,
      config,
    };

    const filter = await permissionFilter(schema, rootValue, typeName);
    expect(filter).to.be.undefined;
  });

  it('returns mongo filter if Filter is returned from permission', async () => {
    const rootValue = {
      db,
      env: { masterSecret: 'foobar' },
      permissions,
      config,
      viewerId: newGlobalId('User'),
    };

    const filter = await permissionFilter(schema, rootValue, typeName);
    expect(filter).to.be.deep.equal(
      [ { _id: { $in: [ rootValue.viewerId ] } } ]
    );
  });

  it('returns mongo filter if Nodes with array is returned from permission',
  async () => {
    const rootValue = {
      db,
      env: { masterSecret: 'foobar' },
      permissions,
      config,
      viewerId: newGlobalId('User'),
    };

    const flt = await permissionFilter(schema, rootValue, 'ThePathRarelyTaken');
    expect(flt).to.be.deep.equal(
      [ { _id: { $in: threeIds } } ]
    );
  });

});
