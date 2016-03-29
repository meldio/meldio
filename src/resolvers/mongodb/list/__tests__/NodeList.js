import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import { typeFromGlobalId } from '../../../../jsutils/globalId';
import { MongoClient } from 'mongodb';
import { GraphQL } from '../../__tests__/setup';

/* eslint no-unused-expressions: 0 */

let graphql;
let db;
const dbName = 'NodeListTest';

const schema = `
  type User implements Node {
    id: ID!
    firstName: String
    lastName: String
    widgets: [Widget]
    named: [Named]
    stuff: [Stuff]
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

  type Widget implements Node, Named {
    id: ID!
    name: String
    quantity: Int
  }

  type Gadget implements Node, Named {
    id: ID!
    name: String
    quality: Int
  }

  type Gizmo implements Node, Named {
    id: ID!
    name: String
    cost: Int
  }

  interface Named {
    name: String
  }

  union Stuff = Widget | Gadget | Gizmo
`;

const widgets = [
  {
    _id: '-KCd76KdWCRpOsyEyApA-m9475K',
    name: 'Flux Capacitor',
    quantity: 10,
  },
  {
    _id: '-KCd7EijXjk4XaruHfhq-m9475K',
    name: 'Delorean',
    quantity: 1,
  },
  {
    _id: '-KCdBWWS8e5AVORNCUa3-m9475K',
    name: 'Hoverboard',
    quantity: 20,
  },
  {
    _id: '-KCdBh9Kl24sSRPeMP6n-m9475K',
    name: 'Baseball Almanac',
    quantity: 5,
  },
];

const gadgets = [
  {
    _id: '-KCg72-8E_IbEZ1NKJch-X1475K',
    name: 'G1',
    quality: 10,
  },
  {
    _id: '-KCg77Qeq8H9iWOvIzNn-X1475K',
    name: 'G2',
    quality: 10,
  },
];

const gizmos = [
  {
    _id: '-KCg7LUkZj9oaw9r3UWC-X9QDF',
    name: 'Skateboard',
    cost: 20,
  },
  {
    _id: '-KCg7RFbm7K95HbRN9fs-X9QDF',
    name: 'Self-Lacing Shoes',
    cost: 30,
  },
];

const named = [
  ...widgets,
  ...gadgets,
  ...gizmos,
];

const stuff = [
  ...widgets,
  ...gadgets,
  ...gizmos,
];

const users = [
  {
    _id: '-KCb1OwX6lMf7PUpOgjK-kJ5I',
    firstName: 'John',
    lastName: 'Smith',
    widgets: widgets.map(w => w._id),
    named: named.map(w => w._id),
    stuff: stuff.map(w => w._id),
    nullList: null,
    listWithNulls: [ null, 'junk', ...widgets.map(w => w._id), null ],
  }
];


function toNode(mongoObjects) {
  return mongoObjects.map(obj => {
    const nodeObj = { ...obj, id: obj._id };
    delete nodeObj._id;
    return nodeObj;
  });
}

describe('Mongo Resolvers / lists / NodeList:', function () {

  before(async () => {

    db = await MongoClient.connect(`mongodb://localhost:27017/${dbName}`);
    graphql = await GraphQL(schema, db);

    await db.collection('User').insertMany(users);
    await db.collection('Widget').insertMany(widgets);
    await db.collection('Gadget').insertMany(gadgets);
    await db.collection('Gizmo').insertMany(gizmos);
  });

  after(async function() {
    await db.dropDatabase(dbName);
    db.close();
  });

  it('Node list is fetched along with node', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        widgets {
          id
          name
          quantity
        }
        named {
          ...on Node { id }
          name
          ...on Widget { quantity }
          ...on Gadget { quality }
          ...on Gizmo { cost }
        }
        stuff {
          ...on Node { id }
          ...on Named { name }
          ...on Widget { quantity }
          ...on Gadget { quality }
          ...on Gizmo { cost }
        }
        missingList { name }
        nullList { name }
        listWithNulls { name }
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      widgets: toNode(widgets),
      named: toNode(named),
      stuff: toNode(stuff),
      missingList: null,
      nullList: null,
      listWithNulls: [
        null,
        null,
        ...widgets.map(w => ({name: w.name})),
        null ],
    } ] });
  });

  const tests = Array
    .apply(null, { length: widgets.length })
    .map( (_, i) => i + 1);

  tests.forEach(n =>
    it('Node list argument first works with ' + n, async () => {
      const message = ` query Q {
        user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
          widgets(first: ${n}) {
            id
            name
            quantity
          }
          named(first: ${n}) {
            ...on Node { id }
            name
            ...on Widget { quantity }
            ...on Gadget { quality }
            ...on Gizmo { cost }
          }
          stuff(first: ${n}) {
            ...on Node { id }
            ...on Named { name }
            ...on Widget { quantity }
            ...on Gadget { quality }
            ...on Gizmo { cost }
          }
        }
      } `;
      const result = await graphql(message);
      expect(result.data).to.deep.equal({ user: [ {
        widgets: toNode(widgets).slice(0, n),
        named: toNode(named).slice(0, n),
        stuff: toNode(stuff).slice(0, n),
      } ] });
    }));

  tests.forEach(n =>
    it('Node list argument last works with ' + n, async () => {
      const message = ` query Q {
        user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
          widgets(last: ${n}) {
            id
            name
            quantity
          }
          named(last: ${n}) {
            ...on Node { id }
            name
            ...on Widget { quantity }
            ...on Gadget { quality }
            ...on Gizmo { cost }
          }
          stuff(last: ${n}) {
            ...on Node { id }
            ...on Named { name }
            ...on Widget { quantity }
            ...on Gadget { quality }
            ...on Gizmo { cost }
          }
        }
      } `;
      const result = await graphql(message);
      expect(result.data).to.deep.equal({ user: [ {
        widgets: toNode(widgets).slice(-n),
        named: toNode(named).slice(-n),
        stuff: toNode(stuff).slice(-n),
      } ] });
    }));

  it('Node list filterBy id works as expected', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: widgets(filterBy: { id: {eq: "-KCd76KdWCRpOsyEyApA-m9475K"}}) {
          name
        }
        test2: widgets(filterBy: {
          id: {eq: ["-KCd7EijXjk4XaruHfhq-m9475K",
                    "-KCdBWWS8e5AVORNCUa3-m9475K"]} }
        ) { name }
        test3: named(filterBy: { id: {eq: "-KCg72-8E_IbEZ1NKJch-X1475K"}}) {
          name
        }
        test4: named(filterBy: {
          id: {eq: ["-KCg77Qeq8H9iWOvIzNn-X1475K",
                    "-KCg7RFbm7K95HbRN9fs-X9QDF"]} }) {
          name
        }
        test5: stuff(filterBy: { id: {eq: "-KCg7LUkZj9oaw9r3UWC-X9QDF"} }) {
          ...on Named { name }
        }
        test6: stuff(filterBy: {
          id: {eq: ["-KCg7LUkZj9oaw9r3UWC-X9QDF",
                    "-KCdBh9Kl24sSRPeMP6n-m9475K"]} }) {
          ...on Named { name }
        }
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      test1: [ {name: 'Flux Capacitor'} ],
      test2: [ {name: 'Delorean'}, {name: 'Hoverboard'} ],
      test3: [ {name: 'G1'} ],
      test4: [ {name: 'G2'}, {name: 'Self-Lacing Shoes'} ],
      test5: [ {name: 'Skateboard'} ],
      test6: [ {name: 'Baseball Almanac'}, {name: 'Skateboard'} ],
    } ] });
  });

  it('Node list filterBy works as expected', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: widgets(filterBy: { name: {eq: "Delorean"} }) {
          id, name, quantity
        }
        test2: widgets(filterBy: { name: {ne: "Delorean"} }) {
          id, name, quantity
        }
        test3: widgets(filterBy: { quantity: {gt: 1 lt: 10} }) {
          id, name, quantity
        }
        test4: widgets(filterBy: {
          name: {ne: "Delorean"},
          quantity: {gt: 5}
        }) {
          id, name, quantity
        }
        test5: named(filterBy: { name: {eq: "Delorean"} }) {
          ...on Node { id }
          name,
          ...on Widget { quantity }
          ...on Gadget { quality }
          ...on Gizmo { cost }
        }
        test6: named(filterBy: { name: {ne: "Delorean"} }) {
          ...on Node { id }
          name,
          ...on Widget { quantity }
          ...on Gadget { quality }
          ...on Gizmo { cost }
        }
        test7: named(filterBy: { type: {eq: Widget} }) {
          ...on Node { id }
          name,
          ...on Widget { quantity }
        }
        test8: named(filterBy: {type: {eq: Gadget}, name: {eq: "Delorean"}}) {
          ...on Node { id }
          name,
          ...on Gadget { quality }
        }
        test9: stuff(filterBy: {type: {eq: Gadget}}) {
          ...on Node { id }
          ...on Named { name }
          ...on Gadget { quality }
        }
        test10: stuff(filterBy: {type: {ne: Gadget}}) {
          ...on Node { id }
          ...on Named { name }
          ...on Widget { quantity }
          ...on Gizmo { cost }
        }
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      test1: toNode(widgets).filter(w => w.name === 'Delorean'),
      test2: toNode(widgets).filter(w => w.name !== 'Delorean'),
      test3: toNode(widgets).filter(w => w.quantity > 1 && w.quantity < 10),
      test4:
        toNode(widgets).filter(w => w.name !== 'Delorean' && w.quantity > 5),
      test5: toNode(named).filter(w => w.name === 'Delorean'),
      test6: toNode(named).filter(w => w.name !== 'Delorean'),
      test7: toNode(named).filter(w => typeFromGlobalId(w.id) === 'Widget'),
      test8: toNode(named).filter(w => typeFromGlobalId(w.id) === 'Gadget' &&
                                       w.name === 'Delorean'),
      test9: toNode(stuff).filter(w => typeFromGlobalId(w.id) === 'Gadget'),
      test10: toNode(stuff).filter(w => typeFromGlobalId(w.id) !== 'Gadget'),
    } ] });
  });

  it('Object list filter works as expected', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: widgets(filter: AT_LEAST quantity: 10) { id, name, quantity }
        test2: widgets(filter: LESS_THAN quantity: 10) { id, name, quantity }
        test3: named(filter: DELOREAN) {
          ...on Node { id }
          name
          ...on Widget { quantity }
          ...on Gadget { quality }
          ...on Gizmo { cost }
        }
        test4: named(filter: WIDGET) {
          ...on Node { id }
          name
          ...on Widget { quantity }
        }
        test5: stuff(filter: WIDGET) {
          ...on Node { id }
          ...on Named { name }
          ...on Widget { quantity }
        }
        test6: stuff(filter: GADGET_OR_GIZMO) {
          ...on Node { id }
          ...on Named { name }
          ...on Gadget { quality }
          ...on Gizmo { cost }
        }
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      test1: toNode(widgets).filter(o => o.quantity >= 10),
      test2: toNode(widgets).filter(o => o.quantity < 10),
      test3: toNode(named).filter(o => o.name === 'Delorean'),
      test4: toNode(named).filter(o => typeFromGlobalId(o.id) === 'Widget'),
      test5: toNode(stuff).filter(o => typeFromGlobalId(o.id) === 'Widget'),
      test6: toNode(stuff).filter(o => typeFromGlobalId(o.id) === 'Gadget' ||
                                       typeFromGlobalId(o.id) === 'Gizmo'),
    } ]});
  });


  it('Node list orderBy works as expected', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: widgets(
          orderBy: [
            { quantity: ASCENDING },
            { name: ASCENDING }
          ]
        ) {
          id,
          name,
          quantity
        }
        test2: widgets(orderBy: [ { name: DESCENDING } ] ) {
          id,
          name,
          quantity
        }
        test3: named(orderBy: [ { name: DESCENDING } ]) {
          ...on Node { id }
          name,
          ...on Widget { quantity }
          ...on Gadget { quality }
          ...on Gizmo { cost }
        }
      }
    } `;
    const result = await graphql(message);
    expect(result.data).to.deep.equal({ user: [ {
      test1: toNode([
        {
          _id: '-KCd7EijXjk4XaruHfhq-m9475K',
          name: 'Delorean',
          quantity: 1,
        },
        {
          _id: '-KCdBh9Kl24sSRPeMP6n-m9475K',
          name: 'Baseball Almanac',
          quantity: 5,
        },
        {
          _id: '-KCd76KdWCRpOsyEyApA-m9475K',
          name: 'Flux Capacitor',
          quantity: 10,
        },
        {
          _id: '-KCdBWWS8e5AVORNCUa3-m9475K',
          name: 'Hoverboard',
          quantity: 20,
        },
      ]),
      test2: toNode([
        {
          _id: '-KCdBWWS8e5AVORNCUa3-m9475K',
          name: 'Hoverboard',
          quantity: 20,
        },
        {
          _id: '-KCd76KdWCRpOsyEyApA-m9475K',
          name: 'Flux Capacitor',
          quantity: 10,
        },
        {
          _id: '-KCd7EijXjk4XaruHfhq-m9475K',
          name: 'Delorean',
          quantity: 1,
        },
        {
          _id: '-KCdBh9Kl24sSRPeMP6n-m9475K',
          name: 'Baseball Almanac',
          quantity: 5,
        },
      ]),
      test3: [
        {
          cost: 20,
          id: '-KCg7LUkZj9oaw9r3UWC-X9QDF',
          name: 'Skateboard',
        },
        {
          cost: 30,
          id: '-KCg7RFbm7K95HbRN9fs-X9QDF',
          name: 'Self-Lacing Shoes',
        },
        {
          id: '-KCdBWWS8e5AVORNCUa3-m9475K',
          name: 'Hoverboard',
          quantity: 20,
        },
        {
          id: '-KCg77Qeq8H9iWOvIzNn-X1475K',
          name: 'G2',
          quality: 10,
        },
        {
          id: '-KCg72-8E_IbEZ1NKJch-X1475K',
          name: 'G1',
          quality: 10,
        },
        {
          id: '-KCd76KdWCRpOsyEyApA-m9475K',
          name: 'Flux Capacitor',
          quantity: 10,
        },
        {
          id: '-KCd7EijXjk4XaruHfhq-m9475K',
          name: 'Delorean',
          quantity: 1,
        },
        {
          id: '-KCdBh9Kl24sSRPeMP6n-m9475K',
          name: 'Baseball Almanac',
          quantity: 5,
        } ],
    } ] });
  });


  it('Node list order works as expected', async () => {
    const message = ` query Q {
      user(id: "-KCb1OwX6lMf7PUpOgjK-kJ5I") {
        test1: widgets(order: NAME) { id, name, quantity }
        test2: widgets(order: QUANTITY) { id, name, quantity }
        test3: named(order: NAME) {
          ...on Node { id }
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
          id: '-KCdBh9Kl24sSRPeMP6n-m9475K',
          name: 'Baseball Almanac',
          quantity: 5
        },
        {
          id: '-KCd7EijXjk4XaruHfhq-m9475K',
          name: 'Delorean',
          quantity: 1
        },
        {
          id: '-KCd76KdWCRpOsyEyApA-m9475K',
          name: 'Flux Capacitor',
          quantity: 10
        },
        {
          id: '-KCdBWWS8e5AVORNCUa3-m9475K',
          name: 'Hoverboard',
          quantity: 20
        }
      ],
      test2: [
        {
          id: '-KCdBWWS8e5AVORNCUa3-m9475K',
          name: 'Hoverboard',
          quantity: 20
        },
        {
          id: '-KCd76KdWCRpOsyEyApA-m9475K',
          name: 'Flux Capacitor',
          quantity: 10
        },
        {
          id: '-KCdBh9Kl24sSRPeMP6n-m9475K',
          name: 'Baseball Almanac',
          quantity: 5
        },
        {
          id: '-KCd7EijXjk4XaruHfhq-m9475K',
          name: 'Delorean',
          quantity: 1
        }
      ],
      test3: [
        {
          id: '-KCdBh9Kl24sSRPeMP6n-m9475K',
          name: 'Baseball Almanac',
          quantity: 5
        },
        {
          id: '-KCd7EijXjk4XaruHfhq-m9475K',
          name: 'Delorean',
          quantity: 1
        },
        {
          id: '-KCd76KdWCRpOsyEyApA-m9475K',
          name: 'Flux Capacitor',
          quantity: 10
        },
        {
          id: '-KCg72-8E_IbEZ1NKJch-X1475K',
          name: 'G1',
          quality: 10
        },
        {
          id: '-KCg77Qeq8H9iWOvIzNn-X1475K',
          name: 'G2',
          quality: 10
        },
        {
          id: '-KCdBWWS8e5AVORNCUa3-m9475K',
          name: 'Hoverboard',
          quantity: 20
        },
        {
          id: '-KCg7RFbm7K95HbRN9fs-X9QDF',
          name: 'Self-Lacing Shoes',
          cost: 30
        },
        {
          id: '-KCg7LUkZj9oaw9r3UWC-X9QDF',
          name: 'Skateboard',
          cost: 20
        }
      ]
    } ]});
  });

});
