import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { connect } from '../connect';
import { Db } from 'mongodb';
import {
  parse,
  analyzeAST,
  validate,
} from '../../../../schema';

chai.use(chaiAsPromised);

/* eslint no-unused-expressions: 0 */
/* eslint max-len:0 */

describe('resolvers / mongodb / common / connect:', () => {

  it('connects to MongoDB', async () => {
    const dbName = `ConnectTest1`;
    const dbConnectionUri = `mongodb://localhost:27017/${dbName}`;
    const committedReads = false;
    const config = { dbConnectionUri, committedReads };


    const db = await connect(config);
    expect(db).to.be.an.instanceof(Db);

    await db.dropDatabase(dbName);
    db.close();
  });

  it('creates required indices', async () => {
    const schemaDef = `
      type User implements Node @rootViewer(field: "viewer") {
        id: ID!
        handle: String! @rootPluralId(field: "userByHandle")
        firstName: String
        lastName: String
        emails: [String]!
        profilePictureUrl: String
      }

      type ThePathRarelyTaken implements Node {
        id: ID!
        foo: Int! @rootPluralId(field: "pathByFoo")
      }
    `;
    const ast = parse(schemaDef);
    const schema = analyzeAST(ast);
    const results = validate(schema);
    expect(results).to.have.length(0);

    const dbName = `ConnectTest2`;
    const dbConnectionUri = `mongodb://localhost:27017/${dbName}`;
    const committedReads = false;
    const config = { dbConnectionUri, committedReads };

    const db = await connect(config, schema);
    expect(db).to.be.an.instanceof(Db);

    let exists = await db
      .collection('_Edge')
      .indexExists([ '_Edge_Node', '_Edge_Related' ]);
    expect(exists).to.be.true;

    exists = await db
      .collection('_AuthProvider')
      .indexExists([ '_AuthProvider_Viewer', '_AuthProvider_Provider' ]);
    expect(exists).to.be.true;

    exists = await db
      .collection('ThePathRarelyTaken')
      .indexExists([ '_ThePathRarelyTaken_foo_uniqueId' ]);
    expect(exists).to.be.true;

    exists = await db
      .collection('User')
      .indexExists([ '_User_handle_uniqueId' ]);
    expect(exists).to.be.true;

    await db.dropDatabase(dbName);
    db.close();
  });

  // this test assumes MongoDB is running without commitedReads enabled. It
  // will fail otherwise.
  it('throws if commitedReads are requested', () => {
    const dbName = `ConnectTest3`;
    const dbConnectionUri = `mongodb://localhost:27017/${dbName}`;
    const committedReads = true;
    const config = { dbConnectionUri, committedReads };

    return expect(connect(config)).to.eventually.be.rejectedWith(/Meldio/);
  });

});
