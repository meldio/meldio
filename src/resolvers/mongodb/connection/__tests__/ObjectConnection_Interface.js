import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import { MongoClient } from 'mongodb';
import { GraphQL } from '../../__tests__/setup';
import { newGlobalId } from '../../../../jsutils/globalId';

let graphql;
let db;
const dbName = 'NodeConnectionTest_Interface';

const schema = `
  type User implements Node {
    id: ID!
    firstName: String
    lastName: String
    stuff: ObjectConnection(Stuff, Props)
  }

  type Props {
    quantity: Int
  }

  interface Stuff {
    name: String
    cost: Float
  }

  type Widget implements Stuff {
    name: String
    cost: Float
  }

  type Gadget implements Stuff {
    name: String
    cost: Float
  }

  type Gizmo implements Stuff {
    name: String
    cost: Float
  }
`;

const props = [
  { quantity: 40 },
  { quantity: 30 },
  { quantity: 20 },
  { quantity: 10 },
  { quantity: 5 },
  { quantity: 1 },
];

const widgets = [
  {
    _type: 'Widget',
    name: 'W1',
    cost: 100.1,
  },
  {
    _type: 'Widget',
    name: 'W2',
    cost: 200.2,
  },
  {
    _type: 'Widget',
    name: 'W3',
    cost: 300.3,
  }
];

const gadgets = [
  {
    _type: 'Gadget',
    name: 'G1',
    cost: 400.4,
  },
  {
    _type: 'Gadget',
    name: 'G2',
    cost: 500.5,
  },
];

const gizmos = [
  {
    _type: 'Gizmo',
    name: 'Z1',
    cost: 500.5,
  },
];

const userId = '-KCb1OwX6lMf7PUpOgjK-kJ5I';

const users = [
  {
    _id: userId,
    firstName: 'John',
    lastName: 'Smith',
  }
];

const stuff = [ ...widgets, ...gadgets, ...gizmos ];

const edges = stuff
  .map((s, index) => ({
    _id: newGlobalId('_Edge'),
    nodeId: userId,
    nodeField: 'stuff',
    relatedObject: s,
    edgeProps: props[index] }));

function toObject(mongoObject) {
  const nodeObj = { ...mongoObject };
  delete nodeObj._type;
  return nodeObj;
}

function toEdges(...names) {
  return {
    edges:
      names.map(name => {
        const index = stuff.findIndex(s => s.name === name);
        return {
          ...props[index],
          node: toObject(stuff[index])
        };
      })
  };
}

const edgesQuery = `
  edges {
    quantity
    node { ...on Stuff { name, cost } }
}
`;

describe('Mongo Resolvers / connection / NodeConnection (Interface):',
function () {
  before(async () => {

    db = await MongoClient.connect(`mongodb://localhost:27017/${dbName}`);
    graphql = await GraphQL(schema, db);

    await db.collection('User').insertMany(users);
    await db.collection('_Edge').insertMany(edges);
  });

  after(async function() {
    await db.dropDatabase(dbName);
    db.close();
  });

  it('Object connection is followed from a node', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        id
        firstName
        lastName
        stuff { ${edgesQuery} }
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      id: userId,
      firstName: 'John',
      lastName: 'Smith',
      stuff: toEdges('W1', 'W2', 'W3', 'G1', 'G2', 'Z1')
    } ] });
  });

  it('filterBy filters interface ObjectConnection', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: stuff(filterBy: {quantity: { lt: 30, gt: 5 }}) {
          ${edgesQuery}
        }
        test2: stuff(filterBy: {node: { name: { matches: "W" } }}) {
          ${edgesQuery}
        }
        test3: stuff(filterBy: { node: { type: {eq: [ Gadget, Gizmo ] } } }) {
          ${edgesQuery}
        }
        test4: stuff(filterBy: { node: { type: {ne: [ Gadget, Gizmo ] } } }) {
          ${edgesQuery}
        }
        test5: stuff(filterBy: { node: { type: {ne: Widget } } }) {
          ${edgesQuery}
        }
        test6: stuff(filterBy: { node: { exists: true } }) {
          ${edgesQuery}
        }
        test7: stuff(filterBy: { node: { exists: false } }) {
          ${edgesQuery}
        }
      }
    } `;
    const result = await graphql(message);
    // console.log(result);
    expect(result.data).to.deep.equal({ user: [ {
      test1: toEdges('W3', 'G1'),
      test2: toEdges('W1', 'W2', 'W3'),
      test3: toEdges('G1', 'G2', 'Z1'),
      test4: toEdges('W1', 'W2', 'W3'),
      test5: toEdges('G1', 'G2', 'Z1'),
      test6: toEdges('W1', 'W2', 'W3', 'G1', 'G2', 'Z1'),
      test7: toEdges(),
    } ] });
  });

  it('count filters interface ObjectConnection', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: stuff {
          count(filterBy: {quantity: { lt: 30, gt: 5 }})
        }
        test2: stuff {
          count(filterBy: {node: { name: { eq: ["W1", "W2", "W3"] } }})
        }
        test3: stuff {
          count(filterBy: { node: { type: {eq: [ Gadget, Gizmo ] } } })
        }
        test4: stuff {
          count(filterBy: { node: { type: {ne: [ Gadget, Gizmo ] } } })
        }
        test5: stuff {
          count(filterBy: { node: { type: {ne: Widget } } })
        }
        test6: stuff {
          count(filterBy: { node: { exists: true } })
        }
        test7: stuff {
          count(filterBy: { node: { exists: false } })
        }
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      test1: {count: 2},
      test2: {count: 3},
      test3: {count: 3},
      test4: {count: 3},
      test5: {count: 3},
      test6: {count: 6},
      test7: {count: 0},
    } ] });
  });

  it('orderBy works with interface ObjectConnection', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: stuff(orderBy: { quantity: ASCENDING }) {
          ${edgesQuery}
        }
        test2: stuff(orderBy: { quantity: DESCENDING }) {
          ${edgesQuery}
        }
        test3: stuff(orderBy: { node: {name: ASCENDING} }) {
          ${edgesQuery}
        }
        test4: stuff(orderBy: { node: {name: DESCENDING} }) {
          ${edgesQuery}
        }
        test5: stuff(
          orderBy: [
            { quantity: ASCENDING},
            { node: {name: DESCENDING} }
          ]) {
          ${edgesQuery}
        }
        test6: stuff(
          orderBy: [
            { quantity: DESCENDING},
            { node: {name: ASCENDING} }
          ]) {
          ${edgesQuery}
        }
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      test1: toEdges('Z1', 'G2', 'G1', 'W3', 'W2', 'W1'),
      test2: toEdges('W1', 'W2', 'W3', 'G1', 'G2', 'Z1'),
      test3: toEdges('G1', 'G2', 'W1', 'W2', 'W3', 'Z1'),
      test4: toEdges('Z1', 'W3', 'W2', 'W1', 'G2', 'G1'),
      test5: toEdges('Z1', 'G2', 'G1', 'W3', 'W2', 'W1'),
      test6: toEdges('W1', 'W2', 'W3', 'G1', 'G2', 'Z1'),
    } ] });
  });
});
