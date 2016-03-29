import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';

import { MongoClient } from 'mongodb';
import { GraphQL } from '../../__tests__/setup';

/* eslint no-unused-expressions: 0 */

let graphql;
let secureGraphQl;
let db;
const dbName = 'MutationTest';

const schema = `
  type User implements Node @rootViewer(field: "viewer") {
    id: ID!
    firstName: String
    lastName: String
  }
  mutation addUser(firstName: String!, lastName: String!) {
    user: User
  }
`;

const mutations = {
  async addUser({ firstName, lastName }) {
    const { User } = this.model;
    const user = await User.addNode({ firstName, lastName });
    return { user };
  }
};

const permissions = {
  async User() {
    const { User } = this.model;
    const viewer = this.viewer && await this.viewer.exists();

    if (viewer) {
      return User.filter({ });
    }
  },
  async addUser() {
    const viewer = this.viewer && await this.viewer.exists();

    if (viewer) {
      return true;
    }
  }
};

describe('Mongo Resolvers / mutations / Mutation:', function () {

  before(async () => {

    db = await MongoClient.connect(`mongodb://localhost:27017/${dbName}`);
    graphql = await GraphQL(schema, db, mutations);
    secureGraphQl = await GraphQL(
      schema,
      db,
      mutations,
      { enabledAuth: [ 'password' ] },
      permissions);

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

  it('Mutation is allowed and executed if security is disabled', async () => {
    const message = `
      mutation CanDoIt {
        addUser(input: {
          firstName: "Jack",
          lastName: "Ryan",
          clientMutationId: "1"
        }) {
          user {
            id,
            firstName,
            lastName,
          },
          clientMutationId
        }
      } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({
      addUser: {
        clientMutationId: '1',
        user: {
          id: result.data.addUser.user.id,
          firstName: 'Jack',
          lastName: 'Ryan',
        }
      }
    });
  });

  it('Mutation is not allowed if security is enabled and viewer is null',
  async () => {
    const message = `
      mutation CantDoIt {
        addUser(input: {
          firstName: "Joseph",
          lastName: "Ryan",
          clientMutationId: "1"
        }) {
          user {
            id,
            firstName,
            lastName,
          },
          clientMutationId
        }
      } `;
    const result = await secureGraphQl(message);
    expect(result.data.addUser).to.be.null;
    expect(result.errors).to.have.length(1);
    expect(result.errors[0].message).to.match(/Permission denied/);
  });

  it('Mutation is not allowed if security is enabled and viewer is invalid',
  async () => {

    const message = `
      mutation CantDoIt {
        addUser(input: {
          firstName: "Joseph",
          lastName: "Ryan",
          clientMutationId: "1"
        }) {
          user {
            id,
            firstName,
            lastName,
          },
          clientMutationId
        }
      } `;
    const result = await secureGraphQl(message, '-KCbElre-94v_UXFODyE-kJ5I');
    expect(result.data.addUser).to.be.null;
    expect(result.errors).to.have.length(1);
    expect(result.errors[0].message).to.match(/Permission denied/);
  });

  it('Mutation is allowed if security is enabled and viewer is okay',
  async () => {
    const message = `
      mutation CantDoIt {
        addUser(input: {
          firstName: "Joseph",
          lastName: "Ryan",
          clientMutationId: "2"
        }) {
          user {
            id,
            firstName,
            lastName,
          },
          clientMutationId
        }
      } `;
    const result = await secureGraphQl(message, '-KCb1OwX6lMf7PUpOgjK-kJ5I');
    expect(result.data).to.deep.equal({
      addUser: {
        clientMutationId: '2',
        user: {
          id: result.data.addUser.user.id,
          firstName: 'Joseph',
          lastName: 'Ryan',
        }
      }
    });
  });
});
