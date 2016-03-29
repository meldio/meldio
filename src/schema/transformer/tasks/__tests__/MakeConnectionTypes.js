import { expect } from 'chai';
import { describe, it } from 'mocha';
import { runTest, stripMargin } from '../../__tests__/setup';
import { getConnectionName, getEdgeName } from '../../../analyzer';

describe('AST Transformer / MakeConnectionTypes: ', () => {
  it('Creates Node connection without an edge', () => {
    const result = runTest(`
      type RelatedType implements Node {
        id: ID!
        test: NodeConnection(Test, relatedType)
      }
      interface Test {
        relatedType: NodeConnection(RelatedType, test)
      }
      type TestCase implements Node, Test {
        id: ID!
        relatedType: NodeConnection(RelatedType, test)
      }
    `);

    expect(result)
      .to.contain(stripMargin`
        |type ${getConnectionName('RelatedType')} {
        |  edges: [${getEdgeName('RelatedType')}]
        |  pageInfo: PageInfo!
        |  count(filterBy: _RelatedType__EdgeFilter): Int
        |}`).and
      .to.contain(stripMargin`
        |type ${getEdgeName('RelatedType')} {
        |  node: RelatedType
        |  cursor: String
        |}`).and
      .to.contain(stripMargin`
        |type ${getConnectionName('Test')} {
        |  edges: [${getEdgeName('Test')}]
        |  pageInfo: PageInfo!
        |  count(filterBy: _Test__EdgeFilter): Int
        |}`).and
      .to.contain(stripMargin`
        |type ${getEdgeName('Test')} {
        |  node: Test
        |  cursor: String
        |}`);
  });

  it('Creates Node connection with a simple edge', () => {
    const result = runTest(`
      type EdgeProps {
        foo: String
        bar: String
      }
      type RelatedType implements Node {
        id: ID!
        test: NodeConnection(Test, relatedType, EdgeProps)
      }
      interface Test {
        relatedType: NodeConnection(RelatedType, test, EdgeProps)
      }
      type TestCase implements Node, Test {
        id: ID!
        relatedType: NodeConnection(RelatedType, test, EdgeProps)
      }
    `);

    expect(result)
      .to.contain(stripMargin`
        |type ${getConnectionName('RelatedType', 'EdgeProps')} {
        |  edges: [${getEdgeName('RelatedType', 'EdgeProps')}]
        |  pageInfo: PageInfo!
        |  count(filterBy: _RelatedType_EdgeProps_EdgeFilter): Int
        |}`).and
      .to.contain(stripMargin`
        |type ${getEdgeName('RelatedType', 'EdgeProps')} {
        |  node: RelatedType
        |  cursor: String
        |  foo: String
        |  bar: String
        |}`).and
      .to.contain(stripMargin`
        |type ${getConnectionName('Test', 'EdgeProps')} {
        |  edges: [${getEdgeName('Test', 'EdgeProps')}]
        |  pageInfo: PageInfo!
        |  count(filterBy: _Test_EdgeProps_EdgeFilter): Int
        |}`).and
      .to.contain(stripMargin`
        |type ${getEdgeName('Test', 'EdgeProps')} {
        |  node: Test
        |  cursor: String
        |  foo: String
        |  bar: String
        |}`);
  });

  it('Creates Node connection with a complex edge', () => {
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
      }
      type RelatedType implements Node {
        id: ID!
        distance: Float
        test: NodeConnection(Test, relatedType, EdgeProps)
      }
      interface Test {
        depth: Int
        relatedType: NodeConnection(RelatedType, test, EdgeProps)
      }
      type TestCase implements Node, Test {
        id: ID!
        depth: Int
        relatedType: NodeConnection(RelatedType, test, EdgeProps)
      }
    `);

    expect(result)
      .to.contain(stripMargin`
        |type ${getConnectionName('RelatedType', 'EdgeProps')} {
        |  edges: [${getEdgeName('RelatedType', 'EdgeProps')}]
        |  pageInfo: PageInfo!
        |  count(filterBy: _RelatedType_EdgeProps_EdgeFilter): Int
        |  sum(edges: _EdgeProps_NumericFields,
             ~ node: _RelatedType_NumericFields): Float
        |  average(edges: _EdgeProps_NumericFields,
                 ~ node: _RelatedType_NumericFields): Float
        |  min(edges: _EdgeProps_NumericFields,
             ~ node: _RelatedType_NumericFields): Float
        |  max(edges: _EdgeProps_NumericFields,
             ~ node: _RelatedType_NumericFields): Float
        |}`).and
      .to.contain(stripMargin`
        |type ${getEdgeName('RelatedType', 'EdgeProps')} {
        |  node: RelatedType
        |  cursor: String
        |  str: String
        |  strReq: String!
        |  int: Int
        |  intReq: Int!
        |  float: Float
        |  floatReq: Float!
        |  strList: [String]
        |  strListReq: [String]!
        |  strReqListReq: [String!]!
        |  obj: AnotherObject
        |  objList: [AnotherObject]
        |}`).and
      .to.contain(stripMargin`
        |type ${getConnectionName('Test', 'EdgeProps')} {
        |  edges: [${getEdgeName('Test', 'EdgeProps')}]
        |  pageInfo: PageInfo!
        |  count(filterBy: _Test_EdgeProps_EdgeFilter): Int
        |  sum(edges: _EdgeProps_NumericFields,
             ~ node: _Test_NumericFields): Float
        |  average(edges: _EdgeProps_NumericFields,
                 ~ node: _Test_NumericFields): Float
        |  min(edges: _EdgeProps_NumericFields,
             ~ node: _Test_NumericFields): Float
        |  max(edges: _EdgeProps_NumericFields,
             ~ node: _Test_NumericFields): Float
        |}`).and
      .to.contain(stripMargin`
        |type ${getEdgeName('Test', 'EdgeProps')} {
        |  node: Test
        |  cursor: String
        |  str: String
        |  strReq: String!
        |  int: Int
        |  intReq: Int!
        |  float: Float
        |  floatReq: Float!
        |  strList: [String]
        |  strListReq: [String]!
        |  strReqListReq: [String!]!
        |  obj: AnotherObject
        |  objList: [AnotherObject]
        |}`);
  });

  it('Creates Object connection without an edge', () => {
    const result = runTest(`
      type RelatedType {
        foo: String
      }
      interface Test {
        relatedType: ObjectConnection(RelatedType)
      }
      type TestCase implements Node, Test {
        id: ID!
        relatedType: ObjectConnection(RelatedType)
      }
    `);

    expect(result)
      .to.contain(stripMargin`
        |type ${getConnectionName('RelatedType')} {
        |  edges: [${getEdgeName('RelatedType')}]
        |  pageInfo: PageInfo!
        |  count(filterBy: _RelatedType__EdgeFilter): Int
        |}`).and
      .to.contain(stripMargin`
        |type ${getEdgeName('RelatedType')} {
        |  node: RelatedType
        |  cursor: String
        |}`);
  });

  it('Creates Object connection with a complex edge', () => {
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
      }

      type RelatedType {
        foo: String
        distance: Int
      }
      interface Test {
        relatedType: ObjectConnection(RelatedType, EdgeProps)
      }
      type TestCase implements Node, Test {
        id: ID!
        relatedType: ObjectConnection(RelatedType, EdgeProps)
      }
    `);

    expect(result)
      .to.contain(stripMargin`
        |type ${getConnectionName('RelatedType', 'EdgeProps')} {
        |  edges: [${getEdgeName('RelatedType', 'EdgeProps')}]
        |  pageInfo: PageInfo!
        |  count(filterBy: _RelatedType_EdgeProps_EdgeFilter): Int
        |  sum(edges: _EdgeProps_NumericFields,
             ~ node: _RelatedType_NumericFields): Float
        |  average(edges: _EdgeProps_NumericFields,
                 ~ node: _RelatedType_NumericFields): Float
        |  min(edges: _EdgeProps_NumericFields,
             ~ node: _RelatedType_NumericFields): Float
        |  max(edges: _EdgeProps_NumericFields,
             ~ node: _RelatedType_NumericFields): Float
        |}`).and
      .to.contain(stripMargin`
        |type ${getEdgeName('RelatedType', 'EdgeProps')} {
        |  node: RelatedType
        |  cursor: String
        |  str: String
        |  strReq: String!
        |  int: Int
        |  intReq: Int!
        |  float: Float
        |  floatReq: Float!
        |  strList: [String]
        |  strListReq: [String]!
        |  strReqListReq: [String!]!
        |  obj: AnotherObject
        |  objList: [AnotherObject]
        |}`);
  });

  it('Creates Scalar connection without an edge', () => {
    const result = runTest(`
      enum MyEnum {
        ONE
        TWO
        THREE
      }
      interface Test {
        relatedType: ScalarConnection(MyEnum)
      }
      type TestCase implements Node, Test {
        id: ID!
        relatedType: ScalarConnection(MyEnum)
      }
    `);

    expect(result)
      .to.contain(stripMargin`
        |type ${getConnectionName('MyEnum')} {
        |  edges: [${getEdgeName('MyEnum')}]
        |  pageInfo: PageInfo!
        |  count(filterBy: _MyEnum__EdgeFilter): Int
        |}`).and
      .to.contain(stripMargin`
        |type ${getEdgeName('MyEnum')} {
        |  node: MyEnum
        |  cursor: String
        |}`);
  });

  it('Creates Scalar connection with a simple edge', () => {
    const result = runTest(`
      type EdgeProps { name: String }
      enum MyEnum {
        ONE
        TWO
        THREE
      }
      interface Test {
        relatedType: ScalarConnection(MyEnum, EdgeProps)
      }
      type TestCase implements Node, Test {
        id: ID!
        relatedType: ScalarConnection(MyEnum, EdgeProps)
      }
    `);

    expect(result)
      .to.contain(stripMargin`
        |type ${getConnectionName('MyEnum', 'EdgeProps')} {
        |  edges: [${getEdgeName('MyEnum', 'EdgeProps')}]
        |  pageInfo: PageInfo!
        |  count(filterBy: _MyEnum_EdgeProps_EdgeFilter): Int
        |}`).and
      .to.contain(stripMargin`
        |type ${getEdgeName('MyEnum', 'EdgeProps')} {
        |  node: MyEnum
        |  cursor: String
        |  name: String
        |}`);
  });

  it('Creates Scalar connection with a non-numeric scalar and a complex edge',
  () => {
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
      }
      enum MyEnum {
        ONE
        TWO
        THREE
      }
      interface Test {
        relatedType: ScalarConnection(MyEnum, EdgeProps)
      }
      type TestCase implements Node, Test {
        id: ID!
        relatedType: ScalarConnection(MyEnum, EdgeProps)
      }
    `);

    expect(result)
      .to.contain(stripMargin`
        |type ${getConnectionName('MyEnum', 'EdgeProps')} {
        |  edges: [${getEdgeName('MyEnum', 'EdgeProps')}]
        |  pageInfo: PageInfo!
        |  count(filterBy: _MyEnum_EdgeProps_EdgeFilter): Int
        |  sum(edges: _EdgeProps_NumericFields): Float
        |  average(edges: _EdgeProps_NumericFields): Float
        |  min(edges: _EdgeProps_NumericFields): Float
        |  max(edges: _EdgeProps_NumericFields): Float
        |}`).and
      .to.contain(stripMargin`
        |type ${getEdgeName('MyEnum', 'EdgeProps')} {
        |  node: MyEnum
        |  cursor: String
        |  str: String
        |  strReq: String!
        |  int: Int
        |  intReq: Int!
        |  float: Float
        |  floatReq: Float!
        |  strList: [String]
        |  strListReq: [String]!
        |  strReqListReq: [String!]!
        |  obj: AnotherObject
        |  objList: [AnotherObject]
        |}`);
  });

  it('Creates Scalar connection with a countable scalar and a complex edge',
  () => {
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
      }
      interface Test {
        relatedType: ScalarConnection(Float, EdgeProps)
      }
      type TestCase implements Node, Test {
        id: ID!
        relatedType: ScalarConnection(Float, EdgeProps)
      }
    `);

    expect(result)
      .to.contain(stripMargin`
        |type ${getConnectionName('Float', 'EdgeProps')} {
        |  edges: [${getEdgeName('Float', 'EdgeProps')}]
        |  pageInfo: PageInfo!
        |  count(filterBy: _Float_EdgeProps_EdgeFilter): Int
        |  sum(edges: _EdgeProps_NumericFields, node: _NodeValue): Float
        |  average(edges: _EdgeProps_NumericFields, node: _NodeValue): Float
        |  min(edges: _EdgeProps_NumericFields, node: _NodeValue): Float
        |  max(edges: _EdgeProps_NumericFields, node: _NodeValue): Float
        |}`).and
      .to.contain(stripMargin`
        |type ${getEdgeName('Float', 'EdgeProps')} {
        |  node: Float
        |  cursor: String
        |  str: String
        |  strReq: String!
        |  int: Int
        |  intReq: Int!
        |  float: Float
        |  floatReq: Float!
        |  strList: [String]
        |  strListReq: [String]!
        |  strReqListReq: [String!]!
        |  obj: AnotherObject
        |  objList: [AnotherObject]
        |}`);
  });

  it('Adds filter argument to count when filter is defined', () => {
    const result = runTest(`
      type RelatedType implements Node {
        id: ID!
        width: Int
        test: NodeConnection(TestCase, relatedType)
      }
      type TestCase implements Node {
        id: ID!
        depth: Int
        relatedType: NodeConnection(RelatedType, test)
      }

      filter on NodeConnection(RelatedType) {
        MIN_WIDTH: (minWidth: Int) { node: { width: {gte: $minWidth}}}
        MAX_WIDTH: (maxWidth: Int) { node: { width: {lte: $maxWidth}}}
        BETWEEN_WIDTHS: (minWidth: Int, maxWidth: Int) {
          node: {
            width: {
              gte: $minWidth,
              lte: $maxWidth
            }
          }
        }
      }
    `);

    expect(result)
      .to.contain(stripMargin`
        |type ${getConnectionName('RelatedType')} {
        |  edges: [${getEdgeName('RelatedType')}]
        |  pageInfo: PageInfo!
        |  count(filterBy: _RelatedType__EdgeFilter,
               ~ filter: _RelatedType__ConnectionFilterKeys,
               ~ minWidth: Int,
               ~ maxWidth: Int): Int
        |  sum(node: _RelatedType_NumericFields): Float
        |  average(node: _RelatedType_NumericFields): Float
        |  min(node: _RelatedType_NumericFields): Float
        |  max(node: _RelatedType_NumericFields): Float
        |}`);
  });
});
