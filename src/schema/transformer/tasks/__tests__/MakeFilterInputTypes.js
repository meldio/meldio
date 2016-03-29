import { expect } from 'chai';
import { describe, it } from 'mocha';
import { runTest, stripMargin } from '../../__tests__/setup';

describe('AST Transformer / MakeFilterInputTypes: ', () => {
  it('Creates filters for Node connection without an edge', () => {
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
        |input _RelatedType__EdgeFilter {
        |  node: _RelatedType_Filter
        |}`).and
      .to.contain(stripMargin`
        |input _RelatedType_Filter {
        |  exists: Boolean
        |  id: _ID_Filter
        |  name: _String_Filter
        |  age: _Int_Filter
        |  details: _Details_Filter
        |}`).and
      .to.contain(stripMargin`
        |input _Details_Filter {
        |  exists: Boolean
        |  someDetails: _String_Filter
        |}`).and
      .to.contain(stripMargin`
        |input _Test__EdgeFilter {
        |  node: _Test_Filter
        |}`).and
      .to.contain(stripMargin`
        |input _Test_Filter {
        |  exists: Boolean
        |  id: _ID_Filter
        |  type: _Test_Types_Filter
        |  model: _String_Filter
        |  manufacturers: _String_ListFilter
        |}`).and
      .to.contain(stripMargin`
        |input _Test_Types_Filter {
        |  eq: [_Test_Types!]
        |  ne: [_Test_Types!]
        |}`).and
      .to.contain(stripMargin`
        |input _String_ListFilter {
        |  exists: Boolean
        |  length: Int
        |  empty: Boolean
        |  some: _String_Filter
        |  every: _String_Filter
        |  none: _String_Filter
        |}`).and
      .to.contain(stripMargin`
        |enum _Test_Types {
        |  TestCase
        |}`);
  });

  it('Creates filters for Node connection to union', () => {
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
        |input _RelatedUnion__EdgeFilter {
        |  node: _RelatedUnion_Filter
        |}`).and
      .to.contain(stripMargin`
        |input _RelatedUnion_Filter {
        |  exists: Boolean
        |  id: _ID_Filter
        |  type: _RelatedUnion_Types_Filter
        |}`).and
      .to.contain(stripMargin`
        |input _RelatedUnion_Types_Filter {
        |  eq: [_RelatedUnion_Types!]
        |  ne: [_RelatedUnion_Types!]
        |}`).and
      .to.contain(stripMargin`
        |enum _RelatedUnion_Types {
        |  RelatedType1
        |  RelatedType2
        |}`).and
      .to.contain(stripMargin`
        |input _Test__EdgeFilter {
        |  node: _Test_Filter
        |}`).and
      .to.contain(stripMargin`
        |input _Test_Filter {
        |  exists: Boolean
        |  id: _ID_Filter
        |  type: _Test_Types_Filter
        |  model: _String_Filter
        |  manufacturers: _String_ListFilter
        |}`).and
      .to.contain(stripMargin`
        |input _Test_Types_Filter {
        |  eq: [_Test_Types!]
        |  ne: [_Test_Types!]
        |}`).and
      .to.contain(stripMargin`
        |input _String_ListFilter {
        |  exists: Boolean
        |  length: Int
        |  empty: Boolean
        |  some: _String_Filter
        |  every: _String_Filter
        |  none: _String_Filter
        |}`).and
      .to.contain(stripMargin`
        |enum _Test_Types {
        |  TestCase
        |}`);
  });

  it('Creates filters for Node connection with an edge', () => {
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
        |input _RelatedType_EdgeProps_EdgeFilter {
        |  str: _String_Filter
        |  strReq: _String_Filter
        |  int: _Int_Filter
        |  intReq: _Int_Filter
        |  float: _Float_Filter
        |  floatReq: _Float_Filter
        |  strList: _String_ListFilter
        |  strListReq: _String_ListFilter
        |  strReqListReq: _String_ListFilter
        |  obj: _AnotherObject_Filter
        |  objList: _AnotherObject_ListFilter
        |  nodeList: _ID_ListFilter
        |  nodeRef: _ID_Filter
        |  node: _RelatedType_Filter
        |}`).and
      .to.contain(stripMargin`
        |input _AnotherObject_Filter {
        |  exists: Boolean
        |  anotherProp: _Int_Filter
        |}`).and
      .to.contain(stripMargin`
        |input _AnotherObject_ListFilter {
        |  exists: Boolean
        |  length: Int
        |  empty: Boolean
        |  some: _AnotherObject_Filter
        |  every: _AnotherObject_Filter
        |  none: _AnotherObject_Filter
        |}`).and
      .to.contain(stripMargin`
        |input _RelatedType_Filter {
        |  exists: Boolean
        |  id: _ID_Filter
        |  name: _String_Filter
        |  age: _Int_Filter
        |  details: _Details_Filter
        |}`).and
      .to.contain(stripMargin`
        |input _Details_Filter {
        |  exists: Boolean
        |  someDetails: _String_Filter
        |}`).and
      .to.contain(stripMargin`
        |input _Test_EdgeProps_EdgeFilter {
        |  str: _String_Filter
        |  strReq: _String_Filter
        |  int: _Int_Filter
        |  intReq: _Int_Filter
        |  float: _Float_Filter
        |  floatReq: _Float_Filter
        |  strList: _String_ListFilter
        |  strListReq: _String_ListFilter
        |  strReqListReq: _String_ListFilter
        |  obj: _AnotherObject_Filter
        |  objList: _AnotherObject_ListFilter
        |  nodeList: _ID_ListFilter
        |  nodeRef: _ID_Filter
        |  node: _Test_Filter
        |}`).and
      .to.contain(stripMargin`
        |input _Test_Filter {
        |  exists: Boolean
        |  id: _ID_Filter
        |  type: _Test_Types_Filter
        |  model: _String_Filter
        |  manufacturers: _String_ListFilter
        |}`).and
      .to.contain(stripMargin`
        |input _Test_Types_Filter {
        |  eq: [_Test_Types!]
        |  ne: [_Test_Types!]
        |}`).and
      .to.contain(stripMargin`
        |input _String_ListFilter {
        |  exists: Boolean
        |  length: Int
        |  empty: Boolean
        |  some: _String_Filter
        |  every: _String_Filter
        |  none: _String_Filter
        |}`).and
      .to.contain(stripMargin`
        |input _ID_ListFilter {
        |  exists: Boolean
        |  length: Int
        |  empty: Boolean
        |  some: _ID_Filter
        |  every: _ID_Filter
        |  none: _ID_Filter
        |}`).and
      .to.contain(stripMargin`
        |enum _Test_Types {
        |  TestCase
        |}`);
  });

  it('Creates filters for Object connection with an edge', () => {
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
        |input _Details_EdgeProps_EdgeFilter {
        |  str: _String_Filter
        |  strReq: _String_Filter
        |  int: _Int_Filter
        |  intReq: _Int_Filter
        |  float: _Float_Filter
        |  floatReq: _Float_Filter
        |  strList: _String_ListFilter
        |  strListReq: _String_ListFilter
        |  strReqListReq: _String_ListFilter
        |  obj: _AnotherObject_Filter
        |  objList: _AnotherObject_ListFilter
        |  nodeList: _ID_ListFilter
        |  nodeRef: _ID_Filter
        |  node: _Details_Filter
        |}`).and
      .to.contain(stripMargin`
        |input _AnotherObject_Filter {
        |  exists: Boolean
        |  anotherProp: _Int_Filter
        |}`).and
      .to.contain(stripMargin`
        |input _AnotherObject_ListFilter {
        |  exists: Boolean
        |  length: Int
        |  empty: Boolean
        |  some: _AnotherObject_Filter
        |  every: _AnotherObject_Filter
        |  none: _AnotherObject_Filter
        |}`).and
      .to.contain(stripMargin`
        |input _Details_Filter {
        |  exists: Boolean
        |  model: _String_Filter
        |  manufacturers: _String_ListFilter
        |}`).and
      .to.contain(stripMargin`
        |input _String_ListFilter {
        |  exists: Boolean
        |  length: Int
        |  empty: Boolean
        |  some: _String_Filter
        |  every: _String_Filter
        |  none: _String_Filter
        |}`).and
      .to.contain(stripMargin`
        |input _ID_ListFilter {
        |  exists: Boolean
        |  length: Int
        |  empty: Boolean
        |  some: _ID_Filter
        |  every: _ID_Filter
        |  none: _ID_Filter
        |}`);
  });

  it('Creates filters for Scalar connection with an edge', () => {
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
        |input _Int_EdgeProps_EdgeFilter {
        |  str: _String_Filter
        |  strReq: _String_Filter
        |  int: _Int_Filter
        |  intReq: _Int_Filter
        |  float: _Float_Filter
        |  floatReq: _Float_Filter
        |  strList: _String_ListFilter
        |  strListReq: _String_ListFilter
        |  strReqListReq: _String_ListFilter
        |  obj: _AnotherObject_Filter
        |  objList: _AnotherObject_ListFilter
        |  nodeList: _ID_ListFilter
        |  nodeRef: _ID_Filter
        |  node: _Int_Filter
        |}`).and
      .to.contain(stripMargin`
        |input _AnotherObject_Filter {
        |  exists: Boolean
        |  anotherProp: _Int_Filter
        |}`).and
      .to.contain(stripMargin`
        |input _AnotherObject_ListFilter {
        |  exists: Boolean
        |  length: Int
        |  empty: Boolean
        |  some: _AnotherObject_Filter
        |  every: _AnotherObject_Filter
        |  none: _AnotherObject_Filter
        |}`).and
      .to.contain(stripMargin`
        |input _String_ListFilter {
        |  exists: Boolean
        |  length: Int
        |  empty: Boolean
        |  some: _String_Filter
        |  every: _String_Filter
        |  none: _String_Filter
        |}`).and
      .to.contain(stripMargin`
        |input _ID_ListFilter {
        |  exists: Boolean
        |  length: Int
        |  empty: Boolean
        |  some: _ID_Filter
        |  every: _ID_Filter
        |  none: _ID_Filter
        |}`);
  });

  it('Creates filter for Object list', () => {
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
        |input _Orderable_Filter {
        |  exists: Boolean
        |  name: _String_Filter
        |  age: _Int_Filter
        |  weight: _Float_Filter
        |  strList: _String_ListFilter
        |}`);
  });

  it('Creates filter for Node list', () => {
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
        |input _Item_Filter {
        |  exists: Boolean
        |  id: _ID_Filter
        |  name: _String_Filter
        |  age: _Int_Filter
        |  weight: _Float_Filter
        |  strList: _String_ListFilter
        |}`);
  });

});
