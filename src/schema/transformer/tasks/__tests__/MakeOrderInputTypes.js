import { expect } from 'chai';
import { describe, it } from 'mocha';
import { runTest, stripMargin } from '../../__tests__/setup';

describe('AST Transformer / MakeOrderInputTypes: ', () => {
  it('Creates orders for Node connection without an edge', () => {
    const result = runTest(`
      type Details {
        someDetails: String
      }
      type RelatedType implements Node {
        id: ID!
        name: String
        age: Int
        details: Details
        test: NodeConnection(Test, relatedType)
      }
      interface Test {
        model: String
        manufacturers: [String!]!
        relatedType: NodeConnection(RelatedType, test)
      }
      type TestCase implements Node, Test {
        id: ID!
        model: String
        manufacturers: [String!]!
        relatedType: NodeConnection(RelatedType, test)
      }
    `);

    expect(result)
      .to.contain(stripMargin`
        |input _RelatedType__EdgeOrder {
        |  node: _RelatedType_Order
        |}`).and
      .to.contain(stripMargin`
        |input _RelatedType_Order {
        |  id: _Order
        |  name: _Order
        |  age: _Order
        |}`).and
      .to.contain(stripMargin`
        |input _Test__EdgeOrder {
        |  node: _Test_Order
        |}`).and
      .to.contain(stripMargin`
        |input _Test_Order {
        |  id: _Order
        |  model: _Order
        |}`);
  });

  it('Creates orders for Node connection to union', () => {
    const result = runTest(`
      type RelatedType1 implements Node {
        id: ID!
        name: String
        age: Int
        test: NodeConnection(Test, relatedType)
      }
      type RelatedType2 implements Node {
        id: ID!
        foo: String
        bar: Int
        test: NodeConnection(Test, relatedType)
      }
      union RelatedUnion = RelatedType1 | RelatedType2
      interface Test {
        model: String
        manufacturers: [String!]!
        relatedType: NodeConnection(RelatedUnion, test)
      }
      type TestCase implements Node, Test {
        id: ID!
        model: String
        manufacturers: [String!]!
        relatedType: NodeConnection(RelatedUnion, test)
      }
    `);

    expect(result)
      .to.contain(stripMargin`
        |input _RelatedUnion__EdgeOrder {
        |  node: _RelatedUnion_Order
        |}`).and
      .to.contain(stripMargin`
        |input _RelatedUnion_Order {
        |  id: _Order
        |}`).and
      .to.contain(stripMargin`
        |input _Test__EdgeOrder {
        |  node: _Test_Order
        |}`).and
      .to.contain(stripMargin`
        |input _Test_Order {
        |  id: _Order
        |  model: _Order
        |}`);
  });

  it('Creates orders for Node connection with an edge', () => {
    const result = runTest(`
      type AnotherObject {
        anotherProp: Int
      }
      type EdgeProps {
        str: String
        strReq: String!
        int: Int
        intReq: Int!
        float: Float
        floatReq: Float!
        strList: [String]
        strListReq: [String]!
        strReqListReq: [String!]!
        obj: AnotherObject
        objList: [AnotherObject]
        nodeList: [Node]
        nodeRef: Node
      }
      type Details {
        someDetails: String
      }
      type RelatedType implements Node {
        id: ID!
        name: String
        age: Int
        details: Details
        test: NodeConnection(Test, relatedType, EdgeProps)
      }
      interface Test {
        model: String
        manufacturers: [String!]!
        relatedType: NodeConnection(RelatedType, test, EdgeProps)
      }
      type TestCase implements Node, Test {
        id: ID!
        model: String
        manufacturers: [String!]!
        relatedType: NodeConnection(RelatedType, test, EdgeProps)
      }
    `);

    expect(result)
      .to.contain(stripMargin`
        |input _RelatedType_EdgeProps_EdgeOrder {
        |  str: _Order
        |  strReq: _Order
        |  int: _Order
        |  intReq: _Order
        |  float: _Order
        |  floatReq: _Order
        |  node: _RelatedType_Order
        |}`).and
      .to.contain(stripMargin`
        |input _RelatedType_Order {
        |  id: _Order
        |  name: _Order
        |  age: _Order
        |}`).and
      .to.contain(stripMargin`
        |input _Test_EdgeProps_EdgeOrder {
        |  str: _Order
        |  strReq: _Order
        |  int: _Order
        |  intReq: _Order
        |  float: _Order
        |  floatReq: _Order
        |  node: _Test_Order
        |}`).and
      .to.contain(stripMargin`
        |input _Test_Order {
        |  id: _Order
        |  model: _Order
        |}`);
  });

  it('Creates orders for Object connection with an edge', () => {
    const result = runTest(`
      type AnotherObject {
        anotherProp: Int
      }
      type EdgeProps {
        str: String
        strReq: String!
        int: Int
        intReq: Int!
        float: Float
        floatReq: Float!
        strList: [String]
        strListReq: [String]!
        strReqListReq: [String!]!
        obj: AnotherObject
        objList: [AnotherObject]
        nodeList: [Node]
        nodeRef: Node
      }
      type Details {
        model: String
        manufacturers: [String!]!
      }
      interface Test {
        relatedType: ObjectConnection(Details, EdgeProps)
      }
      type TestCase implements Node, Test {
        id: ID!
        relatedType: ObjectConnection(Details, EdgeProps)
      }
    `);

    expect(result)
      .to.contain(stripMargin`
        |input _Details_EdgeProps_EdgeOrder {
        |  str: _Order
        |  strReq: _Order
        |  int: _Order
        |  intReq: _Order
        |  float: _Order
        |  floatReq: _Order
        |  node: _Details_Order
        |}`).and
      .to.contain(stripMargin`
        |input _Details_Order {
        |  model: _Order
        |}`);
  });

  it('Creates orders for Scalar connection with an edge', () => {
    const result = runTest(`
      type AnotherObject {
        anotherProp: Int
      }
      type EdgeProps {
        str: String
        strReq: String!
        int: Int
        intReq: Int!
        float: Float
        floatReq: Float!
        strList: [String]
        strListReq: [String]!
        strReqListReq: [String!]!
        obj: AnotherObject
        objList: [AnotherObject]
        nodeList: [Node]
        nodeRef: Node
      }
      interface Test {
        relatedType: ScalarConnection(Int, EdgeProps)
      }
      type TestCase implements Node, Test {
        id: ID!
        relatedType: ScalarConnection(Int, EdgeProps)
      }
    `);

    expect(result)
      .to.contain(stripMargin`
        |input _Int_EdgeProps_EdgeOrder {
        |  str: _Order
        |  strReq: _Order
        |  int: _Order
        |  intReq: _Order
        |  float: _Order
        |  floatReq: _Order
        |  node: _Order
        |}`);
  });

  it('Creates orders for Object list', () => {
    const result = runTest(`
      type Orderable {
        name: String
        age: Int
        weight: Float
        strList: [String]
      }
      interface Test {
        list: [Orderable]
      }
      type TestCase implements Node, Test {
        id: ID!
        list: [Orderable]
      }
    `);

    expect(result).to.contain(stripMargin`
        |input _Orderable_Order {
        |  name: _Order
        |  age: _Order
        |  weight: _Order
        |}`);
  });

  it('Creates order for Node list', () => {
    const result = runTest(`
      type Item implements Node {
        id: ID!
        name: String
        age: Int
        weight: Float
        strList: [String]
      }
      interface Test {
        list: [Item]
      }
      type TestCase implements Node, Test {
        id: ID!
        list: [Item]
      }
    `);

    expect(result).to.contain(stripMargin`
        |input _Item_Order {
        |  id: _Order
        |  name: _Order
        |  age: _Order
        |  weight: _Order
        |}`);
  });
});
