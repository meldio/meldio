import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';

import { MongoClient } from 'mongodb';
import { GraphQL } from '../../__tests__/setup';

import { schema } from './_schema.js';
import data from './_testData.json';

let graphql;
let db;
const dbName = 'NodeFieldTest';

describe('Mongo Resolvers / root / NodeField:', function () {

  before(async () => {
    db = await MongoClient.connect(`mongodb://localhost:27017/${dbName}`);
    graphql = await GraphQL(schema, db);
    await db.collection('Employee').insertMany(data.Employee);
    await db.collection('Contractor').insertMany(data.Contractor);
    await db.collection('Bot').insertMany(data.Bot);
  });

  after(async function() {
    await db.dropDatabase(dbName);
    db.close();
  });

  it('Returns an object when node exists', async () => {
    const message = `
      query TestCase {
        node(id: "-K5W9B5PtuqN3eOVemge-VDGCFP55") {
          id
          ... on Person {
            name
            email
            birthDate { month day year }
          }
          ... on Employee {
            employmentStartDate { month day year }
            reviews
          }
        }
      } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({
      node: {
        id: '-K5W9B5PtuqN3eOVemge-VDGCFP55',
        name: 'Naomi Norris',
        email: 'naomi@foobar.com',
        birthDate: { month: 'JAN', day: 1, year: 1980 },
        employmentStartDate: { month: 'SEP', day: 1, year: 2014 },
        reviews: [ 'A', 'B', 'A', 'A', 'A', 'A' ]
      }
    });
  });


  it('Returns null if object does not exist', async () => {
    const message = `
      query TestCase {
        node(id: "-K5WwnwPBaL7PWFFgttp-SFK") { id }
      } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({
      node: null
    });
  });

});
