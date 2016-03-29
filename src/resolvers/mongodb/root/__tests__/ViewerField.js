import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';

import { MongoClient } from 'mongodb';
import { GraphQL } from '../../__tests__/setup';

let graphql;
let db;
const dbName = 'ViewerFieldTest';

const schema = `
  type User implements Node @rootViewer(field: "viewer") {
    id: ID!
    firstName: String
    lastName: String
  }`;

describe('Mongo Resolvers / root / ViewerField:', function () {

  before(async () => {
    db = await MongoClient.connect(`mongodb://localhost:27017/${dbName}`);
    graphql = await GraphQL(schema, db);
    await db.collection('User').insertMany([
      {
        _id: '-KCb1OwX6lMf7PUpOgjK-kJ5I',
        firstName: 'John',
        lastName: 'Smith',
      },
      {
        _id: '-KCb1VwHahyhubEm-K52-kJ5I',
        firstName: 'Jane',
        lastName: 'Doe',
      }
    ]);
  });

  after(async function() {
    await db.dropDatabase(dbName);
    db.close();
  });

  it('Returns null when viewerId is undefined in root context', async () => {
    const message = `
      query TestCase {
        viewer {
          id
          firstName
          lastName
        }
      }`;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({
      viewer: null
    });
  });

  it('Returns null when viewerId defined in root is not found', async () => {
    const message = `
      query TestCase {
        viewer {
          id
          firstName
          lastName
        }
      }`;
    const result = await graphql(message, '-KCb3Pl9U3bIt6aoFv7K-kJ5I');
    expect(result.data).to.deep.equal({
      viewer: null
    });
  });

  it('Returns correct viewer based on root context', async () => {
    const message = `
      query TestCase {
        viewer {
          id
          firstName
          lastName
        }
      }`;
    let result = await graphql(message, '-KCb1OwX6lMf7PUpOgjK-kJ5I');
    expect(result.data).to.deep.equal({
      viewer: {
        id: '-KCb1OwX6lMf7PUpOgjK-kJ5I',
        firstName: 'John',
        lastName: 'Smith',
      }
    });

    result = await graphql(message, '-KCb1VwHahyhubEm-K52-kJ5I');
    expect(result.data).to.deep.equal({
      viewer: {
        id: '-KCb1VwHahyhubEm-K52-kJ5I',
        firstName: 'Jane',
        lastName: 'Doe',
      }
    });
  });


});
