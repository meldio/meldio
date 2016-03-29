import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
// import { typeFromGlobalId } from '../../../../jsutils/globalId';
import { MongoClient } from 'mongodb';
import { GraphQL } from '../../__tests__/setup';
import { newGlobalId } from '../../../../jsutils/globalId';
import { base64 } from '../../../../jsutils/base64';

/* eslint no-unused-expressions: 0 */

let graphql;
let db;
const dbName = 'NodeConnectionTest_Type';

const cursor = index => ({ cursor: base64('connection:' + index) });

const schema = `
  type User implements Node {
    id: ID!
    firstName: String
    lastName: String
    widgets: NodeConnection(Widget, users, Props)
  }

  type Props {
    quantity: Int
  }

  type Widget implements Node {
    id: ID!
    name: String
    failureRate: Float
    users: NodeConnection(User, widgets, Props)
    ratings: [Float]
    keyComponent: Component
    otherComponents: [Component]
    keyApp: Application
    otherApps: [Application]
  }

  type Component {
    name: String
    cost: Float
  }

  type Application implements Node {
    id: ID!
    name: String
  }
`;

const props = [
  { quantity: 40 },
  { quantity: 30 },
  { quantity: 20 },
  { quantity: 10 },
  { quantity: 5 },
];

const widgets = [
  {
    _id: '-KCd76KdWCRpOsyEyApA-m9475K',
    name: 'W1',
    failureRate: 0.15,
    ratings: [ 5.0, 4.9, 4.8, 4.5, 5.0 ],
    keyComponent: { _type: 'Component', name: 'W1-C1(Key)', cost: 120 },
    otherComponents: [
      { _type: 'Component', name: 'W1-C2', cost: 100 },
      { _type: 'Component', name: 'W1-C3', cost: 200 },
    ],
    keyApp: '-KCubLwanUEtDjXor5zR-RGGC931K9FE',
    otherApps: [
      '-KCubQLGSURpw0Pb8PM5-RGGC931K9FE',
      '-KCubSkl5sBcsxdWikNV-RGGC931K9FE',
    ],
  },
  {
    _id: '-KCd7EijXjk4XaruHfhq-m9475K',
    name: 'W2',
    failureRate: 0.25,
    ratings: [ 4.0, 3.9, 3.8, 3.5, 3.0 ],
    keyComponent: { _type: 'Component', name: 'W2-C1(Key)', cost: 1000 },
    otherComponents: [
      { _type: 'Component', name: 'W2-C2', cost: 2000 },
      { _type: 'Component', name: 'W2-C3', cost: 3000 },
    ],
    keyApp: '-KCubUkXCBsFvnx0M5nQ-RGGC931K9FE',
    otherApps: [
      '-KCubWlwCn845CI_CktC-RGGC931K9FE',
      '-KCubZ5P2wedKDRiEwl0-RGGC931K9FE',
    ],
  },
  {
    _id: '-KCdBWWS8e5AVORNCUa3-m9475K',
    name: 'W3',
    failureRate: 0.35,
    ratings: [ 3.0, 2.9, 2.8, 2.5 ],
    keyComponent: { _type: 'Component', name: 'W3-C11(Key)', cost: 10 },
    otherComponents: [
      { _type: 'Component', name: 'W3-C12', cost: 20 },
      { _type: 'Component', name: 'W3-C13', cost: 20 },
      { _type: 'Component', name: 'W3-C14', cost: 20 },
      { _type: 'Component', name: 'W3-C15', cost: 20 },
    ],
    keyApp: '-KCubfTv_oxCJykKq7lF-RGGC931K9FE',
    otherApps: [
      '-KCubin9OlYnJk5n6We9-RGGC931K9FE',
      '-KCublfEhiHgXhfUIHhd-RGGC931K9FE'
    ],
  },
  {
    _id: '-KCdBh9Kl24sSRPeMP6n-m9475K',
    name: 'W4',
    failureRate: 0.45,
    ratings: [ ],
    keyComponent: { _type: 'Component', name: 'W4-C1(Key)', cost: null },
    keyApp: '-KCubkXcC7MdPJ0a8rby-RGGC931K9FE',
  },
  {
    _id: '-KCwduZKHU6uhjE7skPS-m9475K',
    name: 'W5',
    failureRate: 0.95,
    ratings: null,
    keyComponent: null,
    otherComponents: [ ],
    keyApp: null,
    otherApps: null
  },
];

const applications = [
  { _id: '-KCubLwanUEtDjXor5zR-RGGC931K9FE', name: 'W1-A1(Key)' },
  { _id: '-KCubQLGSURpw0Pb8PM5-RGGC931K9FE', name: 'W1-A2' },
  { _id: '-KCubSkl5sBcsxdWikNV-RGGC931K9FE', name: 'W1-A3' },
  { _id: '-KCubUkXCBsFvnx0M5nQ-RGGC931K9FE', name: 'W2-A4(Key)' },
  { _id: '-KCubWlwCn845CI_CktC-RGGC931K9FE', name: 'W2-A5' },
  { _id: '-KCubZ5P2wedKDRiEwl0-RGGC931K9FE', name: 'W2-A6' },
  { _id: '-KCubfTv_oxCJykKq7lF-RGGC931K9FE', name: 'W3-A7(Key)' },
  { _id: '-KCubin9OlYnJk5n6We9-RGGC931K9FE', name: 'W3-A8' },
  { _id: '-KCublfEhiHgXhfUIHhd-RGGC931K9FE', name: 'W3-A9' },
  { _id: '-KCubkXcC7MdPJ0a8rby-RGGC931K9FE', name: 'W4-A10' },
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

const edges = [
  ...widgets.map( (widget, index) => ({
    _id: newGlobalId('_Edge'),
    nodeId: userId,
    nodeField: 'widgets',
    relatedId: widget._id,
    relatedField: 'users',
    edgeProps: props[index],
  }))
].map(edgeInvariant);

describe('Mongo Resolvers / connection / NodeConnection (Type):', function () {

  before(async () => {

    db = await MongoClient.connect(`mongodb://localhost:27017/${dbName}`);
    graphql = await GraphQL(schema, db);

    await db.collection('User').insertMany(users);
    await db.collection('Widget').insertMany(widgets);
    await db.collection('Applications').insertMany(applications);

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
        widgets {
          edges {
            quantity
            node { id name failureRate }
          }
        }
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      id: userId,
      firstName: 'John',
      lastName: 'Smith',
      widgets: {
        edges: widgets.map( (w, i) => ({
          ...props[i],
          node: {
            id: w._id,
            name: w.name,
            failureRate: w.failureRate,
          }
        }))
      }
    } ] });
  });

  const tests = Array
    .apply(null, { length: props.length })
    .map( (_, i) => i + 1 );

  tests.forEach(n =>
    it(`first: ${n} returns expected number of items`, async () => {
      const message = ` query Q {
        user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
          widgets(first: ${n}) {
            edges {
              cursor
              quantity
              node { id name failureRate }
            }
          }
        }
      } `;
      const result = await graphql(message);
      expect(result.data).to.deep.equal({ user: [ {
        widgets: {
          edges:
            widgets.slice(0, n).map( (node, index) => ({
              ...cursor(index),
              ...props[index],
              node: {
                id: node._id,
                name: node.name,
                failureRate: node.failureRate,
              }
            }))
        },
      } ] });
    }));

  tests.forEach(n =>
    it(`last: ${n} returns expected number of items`, async () => {
      const message = ` query Q {
        user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
          widgets(last: ${n}) {
            edges {
              cursor
              quantity
              node { id name failureRate }
            }
          }
        }
      } `;
      const result = await graphql(message);
      expect(result.data).to.deep.equal({ user: [ {
        widgets: {
          edges:
            widgets.slice(-n).map( (node, index) => ({
              ...cursor(widgets.length - n + index),
              ...props[props.length - n + index],
              node: {
                id: node._id,
                name: node.name,
                failureRate: node.failureRate,
              }
            }))
        },
      } ] });
    }));

  for (let afterOff = 0; afterOff < widgets.length - 1; afterOff++) {
    for (let first = 1; first < widgets.length - afterOff; first++) {
      it(`first: ${first} after: ${afterOff} returns expected items`,
        async () => {
          const message = ` query Q {
            user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
              widgets(first: ${first} after: "${cursor(afterOff).cursor}") {
                edges {
                  cursor
                  quantity
                  node { id name failureRate }
                }
              }
            }
          } `;
          const result = await graphql(message);
          expect(result.data).to.deep.equal({ user: [ {
            widgets: {
              edges:
                widgets
                  .slice(afterOff + 1, afterOff + first + 1)
                  .map( (node, index) => ({
                    ...cursor(afterOff + index + 1),
                    ...props[afterOff + index + 1],
                    node: {
                      id: node._id,
                      name: node.name,
                      failureRate: node.failureRate,
                    }
                  }))
            }
          } ] });
        });
    }
  }

  for (let beforeOff = widgets.length - 1; beforeOff > 0; beforeOff--) {
    for (let last = 1; last < beforeOff + 1; last++) {
      it(`last: ${last} before: ${beforeOff} returns expected items`,
        async () => {
          const message = ` query Q {
            user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
              widgets(last: ${last} before: "${cursor(beforeOff).cursor}") {
                edges {
                  cursor
                  quantity
                  node { id name failureRate }
                }
              }
            }
          } `;
          const result = await graphql(message);
          expect(result.data).to.deep.equal({ user: [ {
            widgets: {
              edges:
                widgets
                  .slice(beforeOff - last, beforeOff)
                  .map( (node, index) => ({
                    ...cursor(beforeOff - last + index),
                    ...props[beforeOff - last + index],
                    node: {
                      id: node._id,
                      name: node.name,
                      failureRate: node.failureRate,
                    }
                  }))
            }
          } ] });
        });
    }
  }

  it('filterBy returns expected items', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: widgets(
          filterBy: { node: { failureRate: { lte: 0.25 }}}
        ) {
          edges {
            quantity
            node { id name failureRate }
          }
        },
        test2: widgets(filterBy: { quantity: { gt: 25 }}) {
          edges {
            quantity
            node { id name failureRate }
          }
        },
        test3: widgets(filterBy: {
          quantity: { gt: 25, lt: 35 },
          node: {
            failureRate: { lt: 0.3 }
            name: { eq: [ "W2", "W3" ] }
          }
        }) {
          edges {
            quantity
            node { id name failureRate }
          }
        },
        test4: widgets(filterBy: { node: {
          id: { eq: "-KCdBWWS8e5AVORNCUa3-m9475K" }
        }}) {
          edges {
            quantity
            node { id name failureRate }
          }
        }
        test5: widgets(filterBy: { node: {
          name: { matches: "3" }
        }}) {
          edges {
            quantity
            node { id name failureRate }
          }
        }
        test6: widgets(filterBy: { quantity: { gte: 20 } }) {
          edges {
            quantity
            node { id name failureRate }
          }
        }
        test7: widgets(filterBy: { quantity: { ne: [40, 20, 30, 5] } }) {
          edges {
            quantity
            node { id name failureRate }
          }
        }
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      test1: {
        edges: [
          {
            quantity: 40,
            node: {
              id: '-KCd76KdWCRpOsyEyApA-m9475K',
              name: 'W1',
              failureRate: 0.15,
            },
          },
          {
            quantity: 30,
            node: {
              id: '-KCd7EijXjk4XaruHfhq-m9475K',
              name: 'W2',
              failureRate: 0.25,
            }
          }
        ]
      },
      test2: {
        edges: [
          {
            quantity: 40,
            node: {
              id: '-KCd76KdWCRpOsyEyApA-m9475K',
              name: 'W1',
              failureRate: 0.15,
            },
          },
          {
            quantity: 30,
            node: {
              id: '-KCd7EijXjk4XaruHfhq-m9475K',
              name: 'W2',
              failureRate: 0.25,
            }
          }
        ]
      },
      test3: {
        edges: [
          {
            quantity: 30,
            node: {
              id: '-KCd7EijXjk4XaruHfhq-m9475K',
              name: 'W2',
              failureRate: 0.25,
            }
          }
        ]
      },
      test4: {
        edges: [
          {
            quantity: 20,
            node: {
              id: '-KCdBWWS8e5AVORNCUa3-m9475K',
              name: 'W3',
              failureRate: 0.35,
            }
          }
        ]
      },
      test5: {
        edges: [
          {
            quantity: 20,
            node: {
              id: '-KCdBWWS8e5AVORNCUa3-m9475K',
              name: 'W3',
              failureRate: 0.35,
            }
          }
        ]
      },
      test6: {
        edges: [
          {
            quantity: 40,
            node: {
              id: '-KCd76KdWCRpOsyEyApA-m9475K',
              name: 'W1',
              failureRate: 0.15,
            },
          },
          {
            quantity: 30,
            node: {
              id: '-KCd7EijXjk4XaruHfhq-m9475K',
              name: 'W2',
              failureRate: 0.25,
            }
          },
          {
            quantity: 20,
            node: {
              id: '-KCdBWWS8e5AVORNCUa3-m9475K',
              name: 'W3',
              failureRate: 0.35,
            }
          }
        ]
      },
      test7: {
        edges: [
          {
            quantity: 10,
            node: {
              id: '-KCdBh9Kl24sSRPeMP6n-m9475K',
              name: 'W4',
              failureRate: 0.45,
            },
          },
        ]
      },
    } ] });
  });

  it('filterBy works with scalar list fields', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        exists: widgets(filterBy: {node: {otherApps: {exists: true}}}) {
          edges { node { name } }
        },
        notExists: widgets(filterBy: {node: {otherApps: {exists: false}}}) {
          edges { node { name } }
        },
        some: widgets(filterBy: {node: {ratings: {some: { gt: 4.5 }}}}) {
          edges { node { name } }
        },
        every: widgets(filterBy: {node: {ratings: {every: { gte: 3.0 }}}}) {
          edges { node { name } }
        },
        length: widgets(filterBy: {node: {ratings: {length: 4}}}) {
          edges { node { name } }
        },
        empty: widgets(filterBy: {node: {ratings: {empty: true}}}) {
          edges { node { name } }
        },
        notEmpty: widgets(filterBy: {node: {ratings: {empty: false}}}) {
          edges { node { name } }
        },
        none: widgets(filterBy: {node: {ratings: {none: {lt: 4}}}}) {
          edges { node { name } }
        },
        noneNonEmptyExists: widgets(filterBy: {node: {
          ratings: {
            none: {lt: 4}
            empty: false
            exists: true
          }
        }}) {
          edges { node { name } }
        },
      }
    } `;
    const result = await graphql(message);
    const toEdges = list => ({edges: list.map(v => ({ node: { name: v }}))});
    expect(result.data).to.deep.equal({ user: [ {
      exists: toEdges([ 'W1', 'W2', 'W3' ]),
      notExists: toEdges([ 'W4', 'W5' ]),
      some: toEdges([ 'W1' ]),
      every: toEdges([ 'W1', 'W2', 'W4', 'W5' ]),
      length: toEdges([ 'W3' ]),
      empty: toEdges([ 'W4' ]),
      notEmpty: toEdges([ 'W1', 'W2', 'W3' ]),
      none: toEdges([ 'W1', 'W4', 'W5' ]),
      noneNonEmptyExists: toEdges([ 'W1' ]),
    } ]});
  });

  it('filterBy works with object list fields', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        exists: widgets(filterBy: {node: {otherComponents: {exists: true}}}) {
          edges { node { name } }
        },
        notExists: widgets(filterBy: {node: {
          otherComponents: {exists: false}
        }})
        {
          edges { node { name } }
        },
        some: widgets(filterBy: {node: {
          otherComponents: {
            some: {
              name: { matches: "-C2" }
              cost: { gt: 1000 }
            }
          }
        }}) {
          edges { node { name } }
        },
        every: widgets(filterBy: {node: {
          otherComponents: {
            every: { cost: { eq: 20 } }
            empty: false
            exists: true
          }
        }}) {
          edges { node { name } }
        },
        everyWithMultipleCond: widgets(filterBy: {node: {
          otherComponents: {
            every: {
              cost: { lt: 1000 }
              name: { matches: "W1" }
            }
            empty: false
            exists: true
          }
        }}) {
          edges { node { name } }
        },
        length: widgets(filterBy: {node: {
          otherComponents: {length: 2}
        }}) {
          edges { node { name } }
        },
        empty: widgets(filterBy: {node: {
          otherComponents: { empty: true }
        }}) {
          edges { node { name } }
        },
        notEmpty: widgets(filterBy: {node: {
          otherComponents: {empty: false}
        }}) {
          edges { node { name } }
        },
        none: widgets(filterBy: {node: {
          otherComponents: {none: {cost: { lt: 1000 }}}
        }}) {
          edges { node { name } }
        },
        noneNonEmpty: widgets(filterBy: {node: {
          otherComponents: {
            none: { cost: { lt: 1000 }}
            exists: true
            empty: false
          }
        }}) {
          edges { node { name } }
        },
      }
    } `;
    const result = await graphql(message);
    const toEdges = list => ({ edges: list.map(v => ({ node: { name: v }})) });
    expect(result.data).to.deep.equal({ user: [ {
      exists: toEdges([ 'W1', 'W2', 'W3', 'W5' ]),
      notExists: toEdges([ 'W4' ]),
      some: toEdges([ 'W2' ]),
      every: toEdges([ 'W3' ]),
      everyWithMultipleCond: toEdges([ 'W1' ]),
      length: toEdges([ 'W1', 'W2' ]),
      empty: toEdges([ 'W5' ]),
      notEmpty: toEdges([ 'W1', 'W2', 'W3' ]),
      none: toEdges([ 'W2', 'W4', 'W5' ]),
      noneNonEmpty: toEdges([ 'W2' ]),
    } ]});
  });

  it('filterBy works with object fields', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: widgets(filterBy: {node: {keyComponent: {cost: {lt: 1000}}}}) {
          edges { node { name } }
        }
        test2: widgets(
          filterBy: {node: {keyComponent: {cost: {exists: true}}}}
        ) {
          edges { node { name } }
        }
        test3: widgets(
          filterBy: {node: {keyComponent: {cost: {exists: false}}}}
        ) {
          edges { node { name } }
        }
      }
    } `;
    const result = await graphql(message);
    const toEdges = list => ({ edges: list.map(v => ({ node: { name: v }})) });
    expect(result.data).to.deep.equal({ user: [ {
      test1: toEdges([ 'W1', 'W3' ]),
      test2: toEdges([ 'W1', 'W2', 'W3' ]),
      test3: toEdges([ 'W4', 'W5' ]),
    } ]});
  });

  it('orderBy works as expected', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: widgets(orderBy: {quantity: ASCENDING}) {
          edges { node { name } }
        }
        test2: widgets(orderBy: {node: {id: DESCENDING}}) {
          edges { node { name } }
        }
        test3: widgets(orderBy: {node: {failureRate: ASCENDING}}) {
          edges { node { name } }
        }
      }
    } `;
    const result = await graphql(message);
    const toEdges = list => ({ edges: list.map(v => ({ node: { name: v }})) });
    expect(result.data).to.deep.equal({ user: [ {
      test1: toEdges([ 'W5', 'W4', 'W3', 'W2', 'W1' ]),
      test2: toEdges([ 'W5', 'W4', 'W3', 'W2', 'W1' ]),
      test3: toEdges([ 'W1', 'W2', 'W3', 'W4', 'W5' ]),
    } ]});
  });

  it('aggregations work as expected', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        widgets {
          sum(edges: quantity)
          average(node: failureRate)
        }
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      widgets: {
        sum: 105,
        average: 0.43,
      }
    } ]});
  });

  it('count works as expected expected items', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: widgets {
          count(filterBy: { node: { failureRate: { lte: 0.25 }}})
        },
        test2: widgets {
          count(filterBy: { quantity: { gt: 25 }})
        },
        test3: widgets {
          count(filterBy: {
            quantity: { gt: 25, lt: 35 },
            node: {
              failureRate: { lt: 0.3 }
              name: { eq: [ "W2", "W3" ] }
            }
          })
        },
        test4: widgets {
          count(filterBy: { node: { id: {eq: "-KCdBWWS8e5AVORNCUa3-m9475K" }}})
        }
        test5: widgets {
          count(filterBy: { node: { name: { matches: "W3" } }})
        }
        test6: widgets {
          count(filterBy: { quantity: { gte: 20 } })
        }
        test7: widgets {
          count(filterBy: { quantity: { ne: [40, 20, 30, 5] } })
        }
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      test1: { count: 2 },
      test2: { count: 2 },
      test3: { count: 1 },
      test4: { count: 1 },
      test5: { count: 1 },  // matches deteriorates to eq on count
      test6: { count: 3 },
      test7: { count: 1 },
    } ] });
  });

  it('count works with scalar list fields', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        exists: widgets {
          count(filterBy: {node: {otherApps: {exists: true}}})
        },
        notExists: widgets {
          count(filterBy: {node: {otherApps: {exists: false}}})
        },
        some: widgets {
          count(filterBy: {node: {ratings: {some: { gt: 4.5 }}}})
        },
        every: widgets {
          count(filterBy: {node: {ratings: {every: { gte: 3.0 }}}})
        },
        length: widgets {
          count(filterBy: {node: {ratings: {length: 4}}})
        },
        empty: widgets {
          count(filterBy: {node: {ratings: {empty: true}}})
        },
        notEmpty: widgets {
          count(filterBy: {node: {ratings: {empty: false}}})
        },
        none: widgets {
          count(filterBy: {node: {ratings: {none: {lt: 4}}}})
        },
        noneNonEmpty: widgets {
          count(filterBy: {node: {
            ratings: {
              none: {lt: 4}
              empty: false
            }
          }})
        },
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      exists: {count: 3},
      notExists: {count: 2},
      some: {count: 1},
      every: {count: 4},
      length: {count: 1},
      empty: {count: 1},
      notEmpty: {count: 3},
      none: {count: 3},
      noneNonEmpty: {count: 1},
    } ]});
  });

  it('count works with object list fields', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        exists: widgets {
          count(filterBy: {node: {otherComponents: {exists: true}}})
        },
        notExists: widgets {
          count(filterBy: {node: {
            otherComponents: {exists: false}
          }})
        },
        some: widgets {
          count(filterBy: {node: {
            otherComponents: {
              some: {
                cost: { gt: 1000 }
              }
            }
          }})
        },
        every: widgets {
          count(filterBy: {node: {
            otherComponents: {
              every: { cost: { eq: 20 } }
              empty: false
              exists: true
            }
          }})
        },
        everyWithMultipleCond: widgets {
          count(filterBy: {node: {
            otherComponents: {
              every: {
                cost: { lt: 1000 }
                name: { ne: [ "W3-C12", "W3-C13", "W3-C14", "W3-C15"] }
              }
              empty: false
              exists: true
            }
          }})
        },
        length: widgets {
          count(filterBy: {node: {
            otherComponents: {length: 2}
          }})
        },
        empty: widgets {
          count(filterBy: {node: {
            otherComponents: { empty: true }
          }})
        },
        notEmpty: widgets {
          count(filterBy: {node: {
            otherComponents: {empty: false}
          }})
        },
        none: widgets {
          count(filterBy: {node: {
            otherComponents: {none: {cost: { lt: 1000 }}}
          }})
        },
        noneNonEmpty: widgets {
          count(filterBy: {node: {
            otherComponents: {
              none: { cost: { lt: 1000 }}
              exists: true
              empty: false
            }
          }})
        },
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      exists: {count: 4},
      notExists: {count: 1},
      some: {count: 1},
      every: {count: 1},
      everyWithMultipleCond: {count: 1},
      length: {count: 2},
      empty: {count: 1},
      notEmpty: {count: 3},
      none: {count: 3},
      noneNonEmpty: {count: 1},
    } ]});
  });

  it('filterBy and count works with object fields', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: widgets {
          count(filterBy: { node: { keyComponent: { cost: { gt: 100 }} } })
        },
        test2: widgets(filterBy: {node: {keyComponent: {cost: { gt: 100 }}}}) {
          edges {
            node { name }
          }
        }
      }
    } `;
    const result = await graphql(message);
    const toEdges = list => ({ edges: list.map(v => ({ node: { name: v }})) });
    expect(result.data).to.deep.equal({ user: [ {
      test1: { count: 2 },
      test2: toEdges([ 'W1', 'W2' ])
    } ]});
  });

});
