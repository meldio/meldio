import { expect } from 'chai';
import { describe, it } from 'mocha';
import { runTest, stripMargin } from '../../../__tests__/setup';
import { getConnectionName } from '../../../../analyzer';

describe('AST Transformer / visitor / AddArgsToListsAndConnections: ', () => {
  it('Adds arguments to lists', () => {
    const result = runTest(`
      enum MyEnum { ONE TWO THREE }
      type Foo { foo: String }
      type NodeItem implements Node { id: ID! }

      interface TestInterface {
        str1: [String]
        str2: [String!]
        str3: [String]!
        str4: [String!]!
        int: [Int!]!
        float: [Float!]
        bool: [Boolean]!
        ids: [ID]
        enums: [MyEnum!]!
        objs: [Foo]
        nodes: [NodeItem]
      }

      type TestCase implements Node, TestInterface {
        id: ID!
        str1: [String]
        str2: [String!]
        str3: [String]!
        str4: [String!]!
        int: [Int!]!
        float: [Float!]
        bool: [Boolean]!
        ids: [ID]
        enums: [MyEnum!]!
        objs: [Foo]
        nodes: [NodeItem]
      }
    `);
    const expectedFieldDefs = stripMargin`
      |  str1(first: Int,
            ~ last: Int,
            ~ filterBy: _String_Filter,
            ~ orderBy: _Order): [String]
      |  str2(first: Int,
            ~ last: Int,
            ~ filterBy: _String_Filter,
            ~ orderBy: _Order): [String!]
      |  str3(first: Int,
            ~ last: Int,
            ~ filterBy: _String_Filter,
            ~ orderBy: _Order): [String]!
      |  str4(first: Int,
            ~ last: Int,
            ~ filterBy: _String_Filter,
            ~ orderBy: _Order): [String!]!
      |  int(first: Int,
            ~ last: Int,
            ~ filterBy: _Int_Filter,
            ~ orderBy: _Order,
            ~ aggregate: _NumericAggregate): [Int!]!
      |  float(first: Int,
            ~ last: Int,
            ~ filterBy: _Float_Filter,
            ~ orderBy: _Order,
            ~ aggregate: _NumericAggregate): [Float!]
      |  bool(first: Int,
            ~ last: Int,
            ~ filterBy: _Boolean_Filter,
            ~ orderBy: _Order): [Boolean]!
      |  ids(first: Int,
            ~ last: Int,
            ~ filterBy: _ID_Filter,
            ~ orderBy: _Order): [ID]
      |  enums(first: Int,
            ~ last: Int,
            ~ filterBy: _MyEnum_Filter,
            ~ orderBy: _Order): [MyEnum!]!
      |  objs(first: Int,
            ~ last: Int,
            ~ filterBy: _Foo_Filter,
            ~ orderBy: [_Foo_Order!]): [Foo]
      |  nodes(first: Int,
            ~ last: Int,
            ~ filterBy: _NodeItem_Filter,
            ~ orderBy: [_NodeItem_Order!]): [NodeItem]
      |`;

    expect(result).to.contain(`interface TestInterface {${expectedFieldDefs}}`);

    expect(result).to.contain(stripMargin`
      |type TestCase implements Node, TestInterface {
      |  id: ID!
      ~${expectedFieldDefs}}`);
  });

  it('Adds arguments to connections', () => {
    const result = runTest(`
      enum MyEnum { ONE TWO THREE }
      type EdgeProps { date: String }
      type Foo { foo: String }
      type RelatedType implements Node {
        id: ID!
        test1: NodeConnection(TestInterface, node1)
        test2: NodeConnection(TestInterface, node2, EdgeProps)
      }

      interface TestInterface {
        str1: ScalarConnection(String)
        str2: ScalarConnection(String)!
        str3: ScalarConnection(String, EdgeProps)
        str4: ScalarConnection(String, EdgeProps)!
        enums: ScalarConnection(MyEnum)
        objs1: ObjectConnection(Foo)
        objs2: ObjectConnection(Foo, EdgeProps)
        node1: NodeConnection(RelatedType, test1)
        node2: NodeConnection(RelatedType, test2, EdgeProps)
      }

      type TestCase implements Node, TestInterface {
        id: ID!
        str1: ScalarConnection(String)
        str2: ScalarConnection(String)!
        str3: ScalarConnection(String, EdgeProps)
        str4: ScalarConnection(String, EdgeProps)!
        enums: ScalarConnection(MyEnum)
        objs1: ObjectConnection(Foo)
        objs2: ObjectConnection(Foo, EdgeProps)
        node1: NodeConnection(RelatedType, test1)
        node2: NodeConnection(RelatedType, test2, EdgeProps)
      }
    `);

    expect(result).to.contain(stripMargin`
      |type RelatedType implements Node {
      |  id: ID!
      |  test1(first: Int,
             ~ last: Int,
             ~ after: String,
             ~ before: String,
             ~ filterBy: _TestInterface__EdgeFilter,
             ~ orderBy: [_TestInterface__EdgeOrder!]
             ~): ${getConnectionName('TestInterface')}
      |  test2(first: Int,
             ~ last: Int,
             ~ after: String,
             ~ before: String,
             ~ filterBy: _TestInterface_EdgeProps_EdgeFilter,
             ~ orderBy: [_TestInterface_EdgeProps_EdgeOrder!]
             ~): ${getConnectionName('TestInterface', 'EdgeProps')}
      |}`);
    const expectedFieldDefs = stripMargin`
      |  str1(first: Int,
            ~ last: Int,
            ~ after: String,
            ~ before: String,
            ~ filterBy: _String__EdgeFilter,
            ~ orderBy: _String__EdgeOrder
            ~): ${getConnectionName('String')}
      |  str2(first: Int,
            ~ last: Int,
            ~ after: String,
            ~ before: String,
            ~ filterBy: _String__EdgeFilter,
            ~ orderBy: _String__EdgeOrder
            ~): ${getConnectionName('String')}!
      |  str3(first: Int,
            ~ last: Int,
            ~ after: String,
            ~ before: String,
            ~ filterBy: _String_EdgeProps_EdgeFilter,
            ~ orderBy: [_String_EdgeProps_EdgeOrder!]
            ~): ${getConnectionName('String', 'EdgeProps')}
      |  str4(first: Int,
            ~ last: Int,
            ~ after: String,
            ~ before: String,
            ~ filterBy: _String_EdgeProps_EdgeFilter,
            ~ orderBy: [_String_EdgeProps_EdgeOrder!]
            ~): ${getConnectionName('String', 'EdgeProps')}!
      |  enums(first: Int,
             ~ last: Int,
             ~ after: String,
             ~ before: String,
             ~ filterBy: _MyEnum__EdgeFilter,
             ~ orderBy: _MyEnum__EdgeOrder
             ~): ${getConnectionName('MyEnum')}
      |  objs1(first: Int,
             ~ last: Int,
             ~ after: String,
             ~ before: String,
             ~ filterBy: _Foo__EdgeFilter,
             ~ orderBy: [_Foo__EdgeOrder!]
             ~): ${getConnectionName('Foo')}
      |  objs2(first: Int,
             ~ last: Int,
             ~ after: String,
             ~ before: String,
             ~ filterBy: _Foo_EdgeProps_EdgeFilter,
             ~ orderBy: [_Foo_EdgeProps_EdgeOrder!]
             ~): ${getConnectionName('Foo', 'EdgeProps')}
      |  node1(first: Int,
             ~ last: Int,
             ~ after: String,
             ~ before: String,
             ~ filterBy: _RelatedType__EdgeFilter,
             ~ orderBy: [_RelatedType__EdgeOrder!]
             ~): ${getConnectionName('RelatedType')}
      |  node2(first: Int,
             ~ last: Int,
             ~ after: String,
             ~ before: String,
             ~ filterBy: _RelatedType_EdgeProps_EdgeFilter,
             ~ orderBy: [_RelatedType_EdgeProps_EdgeOrder!]
             ~): ${getConnectionName('RelatedType', 'EdgeProps')}
      |`;
    expect(result).to.contain(`interface TestInterface {${expectedFieldDefs}}`);
    expect(result).to.contain(stripMargin`
      |type TestCase implements Node, TestInterface {
      |  id: ID!
      ~${expectedFieldDefs}}`);
  });


  it('Adds filter and order arguments to lists when they are defined', () => {
    const result = runTest(`
      enum MyEnum { ONE TWO THREE }
      type Foo { foo: String }
      type NodeItem implements Node { id: ID! }

      filter on [String] {
        EMPTY: { eq: "" }
        EQUALS: (value: String) { eq: $value }
      }

      filter on [Int] {
        ZERO: { eq: 0 }
        EQUALS: (value: Int) { eq: $value }
      }

      filter on [Float] {
        ZERO: { eq: 0.0 }
        EQUALS: (value: Float) { eq: $value }
      }

      filter on [Boolean] {
        TRUE: { eq: true }
        FALSE: { eq: false }
        EQUALS: (value: Boolean) { eq: $value }
      }

      filter on [ID] {
        EQUALS: (value: ID) { eq: $value }
      }

      filter on [MyEnum] {
        ONE: { eq: ONE }
        EQUALS: (value: MyEnum) { eq: $value }
      }

      filter on [Foo] {
        EMPTY: { foo: { eq: "" } }
        EQUALS: (value: String) { foo: { eq: $value } }
      }

      order on [Foo] {
        FOO_ASC: [{ foo: ASCENDING }]
        FOO_DES: [{ foo: DESCENDING }]
      }

      filter on [NodeItem] {
        EQUALS: (id: ID) { id: { eq: $id } }
      }

      order on [NodeItem] {
        NODE_ASC: [{ id: ASCENDING }]
        NODE_DES: [{ id: DESCENDING }]
      }

      interface TestInterface {
        str1: [String]
        str2: [String!]
        str3: [String]!
        str4: [String!]!
        int: [Int!]!
        float: [Float!]
        bool: [Boolean]!
        ids: [ID]
        enums: [MyEnum!]!
        objs: [Foo]
        nodes: [NodeItem]
      }

      type TestCase implements Node, TestInterface {
        id: ID!
        str1: [String]
        str2: [String!]
        str3: [String]!
        str4: [String!]!
        int: [Int!]!
        float: [Float!]
        bool: [Boolean]!
        ids: [ID]
        enums: [MyEnum!]!
        objs: [Foo]
        nodes: [NodeItem]
      }
    `);
    const expectedFieldDefs = stripMargin`
      |  str1(first: Int,
            ~ last: Int,
            ~ filterBy: _String_Filter,
            ~ filter: _String_ListFilterKeys,
            ~ value: String,
            ~ orderBy: _Order): [String]
      |  str2(first: Int,
            ~ last: Int,
            ~ filterBy: _String_Filter,
            ~ filter: _String_ListFilterKeys,
            ~ value: String,
            ~ orderBy: _Order): [String!]
      |  str3(first: Int,
            ~ last: Int,
            ~ filterBy: _String_Filter,
            ~ filter: _String_ListFilterKeys,
            ~ value: String,
            ~ orderBy: _Order): [String]!
      |  str4(first: Int,
            ~ last: Int,
            ~ filterBy: _String_Filter,
            ~ filter: _String_ListFilterKeys,
            ~ value: String,
            ~ orderBy: _Order): [String!]!
      |  int(first: Int,
            ~ last: Int,
            ~ filterBy: _Int_Filter,
            ~ filter: _Int_ListFilterKeys,
            ~ value: Int,
            ~ orderBy: _Order,
            ~ aggregate: _NumericAggregate): [Int!]!
      |  float(first: Int,
            ~ last: Int,
            ~ filterBy: _Float_Filter,
            ~ filter: _Float_ListFilterKeys,
            ~ value: Float,
            ~ orderBy: _Order,
            ~ aggregate: _NumericAggregate): [Float!]
      |  bool(first: Int,
            ~ last: Int,
            ~ filterBy: _Boolean_Filter,
            ~ filter: _Boolean_ListFilterKeys,
            ~ value: Boolean,
            ~ orderBy: _Order): [Boolean]!
      |  ids(first: Int,
            ~ last: Int,
            ~ filterBy: _ID_Filter,
            ~ filter: _ID_ListFilterKeys,
            ~ value: ID,
            ~ orderBy: _Order): [ID]
      |  enums(first: Int,
            ~ last: Int,
            ~ filterBy: _MyEnum_Filter,
            ~ filter: _MyEnum_ListFilterKeys,
            ~ value: MyEnum,
            ~ orderBy: _Order): [MyEnum!]!
      |  objs(first: Int,
            ~ last: Int,
            ~ filterBy: _Foo_Filter,
            ~ filter: _Foo_ListFilterKeys,
            ~ value: String,
            ~ orderBy: [_Foo_Order!],
            ~ order: _Foo_ListOrderKeys): [Foo]
      |  nodes(first: Int,
            ~ last: Int,
            ~ filterBy: _NodeItem_Filter,
            ~ filter: _NodeItem_ListFilterKeys,
            ~ id: ID,
            ~ orderBy: [_NodeItem_Order!],
            ~ order: _NodeItem_ListOrderKeys): [NodeItem]
      |`;

    expect(result).to.contain(`interface TestInterface {${expectedFieldDefs}}`);

    expect(result).to.contain(stripMargin`
      |type TestCase implements Node, TestInterface {
      |  id: ID!
      ~${expectedFieldDefs}}`);
  });

  it('Adds filter and order arguments to conns when they are defined', () => {
    const result = runTest(`
      enum MyEnum { ONE TWO THREE }
      type EdgeProps { date: String }
      type Foo { foo: String }
      type RelatedType implements Node {
        id: ID!
        test1: NodeConnection(TestInterface, node1)
        test2: NodeConnection(TestInterface, node2, EdgeProps)
      }

      filter on ScalarConnection(String) {
        VALUE: (value: String) { node: { eq: $value } }
      }

      filter on ScalarConnection(String, EdgeProps) {
        VALUE: (value: String) { node: { eq: $value } }
        DATE: (date: String) { date: { eq: $date } }
      }

      filter on ScalarConnection(MyEnum) {
        ONE: { node: { eq: ONE }}
        TWO: { node: { eq: TWO }}
        THREE: { node: { eq: THREE }}
      }

      filter on ObjectConnection(Foo) {
        FOO: (foo: String) { node: { foo: { eq: $foo } } }
      }

      filter on ObjectConnection(Foo, EdgeProps) {
        FOO: (foo: String) { node: { foo: { eq: $foo } } }
        DATE: (date: String) { date: { eq: $date }}
      }

      filter on NodeConnection(RelatedType) {
        ID: (id: ID) { node: { id: { eq: $id }}}
      }

      filter on NodeConnection(RelatedType, EdgeProps) {
        ID: (id: ID) { node: { id: { eq: $id }}}
        DATE: (date: String) { date: { eq: $date }}
      }

      order on ScalarConnection(String) {
        NODE: [{ node: ASCENDING }]
      }

      order on ScalarConnection(String, EdgeProps) {
        NODE: [{ node: ASCENDING }]
        DATE: [{ date: ASCENDING }]
      }

      order on ScalarConnection(MyEnum) {
        NODE: [{ node: ASCENDING }]
      }

      order on ObjectConnection(Foo) {
        FOO: [{ node: { foo: ASCENDING } }]
      }

      order on ObjectConnection(Foo, EdgeProps) {
        FOO: [{ node: { foo: ASCENDING } }]
        DATE: [{ date: ASCENDING }]
      }

      order on NodeConnection(RelatedType) {
        ID: [{ node: { id: ASCENDING } }]
      }

      order on NodeConnection(RelatedType, EdgeProps) {
        ID: [{ node: { id: ASCENDING } }]
        DATE: [{ date: ASCENDING }]
      }

      interface TestInterface {
        str1: ScalarConnection(String)
        str2: ScalarConnection(String)!
        str3: ScalarConnection(String, EdgeProps)
        str4: ScalarConnection(String, EdgeProps)!
        enums: ScalarConnection(MyEnum)
        objs1: ObjectConnection(Foo)
        objs2: ObjectConnection(Foo, EdgeProps)
        node1: NodeConnection(RelatedType, test1)
        node2: NodeConnection(RelatedType, test2, EdgeProps)
      }

      type TestCase implements Node, TestInterface {
        id: ID!
        str1: ScalarConnection(String)
        str2: ScalarConnection(String)!
        str3: ScalarConnection(String, EdgeProps)
        str4: ScalarConnection(String, EdgeProps)!
        enums: ScalarConnection(MyEnum)
        objs1: ObjectConnection(Foo)
        objs2: ObjectConnection(Foo, EdgeProps)
        node1: NodeConnection(RelatedType, test1)
        node2: NodeConnection(RelatedType, test2, EdgeProps)
      }
    `);

    expect(result).to.contain(stripMargin`
      |type RelatedType implements Node {
      |  id: ID!
      |  test1(first: Int,
             ~ last: Int,
             ~ after: String,
             ~ before: String,
             ~ filterBy: _TestInterface__EdgeFilter,
             ~ orderBy: [_TestInterface__EdgeOrder!]
             ~): ${getConnectionName('TestInterface')}
      |  test2(first: Int,
             ~ last: Int,
             ~ after: String,
             ~ before: String,
             ~ filterBy: _TestInterface_EdgeProps_EdgeFilter,
             ~ orderBy: [_TestInterface_EdgeProps_EdgeOrder!]
             ~): ${getConnectionName('TestInterface', 'EdgeProps')}
      |}`);
    const expectedFieldDefs = stripMargin`
      |  str1(first: Int,
            ~ last: Int,
            ~ after: String,
            ~ before: String,
            ~ filterBy: _String__EdgeFilter,
            ~ filter: _String__ConnectionFilterKeys,
            ~ value: String,
            ~ orderBy: _String__EdgeOrder,
            ~ order: _String__ConnectionOrderKeys
            ~): ${getConnectionName('String')}
      |  str2(first: Int,
            ~ last: Int,
            ~ after: String,
            ~ before: String,
            ~ filterBy: _String__EdgeFilter,
            ~ filter: _String__ConnectionFilterKeys,
            ~ value: String,
            ~ orderBy: _String__EdgeOrder,
            ~ order: _String__ConnectionOrderKeys
            ~): ${getConnectionName('String')}!
      |  str3(first: Int,
            ~ last: Int,
            ~ after: String,
            ~ before: String,
            ~ filterBy: _String_EdgeProps_EdgeFilter,
            ~ filter: _String_EdgeProps_ConnectionFilterKeys,
            ~ value: String,
            ~ date: String,
            ~ orderBy: [_String_EdgeProps_EdgeOrder!],
            ~ order: _String_EdgeProps_ConnectionOrderKeys
            ~): ${getConnectionName('String', 'EdgeProps')}
      |  str4(first: Int,
            ~ last: Int,
            ~ after: String,
            ~ before: String,
            ~ filterBy: _String_EdgeProps_EdgeFilter,
            ~ filter: _String_EdgeProps_ConnectionFilterKeys,
            ~ value: String,
            ~ date: String,
            ~ orderBy: [_String_EdgeProps_EdgeOrder!],
            ~ order: _String_EdgeProps_ConnectionOrderKeys
            ~): ${getConnectionName('String', 'EdgeProps')}!
      |  enums(first: Int,
             ~ last: Int,
             ~ after: String,
             ~ before: String,
             ~ filterBy: _MyEnum__EdgeFilter,
             ~ filter: _MyEnum__ConnectionFilterKeys,
             ~ orderBy: _MyEnum__EdgeOrder,
             ~ order: _MyEnum__ConnectionOrderKeys
             ~): ${getConnectionName('MyEnum')}
      |  objs1(first: Int,
             ~ last: Int,
             ~ after: String,
             ~ before: String,
             ~ filterBy: _Foo__EdgeFilter,
             ~ filter: _Foo__ConnectionFilterKeys,
             ~ foo: String,
             ~ orderBy: [_Foo__EdgeOrder!],
             ~ order: _Foo__ConnectionOrderKeys
             ~): ${getConnectionName('Foo')}
      |  objs2(first: Int,
             ~ last: Int,
             ~ after: String,
             ~ before: String,
             ~ filterBy: _Foo_EdgeProps_EdgeFilter,
             ~ filter: _Foo_EdgeProps_ConnectionFilterKeys,
             ~ foo: String,
             ~ date: String,
             ~ orderBy: [_Foo_EdgeProps_EdgeOrder!],
             ~ order: _Foo_EdgeProps_ConnectionOrderKeys
             ~): ${getConnectionName('Foo', 'EdgeProps')}
      |  node1(first: Int,
             ~ last: Int,
             ~ after: String,
             ~ before: String,
             ~ filterBy: _RelatedType__EdgeFilter,
             ~ filter: _RelatedType__ConnectionFilterKeys,
             ~ id: ID,
             ~ orderBy: [_RelatedType__EdgeOrder!],
             ~ order: _RelatedType__ConnectionOrderKeys
             ~): ${getConnectionName('RelatedType')}
      |  node2(first: Int,
             ~ last: Int,
             ~ after: String,
             ~ before: String,
             ~ filterBy: _RelatedType_EdgeProps_EdgeFilter,
             ~ filter: _RelatedType_EdgeProps_ConnectionFilterKeys,
             ~ id: ID,
             ~ date: String,
             ~ orderBy: [_RelatedType_EdgeProps_EdgeOrder!],
             ~ order: _RelatedType_EdgeProps_ConnectionOrderKeys
             ~): ${getConnectionName('RelatedType', 'EdgeProps')}
      |`;
    expect(result).to.contain(`interface TestInterface {${expectedFieldDefs}}`);
    expect(result).to.contain(stripMargin`
      |type TestCase implements Node, TestInterface {
      |  id: ID!
      ~${expectedFieldDefs}}`);
  });
});
