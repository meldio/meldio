import { expect } from 'chai';
import { describe, it } from 'mocha';
import { generate } from '../generate';
import {
  parse,
  analyzeAST,
  validate,
  transformAST,
} from '../..';
import * as resolvers from '../../../resolvers/mongodb';

const schemaDefinition = `
  type Address {
    street: String
    city: String
    postal: String
  }

  interface Named {
    name: String!
  }

  type Foo implements Node, Named @rootConnection(field: "allFoos") {
    id: ID!
    name: String! @rootPluralId(field: "fooByName")
    amount: Int
    primaryAddress: Address
    otherAddresses: ObjectConnection(Address)
    owner: User
    users: NodeConnection(User, foos)
    readings: ScalarConnection(Float)
  }

  type Bar implements Node, Named @rootConnection(field: "allBars") {
    id: ID!
    name: String! @rootPluralId(field: "barByName")
    cost: Float
    addresses: [Address]
    users: [User]
    readings: [Float]
  }

  type User implements Node @rootViewer(field: "viewer") {
    id: ID!
    emails: [String!]
    foos: NodeConnection(Foo, users)
  }

  union Bag = Foo | Bar

  mutation addUser(email: String) {
    user: User
  }
`;

const ast = parse(schemaDefinition);
const schema = analyzeAST(ast);
const validationResult = validate(schema);
// const mutation = {
//   name: 'test',
//   clientMutationId: 'a',
//   globalIds: [ ]
// };

describe('schema / generate', () => {
  it('test schema definition is valid', () => {
    expect(validationResult).to.have.length(0);
  });

  const transformedAST = transformAST(ast, schema);

  it('throws if transformedAST is not passed', () => {
    expect(generate)
      .to.throw(Error, /must pass transformedAST, schema and resolvers/);
  });

  it('throws if schema is not passed', () => {
    expect(generate.bind(null, { }))
      .to.throw(Error, /must pass transformedAST, schema and resolvers/);
  });

  it('throws if resolvers are not passed', () => {
    expect(generate.bind(null, { }, { }))
      .to.throw(Error, /must pass transformedAST, schema and resolvers/);
  });

  /* eslint no-unused-expressions: 0 */
  it('test schema definition is valid', () => {
    const result = generate(transformedAST, schema, resolvers);
    expect(result).to.not.be.null;
    expect(result._typeMap).to.not.be.null;
    expect(result._typeMap._Query).to.not.be.null;

    const typeMap = result._typeMap;
    // node field:
    expect(typeMap._Query._fields['node'].resolve).to.be.a('function');
    // implicit root plural id fields:
    expect(typeMap._Query._fields['named'].resolve).to.be.a('function');
    expect(typeMap._Query._fields['foo'].resolve).to.be.a('function');
    expect(typeMap._Query._fields['bar'].resolve).to.be.a('function');
    expect(typeMap._Query._fields['user'].resolve).to.be.a('function');
    expect(typeMap._Query._fields['bag'].resolve).to.be.a('function');
    // explicit plural id fields:
    expect(typeMap._Query._fields['fooByName'].resolve).to.be.a('function');
    expect(typeMap._Query._fields['barByName'].resolve).to.be.a('function');
    // root connections:
    expect(typeMap._Query._fields['allFoos'].resolve).to.be.a('function');
    expect(typeMap._Query._fields['allBars'].resolve).to.be.a('function');

    // union type resolvers:
    expect(typeMap.Bag.resolveType).to.be.a('function');
    expect(typeMap.Bag._typeConfig.resolveType).to.be.a('function');

    // interface type resolvers:
    expect(typeMap.Named.resolveType).to.be.a('function');
    expect(typeMap.Node.resolveType).to.be.a('function');

    // isTypeOf resolvers on each type:
    expect(typeMap.Address.isTypeOf).to.be.a('function');
    expect(typeMap.Foo.isTypeOf).to.be.a('function');
    expect(typeMap.Bar.isTypeOf).to.be.a('function');
    expect(typeMap.User.isTypeOf).to.be.a('function');

    // resolver for id fields on nodes:
    expect(typeMap.Foo._fields.id.resolve).to.be.a('function');
    expect(typeMap.Bar._fields.id.resolve).to.be.a('function');
    expect(typeMap.User._fields.id.resolve).to.be.a('function');

    // resolvers for node connection fields:
    expect(typeMap.Foo._fields.users.resolve).to.be.a('function');
    expect(typeMap.User._fields.foos.resolve).to.be.a('function');
    // object connection fields:
    expect(typeMap.Foo._fields.otherAddresses.resolve).to.be.a('function');
    // scalar connections:
    expect(typeMap.Foo._fields.readings.resolve).to.be.a('function');
    // node fields:
    expect(typeMap.Foo._fields.owner.resolve).to.be.a('function');
    // node list:
    expect(typeMap.Bar._fields.users.resolve).to.be.a('function');
    // object list:
    expect(typeMap.Bar._fields.addresses.resolve).to.be.a('function');
    // scalar list:
    expect(typeMap.Bar._fields.readings.resolve).to.be.a('function');
    expect(typeMap.User._fields.emails.resolve).to.be.a('function');
    // connection aggregation fields:
    expect(typeMap.AddressConnection._fields.count.resolve).to.be.a('function');
    expect(typeMap.UserConnection._fields.count.resolve).to.be.a('function');
    expect(typeMap.FloatConnection._fields.count.resolve).to.be.a('function');
    expect(typeMap.FloatConnection._fields.sum.resolve).to.be.a('function');
    expect(typeMap.FloatConnection._fields.average.resolve).to.be.a('function');
    expect(typeMap.FloatConnection._fields.min.resolve).to.be.a('function');
    expect(typeMap.FloatConnection._fields.max.resolve).to.be.a('function');
    expect(typeMap.FooConnection._fields.count.resolve).to.be.a('function');
    expect(typeMap.FooConnection._fields.sum.resolve).to.be.a('function');
    expect(typeMap.FooConnection._fields.average.resolve).to.be.a('function');
    expect(typeMap.FooConnection._fields.min.resolve).to.be.a('function');
    expect(typeMap.FooConnection._fields.max.resolve).to.be.a('function');
    expect(typeMap.BarConnection._fields.count.resolve).to.be.a('function');
    expect(typeMap.BarConnection._fields.sum.resolve).to.be.a('function');
    expect(typeMap.BarConnection._fields.average.resolve).to.be.a('function');
    expect(typeMap.BarConnection._fields.min.resolve).to.be.a('function');
    expect(typeMap.BarConnection._fields.max.resolve).to.be.a('function');
    // mutations
    expect(typeMap._Mutations._fields.addUser.resolve).to.be.a('function');
    // root viewer resolver:
    expect(typeMap._Query._fields.viewer.resolve).to.be.a('function');
  });
});
