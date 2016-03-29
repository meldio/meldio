import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import { MongoClient } from 'mongodb';
import { newGlobalId } from '../../../../jsutils/globalId';
import {
  parse,
  analyzeAST,
  validate,
} from '../../../../schema';
import { CRUD } from '../CRUD';

/* eslint no-unused-expressions: 0 */

let db;
let crud;
const dbName = 'CRUDTest';

const schemaDef = `
  type User implements Node {
    id: ID!
    firstName: String
    lastName: String                              # scalar
    score: Int                                    # numeric
    stuff: NodeConnection(Stuff, users, Props)    # node connection (union)
    highScores: [Int]                             # scalar list
    billingAddress: Address                       # object (type)
    shippingAddresses: [Address]                  # object list (type)
    primaryGadget: Gadget                         # node
    secondaryGadgets: [Gadget]                    # node list
    location: Location                            # object (union)
  }

  type Address {
    street: String
    city: String
    state: String
    postal: String
  }

  type Gps {
    lat: Float
    lon: Float
  }
  union Location = Address | Gps

  type Props {
    quantity: Int
  }

  union Stuff = Widget | Gizmo

  type Widget implements Node {
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

  type Gadget implements Node {
    id: ID!
    name: String
    cost: Float
  }

`;

let janeUserId;
let jane;


describe('Mongo Resolvers / CRUD:', () => {
  before(async () => {
    const ast = parse(schemaDef);
    const schema = analyzeAST(ast);
    const results = validate(schema);
    expect(results).to.have.length(0);
    db = await MongoClient.connect(`mongodb://localhost:27017/${dbName}`);

    crud = new CRUD({ db, schema, config: { } });

    janeUserId = newGlobalId('User');
    jane = {
      id: janeUserId,
      firstName: 'Jane',
      lastName: 'Smith',
      score: 1000,
    };
    const result = await crud.addNode('User', jane);
    expect(result).to.be.true;
  });

  after(async function() {
    const isDeleted = await crud.deleteNode('User', janeUserId);
    expect(isDeleted).to.be.true;

    await db.dropDatabase(dbName);
    db.close();
  });

  it('single node crud operations work as expected', async () => {
    const userId = newGlobalId('User');
    const user = {
      id: userId,
      firstName: 'John',
      lastName: 'Smith',
    };
    const result = await crud.addNode('User', user);
    expect(result).to.be.true;
    const exists = await crud.existsNode('User', userId);
    expect(exists).to.be.true;
    const doesntExist = await crud.existsNode('User', newGlobalId('User'));
    expect(doesntExist).to.be.false;
    const retrieved = await crud.getNode('User', userId);
    expect(retrieved).to.deep.equal(user);
    const notRetrieved = await crud.getNode('User', newGlobalId('User'));
    expect(notRetrieved).to.be.null;

    const isUpdated = await crud.updateNode('User', userId, {lastName: 'Doe'});
    expect(isUpdated).to.be.true;
    const newlyRetrieved = await crud.getNode('User', userId);
    expect(newlyRetrieved).to.deep.equal({ ...user, lastName: 'Doe' });

    const notUpdated =
      await crud.updateNode('User', newGlobalId('User'), {lastName: 'Doe'});
    expect(notUpdated).to.be.false;

    const notDeleted = await crud.deleteNode('User', newGlobalId('User'));
    expect(notDeleted).to.be.false;

    const isDeleted = await crud.deleteNode('User', userId);
    expect(isDeleted).to.be.true;
  });

  it('updateNodes operation works as expected', async () => {
    const users = [
      { id: newGlobalId('User'), firstName: 'FN1', lastName: 'LN1', score: 10 },
      { id: newGlobalId('User'), firstName: 'FN2', lastName: 'LN2', score: 20 },
      { id: newGlobalId('User'), firstName: 'FN3', lastName: 'LN3', score: 30 },
      { id: newGlobalId('User'), firstName: 'FN4', lastName: 'LN4', score: 40 },
      { id: newGlobalId('User'), firstName: 'FN5', lastName: 'LN5', score: 50 },
      { id: newGlobalId('User'), firstName: 'FN6', lastName: 'LN6', score: 60 },
      { id: newGlobalId('User'), firstName: 'FN7', lastName: 'LN7', score: 70 },
      { id: newGlobalId('User'), firstName: 'FN8', lastName: 'LN8', score: 80 },
      { id: newGlobalId('User'), firstName: 'FN9', lastName: 'LN9', score: 90 },
    ];
    const addStatuses = await Promise.all(
      users.map(user => crud.addNode('User', user)));
    expect(addStatuses).to.have.length(users.length);
    expect(addStatuses).to.include(true);
    expect(addStatuses).to.not.include(false);

    const allUsers = await crud.listNodes('User', { });
    expect(allUsers).to.have.length(users.length + 1);
    users.forEach(user => expect(allUsers).to.deep.include(user));

    const fn7User = await crud.listNodes('User', { firstName: 'FN7' });
    expect(fn7User).to.have.length(1);
    expect(fn7User[0]).to.have.property('firstName').that.equals('FN7');

    const noUser = await crud.listNodes('User', { firstName: 'Boom!' });
    expect(noUser).to.have.length(0);

    let threeUsers = await crud.listNodes('User', {score: {gt: 50, lt: 90}});
    expect(threeUsers).to.have.length(3);
    expect(threeUsers).to.deep.include(users[5]);
    expect(threeUsers).to.deep.include(users[6]);
    expect(threeUsers).to.deep.include(users[7]);

    threeUsers = await crud.listNodes('User', [
      users[1].id,
      users[2].id,
      users[3].id,
    ]);
    expect(threeUsers).to.have.length(3);
    expect(threeUsers).to.deep.include(users[1]);
    expect(threeUsers).to.deep.include(users[2]);
    expect(threeUsers).to.deep.include(users[3]);

    let areUpdated = await crud.updateNodes(
      'User',
      { score: { gt: 50, lt: 90 } },
      { score: { add: 3 } }
    );
    expect(areUpdated).to.have.length(3);
    expect(areUpdated).to.include(users[5].id);
    expect(areUpdated).to.include(users[6].id);
    expect(areUpdated).to.include(users[7].id);

    threeUsers = await crud.listNodes('User', {score: {gt: 50, lt: 90}});
    expect(threeUsers).to.have.length(3);
    expect(threeUsers)
      .to.deep.include({...users[5], score: users[5].score + 3});
    expect(threeUsers)
      .to.deep.include({...users[6], score: users[6].score + 3});
    expect(threeUsers)
      .to.deep.include({...users[7], score: users[7].score + 3});

    areUpdated = await crud.updateNodes(
      'User',
      { score: { gt: 50, lt: 90 } },
      { score: { sub: 3 } }
    );
    expect(areUpdated).to.have.length(3);
    expect(areUpdated).to.include(users[5].id);
    expect(areUpdated).to.include(users[6].id);
    expect(areUpdated).to.include(users[7].id);

    threeUsers = await crud.listNodes('User', {score: {gt: 50, lt: 90}});
    expect(threeUsers).to.have.length(3);
    expect(threeUsers).to.deep.include(users[5]);
    expect(threeUsers).to.deep.include(users[6]);
    expect(threeUsers).to.deep.include(users[7]);

    const deleted = await crud.deleteNodes(
      'User',
      { firstName: { matches: 'FN'} });
    expect(deleted).to.have.length(users.length);
    users
      .map(user => user.id)
      .forEach(id => expect(deleted).to.include(id));

    const remainingUser = await crud.listNodes('User', { });
    expect(remainingUser).to.have.length(1);
  });

  it('updateNode: scalar field is updated correctly', async () => {
    // clear:
    const { id, lastName, score } = jane;
    let updated = await crud.updateNode('User', id, {firstName: {clear: true}});
    expect(updated).to.be.true;
    let updatedJane = await crud.getNode('User', id);
    expect(updatedJane).to.deep.equal({ id, lastName, score});

    // set:
    updated = await crud.updateNode('User', id, {firstName: 'Jane'});
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', id);
    expect(updatedJane).to.deep.equal(jane);
  });

  it('updateNode: numeric field is updated correctly', async () => {
    // add:
    let updated = await crud.updateNode('User', janeUserId, {score: {add: 3}});
    expect(updated).to.be.true;
    let updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({...jane, score: jane.score + 3});

    // sub:
    updated = await crud.updateNode('User', janeUserId, {score: {sub: 3}});
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal(jane);

    // mul:
    updated = await crud.updateNode('User', janeUserId, {score: {mul: 10}});
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({...jane, score: jane.score * 10});

    // div:
    updated = await crud.updateNode('User', janeUserId, {score: {div: 10}});
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal(jane);

    // min:
    updated = await crud.updateNode('User', janeUserId, {score: {min: 999}});
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({...jane, score: 999 });

    // max:
    updated = await crud.updateNode('User', janeUserId, {score: {max: 1000}});
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal(jane);

    // clear:
    updated = await crud.updateNode('User', janeUserId, {score: {clear: true}});
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    const { id, firstName, lastName } = jane;
    expect(updatedJane).to.deep.equal({ id, firstName, lastName});

    // set:
    updated = await crud.updateNode('User', janeUserId, {score: 1000});
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal(jane);
  });

  it('updateNode: node field is updated correctly', async () => {
    const gid = newGlobalId('Gadget');
    const gadget = {
      id: gid,
      name: 'G1',
      cost: 200.22,
    };
    const isAdded = await crud.addNode('Gadget', gadget);
    expect(isAdded).to.be.true;

    // set:
    updated = await crud.updateNode('User', janeUserId, {primaryGadget: gid});
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({...jane, primaryGadget: gid});

    // clear:
    let updated = await crud.updateNode(
      'User',
      janeUserId,
      { primaryGadget: {clear: true} });
    expect(updated).to.be.true;
    let updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal(jane);

    const isDeleted = await crud.deleteNode('Gadget', gid);
    expect(isDeleted).to.be.true;
  });

  it('updateNode: node list field is updated correctly', async () => {
    // setup:
    const gadgets = [
      { id: newGlobalId('Gadget'), name: 'G1', cost: 100 }, // 0
      { id: newGlobalId('Gadget'), name: 'G2', cost: 200 }, // 1
      { id: newGlobalId('Gadget'), name: 'G3', cost: 300 }, // 2
      { id: newGlobalId('Gadget'), name: 'G4', cost: 400 }, // 3
      { id: newGlobalId('Gadget'), name: 'G5', cost: 500 }, // 4
      { id: newGlobalId('Gadget'), name: 'G6', cost: 600 }, // 5
      { id: newGlobalId('Gadget'), name: 'G7', cost: 700 }, // 6
      { id: newGlobalId('Gadget'), name: 'G8', cost: 800 }, // 7
      { id: newGlobalId('Gadget'), name: 'G9', cost: 900 }, // 8
      { id: newGlobalId('Gadget'), name: 'G10', cost: 1000 }, // 9
    ];
    const addStatuses = await Promise.all(
      gadgets.map(gadget => crud.addNode('Gadget', gadget)));
    expect(addStatuses).to.have.length(gadgets.length);
    addStatuses.forEach(status => expect(status).to.be.true);

    // set:
    let updated = await crud.updateNode('User', janeUserId, {
      secondaryGadgets: [
        gadgets[3].id,
        gadgets[6].id,
      ]
    });
    expect(updated).to.be.true;
    let updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      secondaryGadgets: [
        gadgets[3].id,
        gadgets[6].id,
      ]
    });

    // insert: default to the tail of the list:
    updated = await crud.updateNode('User', janeUserId, {
      secondaryGadgets: {
        insert: [
          gadgets[8].id,
          gadgets[9].id,
        ] }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      secondaryGadgets: [
        gadgets[3].id,
        gadgets[6].id,
        gadgets[8].id,
        gadgets[9].id,
      ]
    });

    // insert: at inserts at specific position:
    updated = await crud.updateNode('User', janeUserId, {
      secondaryGadgets: {
        insert: gadgets[7].id,
        at: 2
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      secondaryGadgets: [
        gadgets[3].id,
        gadgets[6].id,
        gadgets[7].id,
        gadgets[8].id,
        gadgets[9].id,
      ]
    });
    updated = await crud.updateNode('User', janeUserId, {
      secondaryGadgets: {
        insert: [ gadgets[4].id, gadgets[5].id ],
        at: 1,
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      secondaryGadgets: [
        gadgets[3].id,
        gadgets[4].id,
        gadgets[5].id,
        gadgets[6].id,
        gadgets[7].id,
        gadgets[8].id,
        gadgets[9].id,
      ]
    });

    // insert: ascending: true maintains the order
    updated = await crud.updateNode('User', janeUserId, {
      secondaryGadgets: {
        insert: [ gadgets[1].id, gadgets[2].id ],
        ascending: true,
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      secondaryGadgets: [
        gadgets[1].id,
        gadgets[2].id,
        gadgets[3].id,
        gadgets[4].id,
        gadgets[5].id,
        gadgets[6].id,
        gadgets[7].id,
        gadgets[8].id,
        gadgets[9].id,
      ]
    });

    // insert: keepFirst: maintains the invariant
    updated = await crud.updateNode('User', janeUserId, {
      secondaryGadgets: {
        insert: gadgets[0].id,
        ascending: true,
        keepFirst: 4,
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      secondaryGadgets: [
        gadgets[0].id,
        gadgets[1].id,
        gadgets[2].id,
        gadgets[3].id,
      ]
    });

    // insert: keepLast: maintains the invariant
    updated = await crud.updateNode('User', janeUserId, {
      secondaryGadgets: {
        insert: gadgets[4].id,
        ascending: true,
        keepLast: 3,
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      secondaryGadgets: [
        gadgets[2].id,
        gadgets[3].id,
        gadgets[4].id,
      ]
    });

    // insert: descending: true: maintains the order
    updated = await crud.updateNode('User', janeUserId, {
      secondaryGadgets: {
        insert: [ gadgets[0].id, gadgets[1].id, gadgets[5].id, gadgets[6].id ],
        descending: true,
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      secondaryGadgets: [
        gadgets[6].id,
        gadgets[5].id,
        gadgets[4].id,
        gadgets[3].id,
        gadgets[2].id,
        gadgets[1].id,
        gadgets[0].id,
      ]
    });

    // insert: ascending: restores the order
    updated = await crud.updateNode('User', janeUserId, {
      secondaryGadgets: {
        insert: [ gadgets[9].id, gadgets[8].id, gadgets[7].id ],
        ascending: true,
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      secondaryGadgets: [
        gadgets[0].id,
        gadgets[1].id,
        gadgets[2].id,
        gadgets[3].id,
        gadgets[4].id,
        gadgets[5].id,
        gadgets[6].id,
        gadgets[7].id,
        gadgets[8].id,
        gadgets[9].id,
      ]
    });

    // delete: deletes the specific ids
    updated = await crud.updateNode('User', janeUserId, {
      secondaryGadgets: {
        delete: [ gadgets[3].id, gadgets[5].id, gadgets[7].id ],
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      secondaryGadgets: [
        gadgets[0].id,
        gadgets[1].id,
        gadgets[2].id,
        gadgets[4].id,
        gadgets[6].id,
        gadgets[8].id,
        gadgets[9].id,
      ]
    });

    // delete: delete one id
    updated = await crud.updateNode('User', janeUserId, {
      secondaryGadgets: {
        delete: gadgets[9].id,
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      secondaryGadgets: [
        gadgets[0].id,
        gadgets[1].id,
        gadgets[2].id,
        gadgets[4].id,
        gadgets[6].id,
        gadgets[8].id,
      ]
    });

    // delete: delete with scalar expression
    updated = await crud.updateNode('User', janeUserId, {
      secondaryGadgets: {
        delete: { lte: gadgets[2].id },
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      secondaryGadgets: [
        gadgets[4].id,
        gadgets[6].id,
        gadgets[8].id,
      ]
    });
    updated = await crud.updateNode('User', janeUserId, {
      secondaryGadgets: {
        delete: { gt: gadgets[6].id },
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      secondaryGadgets: [
        gadgets[4].id,
        gadgets[6].id,
      ]
    });

    // delete: delete with scalar expression
    updated = await crud.updateNode('User', janeUserId, {
      secondaryGadgets: {
        delete: { eq: [ gadgets[4].id, gadgets[6].id ]},
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      secondaryGadgets: [ ]
    });

    // insert: insert specific ids
    updated = await crud.updateNode('User', janeUserId, {
      secondaryGadgets: {
        insert: [ gadgets[3].id, gadgets[2].id, gadgets[1].id ],
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      secondaryGadgets: [
        gadgets[3].id,
        gadgets[2].id,
        gadgets[1].id
      ]
    });

    // pop: first
    updated = await crud.updateNode('User', janeUserId, {
      secondaryGadgets: {
        pop: 'first',
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      secondaryGadgets: [
        gadgets[2].id,
        gadgets[1].id
      ]
    });

    // pop: last
    updated = await crud.updateNode('User', janeUserId, {
      secondaryGadgets: {
        pop: 'last',
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      secondaryGadgets: [
        gadgets[2].id,
      ]
    });

    // clear: true
    updated = await crud.updateNode('User', janeUserId, {
      secondaryGadgets: {
        clear: true,
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal(jane);

    // cleanup:
    const deleted = await crud.deleteNodes('Gadget', gadgets.map(g => g.id));
    expect(deleted).to.have.length(gadgets.length);
    gadgets
      .map(gadget => gadget.id)
      .forEach(id => expect(deleted).to.include(id));

    const remainingGadgets = await crud.listNodes('Gadget', { });
    expect(remainingGadgets).to.have.length(0);
  });

  it('updateNode: scalar list field is updated correctly', async () => {
    // set:
    let updated = await crud.updateNode('User', janeUserId, {
      highScores: [ 3, 6 ]
    });
    expect(updated).to.be.true;
    let updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      highScores: [ 3, 6 ],
    });

    // insert: default to the tail of the list:
    updated = await crud.updateNode('User', janeUserId, {
      highScores: {
        insert: [ 8, 9 ],
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      highScores: [ 3, 6, 8, 9 ],
    });

    // insert: at inserts at specific position:
    updated = await crud.updateNode('User', janeUserId, {
      highScores: {
        insert: 7,
        at: 2
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      highScores: [ 3, 6, 7, 8, 9 ],
    });
    updated = await crud.updateNode('User', janeUserId, {
      highScores: {
        insert: [ 4, 5 ],
        at: 1,
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      highScores: [ 3, 4, 5, 6, 7, 8, 9 ],
    });

    // insert: ascending: true maintains the order
    updated = await crud.updateNode('User', janeUserId, {
      highScores: {
        insert: [ 1, 2 ],
        ascending: true,
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      highScores: [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ],
    });

    // insert: keepFirst: maintains the invariant
    updated = await crud.updateNode('User', janeUserId, {
      highScores: {
        insert: 0,
        ascending: true,
        keepFirst: 4,
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      highScores: [ 0, 1, 2, 3 ],
    });

    // insert: keepLast: maintains the invariant
    updated = await crud.updateNode('User', janeUserId, {
      highScores: {
        insert: 4,
        ascending: true,
        keepLast: 3,
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      highScores: [ 2, 3, 4 ],
    });

    // insert: descending: true: maintains the order
    updated = await crud.updateNode('User', janeUserId, {
      highScores: {
        insert: [ 0, 1, 5, 6 ],
        descending: true,
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      highScores: [ 6, 5, 4, 3, 2, 1, 0 ],
    });

    // insert: ascending: restores the order
    updated = await crud.updateNode('User', janeUserId, {
      highScores: {
        insert: [ 9, 8, 7 ],
        ascending: true,
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      highScores: [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ],
    });

    // delete: deletes the specific ids
    updated = await crud.updateNode('User', janeUserId, {
      highScores: {
        delete: [ 3, 5, 7 ],
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      highScores: [ 0, 1, 2, 4, 6, 8, 9 ],
    });

    // delete: delete one id
    updated = await crud.updateNode('User', janeUserId, {
      highScores: {
        delete: 9,
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      highScores: [ 0, 1, 2, 4, 6, 8 ],
    });

    // delete: delete with scalar expression
    updated = await crud.updateNode('User', janeUserId, {
      highScores: {
        delete: { lte: 2 },
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      highScores: [ 4, 6, 8 ],
    });
    updated = await crud.updateNode('User', janeUserId, {
      highScores: {
        delete: { gt: 6 },
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      highScores: [ 4, 6 ],
    });

    // delete: delete with scalar expression
    updated = await crud.updateNode('User', janeUserId, {
      highScores: {
        delete: { eq: [ 4, 6 ]},
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      highScores: [ ]
    });

    // insert: insert specific ids
    updated = await crud.updateNode('User', janeUserId, {
      highScores: {
        insert: [ 3, 2, 1 ],
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      highScores: [ 3, 2, 1 ],
    });

    // insert: null works:
    updated = await crud.updateNode('User', janeUserId, {
      highScores: {
        insert: null,
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      highScores: [ 3, 2, 1, null ],
    });
    updated = await crud.updateNode('User', janeUserId, {
      highScores: {
        insert: null,
        at: 0,
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      highScores: [ null, 3, 2, 1, null ],
    });

    // delete: null works:
    updated = await crud.updateNode('User', janeUserId, {
      highScores: {
        delete: null,
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      highScores: [ 3, 2, 1 ],
    });

    // pop: first
    updated = await crud.updateNode('User', janeUserId, {
      highScores: {
        pop: 'first',
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      highScores: [ 2, 1 ],
    });

    // pop: last
    updated = await crud.updateNode('User', janeUserId, {
      highScores: {
        pop: 'last',
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      highScores: [ 2 ],
    });

    // clear: true
    updated = await crud.updateNode('User', janeUserId, {
      highScores: {
        clear: true,
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal(jane);
  });

  it('updateNode: object list field is updated correctly', async () => {
    // setup:
    const state = 'CA';
    const addresses = [
      {_type: 'Address', street: 'Address0', city: 'City0', state, postal: '0'},
      {_type: 'Address', street: 'Address1', city: 'City1', state, postal: '1'},
      {_type: 'Address', street: 'Address2', city: 'City2', state, postal: '2'},
      {_type: 'Address', street: 'Address3', city: 'City3', state, postal: '3'},
      {_type: 'Address', street: 'Address4', city: 'City4', state, postal: '4'},
      {_type: 'Address', street: 'Address5', city: 'City5', state, postal: '5'},
      {_type: 'Address', street: 'Address6', city: 'City6', state, postal: '6'},
      {_type: 'Address', street: 'Address7', city: 'City7', state, postal: '7'},
      {_type: 'Address', street: 'Address8', city: 'City8', state, postal: '8'},
      {_type: 'Address', street: 'Address9', city: 'City9', state, postal: '9'},
    ];

    // set:
    let updated = await crud.updateNode('User', janeUserId, {
      shippingAddresses: [ addresses[3], addresses[6] ]
    });
    expect(updated).to.be.true;
    let updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane, shippingAddresses: [ addresses[3], addresses[6] ] });

    // insert: default to the tail of the list:
    updated = await crud.updateNode('User', janeUserId, {
      shippingAddresses: { insert: [ addresses[8], addresses[9] ] }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      shippingAddresses: [
        addresses[3],
        addresses[6],
        addresses[8],
        addresses[9],
      ]
    });

    // insert: at inserts at specific position:
    updated = await crud.updateNode('User', janeUserId, {
      shippingAddresses: {
        insert: addresses[7],
        at: 2
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      shippingAddresses: [
        addresses[3],
        addresses[6],
        addresses[7],
        addresses[8],
        addresses[9],
      ]
    });
    updated = await crud.updateNode('User', janeUserId, {
      shippingAddresses: {
        insert: [ addresses[4], addresses[5] ],
        at: 1,
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      shippingAddresses: [
        addresses[3],
        addresses[4],
        addresses[5],
        addresses[6],
        addresses[7],
        addresses[8],
        addresses[9],
      ]
    });

    // insert: ascending: true maintains the order
    updated = await crud.updateNode('User', janeUserId, {
      shippingAddresses: {
        insert: [ addresses[2], addresses[1] ],
        ascending: 'street',
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      shippingAddresses: [
        addresses[1],
        addresses[2],
        addresses[3],
        addresses[4],
        addresses[5],
        addresses[6],
        addresses[7],
        addresses[8],
        addresses[9],
      ]
    });

    // insert: keepFirst: maintains the invariant
    updated = await crud.updateNode('User', janeUserId, {
      shippingAddresses: {
        insert: [ addresses[0] ],
        ascending: 'street',
        keepFirst: 4,
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      shippingAddresses: [
        addresses[0],
        addresses[1],
        addresses[2],
        addresses[3],
      ]
    });

    // insert: keepLast: maintains the invariant
    updated = await crud.updateNode('User', janeUserId, {
      shippingAddresses: {
        insert: [ addresses[4] ],
        ascending: 'street',
        keepLast: 3,
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      shippingAddresses: [
        addresses[2],
        addresses[3],
        addresses[4],
      ]
    });

    // insert: descending: true: maintains the order
    updated = await crud.updateNode('User', janeUserId, {
      shippingAddresses: {
        insert: [ addresses[0], addresses[1], addresses[5], addresses[6] ],
        descending: 'street',
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      shippingAddresses: [
        addresses[6],
        addresses[5],
        addresses[4],
        addresses[3],
        addresses[2],
        addresses[1],
        addresses[0],
      ]
    });

    // insert: ascending: restores the order
    updated = await crud.updateNode('User', janeUserId, {
      shippingAddresses: {
        insert: [ addresses[9], addresses[8], addresses[7] ],
        ascending: 'street',
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      shippingAddresses: [
        addresses[0],
        addresses[1],
        addresses[2],
        addresses[3],
        addresses[4],
        addresses[5],
        addresses[6],
        addresses[7],
        addresses[8],
        addresses[9],
      ]
    });

    // delete: deletes the specific objects
    updated = await crud.updateNode('User', janeUserId, {
      shippingAddresses: {
        delete: [ addresses[3], addresses[5], addresses[7] ],
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      shippingAddresses: [
        addresses[0],
        addresses[1],
        addresses[2],
        addresses[4],
        addresses[6],
        addresses[8],
        addresses[9],
      ]
    });

    // delete: delete one object
    updated = await crud.updateNode('User', janeUserId, {
      shippingAddresses: {
        delete: [ addresses[9] ],
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      shippingAddresses: [
        addresses[0],
        addresses[1],
        addresses[2],
        addresses[4],
        addresses[6],
        addresses[8],
      ]
    });

    // delete: delete with scalar expression
    updated = await crud.updateNode('User', janeUserId, {
      shippingAddresses: {
        delete: { street: { lte: addresses[2].street }},
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      shippingAddresses: [
        addresses[4],
        addresses[6],
        addresses[8],
      ]
    });
    updated = await crud.updateNode('User', janeUserId, {
      shippingAddresses: {
        delete: {street: { gt: addresses[6].street } },
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      shippingAddresses: [
        addresses[4],
        addresses[6],
      ]
    });

    // delete: delete with scalar expression
    updated = await crud.updateNode('User', janeUserId, {
      shippingAddresses: {
        delete: { postal: { eq: [ addresses[4].postal, addresses[6].postal ]}},
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      shippingAddresses: [ ]
    });

    // insert: insert specific objects
    updated = await crud.updateNode('User', janeUserId, {
      shippingAddresses: {
        insert: [ addresses[3], addresses[2], addresses[1] ],
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      shippingAddresses: [
        addresses[3],
        addresses[2],
        addresses[1],
      ]
    });

    // pop: first
    updated = await crud.updateNode('User', janeUserId, {
      shippingAddresses: { pop: 'first' }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane, shippingAddresses: [ addresses[2], addresses[1] ] });

    // pop: last
    updated = await crud.updateNode('User', janeUserId, {
      shippingAddresses: { pop: 'last' }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane, shippingAddresses: [ addresses[2] ] });

    // clear: true
    updated = await crud.updateNode('User', janeUserId, {
      shippingAddresses: { clear: true }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal(jane);
  });


  it('updateNode: object field is updated correctly', async () => {
    let updated = await crud.updateNode('User', janeUserId, {
      billingAddress: {
        _type: 'Address',
        street: '1 Meldio Way',
        city: 'Menlo Park',
        state: 'CA',
        postal: '00001',
      }
    });
    expect(updated).to.be.true;
    let updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      billingAddress: {
        _type: 'Address',
        street: '1 Meldio Way',
        city: 'Menlo Park',
        state: 'CA',
        postal: '00001',
      }
    });

    updated = await crud.updateNode('User', janeUserId, {
      location: {
        _type: 'Gps',
        lat: 1.1,
        lon: 2.2,
      }
    });
    expect(updated).to.be.true;
    updatedJane = await crud.getNode('User', janeUserId);
    expect(updatedJane).to.deep.equal({
      ...jane,
      billingAddress: {
        _type: 'Address',
        street: '1 Meldio Way',
        city: 'Menlo Park',
        state: 'CA',
        postal: '00001',
      },
      location: {
        _type: 'Gps',
        lat: 1.1,
        lon: 2.2,
      }
    });

    let users = await crud.listNodes('User', {
      location: { type: 'Gps'}
    });
    expect(users).to.have.length(1);
    expect(users[0].id).to.equal(janeUserId);

    users = await crud.listNodes('User', {
      location: { type: [ 'Gps', 'Address' ]}
    });
    expect(users).to.have.length(1);
    expect(users[0].id).to.equal(janeUserId);
  });

  it('NodeConnection crud ops work as expected', async () => {
    const widgets = [
      { id: newGlobalId('Widget'), name: 'W1', cost: 100.1 },
      { id: newGlobalId('Widget'), name: 'W2', cost: 200.2 },
      { id: newGlobalId('Widget'), name: 'W3', cost: 300.3 },
      { id: newGlobalId('Widget'), name: 'W4', cost: 400.4 },
      { id: newGlobalId('Widget'), name: 'W5', cost: 500.5 },
      { id: newGlobalId('Widget'), name: 'W6', cost: 600.6 },
      { id: newGlobalId('Widget'), name: 'W7', cost: 700.7 },
      { id: newGlobalId('Widget'), name: 'W8', cost: 800.8 },
      { id: newGlobalId('Widget'), name: 'W9', cost: 900.9 },
    ];
    const gizmos = [
      { id: newGlobalId('Gizmo'), name: 'G1', cost: 1000.1 },
      { id: newGlobalId('Gizmo'), name: 'G2', cost: 2000.2 },
      { id: newGlobalId('Gizmo'), name: 'G3', cost: 3000.3 },
      { id: newGlobalId('Gizmo'), name: 'G4', cost: 4000.4 },
      { id: newGlobalId('Gizmo'), name: 'G5', cost: 5000.5 },
      { id: newGlobalId('Gizmo'), name: 'G6', cost: 6000.6 },
      { id: newGlobalId('Gizmo'), name: 'G7', cost: 7000.7 },
      { id: newGlobalId('Gizmo'), name: 'G8', cost: 8000.8 },
      { id: newGlobalId('Gizmo'), name: 'G9', cost: 9000.9 },
    ];
    const stuff = [ ...widgets, ...gizmos ];
    const props = Array.apply(null, { length: stuff.length })
      .map( (_, i) => ({ quantity: (i + 1) * 10 }) );
    const addResults = await Promise.all([
      ...widgets.map(w => crud.addNode('Widget', w)),
      ...gizmos.map(g => crud.addNode('Gizmo', g)),
    ]);
    expect(addResults).to.have.length(widgets.length + gizmos.length);
    addResults.forEach(result => expect(result).to.be.true);

    // addEdge:
    const edgeAddResults = await Promise.all(
      stuff.map((s, i) =>
        crud.NodeConnection.addEdge(
          newGlobalId('_Edge'),
          janeUserId,
          'stuff',
          s.id,
          'users',
          props[i])));
    expect(edgeAddResults).to.have.length(stuff.length);
    edgeAddResults.forEach(result => expect(result).to.be.true);

    // existsEdge:
    const existsResults = await Promise.all(
      stuff.map(s =>
        crud.NodeConnection.existsEdge(s.id, 'users', janeUserId, 'stuff')));
    expect(existsResults).to.have.length(stuff.length);
    existsResults.forEach(result => expect(result).to.be.true);

    const nonExistent = await Promise.all([
      crud.NodeConnection.existsEdge(
        newGlobalId('Widget'), 'users', janeUserId, 'stuff'),
      crud.NodeConnection.existsEdge(
        newGlobalId('Gizmo'), 'users', janeUserId, 'stuff'),
      crud.NodeConnection.existsEdge(
        widgets[0].id, 'users', newGlobalId('User'), 'stuff') ]);
    expect(nonExistent).to.have.length(3);
    nonExistent.forEach(result => expect(result).to.be.false);

    // getEdge:
    const retrievedEdges = await Promise.all(
      stuff.map(s =>
        crud.NodeConnection.getEdge(janeUserId, 'stuff', s.id, 'users')));
    expect(retrievedEdges).to.have.length(stuff.length);
    retrievedEdges.forEach((edge, i) => expect(edge).to.deep.equal({
      ...props[i],
      node: stuff[i],
    }));

    // listRelatedNodeIds:
    let relatedStuffIds = await crud.NodeConnection
      .listRelatedNodeIds(janeUserId, 'stuff');
    expect(relatedStuffIds).to.have.length(stuff.length);
    relatedStuffIds.forEach(id => expect(stuff.map(s => s.id)).to.include(id));

    const relatedUserIds = await crud.NodeConnection
      .listRelatedNodeIds(stuff[0].id, 'users');
    expect(relatedUserIds).to.have.length(1);
    expect(relatedUserIds).to.include(janeUserId);

    const delId = gizmos[8].id;
    const isEdgeUpdated = await crud.NodeConnection
      .updateEdge(janeUserId, 'stuff', delId, 'users', 'Stuff', 'Props', {
        quantity: { mul: 10 }
      });
    expect(isEdgeUpdated).to.be.true;
    const updatedEdge = await crud.NodeConnection
      .getEdge(janeUserId, 'stuff', delId, 'users');
    expect(updatedEdge).to.deep.equal({
      quantity: 1800,
      node: gizmos[8],
    });

    const isDeleted = await crud.NodeConnection
      .deleteEdge(janeUserId, 'stuff', delId, 'users');
    expect(isDeleted).to.be.true;

    relatedStuffIds = await crud.NodeConnection
      .listRelatedNodeIds(janeUserId, 'stuff');
    expect(relatedStuffIds).to.have.length(stuff.length - 1);
    relatedStuffIds.forEach(id => expect(stuff.map(s => s.id)).to.include(id));
    expect(relatedStuffIds).to.not.include(delId);

    // listEdges:
    const stuffEdges = stuff.map( (s, i) => ({ ...props[i], node: s }) );
    const widgetEdges = stuff.map( (s, i) => ({ ...props[i], node: s }) );

    const retrievedWidgetEdges = await crud.NodeConnection
      .listEdges(janeUserId, 'stuff', 'Stuff', 'Props', {
        node: { type: 'Widget' }
      });
    expect(retrievedWidgetEdges).to.have.length(widgets.length);
    retrievedWidgetEdges.forEach(edge =>
      expect(widgetEdges).to.deep.include(edge));

    const allEdges = await crud.NodeConnection
      .listEdges(janeUserId, 'stuff', 'Stuff', 'Props', {
        node: { type: [ 'Widget', 'Gizmo' ] }
      });
    expect(allEdges).to.have.length(stuff.length - 1);
    allEdges.forEach(edge => expect(stuffEdges).to.deep.include(edge));

    // updateEdges:
    const widgetIds = widgets.map(w => w.id);
    const gizmoIds = gizmos.map(g => g.id);

    const wUpdateResult = await crud.NodeConnection
      .updateEdges(janeUserId, 'stuff', 'Stuff', 'Props',
        { node: {type: 'Widget'} },
        { quantity: { div: 10 } });
    expect(wUpdateResult).to.have.length(widgets.length);
    wUpdateResult.forEach(id => expect(widgetIds).to.include(id));

    const wUpdatedEdges = await crud.NodeConnection
      .listEdges(janeUserId, 'stuff', 'Stuff', 'Props', wUpdateResult);
    expect(wUpdatedEdges).to.have.length(widgets.length);
    widgets.forEach((w, i) => expect(wUpdatedEdges).to.deep.include({
      quantity: props[i].quantity / 10,
      node: w
    }));

    const gUpdateResult = await crud.NodeConnection
      .updateEdges(janeUserId, 'stuff', 'Stuff', 'Props',
        gizmoIds.slice(0, -1),
        { quantity: { mul: 10 } });
    expect(gUpdateResult).to.have.length(gizmos.length - 1);
    gUpdateResult.forEach(id => expect(gizmoIds).to.include(id));

    const gUpdatedEdges = await crud.NodeConnection
      .listEdges(janeUserId, 'stuff', 'Stuff', 'Props', gUpdateResult);
    expect(gUpdatedEdges).to.have.length(gizmos.length - 1);
    gizmos
      .slice(0, -1)
      .forEach((g, i) =>
        expect(gUpdatedEdges).to.deep.include({
          quantity: props[i + widgets.length].quantity * 10,
          node: g
        }));

    const deletedWidgetIds = await crud.NodeConnection
      .deleteEdges(janeUserId, 'stuff', 'Stuff', 'Props',
        { node: { type: 'Widget' } });
    expect(deletedWidgetIds).to.have.length(widgets.length);
    deletedWidgetIds.forEach(id => expect(widgetIds).to.include(id));

    const deletedGizmoIds = await crud.NodeConnection
      .deleteEdges(janeUserId, 'stuff', 'Stuff', 'Props',
        gizmoIds.slice(0, -1));
    expect(deletedGizmoIds).to.have.length(gizmos.length - 1);
    expect(deletedGizmoIds).to.deep.equal(gizmoIds.slice(0, -1));

    const noEdges = await crud.NodeConnection
      .listEdges(janeUserId, 'stuff', 'Stuff', 'Props', { });
    expect(noEdges).to.have.length(0);
  });
});
