import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import { MongoClient } from 'mongodb';
import { GraphQL } from '../../__tests__/setup';
import { newGlobalId } from '../../../../jsutils/globalId';

let graphql;
let db;
const dbName = 'NodeConnectionTest_Union';

const schema = `
  type User implements Node {
    id: ID!
    firstName: String
    lastName: String
    stuff: NodeConnection(Stuff, users, Props)
  }

  type Props {
    quantity: Int
  }

  union Stuff = Widget | Gadget | Gizmo

  type Widget implements Node {
    id: ID!
    name: String
    cost: Float
    users: NodeConnection(User, stuff, Props)
  }

  type Gadget implements Node {
    id: ID!
    name: String
    cost: Float
    users: NodeConnection(User, stuff, Props)
  }

  type Gizmo implements Node {
    id: ID!
    name: String
    cost: Float
    users: NodeConnection(User, stuff, Props)
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
    _id: '-KCd76KdWCRpOsyEyApA-m9475K',
    name: 'W1',
    cost: 100.1,
  },
  {
    _id: '-KCd7EijXjk4XaruHfhq-m9475K',
    name: 'W2',
    cost: 200.2,
  },
  {
    _id: '-KCdBWWS8e5AVORNCUa3-m9475K',
    name: 'W3',
    cost: 300.3,
  }
];

const gadgets = [
  {
    _id: '-KD0CLmShRZRVsQxWFhR-X1475K',
    name: 'G1',
    cost: 400.4,
  },
  {
    _id: '-KD0EYV-NxWR5qsC3F_w-X1475K',
    name: 'G2',
    cost: 500.5,
  },
];

const gizmos = [
  {
    _id: '-KD0CU95yg9C9aZJLlHZ-X9QDF',
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

const edgeInvariant = edge =>
  edge.nodeId < edge.relatedId ?
    edge :
    {
      ...edge,
      nodeId: edge.relatedId,
      nodeField: edge.relatedField,
      relatedId: edge.nodeId,
      relatedField: edge.nodeField
    };

const stuff = [ ...widgets, ...gadgets, ...gizmos ];

const edges = stuff
  .map((s, index) => ({
    _id: newGlobalId('_Edge'),
    nodeId: userId,
    nodeField: 'stuff',
    relatedId: s._id,
    relatedField: 'users',
    edgeProps: props[index] }))
  .map(edgeInvariant);

function toNode(mongoObject) {
  const nodeObj = { ...mongoObject, id: mongoObject._id };
  delete nodeObj._id;
  return nodeObj;
}

function toEdges(...names) {
  return {
    edges:
      names.map(name => {
        const index = stuff.findIndex(s => s.name === name);
        return {
          ...props[index],
          node: toNode(stuff[index])
        };
      })
  };
}

const edgesQuery = `
  edges {
    quantity
    node {
      ...on Node { id }
      ...on Widget { name, cost }
      ...on Gadget { name, cost }
      ...on Gizmo { name, cost }
    }
}
`;

describe('Mongo Resolvers / connection / NodeConnection (Union):', function () {

  before(async () => {

    db = await MongoClient.connect(`mongodb://localhost:27017/${dbName}`);
    graphql = await GraphQL(schema, db);

    await db.collection('User').insertMany(users);
    await db.collection('Widget').insertMany(widgets);
    await db.collection('Gadget').insertMany(gadgets);
    await db.collection('Gizmo').insertMany(gizmos);
    await db.collection('_Edge').insertMany(edges);
  });

  after(async function() {
    await db.dropDatabase(dbName);
    db.close();
  });

  it('Node connection is followed from a node', async () => {
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

  it('filterBy filters union NodeConnection', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: stuff(filterBy: {quantity: { lt: 30, gt: 5 }}) {
          ${edgesQuery}
        }
        test2: stuff(filterBy: {
          node: {
            id: {eq: [
              "-KCd76KdWCRpOsyEyApA-m9475K",
              "-KD0CLmShRZRVsQxWFhR-X1475K",
              "-KD0CU95yg9C9aZJLlHZ-X9QDF" ]}
          }}) { ${edgesQuery} }
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
      test2: toEdges('W1', 'G1', 'Z1'),
      test3: toEdges('G1', 'G2', 'Z1'),
      test4: toEdges('W1', 'W2', 'W3'),
      test5: toEdges('G1', 'G2', 'Z1'),
      test6: toEdges('W1', 'W2', 'W3', 'G1', 'G2', 'Z1'),
      test7: toEdges(),
    } ] });
  });

  it('count filters union NodeConnection', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: stuff {
          count(filterBy: {quantity: { lt: 30, gt: 5 }})
        }
        test2: stuff {
          count(filterBy: {
            node: {
              id: {eq: [
                "-KCd76KdWCRpOsyEyApA-m9475K",
                "-KD0CLmShRZRVsQxWFhR-X1475K",
                "-KD0CU95yg9C9aZJLlHZ-X9QDF" ]}
            }})
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

  it('orderBy works with union NodeConnection', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: stuff(orderBy: { quantity: ASCENDING }) {
          ${edgesQuery}
        }
        test2: stuff(orderBy: { quantity: DESCENDING }) {
          ${edgesQuery}
        }
        test3: stuff(orderBy: { node: {id: ASCENDING} }) {
          ${edgesQuery}
        }
        test4: stuff(orderBy: { node: {id: DESCENDING} }) {
          ${edgesQuery}
        }
        test5: stuff(
          orderBy: [
            { quantity: ASCENDING},
            { node: {id: DESCENDING} }
          ]) {
          ${edgesQuery}
        }
        test6: stuff(
          orderBy: [
            { quantity: DESCENDING},
            { node: {id: ASCENDING} }
          ]) {
          ${edgesQuery}
        }
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      test1: toEdges('Z1', 'G2', 'G1', 'W3', 'W2', 'W1'),
      test2: toEdges('W1', 'W2', 'W3', 'G1', 'G2', 'Z1'),
      test3: toEdges('W1', 'W2', 'W3', 'G1', 'Z1', 'G2'),
      test4: toEdges('G2', 'Z1', 'G1', 'W3', 'W2', 'W1'),
      test5: toEdges('Z1', 'G2', 'G1', 'W3', 'W2', 'W1'),
      test6: toEdges('W1', 'W2', 'W3', 'G1', 'G2', 'Z1'),
    } ] });
  });


});
