import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';

import { MongoClient } from 'mongodb';
import { GraphQL } from '../../__tests__/setup';

/* eslint no-unused-expressions: 0 */

let graphql;
let db;
const dbName = 'ObjectListTest';

const schema = `
  type User implements Node {
    id: ID!
    firstName: String
    lastName: String
    widgets: [Widget]
    named: [Named]
    stuff: [Stuff]
    tiebreaker: [Tiebreaker]
    inner: [InnerTest]
    missingList: [Widget]
    nullList: [Widget]
    listWithNulls: [Widget]
  }

  filter on [Widget] {
    AT_LEAST: (quantity: Int) { quantity: { gte: $quantity } }
    LESS_THAN: (quantity: Int) { quantity: { lt: $quantity } }
  }

  order on [Widget] {
    NAME: [{ name: ASCENDING }]
    QUANTITY: [{ quantity: DESCENDING }, { name: ASCENDING }]
  }

  filter on [Named] {
    DELOREAN: { name: { eq: "Delorean"} }
    WIDGET: { type: { eq: Widget }}
  }

  order on [Named] {
    NAME: [{ name: ASCENDING }]
  }

  filter on [Stuff] {
    WIDGET: { type: { eq: Widget }}
    GADGET_OR_GIZMO: { type: { eq: [ Gadget, Gizmo ] }}
  }

  interface Named {
    name: String
  }

  type Widget implements Named {
    name: String
    quantity: Int
  }

  type Gadget implements Named {
    name: String
    quality: Int
  }

  type Gizmo implements Named {
    name: String
    cost: Int
  }

  type Tiebreaker {
    a: Int
    b: String
    c: Float
    d: Boolean
  }

  type InnerTest {
    scalar: [Float]
    nodeRef: [User]
    obj: [Tiebreaker]
    oneObj: Tiebreaker
  }

  union Stuff = Widget | Gadget | Gizmo
`;

const widgets = [
  {
    _type: 'Widget',
    name: 'Flux Capacitor',
    quantity: 10,
  },
  {
    _type: 'Widget',
    name: 'Delorean',
    quantity: 1,
  },
  {
    _type: 'Widget',
    name: 'Hoverboard',
    quantity: 20,
  },
  {
    _type: 'Widget',
    name: 'Baseball Almanac',
    quantity: 5,
  },
];

const named = [
  {
    _type: 'Widget',
    name: 'Flux Capacitor',
    quantity: 10,
  },
  {
    _type: 'Gadget',
    name: 'Delorean',
    quality: 10,
  },
  {
    _type: 'Gizmo',
    name: 'Hoverboard',
    cost: 20,
  },
  {
    _type: 'Widget',
    name: 'Baseball Almanac',
    quantity: 5,
  },
  {
    _type: 'Gizmo',
    name: 'Self-Lacing Shoes',
    cost: 30,
  },
];

const stuff = [
  {
    _type: 'Widget',
    name: 'Flux Capacitor',
    quantity: 10,
  },
  {
    _type: 'Gadget',
    name: 'Delorean',
    quality: 10,
  },
  {
    _type: 'Gizmo',
    name: 'Hoverboard',
    cost: 20,
  },
  {
    _type: 'Widget',
    name: 'Baseball Almanac',
    quantity: 5,
  },
  {
    _type: 'Gizmo',
    name: 'Self-Lacing Shoes',
    cost: 30,
  },
];

const tiebreaker = [
  { _type: 'Tiebreaker', a: 5, b: 'foo', c: 0.0, d: true },
  { _type: 'Tiebreaker', a: 50, b: 'bar', c: 1.0, d: false },
  { _type: 'Tiebreaker', a: 5, b: 'foo', c: 1.0, d: true },
  { _type: 'Tiebreaker', a: 1, b: 'boo', c: 0.0, d: false },
  { _type: 'Tiebreaker', a: 5, b: 'boo', c: 0.0, d: true },
  { _type: 'Tiebreaker', a: 50, b: 'baz', c: 1.0, d: false },
  { _type: 'Tiebreaker', a: 5, b: 'boo', c: 0.0, d: true },
  { _type: 'Tiebreaker', a: 10, b: 'bar', c: 1.0, d: false },
  { _type: 'Tiebreaker', a: 5, b: 'foo', c: 0.0, d: false },
  { _type: 'Tiebreaker', a: 50, b: 'baz', c: 1.1, d: false },
  { _type: 'Tiebreaker', a: 5, b: 'boo', c: 0.0, d: false },
  { _type: 'Tiebreaker', a: 2, b: 'boo', c: 0.0, d: false },
  { _type: 'Tiebreaker', a: 5, b: 'foo', c: 2.0, d: true },
  { _type: 'Tiebreaker', a: 10, b: 'boo', c: 0.0, d: false },
  { _type: 'Tiebreaker', a: 5, b: 'foo', c: 1.5, d: true },
  { _type: 'Tiebreaker', a: 50, b: 'baz', c: 1.1, d: true },
];

const inner = [
  {
    _type: 'InnerTest',
    scalar: [ -1.1, -2.2, -3.3 ],
    nodeRef: [ '-KCb1OwX6lMf7PUpOgjK-kJ5I' ],
    obj: [
      { _type: 'Tiebreaker', a: 5, b: 'foo', c: 0.0, d: true },
      { _type: 'Tiebreaker', a: 5, b: 'foo', c: 1.0, d: true },
    ],
    oneObj: { _type: 'Tiebreaker', a: 5, b: 'baz', c: 0.0, d: true }
  },
  {
    _type: 'InnerTest',
    scalar: [ 1.1, 2.2, 3.3 ],
    nodeRef: [ ],
    obj: [
      { _type: 'Tiebreaker', a: 5, b: 'bar', c: 0.0, d: true },
      { _type: 'Tiebreaker', a: 5, b: 'bar', c: 1.0, d: true },
      { _type: 'Tiebreaker', a: 5, b: 'bar', c: 2.0, d: true },
    ],
    oneObj: { _type: 'Tiebreaker', a: 5, b: 'zaz', c: 0.0, d: true }
  }
];

const listWithNulls = [
  {
    _type: 'Widget',
    name: 'W1',
    quantity: 10,
  },
  null,
  {
    _type: 'Widget',
    name: 'W3',
    quantity: 30,
  },
];

const users = [
  {
    _id: '-KCb1OwX6lMf7PUpOgjK-kJ5I',
    firstName: 'John',
    lastName: 'Smith',
    widgets,
    named,
    stuff,
    tiebreaker,
    inner,
    nullList: null,
    listWithNulls
  }
];

function toObject(mongoObjects) {
  return mongoObjects.map(obj => {
    if (obj) {
      const nodeObj = { ...obj };
      delete nodeObj._type;
      return nodeObj;
    }
    return null;
  });
}

describe('Mongo Resolvers / lists / ObjectList:', function () {

  before(async () => {

    db = await MongoClient.connect(`mongodb://localhost:27017/${dbName}`);
    graphql = await GraphQL(schema, db);

    await db.collection('User').insertMany(users);
  });

  after(async function() {
    await db.dropDatabase(dbName);
    db.close();
  });

  it('Object list is fetched along with node', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        widgets {
          name
          quantity
        }
        named {
          name
          ...on Widget { quantity }
          ...on Gadget { quality }
          ...on Gizmo { cost }
        }
        stuff {
          ...on Named { name }
          ...on Widget { quantity }
          ...on Gadget { quality }
          ...on Gizmo { cost }
        },
        missingList { name },
        nullList { name },
        listWithNulls { name, quantity }
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      widgets: toObject(widgets),
      named: toObject(named),
      stuff: toObject(stuff),
      missingList: null,
      nullList: null,
      listWithNulls: toObject(listWithNulls)
    } ] });
  });

  const tests = Array
    .apply(null, { length: widgets.length })
    .map( (_, i) => i + 1);

  tests.forEach(n =>
    it('Object list argument first works with ' + n, async () => {
      const message = ` query Q {
        user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
          widgets(first: ${n}) {
            name
            quantity
          }
          named(first: ${n}) {
            name
            ...on Widget { quantity }
            ...on Gadget { quality }
            ...on Gizmo { cost }
          }
          stuff(first: ${n}, filterBy: { }) {
            ...on Named { name }
            ...on Widget { quantity }
            ...on Gadget { quality }
            ...on Gizmo { cost }
          }
        }
      } `;
      const result = await graphql(message);
      expect(result.data).to.deep.equal({ user: [ {
        widgets: toObject(widgets).slice(0, n),
        named: toObject(named).slice(0, n),
        stuff: toObject(stuff).slice(0, n),
      } ] });
    }));

  tests.forEach(n =>
    it('Node list argument last works with ' + n, async () => {
      const message = ` query Q {
        user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
          widgets(last: ${n}) {
            name
            quantity
          }
          named(last: ${n}) {
            name
            ...on Widget { quantity }
            ...on Gadget { quality }
            ...on Gizmo { cost }
          }
          stuff(last: ${n}) {
            ...on Named { name }
            ...on Widget { quantity }
            ...on Gadget { quality }
            ...on Gizmo { cost }
          }
        }
      } `;
      const result = await graphql(message);
      expect(result.data).to.deep.equal({ user: [ {
        widgets: toObject(widgets).slice(-n),
        named: toObject(named).slice(-n),
        stuff: toObject(stuff).slice(-n),
      } ] });
    }));

  it('Object list filterBy works as expected', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: widgets(filterBy: { name: {eq: "Delorean"} }) {
          name, quantity
        }
        test2: widgets(filterBy: { name: {ne: "Delorean"} }) {
          name, quantity
        }
        test3: widgets(filterBy: { quantity: {gt: 1 lt: 10} }) {
          name, quantity
        }
        test4: widgets(filterBy: {
          name: {ne: "Delorean"},
          quantity: {gt: 5}
        }) {
          name, quantity
        }
        test5: named(filterBy: { name: {eq: "Delorean"} }) {
          name,
          ...on Widget { quantity }
          ...on Gadget { quality }
          ...on Gizmo { cost }
        }
        test6: named(filterBy: { name: {ne: "Delorean"} }) {
          name,
          ...on Widget { quantity }
          ...on Gadget { quality }
          ...on Gizmo { cost }
        }
        test7: named(filterBy: { type: {eq: Widget} }) {
          name,
          ...on Widget { quantity }
        }
        test8: named(filterBy: {type: {eq: Gadget}, name: {eq: "Delorean"}}) {
          name,
          ...on Gadget { quality }
        }
        test9: stuff(filterBy: {type: {eq: Gadget}}) {
          ...on Named { name }
          ...on Gadget { quality }
        }
        test10: stuff(filterBy: {type: {ne: Gadget}}) {
          ...on Named { name }
          ...on Widget { quantity }
          ...on Gizmo { cost }
        }
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      test1: toObject(widgets).filter(w => w.name === 'Delorean'),
      test2: toObject(widgets).filter(w => w.name !== 'Delorean'),
      test3: toObject(widgets).filter(w => w.quantity > 1 && w.quantity < 10),
      test4:
        toObject(widgets).filter(w => w.name !== 'Delorean' && w.quantity > 5),
      test5: toObject(named).filter(w => w.name === 'Delorean'),
      test6: toObject(named).filter(w => w.name !== 'Delorean'),
      test7: toObject(named.filter(w => w._type === 'Widget')),
      test8: toObject(named.filter(w => w._type === 'Gadget' &&
                                        w.name === 'Delorean')),
      test9: toObject(stuff.filter(w => w._type === 'Gadget')),
      test10: toObject(stuff.filter(w => w._type !== 'Gadget')),
    } ] });
  });

  it('Object list filter works as expected', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: widgets(filter: AT_LEAST quantity: 10) { name, quantity }
        test2: widgets(filter: LESS_THAN quantity: 10) { name, quantity }
        test3: named(filter: DELOREAN) {
          name
          ...on Widget { quantity }
          ...on Gadget { quality }
          ...on Gizmo { cost }
        }
        test4: named(filter: WIDGET) {
          name
          ...on Widget { quantity }
        }
        test5: stuff(filter: WIDGET) {
          ...on Named { name }
          ...on Widget { quantity }
        }
        test6: stuff(filter: GADGET_OR_GIZMO) {
          ...on Named { name }
          ...on Gadget { quality }
          ...on Gizmo { cost }
        }
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      test1: toObject(widgets.filter(o => o.quantity >= 10)),
      test2: toObject(widgets.filter(o => o.quantity < 10)),
      test3: toObject(named.filter(o => o.name === 'Delorean')),
      test4: toObject(named.filter(o => o._type === 'Widget')),
      test5: toObject(stuff.filter(o => o._type === 'Widget')),
      test6: toObject(stuff.filter(o => o._type === 'Gadget' ||
                                        o._type === 'Gizmo')),
    } ]});
  });

  it('Object list orderBy works as expected', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: widgets(
          orderBy: [
            { quantity: ASCENDING },
            { name: ASCENDING }
          ]
        ) { name, quantity }
        test2: widgets(
          orderBy: [
            { name: DESCENDING }
          ]
        ) { name, quantity }
        test3: named(
          orderBy: [
            { name: DESCENDING }
          ]
        ) {
          name,
          ...on Widget { quantity }
          ...on Gadget { quality }
          ...on Gizmo { cost }
        }
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      test1: toObject([
        {
          name: 'Delorean',
          quantity: 1,
        },
        {
          name: 'Baseball Almanac',
          quantity: 5,
        },
        {
          name: 'Flux Capacitor',
          quantity: 10,
        },
        {
          name: 'Hoverboard',
          quantity: 20,
        },
      ]),
      test2: toObject([
        {
          name: 'Hoverboard',
          quantity: 20,
        },
        {
          name: 'Flux Capacitor',
          quantity: 10,
        },
        {
          name: 'Delorean',
          quantity: 1,
        },
        {
          name: 'Baseball Almanac',
          quantity: 5,
        },
      ]),
      test3: [
        {
          name: 'Self-Lacing Shoes',
          cost: 30,
        },
        {
          name: 'Hoverboard',
          cost: 20,
        },
        {
          name: 'Flux Capacitor',
          quantity: 10,
        },
        {
          name: 'Delorean',
          quality: 10,
        },
        {
          name: 'Baseball Almanac',
          quantity: 5,
        },
      ]
    } ] });
  });

  it('Object list order works as expected', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: widgets(order: NAME) { name, quantity }
        test2: widgets(order: QUANTITY) { name, quantity }
        test3: named(order: NAME) {
          name,
          ...on Widget { quantity }
          ...on Gadget { quality }
          ...on Gizmo { cost }
        }
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      test1: [
        {
          name: 'Baseball Almanac',
          quantity: 5,
        },
        {
          name: 'Delorean',
          quantity: 1,
        },
        {
          name: 'Flux Capacitor',
          quantity: 10,
        },
        {
          name: 'Hoverboard',
          quantity: 20,
        },
      ],
      test2: [
        {
          name: 'Hoverboard',
          quantity: 20,
        },
        {
          name: 'Flux Capacitor',
          quantity: 10,
        },
        {
          name: 'Baseball Almanac',
          quantity: 5,
        },
        {
          name: 'Delorean',
          quantity: 1,
        },
      ],
      test3: [
        {
          name: 'Baseball Almanac',
          quantity: 5,
        },
        {
          name: 'Delorean',
          quality: 10,
        },
        {
          name: 'Flux Capacitor',
          quantity: 10,
        },
        {
          name: 'Hoverboard',
          cost: 20,
        },
        {
          name: 'Self-Lacing Shoes',
          cost: 30,
        },
      ]
    } ]});
  });

  it('Object list order breaks ties as expected', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: tiebreaker(orderBy: [
          { a: ASCENDING }
          { b: ASCENDING }
          { c: ASCENDING }
          { d: ASCENDING }
        ]) { a, b, c, d }
        test2: tiebreaker(orderBy: [
          { a: ASCENDING }
          { b: DESCENDING }
          { c: ASCENDING }
          { d: DESCENDING }
        ]) { a, b, c, d }
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      test1: [
        { a: 1, b: 'boo', c: 0.0, d: false },
        { a: 2, b: 'boo', c: 0.0, d: false },
        { a: 5, b: 'boo', c: 0.0, d: false },
        { a: 5, b: 'boo', c: 0.0, d: true },
        { a: 5, b: 'boo', c: 0.0, d: true },
        { a: 5, b: 'foo', c: 0.0, d: false },
        { a: 5, b: 'foo', c: 0.0, d: true },
        { a: 5, b: 'foo', c: 1.0, d: true },
        { a: 5, b: 'foo', c: 1.5, d: true },
        { a: 5, b: 'foo', c: 2.0, d: true },
        { a: 10, b: 'bar', c: 1.0, d: false },
        { a: 10, b: 'boo', c: 0.0, d: false },
        { a: 50, b: 'bar', c: 1.0, d: false },
        { a: 50, b: 'baz', c: 1.0, d: false },
        { a: 50, b: 'baz', c: 1.1, d: false },
        { a: 50, b: 'baz', c: 1.1, d: true },
      ],
      test2: [
        { a: 1, b: 'boo', c: 0.0, d: false },
        { a: 2, b: 'boo', c: 0.0, d: false },
        { a: 5, b: 'foo', c: 0.0, d: true },
        { a: 5, b: 'foo', c: 0.0, d: false },
        { a: 5, b: 'foo', c: 1.0, d: true },
        { a: 5, b: 'foo', c: 1.5, d: true },
        { a: 5, b: 'foo', c: 2.0, d: true },
        { a: 5, b: 'boo', c: 0.0, d: true },
        { a: 5, b: 'boo', c: 0.0, d: true },
        { a: 5, b: 'boo', c: 0.0, d: false },
        { a: 10, b: 'boo', c: 0.0, d: false },
        { a: 10, b: 'bar', c: 1.0, d: false },
        { a: 50, b: 'baz', c: 1.0, d: false },
        { a: 50, b: 'baz', c: 1.1, d: true },
        { a: 50, b: 'baz', c: 1.1, d: false },
        { a: 50, b: 'bar', c: 1.0, d: false },
      ],
    } ]});
  });

  it('Object list filterBy works as expected', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        innerScalarList: inner(filterBy: { scalar: {some: { gt: 0 }}}) {
          scalar
        }

        innerScalarNone: inner(filterBy: { scalar: {none: { lt: 0 }}}) {
          scalar
        }

        innerNodeRef: inner(filterBy: {
          nodeRef: { every: { eq: "-KCb1OwX6lMf7PUpOgjK-kJ5I" }, empty: false }
        }) {
          nodeRef {
            firstName
            lastName
          }
        }

        innerNodeRefEmpty: inner(filterBy: {
          nodeRef: { empty: true }
        }) {
          scalar
          nodeRef {
            firstName
            lastName
          }
        }

        innerNodeRefLength: inner(filterBy: {
          nodeRef: { length: 0 }
        }) {
          scalar
          nodeRef {
            firstName
            lastName
          }
        }

        innerObj: inner(filterBy: {
          obj: { some: { b: {eq: "foo" }}}
        }) {
          obj {
            a, b, c, d
          }
        }
        innerObjLen: inner(filterBy: {
          obj: { length: 3 }
        }) {
          obj {
            a, b, c, d
          }
        }

        innerObjEvery: inner(filterBy: {
          obj: { every: { b: { eq: "foo" } } }
        }) {
          scalar
          obj {
            a, b, c, d
          }
        }
        innerObjNone: inner(filterBy: {
          obj: { none: { b: { eq: "bar" } } }
        }) {
          scalar
          obj {
            a, b, c, d
          }
        }
        innerObjNonEmpty: inner(filterBy: { obj: { empty: false } }) {
          scalar
        }
        innerObjEmpty: inner(filterBy: { obj: { empty: true } }) {
          scalar
        }

        oneObj: inner(filterBy: {
          oneObj: { b: { eq: "zaz" } }
        }) {
          scalar,
          oneObj { a b c d }
        }
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      innerScalarList: [ {
        scalar: [ 1.1, 2.2, 3.3 ]
      } ],
      innerScalarNone: [ {
        scalar: [ 1.1, 2.2, 3.3 ]
      } ],
      innerNodeRef: [ {
        nodeRef: [ {
          firstName: 'John',
          lastName: 'Smith'
        } ]
      } ],
      innerNodeRefEmpty: [ {
        scalar: [ 1.1, 2.2, 3.3 ],
        nodeRef: [ ],
      } ],
      innerNodeRefLength: [ {
        scalar: [ 1.1, 2.2, 3.3 ],
        nodeRef: [ ],
      } ],
      innerObj: [ {
        obj: [
          { a: 5, b: 'foo', c: 0.0, d: true },
          { a: 5, b: 'foo', c: 1.0, d: true },
        ]
      } ],
      innerObjLen: [ {
        obj: [
          { a: 5, b: 'bar', c: 0.0, d: true },
          { a: 5, b: 'bar', c: 1.0, d: true },
          { a: 5, b: 'bar', c: 2.0, d: true },
        ]
      } ],
      innerObjEvery: [ {
        scalar: [ -1.1, -2.2, -3.3 ],
        obj: [
          { a: 5, b: 'foo', c: 0.0, d: true },
          { a: 5, b: 'foo', c: 1.0, d: true },
        ],
      } ],
      innerObjNone: [ {
        scalar: [ -1.1, -2.2, -3.3 ],
        obj: [
          { a: 5, b: 'foo', c: 0.0, d: true },
          { a: 5, b: 'foo', c: 1.0, d: true },
        ],
      } ],
      innerObjNonEmpty: [
        { scalar: [ -1.1, -2.2, -3.3 ] },
        { scalar: [ 1.1, 2.2, 3.3 ] },
      ],
      innerObjEmpty: [ ],
      oneObj: [ {
        scalar: [ 1.1, 2.2, 3.3 ],
        oneObj: {
          a: 5,
          b: 'zaz',
          c: 0.0,
          d: true
        }
      } ]
    } ] });
  });
});
