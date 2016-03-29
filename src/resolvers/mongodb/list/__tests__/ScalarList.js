import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';

import { MongoClient } from 'mongodb';
import { GraphQL } from '../../__tests__/setup';

/* eslint no-unused-expressions: 0 */

let graphql;
let db;
const dbName = 'ScalarListTest';

const schema = `
  enum MyEnum { ONE TWO THREE FOUR }

  type User implements Node {
    id: ID!
    firstName: String
    lastName: String
    floats: [Float]
    ints: [Int]
    strings: [String]
    bools: [Boolean]
    ids: [ID]
    enums: [MyEnum]
    missingList: [Int]
    nullList: [Int]
    listWithNulls: [Int]
  }

  filter on [Float] {
    LESS_THAN: (f: Float) { lt: $f }
  }

  filter on [Int] {
    LESS_THAN: (n: Int) { lt: $n }
  }

  filter on [String] {
    LESS_THAN: (str: String) { lt: $str }
  }

  filter on [Boolean] {
    TRUE: { eq: true }
    FALSE: { eq: false }
  }

  filter on [ID] {
    LESS_THAN: (str: ID) { lt: $str }
  }

  filter on [MyEnum] {
    ONE: { eq: ONE }
    TWO: { eq: TWO }
    THREE: { eq: THREE }
    FOUR: { eq: FOUR }
  }

`;

const lists = {
  floats: [ 4.7, 3.3, 8.2, 6.7, 2.1, 3.6, 1.6, 8.1, 4.9, 1.1, 9.1, 5.4,
            6.8, 8.9, 7.2, 7.5, 2.0, 8.6, 7.2, 5.3 ],
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
  nullList: null,
  listWithNulls: [ 1, 2, 3, null, 4, null ],
};

describe('Mongo Resolvers / lists / ScalarList:', function () {

  before(async () => {

    db = await MongoClient.connect(`mongodb://localhost:27017/${dbName}`);
    graphql = await GraphQL(schema, db);

    await db.collection('User').insertMany([
      {
        _id: '-KCb1OwX6lMf7PUpOgjK-kJ5I',
        firstName: 'John',
        lastName: 'Smith',
        ...lists,
      }
    ]);
  });

  after(async function() {
    await db.dropDatabase(dbName);
    db.close();
  });

  it('Lists are fetched along with node', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        floats,
        ints,
        strings,
        bools
        ids,
        enums,
        missingList,
        nullList,
        listWithNulls
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      ...lists,
      missingList: null
    } ] });
  });

  it('first returns expected number of items', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        floats(first: 1),
        ints(first: 2),
        strings(first: 3),
        bools(first: 4)
        ids(first: 5),
        enums(first: 6),
        missingList(first: 1),
        nullList(first: 2),
        listWithNulls(first: 6),
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      floats: lists.floats.slice(0, 1),
      ints: lists.ints.slice(0, 2),
      strings: lists.strings.slice(0, 3),
      bools: lists.bools.slice(0, 4),
      ids: lists.ids.slice(0, 5),
      enums: lists.enums.slice(0, 6),
      missingList: null,
      nullList: null,
      listWithNulls: [ 1, 2, 3, null, 4, null ],
    } ] });
  });

  it('last returns expected number of items', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        floats(last: 1),
        ints(last: 2),
        strings(last: 3),
        bools(last: 4)
        ids(last: 5),
        enums(last: 6),
        missingList(last: 1),
        nullList(last: 2),
        listWithNulls(last: 3),
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      floats: lists.floats.slice(-1),
      ints: lists.ints.slice(-2),
      strings: lists.strings.slice(-3),
      bools: lists.bools.slice(-4),
      ids: lists.ids.slice(-5),
      enums: lists.enums.slice(-6),
      missingList: null,
      nullList: null,
      listWithNulls: [ null, 4, null ],
    } ] });
  });

  it('float filterBy returns expected items', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: floats(filterBy: { eq: 6.7 }),
        test2: floats(filterBy: { eq: [ 2.1, 3.6, 1.6 ] }),
        test3: floats(filterBy: { ne: 6.7 })
        test4: floats(filterBy: { ne: [ 2.1, 3.6, 1.6 ] }),
        test5: floats(filterBy: { lt: 5.4 }),
        test6: floats(filterBy: { lte: 5.4 }),
        test7: floats(filterBy: { gt: 5.4 }),
        test8: floats(filterBy: { gte: 5.4 }),
        test9: floats(filterBy: { exists: true }),
        test10: floats(filterBy: { exists: false }),
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      test1: [ 6.7 ],
      test2: [ 2.1, 3.6, 1.6 ],
      test3: lists.floats.filter(f => f !== 6.7),
      test4: lists.floats.filter(f => !([ 2.1, 3.6, 1.6 ].includes(f)) ),
      test5: lists.floats.filter(f => f < 5.4),
      test6: lists.floats.filter(f => f <= 5.4),
      test7: lists.floats.filter(f => f > 5.4),
      test8: lists.floats.filter(f => f >= 5.4),
      test9: lists.floats,
      test10: [ ],
    } ] });
  });

  it('float filter returns expected items', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: floats(filter: LESS_THAN f: 5.4 ),
        test2: floats(filter: LESS_THAN f: 3.6 ),
        test3: floats(filter: LESS_THAN f: 10 ),
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      test1: lists.floats.filter(f => f < 5.4),
      test2: lists.floats.filter(f => f < 3.6),
      test3: lists.floats.filter(f => f < 10),
    } ] });
  });

  it('int filterBy returns expected items', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: ints(filterBy: { eq: 64 }),
        test2: ints(filterBy: { eq: [ 64, 3, 47 ] }),
        test3: ints(filterBy: { ne: 64 })
        test4: ints(filterBy: { ne: [ 64, 3, 47 ] }),
        test5: ints(filterBy: { lt: 35 }),
        test6: ints(filterBy: { lte: 35 }),
        test7: ints(filterBy: { gt: 35 }),
        test8: ints(filterBy: { gte: 35 }),
        test9: ints(filterBy: { exists: true }),
        test10: ints(filterBy: { exists: false }),
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      test1: [ 64 ],
      test2: [ 64, 3, 47 ],
      test3: lists.ints.filter(f => f !== 64),
      test4: lists.ints.filter(f => !([ 64, 3, 47 ].includes(f)) ),
      test5: lists.ints.filter(f => f < 35),
      test6: lists.ints.filter(f => f <= 35),
      test7: lists.ints.filter(f => f > 35),
      test8: lists.ints.filter(f => f >= 35),
      test9: lists.ints,
      test10: [ ],
    } ] });
  });

  it('int filter returns expected items', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: ints(filter: LESS_THAN n: 64 ),
        test2: ints(filter: LESS_THAN n: 35 ),
        test3: ints(filter: LESS_THAN n: 47 ),
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      test1: lists.ints.filter(n => n < 64),
      test2: lists.ints.filter(n => n < 35),
      test3: lists.ints.filter(n => n < 47),
    } ] });
  });

  it('string filterBy returns expected items', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: strings(filterBy: { eq: "IXJYIGQMXWPLQZKDPPNW" }),
        test2: strings(filterBy: { eq: [
          "BTYLRXFVGHMZVAJRTATE",
          "YWFBVQSIEVVEGWKDJGGR" ] }),
        test3: strings(filterBy: { ne: "IXJYIGQMXWPLQZKDPPNW" })
        test4: strings(filterBy: { ne: [
          "BTYLRXFVGHMZVAJRTATE",
          "YWFBVQSIEVVEGWKDJGGR" ] }),
        test5: strings(filterBy: { lt: "TRXTJQOICHEKOKTEYNQH" }),
        test6: strings(filterBy: { lte: "TRXTJQOICHEKOKTEYNQH" }),
        test7: strings(filterBy: { gt: "TRXTJQOICHEKOKTEYNQH" }),
        test8: strings(filterBy: { gte: "TRXTJQOICHEKOKTEYNQH" }),
        test9: strings(filterBy: { exists: true }),
        test10: strings(filterBy: { exists: false }),
        test11: strings(filterBy: { matches: "HMZ" }),
        test12: strings(filterBy: { matches: "H" }),
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      test1: [ 'IXJYIGQMXWPLQZKDPPNW' ],
      test2: [ 'YWFBVQSIEVVEGWKDJGGR', 'BTYLRXFVGHMZVAJRTATE' ],
      test3: lists.strings.filter(f => f !== 'IXJYIGQMXWPLQZKDPPNW'),
      test4: lists.strings.filter(f =>
          !([ 'BTYLRXFVGHMZVAJRTATE', 'YWFBVQSIEVVEGWKDJGGR' ].includes(f)) ),
      test5: lists.strings.filter(f => f < 'TRXTJQOICHEKOKTEYNQH'),
      test6: lists.strings.filter(f => f <= 'TRXTJQOICHEKOKTEYNQH'),
      test7: lists.strings.filter(f => f > 'TRXTJQOICHEKOKTEYNQH'),
      test8: lists.strings.filter(f => f >= 'TRXTJQOICHEKOKTEYNQH'),
      test9: lists.strings,
      test10: [ ],
      test11: lists.strings.filter(f => f.includes('HMZ')),
      test12: lists.strings.filter(f => f.includes('H')),
    } ] });
  });

  it('string filter returns expected items', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: strings(filter: LESS_THAN str: "TRXTJQOICHEKOKTEYNQH" ),
        test2: strings(filter: LESS_THAN str: "IXJYIGQMXWPLQZKDPPNW" ),
        test3: strings(filter: LESS_THAN str: "BTYLRXFVGHMZVAJRTATE" ),
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      test1: lists.strings.filter(s => s < 'TRXTJQOICHEKOKTEYNQH'),
      test2: lists.strings.filter(s => s < 'IXJYIGQMXWPLQZKDPPNW'),
      test3: lists.strings.filter(s => s < 'BTYLRXFVGHMZVAJRTATE'),
    } ] });
  });

  it('boolean filterBy returns expected items', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: bools(filterBy: { eq: true }),
        test2: bools(filterBy: { eq: false }),
        test3: bools(filterBy: { ne: true }),
        test4: bools(filterBy: { ne: false }),
        test5: bools(filterBy: { exists: true }),
        test6: bools(filterBy: { exists: false }),
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      test1: lists.bools.filter(b => b === true),
      test2: lists.bools.filter(b => b === false),
      test3: lists.bools.filter(b => b !== true),
      test4: lists.bools.filter(b => b !== false),
      test5: lists.bools,
      test6: [ ],
    } ] });
  });

  it('boolean filter returns expected items', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: bools(filter: TRUE),
        test2: bools(filter: FALSE),
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      test1: lists.bools.filter(b => b === true),
      test2: lists.bools.filter(b => b === false),
    } ] });
  });

  it('id filterBy returns expected items', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: ids(filterBy: { eq: "OLOYH" }),
        test2: ids(filterBy: { eq: [ "HZZDA", "FNTPQ" ] }),
        test3: ids(filterBy: { ne: "OLOYH" })
        test4: ids(filterBy: { ne: [ "HZZDA", "FNTPQ" ] }),
        test5: ids(filterBy: { lt: "IOUHB" }),
        test6: ids(filterBy: { lte: "IOUHB" }),
        test7: ids(filterBy: { gt: "IOUHB" }),
        test8: ids(filterBy: { gte: "IOUHB" }),
        test9: ids(filterBy: { exists: true }),
        test10: ids(filterBy: { exists: false })
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      test1: [ 'OLOYH' ],
      test2: [ 'FNTPQ', 'HZZDA' ],
      test3: lists.ids.filter(f => f !== 'OLOYH'),
      test4: lists.ids.filter(f => !([ 'HZZDA', 'FNTPQ' ].includes(f)) ),
      test5: lists.ids.filter(f => f < 'IOUHB'),
      test6: lists.ids.filter(f => f <= 'IOUHB'),
      test7: lists.ids.filter(f => f > 'IOUHB'),
      test8: lists.ids.filter(f => f >= 'IOUHB'),
      test9: lists.ids,
      test10: [ ]
    } ] });
  });

  it('id filterBy returns expected items', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: ids(filter: LESS_THAN str: "OLOYH" ),
        test2: ids(filter: LESS_THAN str: "HZZDA" ),
        test3: ids(filter: LESS_THAN str: "IOUHB" ),
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      test1: lists.ids.filter(f => f < 'OLOYH'),
      test2: lists.ids.filter(f => f < 'HZZDA'),
      test3: lists.ids.filter(f => f < 'IOUHB'),
    } ] });
  });

  it('enum filterBy returns expected items', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: enums(filterBy: { eq: THREE }),
        test2: enums(filterBy: { eq: [ TWO, ONE ] }),
        test3: enums(filterBy: { ne: THREE })
        test4: enums(filterBy: { ne: [ TWO, ONE ] }),
        test5: enums(filterBy: { exists: true }),
        test6: enums(filterBy: { exists: false })
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      test1: [ 'THREE', 'THREE', 'THREE', 'THREE', 'THREE' ],
      test2: [ 'TWO', 'TWO', 'TWO', 'ONE', 'TWO' ],
      test3: lists.enums.filter(f => f !== 'THREE'),
      test4: lists.enums.filter(f => !([ 'ONE', 'TWO' ].includes(f)) ),
      test5: lists.enums,
      test6: [ ]
    } ] });
  });

  it('enum filter returns expected items', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: enums(filter: ONE),
        test2: enums(filter: TWO),
        test3: enums(filter: THREE)
        test4: enums(filter: FOUR),
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      test1: lists.enums.filter(f => f === 'ONE'),
      test2: lists.enums.filter(f => f === 'TWO'),
      test3: lists.enums.filter(f => f === 'THREE'),
      test4: lists.enums.filter(f => f === 'FOUR'),
    } ] });
  });

  it('orderBy returns items in expected order', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        floatsAsc: floats(orderBy: ASCENDING)
        floatsDes: floats(orderBy: DESCENDING)
        intsAsc: ints(orderBy: ASCENDING)
        intsDes: ints(orderBy: DESCENDING)
        stringsAsc: strings(orderBy: ASCENDING)
        stringsDes: strings(orderBy: DESCENDING)
        boolsAsc: bools(orderBy: ASCENDING)
        boolsDes: bools(orderBy: DESCENDING)
        idsAsc: ids(orderBy: ASCENDING)
        idsDes: ids(orderBy: DESCENDING)
        enumsAsc: enums(orderBy: ASCENDING)
        enumsDes: enums(orderBy: DESCENDING)
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      floatsAsc: [ 1.1, 1.6, 2, 2.1, 3.3, 3.6, 4.7, 4.9, 5.3, 5.4, 6.7, 6.8,
                   7.2, 7.2, 7.5, 8.1, 8.2, 8.6, 8.9, 9.1 ],
      floatsDes: [ 9.1, 8.9, 8.6, 8.2, 8.1, 7.5, 7.2, 7.2, 6.8, 6.7, 5.4, 5.3,
                   4.9, 4.7, 3.6, 3.3, 2.1, 2, 1.6, 1.1 ],
      intsAsc: [ 1, 3, 11, 15, 18, 22, 28, 30, 35, 47, 52, 64, 65, 67, 74,
                 77, 78, 82, 87, 96 ],
      intsDes: [ 96, 87, 82, 78, 77, 74, 67, 65, 64, 52, 47, 35, 30, 28, 22,
                 18, 15, 11, 3, 1 ],
      stringsAsc: [
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
      ],
      stringsDes: [
        'YWFBVQSIEVVEGWKDJGGR',
        'YGLUZZXDRPMTKTQIZPVB',
        'WZZTAGETNIJWXWWMLN[Z',
        'TRXTJQOICHEKOKTEYNQH',
        'QQMMUKPJUQWDHZWMTIXN',
        'MXHTJKEDOTFQORXOIJHZ',
        'JC[XWKDIMXEOBINCQKQS',
        'IXJYIGQMXWPLQZKDPPNW',
        'IPVVQGYMWGWSDRQYSQOK',
        'BTYLRXFVGHMZVAJRTATE'
      ],
      boolsAsc: [ false, false, false, false, false, true, true, true, true,
                  true ],
      boolsDes: [ true, true, true, true, true, false, false, false, false,
                  false ],
      idsAsc: [ 'CZDCK', 'EHJOF', 'FNTPQ', 'HZZDA', 'IOUHB', 'JAWEV', 'KBXHD',
                'MMHHU', 'OLOYH', 'TFVPK' ],
      idsDes: [ 'TFVPK', 'OLOYH', 'MMHHU', 'KBXHD', 'JAWEV', 'IOUHB',
                'HZZDA', 'FNTPQ', 'EHJOF', 'CZDCK' ],
      enumsAsc: [ 'ONE', 'THREE', 'THREE', 'THREE', 'THREE', 'THREE', 'TWO',
                  'TWO', 'TWO', 'TWO' ],
      enumsDes: [ 'TWO', 'TWO', 'TWO', 'TWO', 'THREE', 'THREE', 'THREE',
                  'THREE', 'THREE', 'ONE' ]
    } ] });
  });

  it('aggregate returns expected results', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        sumFloat: floats(aggregate: SUM),
        countFloat: floats(aggregate: COUNT),
        minFloat: floats(aggregate: MIN),
        maxFloat: floats(aggregate: MAX),
        averageFloat: floats(aggregate: AVERAGE),
        sumInt: ints(aggregate: SUM),
        countInt: ints(aggregate: COUNT),
        minInt: ints(aggregate: MIN),
        maxInt: ints(aggregate: MAX),
        averageInt: ints(aggregate: AVERAGE),
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      sumFloat: [ lists.floats.reduce( (acc, f) => acc + f, 0.0) ],
      countFloat: [ lists.floats.length ],
      minFloat: [ lists.floats.slice(1).reduce(
        (acc, f) => f < acc ? f : acc,
        lists.floats[0]) ],
      maxFloat: [ lists.floats.slice(1).reduce(
        (acc, f) => f > acc ? f : acc,
        lists.floats[0]) ],
      averageFloat: [
        lists.floats.reduce( (acc, f) => acc + f, 0.0) / lists.floats.length ],
      sumInt: [ lists.ints.reduce( (acc, n) => acc + n, 0) ],
      countInt: [ lists.ints.length ],
      minInt: [ lists.ints.slice(1).reduce(
        (acc, f) => f < acc ? f : acc,
        lists.ints[0]) ],
      maxInt: [ lists.ints.slice(1).reduce(
        (acc, f) => f > acc ? f : acc,
        lists.ints[0]) ],
      averageInt:
        [ Math.floor(lists.ints.reduce( (acc, f) => acc + f, 0) /
                     lists.ints.length) ],
    } ] });
  });

});
