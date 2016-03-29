import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';

import { MongoClient } from 'mongodb';
import { GraphQL } from '../../__tests__/setup';

const schemaDefinition = `
  type RelatedObject {
    anotherString: String
  }

  type RelatedNode implements Node {
    id: ID!
    name: String
    anotherObj: RelatedObject
  }

  type Test implements Node @rootConnection(field: "allTests") {
    id: ID!
    related: RelatedNode
  } `;

let graphql;
let db;
const dbName = 'NodeTest';

describe('Mongo Resolvers / node / Node:', function () {

  before(async () => {
    db = await MongoClient.connect(`mongodb://localhost:27017/${dbName}`);
    graphql = await GraphQL(schemaDefinition, db);
    await db.collection('RelatedNode').insertMany([
      {
        _id: '-K5JBB-KKePB_1zaIC_R-h5C1K54dF45',
        name: 'Foo',
        anotherObj: {
          _type: 'RelatedObject',
          anotherString: 'Bar'
        }
      },
      {
        _id: '-K5JBGDUcsWJA6-UMj_f-h5C1K54dF45',
        name: 'Unrelated',
        anotherObj: {
          _type: 'RelatedObject',
          anotherString: 'Unrelated'
        }
      }
    ]);
    await db.collection('Test').insertMany([
      {
        _id: '-K5J4EebArCobZljE0-y-j5JK',
        related: '-K5JBB-KKePB_1zaIC_R-h5C1K54dF45'
      },
      {
        _id: '-K5J4GkqW7bOYpaKAgc5-j5JK',
        related: '-K5JBGDUcsWJA6-UMj_f-h5C1K54dF45',
      },
      {
        _id: '-K5J4Ip3EzAf3JgTescv-j5JK',
        related: null
      },
    ]);
  });

  after(async function() {
    await db.dropDatabase(dbName);
    db.close();
  });

  it('Resolves one-to-one connection to another node', async () => {
    const message = `
      query TestCase {
        test(id: "-K5J4EebArCobZljE0-y-j5JK") {
          id
          related {
            id
            name
            anotherObj {
              __typename
              anotherString
            }
          }
        }
      }`;
    const result = await graphql(message);
    expect(result).to.deep.equal({
      data: {
        test: [ {
          id: '-K5J4EebArCobZljE0-y-j5JK',
          related: {
            id: '-K5JBB-KKePB_1zaIC_R-h5C1K54dF45',
            name: 'Foo',
            anotherObj: {
              __typename: 'RelatedObject',
              anotherString: 'Bar'
            }
          }
        } ]
      }
    });
  });

  it('Works okay if there is no connection to related node', async () => {
    const message = `
      query TestCase {
        test(id: "-K5J4Ip3EzAf3JgTescv-j5JK") {
          id
          related {
            id
            name
            anotherObj {
              __typename
              anotherString
            }
          }
        }
      }`;
    const result = await graphql(message);
    expect(result).to.deep.equal({
      data: {
        test: [ {
          id: '-K5J4Ip3EzAf3JgTescv-j5JK',
          related: null
        } ]
      }
    });
  });

});
