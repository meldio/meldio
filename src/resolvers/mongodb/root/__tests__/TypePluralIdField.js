import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';

import { MongoClient } from 'mongodb';
import { GraphQL } from '../../__tests__/setup';

import { schema } from './_schema.js';
import data from './_testData.json';

let graphql;
let db;
const dbName = 'TypePluralIdFieldTest';

describe('Mongo Resolvers / root / TypePluralIdField:', function () {

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

  it('Returns a single object by id', async () => {
    const message = `
      query TestCase {
        employee(id: "-K5W9B5PtuqN3eOVemge-VDGCFP55") {
          id
          name
          email
          birthDate { month day year }
          employmentStartDate { month day year }
          reviews
        }
      } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({
      employee: [
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

  it('Returns a single object from another type by id', async () => {
    const message = `
      query TestCase {
        contractor(id: "-K5Wn3VQfTc_r7tD81hu-TFEKI13KFI") {
          id
          name
          email
          birthDate { month day year }
          contractStartDate { month day year }
          rates
        }
      } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({
      contractor: [
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

  it('Returns multiple objects by id\'s', async () => {
    const message = `
      query TestCase {
        contractor(id:
          ["-K5Wn3VQfTc_r7tD81hu-TFEKI13KFI", "-K5WmQ27-hp2l2SO6JR7-TFEKI13KFI"]
        ) {
          id
          name
          email
          birthDate { month day year }
          contractStartDate { month day year }
          rates
        }
      } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({
      contractor: [
        {
          id: '-K5Wn3VQfTc_r7tD81hu-TFEKI13KFI',
          name: 'Fay Dyer',
          email: 'fay@foobar.com',
          birthDate: { month: 'JUN', day: 20, year: 1993 },
          contractStartDate: { month: 'DEC', day: 1, year: 2015 },
          rates: [ 125 ]
        },
        {
          id: '-K5WmQ27-hp2l2SO6JR7-TFEKI13KFI',
          name: 'Kane Swanson',
          email: 'kane@foobar.com',
          birthDate: { month: 'APR', day: 1, year: 1990 },
          contractStartDate: { month: 'OCT', day: 1, year: 2015 },
          rates: [ 105.50, 110.25 ]
        }
      ]
    });
  });

  it('Returns null if an object is not found by id', async () => {
    const message = `
      query TestCase {
        contractor(id:
          ["-K5X-pF4tp30CmkXI0vX-TFEKI13KFI", "-K5X-rX8nPyhNBZj3CD1-TFEKI13KFI"]
        ) {
          id
          name
          email
        }
      } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({
      contractor: [ null, null ]
    });
  });

  it('Returns null if object id is incorrect', async () => {
    const message = `
      query TestCase {
        contractor(id: ["-K5WwnwPBaL7PWFFgttp-SFK", "-K5WwrfJ8P312KiyX4z0-WFF"])
        {
          id
          name
          email
        }
      } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({
      contractor: [ null, null ]
    });
  });

  it('Returns multiple objects using a custom root field', async () => {
    const message = `
      query TestCase {
        employeeByEmail(email:
          [ "velma@foobar.com" , "shay@foobar.com", "naomi@foobar.com" ]
        ) {
          id
          name
          email
          birthDate { month day year }
          employmentStartDate { month day year }
          reviews
        }
      } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({
      employeeByEmail: [
        {
          id: '-K5WlyzVNhOW3u4Y52cd-VDGCFP55',
          name: 'Velma Collier',
          email: 'velma@foobar.com',
          birthDate: { month: 'MAR', day: 5, year: 1985 },
          employmentStartDate: { month: 'SEP', day: 1, year: 2015 },
          reviews: [ ]
        },
        {
          id: '-K5WGtpGz8Y7uHDKEIzz-VDGCFP55',
          name: 'Shay Daniels',
          email: 'shay@foobar.com',
          birthDate: { month: 'FEB', day: 2, year: 1981 },
          employmentStartDate: { month: 'JAN', day: 1, year: 2015 },
          reviews: [ 'A', 'B', 'C' ]
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


  it('Returns null when using a custom field with invalid value', async () => {
    const message = `
      query TestCase {
        employeeByEmail(email:
          [ "foo@foobar.com" , "shay@foobar.com", "bar@foobar.com" ]
        ) {
          id
          name
          email
          birthDate { month day year }
          employmentStartDate { month day year }
          reviews
        }
      } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({
      employeeByEmail: [
        null,
        {
          id: '-K5WGtpGz8Y7uHDKEIzz-VDGCFP55',
          name: 'Shay Daniels',
          email: 'shay@foobar.com',
          birthDate: { month: 'FEB', day: 2, year: 1981 },
          employmentStartDate: { month: 'JAN', day: 1, year: 2015 },
          reviews: [ 'A', 'B', 'C' ]
        },
        null
      ]
    });
  });

});
