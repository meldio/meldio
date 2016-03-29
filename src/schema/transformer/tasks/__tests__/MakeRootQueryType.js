import { expect } from 'chai';
import { describe, it } from 'mocha';
import { runTest, stripMargin } from '../../__tests__/setup';
import { getConnectionName } from '../../../analyzer';

describe('AST Transformer / MakeRootQueryType: ', () => {
  it('Creates root query type', () => {
    const result = runTest(` type Foo implements Node { id: ID! } `);

    expect(result).to.contain(stripMargin`
      |type _Query {
      |  node(id: ID!): Node
      |  foo(id: [ID!]!): [Foo]!
      |}`);
  });

  it('Creates root query fields for each interface and union that are Node',
  () => {
    const result = runTest(`
      enum Enum { ONE, TWO }
      interface Interface {
        id: ID!
        name: String
        age: Int
      }
      type Foo implements Interface {
        id: ID!
        name: String
        age: Int
      }
      type Bar implements Interface {
        id: ID!
        name: String
        age: Int
        bar: Enum
      }
      union U1 = Foo | Bar
      interface Named {
        name: String
      }
      type Baz implements Node, Named {
        id: ID!
        name: String
        age: Int
      }
      type Zaz implements Node, Named {
        id: ID!
        name: String
        age: Int
        zaz: Enum
      }
      union U2 = Baz | Zaz
    `);

    expect(result).to.contain(stripMargin`
      |type _Query {
      |  node(id: ID!): Node
      |  baz(id: [ID!]!): [Baz]!
      |  zaz(id: [ID!]!): [Zaz]!
      |  named(id: [ID!]!): [Named]!
      |  u2(id: [ID!]!): [U2]!
      |}`);
  });

  it('Creates root query fields with @rootConnection and @rootPluralId', () => {
    const result = runTest(`
      interface Named {
        name: String!
      }

      type Foo implements Node, Named @rootConnection(field: "allFoos") {
        id: ID!
        name: String! @rootPluralId(field: "fooByName")
      }

      union Union = Foo
    `);

    expect(result).to.contain(stripMargin`
      |type _Query {
      |  node(id: ID!): Node
      |  foo(id: [ID!]!): [Foo]!
      |  named(id: [ID!]!): [Named]!
      |  union(id: [ID!]!): [Union]!
      |  fooByName(name: [String!]!): [Foo]!
      |  allFoos(first: Int,
               ~ last: Int,
               ~ after: String,
               ~ before: String,
               ~ filterBy: _Foo__EdgeFilter,
               ~ orderBy: [_Foo__EdgeOrder!]): ${getConnectionName('Foo')}
      |}`);
  });

  it('Creates viewer field when @rootViewer is specified', () => {
    const result = runTest(`
      interface Named {
        name: String!
      }

      type Foo implements Node, Named @rootConnection(field: "allFoos") {
        id: ID!
        name: String! @rootPluralId(field: "fooByName")
      }

      union Union = Foo

      type User implements Node @rootViewer(field: "myViewer") {
        id: ID!
      }
    `);

    expect(result).to.contain(stripMargin`
      |type _Query {
      |  node(id: ID!): Node
      |  myViewer: User
      |  foo(id: [ID!]!): [Foo]!
      |  user(id: [ID!]!): [User]!
      |  named(id: [ID!]!): [Named]!
      |  union(id: [ID!]!): [Union]!
      |  fooByName(name: [String!]!): [Foo]!
      |  allFoos(first: Int,
               ~ last: Int,
               ~ after: String,
               ~ before: String,
               ~ filterBy: _Foo__EdgeFilter,
               ~ orderBy: [_Foo__EdgeOrder!]): ${getConnectionName('Foo')}
      |}`);
  });

  it('Creates rootConnection with filter and order when specified', () => {
    const result = runTest(`
      filter on NodeConnection(Foo) {
        NAME: (name: String) { node: { name: { eq: $name }}}
        ID: (id: ID) { node: { id: { eq: $id }}}
      }
      order on NodeConnection(Foo) {
        NAME: [{ node: { name: ASCENDING }}]
        ID: [{ node: { id: ASCENDING }}]
      }
      type Foo implements Node @rootConnection(field: "allFoos") {
        id: ID!
        name: String!
      }
    `);

    expect(result).to.contain(stripMargin`
      |type _Query {
      |  node(id: ID!): Node
      |  foo(id: [ID!]!): [Foo]!
      |  allFoos(first: Int,
               ~ last: Int,
               ~ after: String,
               ~ before: String,
               ~ filterBy: _Foo__EdgeFilter,
               ~ filter: _Foo__ConnectionFilterKeys,
               ~ name: String,
               ~ id: ID,
               ~ orderBy: [_Foo__EdgeOrder!],
               ~ order: _Foo__ConnectionOrderKeys): ${getConnectionName('Foo')}
      |}`);

  });
});
