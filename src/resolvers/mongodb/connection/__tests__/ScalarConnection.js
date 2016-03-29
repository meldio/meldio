import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';

import { MongoClient } from 'mongodb';
import { GraphQL } from '../../__tests__/setup';
import { newGlobalId } from '../../../../jsutils/globalId';
import { base64 } from '../../../../jsutils/base64';

/* eslint no-unused-expressions: 0 */

let graphql;
let db;
const dbName = 'ScalarConnectionTest';

const cursor = index => ({ cursor: base64('connection:' + index) });

const schema = `
  enum MyEnum { ONE TWO THREE FOUR }

  type Props {
    color: String
    length: Int
    mass: Float
  }

  type User implements Node {
    id: ID!
    firstName: String
    lastName: String
    floats: ScalarConnection(Float, Props)
    ints: ScalarConnection(Int)
    strings: ScalarConnection(String)
    bools: ScalarConnection(Boolean)
    ids: ScalarConnection(ID)
    enums: ScalarConnection(MyEnum)
  }

  filter on ScalarConnection(Float, Props) {
    LESS_THAN: (value: Float) { node: { lt: $value } }
    GREEN: { color: { eq: "Green" } }
    LONGER_THAN: (length: Int) { length: { gt: $length } }
    INVALID: { color: { eq: 123 } }
  }

  order on ScalarConnection(Float, Props) {
    COLOR: [{ color: ASCENDING }]
    LONGEST_FIRST: [{ length: DESCENDING }]
    HEAVIEST_FIRST: [{ mass: DESCENDING }]
    VALUE: [{ node: ASCENDING }]
    ALL: [{ node: ASCENDING }, { color: ASCENDING }, { mass: DESCENDING }]
  }

  filter on ScalarConnection(Int) {
    LESS_THAN: (number: Int) { node: { lt: $number } }
  }

  filter on ScalarConnection(String) {
    LESS_THAN: (str: String) { node: { lt: $str } }
  }

  filter on ScalarConnection(Boolean) {
    TRUE: { node: { eq: true } }
    FALSE: { node: { eq: false } }
  }

  filter on ScalarConnection(ID) {
    LESS_THAN: (str: ID) { node: { lt: $str } }
  }

  filter on ScalarConnection(MyEnum) {
    ONE: { node: { eq: ONE } }
    TWO: { node: { eq: TWO } }
    THREE: { node: { eq: THREE } }
    FOUR: { node: { eq: FOUR } }
  }
`;

const lists = {
  floats: [ 4.7, 3.3, 8.2, 6.7, 2.1 ],
  floatProps: [
    { color: 'Green', length: 12, mass: 33.3 },
    { color: 'Blue', length: 22, mass: 63.3 },
    { color: 'Red', length: 33, mass: 73.3 },
    { color: 'Orange', length: 55, mass: 99.9 },
    { color: 'Pink', length: 75, mass: 120.0 },
  ],
  ints: [ 74, 78, 52, 22, 77, 11, 1, 87, 82, 64, 35, 15, 96, 3, 47, 18,
          28, 65, 67, 30 ],
  strings: [
    'QQMMUKPJUQWDHZWMTIXN',
    'MXHTJKEDOTFQORXOIJHZ',
    'IPVVQGYMWGWSDRQYSQOK',
    'YWFBVQSIEVVEGWKDJGGR',
    'IXJYIGQMXWPLQZKDPPNW',
    'TRXTJQOICHEKOKTEYNQH',
    'WZZTAGETNIJWXWWMLN[Z',
    'BTYLRXFVGHMZVAJRTATE',
    'JC[XWKDIMXEOBINCQKQS',
    'YGLUZZXDRPMTKTQIZPVB' ],
  bools:
    [ true, true, false, true, false, false, true, true, false, false ],
  ids: [ 'EHJOF', 'FNTPQ', 'CZDCK', 'JAWEV', 'OLOYH', 'IOUHB', 'TFVPK',
         'HZZDA', 'MMHHU', 'KBXHD' ],
  enums: [ 'TWO', 'THREE', 'TWO', 'THREE', 'THREE', 'THREE', 'TWO', 'ONE',
           'TWO', 'THREE' ],
};

const userId = '-KCb1OwX6lMf7PUpOgjK-kJ5I';

const edges = [
  ...lists.floats.map( (relatedValue, index) => ({
    _id: newGlobalId('_Edge'),
    nodeId: userId,
    nodeField: 'floats',
    relatedValue,
    edgeProps: lists.floatProps[index],
  })),
  ...lists.ints.map( relatedValue => ({
    _id: newGlobalId('_Edge'),
    nodeId: userId,
    nodeField: 'ints',
    relatedValue,
  })),
  ...lists.strings.map( relatedValue => ({
    _id: newGlobalId('_Edge'),
    nodeId: userId,
    nodeField: 'strings',
    relatedValue,
  })),
  ...lists.bools.map( relatedValue => ({
    _id: newGlobalId('_Edge'),
    nodeId: userId,
    nodeField: 'bools',
    relatedValue,
  })),
  ...lists.ids.map( relatedValue => ({
    _id: newGlobalId('_Edge'),
    nodeId: userId,
    nodeField: 'ids',
    relatedValue,
  })),
  ...lists.enums.map( relatedValue => ({
    _id: newGlobalId('_Edge'),
    nodeId: userId,
    nodeField: 'enums',
    relatedValue,
  })),
];

describe('Mongo Resolvers / connection / ScalarConnection:', function () {

  before(async () => {

    db = await MongoClient.connect(`mongodb://localhost:27017/${dbName}`);
    graphql = await GraphQL(schema, db);

    await db.collection('User').insertMany([
      { _id: userId, firstName: 'John', lastName: 'Smith' }
    ]);
    await db.collection('_Edge').insertMany(edges);
  });

  after(async function() {
    await db.dropDatabase(dbName);
    db.close();
  });

  it('Scalar connections are fetched along with node', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        floats {
          edges {
            color
            length
            mass
            node
          }
        }
        ints { edges { node } }
        strings { edges { node } }
        bools { edges { node } }
        ids { edges { node } }
        enums { edges { node } }
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      floats: {
        edges:
          lists.floats.map( (node, index) => ({
            ...lists.floatProps[index],
            node,
          }))
      },
      ints: { edges: lists.ints.map( node => ({ node }))},
      strings: { edges: lists.strings.map( node => ({ node }))},
      bools: { edges: lists.bools.map( node => ({ node }))},
      ids: { edges: lists.ids.map( node => ({ node }))},
      enums: { edges: lists.enums.map( node => ({ node }))},
    } ] });
  });

  const tests = Array.apply(null, { length: 5 }).map( (_, i) => i + 1 );

  tests.forEach(n =>
    it(`first: ${n} returns expected number of items`, async () => {
      const message = ` query Q {
        user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
          floats(first: ${n}) {
            edges {
              cursor
              color
              length
              mass
              node
            }
          }
          ints(first: ${n}) { edges { cursor node } }
          strings(first: ${n}) { edges { cursor node } }
          bools(first: ${n}) { edges { cursor node } }
          ids(first: ${n}) { edges { cursor node } }
          enums(first: ${n}) { edges { cursor node } }
        }
      } `;
      const result = await graphql(message);
      expect(result.data).to.deep.equal({ user: [ {
        floats: {
          edges:
            lists.floats.slice(0, n).map( (node, index) => ({
              ...cursor(index),
              ...lists.floatProps[index],
              node,
            }))
        },
        ints: {
          edges:
            lists.ints
              .slice(0, n)
              .map( (node, index) => ({ ...cursor(index), node }))
        },
        strings: {
          edges:
            lists.strings
              .slice(0, n)
              .map( (node, index) => ({ ...cursor(index), node }))
        },
        bools: {
          edges:
            lists.bools
              .slice(0, n)
              .map( (node, index) => ({ ...cursor(index), node }))
        },
        ids: {
          edges:
            lists.ids
              .slice(0, n)
              .map( (node, index) => ({ ...cursor(index), node }))
        },
        enums: {
          edges:
            lists.enums
              .slice(0, n)
              .map( (node, index) => ({ ...cursor(index), node }))
        },
      } ] });
    }));

  tests.forEach(n =>
    it(`last ${n} returns expected number of items`, async () => {
      const message = ` query Q {
        user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
          floats(last: ${n}) {
            edges {
              cursor
              color
              length
              mass
              node
            }
          }
          ints(last: ${n}) { edges { cursor node } }
          strings(last: ${n}) { edges { cursor node } }
          bools(last: ${n}) { edges { cursor node } }
          ids(last: ${n}) { edges { cursor node } }
          enums(last: ${n}) { edges { cursor node } }
        }
      } `;
      const result = await graphql(message);
      expect(result.data).to.deep.equal({ user: [ {
        floats: {
          edges:
            lists.floats.slice(-n).map( (node, index) => ({
              ...cursor(lists.floats.length - n + index),
              ...lists.floatProps[lists.floats.length - n + index],
              node,
            }))
        },
        ints: {
          edges:
            lists.ints
              .slice(-n)
              .map( (node, index) => ({
                ...cursor(lists.ints.length - n + index),
                node
              }))
        },
        strings: {
          edges:
            lists.strings
              .slice(-n)
              .map( (node, index) => ({
                ...cursor(lists.strings.length - n + index),
                node
              }))
        },
        bools: {
          edges:
            lists.bools
              .slice(-n)
              .map( (node, index) => ({
                ...cursor(lists.bools.length - n + index),
                node
              }))
        },
        ids: {
          edges:
            lists.ids
              .slice(-n)
              .map( (node, index) => ({
                ...cursor(lists.ids.length - n + index),
                node
              }))
        },
        enums: {
          edges:
            lists.enums
              .slice(-n)
              .map( (node, index) => ({
                ...cursor(lists.enums.length - n + index),
                node
              }))
        },
      } ] });
    }));

  for (let afterOff = 0; afterOff < lists.floats.length - 1; afterOff++) {
    for (let first = 1; first < lists.floats.length - afterOff; first++) {
      it(`first: ${first} after: ${afterOff} returns expected items`,
        async () => {
          const message = ` query Q {
            user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
              floats(first: ${first} after: "${cursor(afterOff).cursor}") {
                edges {
                  cursor
                  color
                  length
                  mass
                  node
                }
              }
            }
          } `;
          const result = await graphql(message);
          expect(result.data).to.deep.equal({ user: [ {
            floats: {
              edges:
                lists.floats
                  .slice(afterOff + 1, afterOff + first + 1)
                  .map( (node, index) => ({
                    ...cursor(afterOff + index + 1),
                    ...lists.floatProps[afterOff + index + 1],
                    node,
                  }))
            }
          } ] });
        });
    }
  }

  for (let beforeOff = lists.floats.length - 1; beforeOff > 0; beforeOff--) {
    for (let last = 1; last < beforeOff + 1; last++) {
      it(`last: ${last} before: ${beforeOff} returns expected items`,
        async () => {
          const message = ` query Q {
            user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
              floats(last: ${last} before: "${cursor(beforeOff).cursor}") {
                edges {
                  cursor
                  color
                  length
                  mass
                  node
                }
              }
            }
          } `;
          const result = await graphql(message);
          expect(result.data).to.deep.equal({ user: [ {
            floats: {
              edges:
                lists.floats
                  .slice(beforeOff - last, beforeOff)
                  .map( (node, index) => ({
                    ...cursor(beforeOff - last + index),
                    ...lists.floatProps[beforeOff - last + index],
                    node,
                  }))
            }
          } ] });
        });
    }
  }

  it('filter returns expected items', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: floats(filter: LESS_THAN value: 5.4 ) {
          edges { color length mass node }
        },
        test2: floats(filter: GREEN) {
          edges { color length mass node }
        },
        test3: floats(filter: LONGER_THAN length: 30) {
          edges { color length mass node }
        },
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      test1: {
        edges: [
          { color: 'Green', length: 12, mass: 33.3, node: 4.7 },
          { color: 'Blue', length: 22, mass: 63.3, node: 3.3 },
          { color: 'Pink', length: 75, mass: 120.0, node: 2.1 },
        ]
      },
      test2: {
        edges: [
          { color: 'Green', length: 12, mass: 33.3, node: 4.7 },
        ]
      },
      test3: {
        edges: [
          { color: 'Red', length: 33, mass: 73.3, node: 8.2 },
          { color: 'Orange', length: 55, mass: 99.9, node: 6.7 },
          { color: 'Pink', length: 75, mass: 120.0, node: 2.1 },
        ]
      },

    } ] });
  });

  it('filterBy returns expected items', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: floats(filterBy: { node: { lt: 5.4 } } ) {
          edges { color length mass node }
        },
        test2: floats(filterBy: { color: { eq: "Green" }}) {
          edges { color length mass node }
        },
        test3: floats(filterBy: {
          length: { gt: 30}, node: { lt: 8 }, color: { eq: ["Orange", "Red"]} }
        ) {
          edges { color length mass node }
        },
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      test1: {
        edges: [
          { color: 'Green', length: 12, mass: 33.3, node: 4.7 },
          { color: 'Blue', length: 22, mass: 63.3, node: 3.3 },
          { color: 'Pink', length: 75, mass: 120.0, node: 2.1 },
        ]
      },
      test2: {
        edges: [
          { color: 'Green', length: 12, mass: 33.3, node: 4.7 },
        ]
      },
      test3: {
        edges: [
          { color: 'Orange', length: 55, mass: 99.9, node: 6.7 },
        ]
      },

    } ] });
  });

  it('aggregations: count works as expected', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: ints { count }
        test2: ints { count(filterBy: { node: { lt: 20 } } ) }
        test3: ints { count(filterBy: { node: { lte: 22 } } ) }
        test4: ints { count(filterBy: { node: { eq: 30 } } ) }
        test5: ints { count(filterBy: { node: { eq: [22, 30, 35] } } ) }
        test6: ints { count(filterBy: { node: { ne: 30 } } ) }
        test7: ints { count(filterBy: { node: { ne: [30, 22, 74] } } ) }
        test8: ints { count(filterBy: { node: { gt: 70 } } ) }
        test9: ints { count(filterBy: { node: { gte: 67 } } ) }
        test10: ints { count(filterBy: { node: {
          gte: 18
          lte: 64
          ne: 30
        } } ) }
        test11: floats {count(filterBy: { length: {gt: 33}, mass: {lt: 100.0}})}
        test12: floats(filterBy: { length: { gt: 33 } }) {
          count(filterBy: { mass: { lt: 100.0 } })
        }
        test13: ints { count( filter: LESS_THAN number: 30) }
        test14: ints(filterBy: { node: { gt: 20 }}) {
          count( filter: LESS_THAN number: 30)
        }
        test15: floats { count( filter: GREEN ) }
        test16: floats( filter: LESS_THAN value: 5 ) {
          count (filter: LONGER_THAN length: 20)
        }
        test17: strings { count(filterBy: { node: { matches: "C" }})}
        test18: strings { count(filterBy: { node: {
          matches: "QQMMUKPJUQWDHZWMTIXN"
        }})}
        test19: strings { all: count(filterBy: { node: { exists: true }})}
        test20: strings { none: count(filterBy: { node: { exists: false }})}
      }
    }`;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      test1: { count: 20 },
      test2: { count: 5 },
      test3: { count: 6 },
      test4: { count: 1 },
      test5: { count: 3 },
      test6: { count: 19 },
      test7: { count: 17 },
      test8: { count: 6 },
      test9: { count: 7 },
      test10: { count: 7 },
      test11: { count: 1 },
      test12: { count: 1 },
      test13: { count: 7 },
      test14: { count: 2 },
      test15: { count: 1 },
      test16: { count: 2 },
      test17: { count: 0 },   // matches deteriorates to eq on count filters
      test18: { count: 1 },   // matches deteriorates to eq on count filters
      test19: { all: 10 },
      test20: { none: 0 },
    } ]});
  });

  it('aggregations: sum, min, max, average work as expected', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: ints { sum(node: value) }
        test2: floats { sum(node: value) }
        test3: ints { min(node: value) }
        test4: floats { min(node: value) }
        test5: ints { max(node: value) }
        test6: floats { max(node: value) }
        test7: ints { average(node: value) }
        test8: floats { average(node: value) }
        test9: floats { sum(edges: length) }
        test10: floats { sum(edges: mass) }
        test11: floats { min(edges: length) }
        test12: floats { min(edges: mass) }
        test13: floats { max(edges: length) }
        test14: floats { max(edges: mass) }
        test15: floats { average(edges: length) }
        test16: floats { average(edges: mass) }
      }
    }`;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      test1: { sum: 952 },
      test2: { sum: 25.0 },
      test3: { min: 1 },
      test4: { min: 2.1 },
      test5: { max: 96 },
      test6: { max: 8.2 },
      test7: { average: 47.6 },
      test8: { average: 5 },
      test9: { sum: 197 },
      test10: { sum: 389.79999999999995 },
      test11: { min: 12 },
      test12: { min: 33.3 },
      test13: { max: 75 },
      test14: { max: 120 },
      test15: { average: 39.4 },
      test16: { average: 77.96 },
    } ]});
  });


  it('orderBy returns items in expected order', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        floatsNoOrder: floats(orderBy: { }) { edges { node } }
        floatsAsc: floats(orderBy: {node: ASCENDING}) { edges { node } }
        floatsDes: floats(orderBy: {node: DESCENDING}) { edges { node } }
        floatByLengthAsc: floats(orderBy: {length: ASCENDING}) {edges { node }}
        floatByLengthDsc: floats(orderBy: {length: DESCENDING}) {edges { node }}
        floatByColor: floats(order: COLOR) { edges { node }}
        floatByLength: floats(order: LONGEST_FIRST) { edges { node }}
        floatByMass: floats(order: HEAVIEST_FIRST) { edges { node }}
        floatByValue: floats(order: VALUE) { edges { node }}
        floatByAll: floats(order: ALL) { edges { node }}
        intsNoOrder: ints(orderBy: { }) { edges { node } }
        intsAsc: ints(orderBy: {node: ASCENDING}) { edges { node } }
        intsDes: ints(orderBy: {node: DESCENDING}) { edges { node } }
        stringsAsc: strings(orderBy: {node: ASCENDING}) { edges { node } }
        stringsDes: strings(orderBy: {node: DESCENDING}) { edges { node } }
        boolsAsc: bools(orderBy: {node: ASCENDING}) { edges { node } }
        boolsDes: bools(orderBy: {node: DESCENDING}) { edges { node } }
        idsAsc: ids(orderBy: {node: ASCENDING}) { edges { node } }
        idsDes: ids(orderBy: {node: DESCENDING}) { edges { node } }
        enumsAsc: enums(orderBy: {node: ASCENDING}) { edges { node } }
        enumsDes: enums(orderBy: {node: DESCENDING}) { edges { node } }
      }
    } `;
    const toNode = list => ({ edges: list.map(node => ({ node }))});
    const result = await graphql(message);

    expect(result.data).to.deep.equal({ user: [ {
      floatsNoOrder: toNode(lists.floats),
      floatsAsc: toNode([ 2.1, 3.3, 4.7, 6.7, 8.2 ]),
      floatsDes: toNode([ 2.1, 3.3, 4.7, 6.7, 8.2 ].reverse()),
      floatByLengthAsc: toNode([ 4.7, 3.3, 8.2, 6.7, 2.1 ]),
      floatByLengthDsc: toNode([ 4.7, 3.3, 8.2, 6.7, 2.1 ].reverse()),
      floatByColor: toNode([ 3.3, 4.7, 6.7, 2.1, 8.2 ]),
      floatByLength: toNode([ 4.7, 3.3, 8.2, 6.7, 2.1 ].reverse()),
      floatByMass: toNode([ 4.7, 3.3, 8.2, 6.7, 2.1 ].reverse()),
      floatByValue: toNode([ 2.1, 3.3, 4.7, 6.7, 8.2 ]),
      floatByAll: toNode([ 2.1, 3.3, 4.7, 6.7, 8.2 ]),
      intsNoOrder: toNode(lists.ints),
      intsAsc: toNode([ 1, 3, 11, 15, 18, 22, 28, 30, 35, 47, 52, 64, 65, 67,
                        74, 77, 78, 82, 87, 96 ]),
      intsDes: toNode([ 1, 3, 11, 15, 18, 22, 28, 30, 35, 47, 52, 64, 65, 67,
                        74, 77, 78, 82, 87, 96 ].reverse()),
      stringsAsc: toNode([
        'BTYLRXFVGHMZVAJRTATE',
        'IPVVQGYMWGWSDRQYSQOK',
        'IXJYIGQMXWPLQZKDPPNW',
        'JC[XWKDIMXEOBINCQKQS',
        'MXHTJKEDOTFQORXOIJHZ',
        'QQMMUKPJUQWDHZWMTIXN',
        'TRXTJQOICHEKOKTEYNQH',
        'WZZTAGETNIJWXWWMLN[Z',
        'YGLUZZXDRPMTKTQIZPVB',
        'YWFBVQSIEVVEGWKDJGGR'
      ]),
      stringsDes: toNode([
        'BTYLRXFVGHMZVAJRTATE',
        'IPVVQGYMWGWSDRQYSQOK',
        'IXJYIGQMXWPLQZKDPPNW',
        'JC[XWKDIMXEOBINCQKQS',
        'MXHTJKEDOTFQORXOIJHZ',
        'QQMMUKPJUQWDHZWMTIXN',
        'TRXTJQOICHEKOKTEYNQH',
        'WZZTAGETNIJWXWWMLN[Z',
        'YGLUZZXDRPMTKTQIZPVB',
        'YWFBVQSIEVVEGWKDJGGR'
      ].reverse()),
      boolsAsc: toNode(
        [ false, false, false, false, false, true, true, true, true, true ]),
      boolsDes: toNode(
        [ false, false, false, false, false, true, true, true, true, true ]
          .reverse()),
      idsAsc: toNode([ 'CZDCK', 'EHJOF', 'FNTPQ', 'HZZDA', 'IOUHB', 'JAWEV',
                       'KBXHD' , 'MMHHU', 'OLOYH', 'TFVPK' ]),
      idsDes: toNode([ 'CZDCK', 'EHJOF', 'FNTPQ', 'HZZDA', 'IOUHB', 'JAWEV',
                       'KBXHD' , 'MMHHU', 'OLOYH', 'TFVPK' ].reverse()),
      enumsAsc: toNode([ 'ONE', 'THREE', 'THREE', 'THREE', 'THREE', 'THREE',
                         'TWO', 'TWO', 'TWO', 'TWO' ]),
      enumsDes: toNode([ 'ONE', 'THREE', 'THREE', 'THREE', 'THREE', 'THREE',
                         'TWO', 'TWO', 'TWO', 'TWO' ].reverse())
    } ] });
  });

  it('count fails if both filter and filterBy are specified', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        floats { count(filter: GREEN, filterBy: { color: { eq: "RED" } }) }
      }
    } `;
    const result = await graphql(message);
    expect(result.errors).to.have.length(1);
    expect(result.errors[0].message).to.match(
      /Count cannot specify more than one filter/);
  });

  it('count fails if invalid filter is specified', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        floats { count(filter: INVALID) }
      }
    } `;
    const result = await graphql(message);
    expect(result.errors).to.have.length(1);
    expect(result.errors[0].message).to.match(
      /Count filter validation failed/);
  });

  it('aggregation fails if field is not specified', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        floats { sum }
      }
    } `;
    const result = await graphql(message);
    expect(result.errors).to.have.length(1);
    expect(result.errors[0].message).to.match(
      /"sum" must specify either node or edges parameter/);
  });

  it('aggregation fails if both node and edge are specified', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        floats { sum(node: value edges: mass) }
      }
    } `;
    const result = await graphql(message);
    expect(result.errors).to.have.length(1);
    expect(result.errors[0].message).to.match(
      /"sum" must specify either node or edges parameter/);
  });

});
