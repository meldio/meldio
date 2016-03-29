import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';

import { MongoClient } from 'mongodb';
import { GraphQL } from '../../__tests__/setup';

const schemaDefinition = `
  type Test implements Node @rootConnection(field: "allTests") {
    id: ID!
    string: String
  } `;

let graphql;
let db;
const dbName = 'IDFieldTest';

describe('Mongo Resolvers / node / IDField:', function () {

  before(async () => {
    db = await MongoClient.connect(`mongodb://localhost:27017/${dbName}`);
    graphql = await GraphQL(schemaDefinition, db);
    await db.collection('Test').insertMany([
      { _id: '-K5J4EebArCobZljE0-y-j5JK', string: 'one' },
      { _id: '-K5J4GkqW7bOYpaKAgc5-j5JK', string: 'two' },
      { _id: '-K5J4Ip3EzAf3JgTescv-j5JK', string: 'three' },
    ]);
  });

  after(async function() {
    await db.dropDatabase(dbName);
    db.close();
  });

  it('Object returns id when fetched with node root field', async () => {
    const message = `
      query TestCase {
        node(id: "-K5J4GkqW7bOYpaKAgc5-j5JK") {
          id
          ... on Test { string }
        }
      } `;
    const result = await graphql(message);
    expect(result).to.deep.equal({
      data: { node: { id: '-K5J4GkqW7bOYpaKAgc5-j5JK', string: 'two' } }
    });
  });

  it('Object returns id when fetched with root connection', async () => {
    const message = `
      query TestCase {
        allTests {
          edges {
            node {
              id
              string
            }
          }
        }
      } `;
    const result = await graphql(message);
    expect(result.data.allTests.edges)
      .to.deep.contain(
        { node: { id: '-K5J4EebArCobZljE0-y-j5JK', string: 'one' } }).and
      .to.deep.contain(
        { node: { id: '-K5J4GkqW7bOYpaKAgc5-j5JK', string: 'two' } }).and
      .to.deep.contain(
        { node: { id: '-K5J4Ip3EzAf3JgTescv-j5JK', string: 'three' } });
  });
});
