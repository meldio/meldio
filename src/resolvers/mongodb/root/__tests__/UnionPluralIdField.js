import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';

import { MongoClient } from 'mongodb';
import { GraphQL } from '../../__tests__/setup';

import { schema } from './_schema.js';
import data from './_testData.json';

let graphql;
let db;
const dbName = 'UnionPluralIdFieldTest';

describe('Mongo Resolvers / root / UnionPluralIdField:', function () {

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

  it('Returns a single object from one union member', async () => {
    const message = `
      query TestCase {
        team(id: "-K5W9B5PtuqN3eOVemge-VDGCFP55") {
          ... on Node {
            id
          }
          ... on Person {
            name
            email
            birthDate { month day year }
          }
          ... on Employee {
            employmentStartDate { month day year }
            reviews
          }
          ... on Contractor {
            contractStartDate { month day year }
            rates
          }
        }
      } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({
      team: [
        {
          id: '-K5W9B5PtuqN3eOVemge-VDGCFP55',
          name: 'Naomi Norris',
          email: 'naomi@foobar.com',
          birthDate: { month: 'JAN', day: 1, year: 1980 },
          employmentStartDate: { month: 'SEP', day: 1, year: 2014 },
          reviews: [ 'A', 'B', 'A', 'A', 'A', 'A' ]
        }
      ]
    });
  });

  it('Returns a single object from another member', async () => {
    const message = `
      query TestCase {
        team(id: "-K5Wn3VQfTc_r7tD81hu-TFEKI13KFI") {
          ... on Node {
            id
          }
          ... on Person {
            name
            email
            birthDate { month day year }
          }
          ... on Employee {
            employmentStartDate { month day year }
            reviews
          }
          ... on Contractor {
            contractStartDate { month day year }
            rates
          }
        }
      } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({
      team: [
        {
          id: '-K5Wn3VQfTc_r7tD81hu-TFEKI13KFI',
          name: 'Fay Dyer',
          email: 'fay@foobar.com',
          birthDate: { month: 'JUN', day: 20, year: 1993 },
          contractStartDate: { month: 'DEC', day: 1, year: 2015 },
          rates: [ 125 ]
        }
      ]
    });
  });

  it('Returns multiple objects across members', async () => {
    const message = `
      query TestCase {
        team(id:
          [ "-K5Wn3VQfTc_r7tD81hu-TFEKI13KFI", "-K5W9B5PtuqN3eOVemge-VDGCFP55" ]
        ) {
          ... on Node {
            id
          }
          ... on Person {
            name
            email
            birthDate { month day year }
          }
          ... on Employee {
            employmentStartDate { month day year }
            reviews
          }
          ... on Contractor {
            contractStartDate { month day year }
            rates
          }
        }
      } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({
      team: [
        {
          id: '-K5Wn3VQfTc_r7tD81hu-TFEKI13KFI',
          name: 'Fay Dyer',
          email: 'fay@foobar.com',
          birthDate: { month: 'JUN', day: 20, year: 1993 },
          contractStartDate: { month: 'DEC', day: 1, year: 2015 },
          rates: [ 125 ]
        },
        {
          id: '-K5W9B5PtuqN3eOVemge-VDGCFP55',
          name: 'Naomi Norris',
          email: 'naomi@foobar.com',
          birthDate: { month: 'JAN', day: 1, year: 1980 },
          employmentStartDate: { month: 'SEP', day: 1, year: 2014 },
          reviews: [ 'A', 'B', 'A', 'A', 'A', 'A' ]
        }
      ]
    });
  });

  it('Returns multiple objects from the same member', async () => {
    const message = `
      query TestCase {
        team(id:
          [ "-K5W9B5PtuqN3eOVemge-VDGCFP55", "-K5WGtpGz8Y7uHDKEIzz-VDGCFP55" ]
        ) {
          ... on Node {
            id
          }
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
      team: [
        {
          id: '-K5W9B5PtuqN3eOVemge-VDGCFP55',
          name: 'Naomi Norris',
          email: 'naomi@foobar.com',
          birthDate: { month: 'JAN', day: 1, year: 1980 },
          employmentStartDate: { month: 'SEP', day: 1, year: 2014 },
          reviews: [ 'A', 'B', 'A', 'A', 'A', 'A' ]
        },
        {
          id: '-K5WGtpGz8Y7uHDKEIzz-VDGCFP55',
          name: 'Shay Daniels',
          email: 'shay@foobar.com',
          birthDate: { month: 'FEB', day: 2, year: 1981 },
          employmentStartDate: { month: 'JAN', day: 1, year: 2015 },
          reviews: [ 'A', 'B', 'C' ]
        }
      ]
    });
  });

  it('Returns null if an object is not found', async () => {
    const message = `
      query TestCase {
        team(id:
          [ "-K5WwVl4Wljx7RA64mgw-TFEKI13KFI", "-K5WwYnUKQ_XnkI61gy4-VDGCFP55" ]
        ) {
          ... on Node {
            id
          }
          ... on Person {
            name
            email
          }
        }
      } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({
      team: [ null, null ]
    });
  });

  it('Returns null if object type is incorrect', async () => {
    const message = `
      query TestCase {
        team(id: ["-K5WwnwPBaL7PWFFgttp-SFK", "-K5WwrfJ8P312KiyX4z0-WFF"]) {
          ... on Node {
            id
          }
          ... on Person {
            name
            email
          }
        }
      } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({
      team: [ null, null ]
    });
  });

});
