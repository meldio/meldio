// import strip from '../../../jsutils/strip';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { parse, analyzeAST, validate } from '../../../schema';
import { validateFilter } from '../validateFilter';

const mutation = {
  name: 'test',
  clientMutationId: 'a',
  globalIds: [ ]
};

const schemaDefinition = `
  enum MyEnum { VALID_ONE VALID_TWO }

  type SimpleObj {
    name: String!
    int: Int
    list: [MyEnum]
  }

  type NestedObj {
    head: String!
    tail: [NestedObj]!
  }

  type SimpleObjTest implements Node {
    id: ID!
    simpleObj: SimpleObj
    simpleObjList: [SimpleObj]
  }

  type NestedObjTest implements Node {
    id: ID!
    nestedObj: NestedObj
  }

  interface InterfaceOne {
    name: String
  }

  type ObjOne implements InterfaceOne {
    name: String
    count: Int
  }

  interface InterfaceTwo {
    name: String
  }

  type ObjTwoCount implements InterfaceTwo {
    name: String
    count: Int
  }

  type ObjTwoCost implements InterfaceTwo {
    name: String
    cost: Float
  }

  union UnionOne = ObjOne
  union UnionTwo = ObjTwoCount | ObjTwoCost

  type DisambiguationTest implements Node {
    id: ID!
    interfaceOne: InterfaceOne
    interfaceTwo: InterfaceTwo
    unionOne: UnionOne
    unionTwo: UnionTwo
  }

  interface Named {
    name: String!
  }

  type NodeWithConnections implements Node, Named {
    id: ID!
    name: String!
    scalarConn: ScalarConnection(String)
    objectConn: ObjectConnection(SimpleObj)
    nodeConn: NodeConnection(NodeWithConnections, nodeConn)
  }

  type NodeWithScalars implements Node {
    id: ID!
    optInt: Int
    reqInt: Int!
    optFloat: Float
    reqFloat: Float!
    optStr: String
    reqStr: String!
    optBoolean: Boolean
    reqBoolean: Boolean!
    optId: ID
    reqId: ID!
    optEnum: MyEnum
    reqEnum: MyEnum!
    optIntList: [Int]
    reqIntList: [Int]!
    optFloatList: [Float]
    reqFloatList: [Float]!
    optStrList: [String]
    reqStrList: [String]!
    optBooleanList: [Boolean]
    reqBooleanList: [Boolean]!
    optIdList: [ID]
    reqIdList: [ID]!
    optEnumList: [MyEnum]
    reqEnumList: [MyEnum]!
  }

  union NodeUnion = NodeWithNodeRefs | NodeWithScalars

  type NodeWithNodeRefs implements Node, Named {
    id: ID!
    name: String!

    nodeRef: NodeWithScalars
    nodeInterfaceRef: Named
    nodeUnionRef: NodeUnion

    nodeRefList: [NodeWithScalars]
    nodeInterfaceRefList: [Named]
    nodeUnionRefList: [NodeUnion]
  }
`;

const ast = parse(schemaDefinition);
const schema = analyzeAST(ast);
const validationResult = validate(schema);

const mkContext = type => ({
  schema,
  mutation,
  type,
  function: 'filter'
});

describe('mutations / validator / validateFilter', () => {
  it('test schema is valid', () => {
    expect(validationResult).to.have.length(0);
  });

  it('throws when context is not passed', () => {
    expect(validateFilter).to.throw(Error, /must pass context/);
  });

  it('throws when invalid context is passed', () => {
    let invalidCall = validateFilter.bind(null, { });
    expect(invalidCall).to.throw(Error, /must pass Node context/);

    invalidCall = validateFilter.bind(null, { schema: { } });
    expect(invalidCall).to.throw(Error, /must pass Node context/);

    invalidCall = validateFilter.bind(null, { schema: { }, type: 'Foo' });
    expect(invalidCall).to.throw(Error, /must pass Node context/);

    invalidCall = validateFilter.bind(
      null,
      { schema: { Foo: {} }, type: 'Foo' });
    expect(invalidCall).to.throw(Error, /must pass Node context/);

    invalidCall = validateFilter.bind(
      null,
      { schema: { Foo: { kind: 'interface'} }, type: 'Foo' });
    expect(invalidCall).to.throw(Error, /must pass Node context/);
  });

  it('error if expression is nullish, array or scalar', () => {
    const context = mkContext('NodeWithScalars');
    let returned = validateFilter(context, null);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /Filter expression must be an object expression/);

    returned = validateFilter(context);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /Filter expression must be an object expression/);

    returned = validateFilter(context, 123);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /Filter expression must be an object expression/);

    returned = validateFilter(context, [ { } ]);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /Filter expression must be an object expression/);
  });

  it('error if unknown field is referenced in filter expression', () => {
    const context = mkContext('NodeWithScalars');
    const filter = { boom: { eq: 123 } };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /cannot have an undefined field "boom"/);
  });

  it('error if connection field is referenced in filter expression', () => {
    const context = mkContext('NodeWithConnections');
    const filter = {
      name: { ne: [ 'da', 'boom', '!' ] },
      scalarConn: { },
      objectConn: { },
      nodeConn: { },
    };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(3);
    expect(returned.results).to.deep.match(
      /cannot have a connection field "scalarConn"/);
    expect(returned.results).to.deep.match(
      /cannot have a connection field "objectConn"/);
    expect(returned.results).to.deep.match(
      /cannot have a connection field "nodeConn"/);
  });

  it('should be able to filter on id field', () => {
    const context = mkContext('NodeWithScalars');
    const filter = { id: { ne: '-K9KlCkTDbIIK3UUBtMI-dF45m9K8i31C1IJ' } };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(0);
  });

  it('should be able to filter scalar field by providing scalar value', () => {
    const context = mkContext('NodeWithScalars');
    const filter = { id: '-K9KlCkTDbIIK3UUBtMI-dF45m9K8i31C1IJ' };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(0);
  });

  it('should be able to filter scalar field by providing scalar array', () => {
    const context = mkContext('NodeWithScalars');
    const filter = { reqInt: [ 1, 2, 3 ] };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(0);
  });

  it('error if unknown scalar operator is used to filter on Int field', () => {
    const context = mkContext('NodeWithScalars');
    const filter = { optInt: { xp: 123 } };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /has an invalid "xp" operator within "optInt"/);
    expect(returned.results).to.deep.match(
     /Allowed operators are: "eq", "ne", "lt", "gt", "lte", "gte", "exists"\./);
  });

  it('error if unknown scalar operator is used to filter on Float fld', () => {
    const context = mkContext('NodeWithScalars');
    const filter = { optFloat: { xx: 123.321 } };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /has an invalid "xx" operator within "optFloat"/);
    expect(returned.results).to.deep.match(
     /Allowed operators are: "eq", "ne", "lt", "gt", "lte", "gte", "exists"\./);
  });

  it('error if unknown scalar operator is used to filter on String fld', () => {
    const context = mkContext('NodeWithScalars');
    const filter = { optStr: { xs: 'boom!' } };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /has an invalid "xs" operator within "optStr"/);
    expect(returned.results).to.deep.match(
    /operators are: "eq", "ne", "lt", "gt", "lte", "gte", "matches", "exists"\./
    );
  });

  it('error if value passed to filter operator has wrong type', () => {
    const context = mkContext('NodeWithScalars');
    const filter = { optInt: { eq: 'Str' } };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /has "eq" operator with invalid value within "optInt"/);
  });

  it('eq and ne filter ops should accept both scalar and array values', () => {
    const context = mkContext('NodeWithScalars');
    const filter = {
      optInt: { eq: 123 },
      reqInt: { eq: [ 1, 2, 3 ] },
      optFloat: { eq: 123.321 },
      reqFloat: { eq: [ 1.1, 2.2, 3.3 ] },
    };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(0);
  });

  it('error if array is provided to lt, lte, gt or gte filter operator', () => {
    const context = mkContext('NodeWithScalars');
    const filter = {
      optInt: { lt: [ 123 ] },
      reqInt: { lte: [ 1, 2, 3 ] },
      optFloat: { gt: [ 123.321 ] },
      reqFloat: { gte: [ 1.1, 2.2, 3.3 ] },
    };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(4);
    expect(returned.results)
      .to.deep.match(/has "lt" operator with invalid value within "optInt"/);
    expect(returned.results)
      .to.deep.match(/Value passed to "lt" operator must be "Int" scalar/);
    expect(returned.results)
      .to.deep.match(/has "lte" operator with invalid value within "reqInt"/);
    expect(returned.results)
      .to.deep.match(/Value passed to "lte" operator must be "Int" scalar/);
    expect(returned.results)
      .to.deep.match(/has "gt" operator with invalid value within "optFloat"/);
    expect(returned.results)
      .to.deep.match(/Value passed to "gt" operator must be "Float" scalar/);
    expect(returned.results)
      .to.deep.match(/has "gte" operator with invalid value within "reqFloat"/);
    expect(returned.results)
      .to.deep.match(/Value passed to "gte" operator must be "Float" scalar/);
  });

  it('error if gt filter operator is attempted on Boolean field', () => {
    const context = mkContext('NodeWithScalars');
    const filter = { reqBoolean: { gt: false } };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /has an invalid "gt" operator within "reqBoolean"/);
    expect(returned.results).to.deep.match(
      /Allowed operators are: "eq", "ne", "exists"\./);
  });

  it('error if matches filter operator is attempted on ID field', () => {
    const context = mkContext('NodeWithScalars');
    const filter = { reqId: { matches: /foo/ } };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /has an invalid "matches" operator within "reqId"/);
    expect(returned.results).to.deep.match(
    /Allowed operators are: "eq", "ne", "lt", "gt", "lte", "gte", "exists"\./);
  });

  it('error if matches filter operator argument is Int', () => {
    const context = mkContext('NodeWithScalars');
    const filter = { reqStr: { matches: 123 } };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /has "matches" operator with invalid value within "reqStr"/);
  });

  it('matches filter operator argument should be String or RegExp', () => {
    const context = mkContext('NodeWithScalars');
    const filter = {
      reqStr: { matches: '123' },
      optStr: { matches: /123/ },
    };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(0);
  });

  it('error if lt, lte, gt or gte filter operators are attempted on enum',
  () => {
    const context = mkContext('NodeWithScalars');
    const filter = {
      optEnum: {
        lt: 'VALID_ONE',
        gt: 'VALID_TWO',
      },
      reqEnum: {
        lte: 'VALID_ONE',
        gte: 'VALID_TWO',
      }
    };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(4);
    expect(returned.results)
      .to.deep.match(/has an invalid "lt" operator within "optEnum"/);
    expect(returned.results)
      .to.deep.match(/has an invalid "gt" operator within "optEnum"/);
    expect(returned.results)
      .to.deep.match(/has an invalid "lte" operator within "reqEnum"/);
    expect(returned.results)
      .to.deep.match(/has an invalid "gte" operator within "reqEnum"/);
    expect(returned.results)
      .to.deep.match(/Allowed operators are: "eq", "ne", "exists"\./);
  });

  it('error if array literal is used to filter on scalar list', () => {
    const context = mkContext('NodeWithScalars');
    const filter = { optStrList: [ 'one', 'two', 'three' ] };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /has an array where object is expected within "optStrList"/);
    expect(returned.results).to.deep.match(
      /Only object expressions are allowed in this context\./);
  });

  it('error if scalar value is used to filter on scalar list', () => {
    const context = mkContext('NodeWithScalars');
    const filter = { optStrList: 'one' };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /has a scalar value where object is expected within "optStrList"/);
    expect(returned.results).to.deep.match(
      /Only object expressions are allowed in this context\./);
  });

  it('should be able to pass scalar as a parameter to some/every/none', () => {
    const context = mkContext('NodeWithScalars');
    const filter = {
      optStrList: { some: 'one' },
      reqStrList: { every: 'two' },
      reqIntList: { none: 3 }
    };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(0);
  });

  it('should be able to pass array as a parameter to some/every/none', () => {
    const context = mkContext('NodeWithScalars');
    const filter = {
      optIdList: { some: [ 'one', 'two' ] },
      reqBooleanList: { every: [ true ] },
      reqFloatList: { none: [ 3.14 ] }
    };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(0);
  });

  it('error if exists filter operator parameter has a wrong type', () => {
    const context = mkContext('NodeWithScalars');
    const filter = { optStrList: { exists: 'true' } };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /has "exists" operator with invalid value within "optStrList"/);
    expect(returned.results).to.deep.match(
      /Value passed to "exists" operator must be "Boolean" scalar\./);
  });

  it('error if unknown operator is used to filter on scalar list', () => {
    const context = mkContext('NodeWithScalars');
    const filter = {
      optStrList: { boom: { eq: 'error' } },
    };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /has an invalid "boom" operator within "optStrList"/);
    expect(returned.results).to.deep.match(
      /operators are: "exists", "length", "empty", "some", "every", "none"\./);
  });

  it('error if some/every/none filters are provided with wrong ops or types',
  () => {
    const context = mkContext('NodeWithScalars');
    const filter = {
      reqBooleanList: { some: { xx: 'foo' } },    // wrong operator
      optStrList: { some: { eq: true } },         // wrong type
      reqIntList: { every: { ne: false } },       // wrong type
      optFloatList: { none: { lt: true } },       // wrong type
    };
    const returned = validateFilter(context, filter);

    expect(returned.results).to.have.length(4);
    expect(returned.results).to.deep.match(
      /has an invalid "xx" operator within "reqBooleanList\.some"/);
    expect(returned.results).to.deep.match(
      /Allowed operators are: "eq", "ne", "exists"\./);
    expect(returned.results).to.deep.match(
      /has "ne" operator with invalid value within "reqIntList\.every"/);
    expect(returned.results).to.deep.match(
      /Value passed to "ne" operator must be "Int" scalar or array\./);
    expect(returned.results).to.deep.match(
      /has "lt" operator with invalid value within "optFloatList\.none"/);
    expect(returned.results).to.deep.match(
      /Value passed to "lt" operator must be "Float" scalar\./);
    expect(returned.results).to.deep.match(
      /has "eq" operator with invalid value within "optStrList\.some"/);
    expect(returned.results).to.deep.match(
      /Value passed to "eq" operator must be "String" scalar or array\./);
  });

  it('should filter on node field with scalar filter expressions', () => {
    const context = mkContext('NodeWithNodeRefs');
    const filter = {
      nodeRef: { eq: 'foo-id' },
      nodeInterfaceRef: { eq: 'bar-id' },
      nodeUnionRef: 'baz-id'
    };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(0);
  });

  it('error if filter on node field is an invalid scalar expressions', () => {
    const context = mkContext('NodeWithNodeRefs');
    const filter = {
      nodeRef: { eq: 123 },                   // wrong type
      nodeInterfaceRef: { type: 'bar-id' },   // wrong operator
      nodeUnionRef: { id: 'baz-id' }          // wrong operator
    };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(3);
    expect(returned.results).to.deep.match(
      /has "eq" operator with invalid value within "nodeRef"/);
    expect(returned.results).to.deep.match(
      /Value passed to "eq" operator must be "ID" scalar or array\./);
    expect(returned.results).to.deep.match(
      /has an invalid "type" operator within "nodeInterfaceRef"/);
    expect(returned.results).to.deep.match(
      /has an invalid "id" operator within "nodeUnionRef"/);
    expect(returned.results).to.deep.match(
     /Allowed operators are: "eq", "ne", "lt", "gt", "lte", "gte", "exists"\./);
  });

  it('should filter on node list field with scalar filter expressions', () => {
    const context = mkContext('NodeWithNodeRefs');
    const filter = {
      nodeRefList: { some: 'foo-id' },
      nodeInterfaceRefList: { every: { ne: 'bar-id' } },
      nodeUnionRefList: { empty: true }
    };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(0);
  });

  it('error if filter on node list field is an invalid expressions', () => {
    const context = mkContext('NodeWithNodeRefs');
    const filter = {
      nodeRefList: { some: 123 },                         // wrong type
      nodeInterfaceRefList: { some: { type: 'bar-id' } }, // wrong operator
      nodeUnionRefList: { every: { id: 'baz-id' } }       // wrong operator
    };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(3);
    expect(returned.results).to.deep.match(
      /has an invalid scalar value within "nodeRefList\.some"/);
    expect(returned.results).to.deep.match(
      /Expected "ID" scalar value or array\./);
    expect(returned.results).to.deep.match(
      /has an invalid "type" operator within "nodeInterfaceRefList\.some"/);
    expect(returned.results).to.deep.match(
      /operators are: "eq", "ne", "lt", "gt", "lte", "gte", "exists"\./);
    expect(returned.results).to.deep.match(
      /has an invalid "id" operator within "nodeUnionRefList\.every"/);
    expect(returned.results).to.deep.match(
      /operators are: "eq", "ne", "lt", "gt", "lte", "gte", "exists"\./);
  });

  it('filter expressions follow through object fields', () => {
    const context = mkContext('SimpleObjTest');
    const filter = {
      id: { eq: 'foo' },
      simpleObj: {
        exists: true,
        name: { eq: 'bar' },
        int: { lt: 1000 },
        list: { some: [ 'VALID_ONE', 'VALID_TWO' ] },
      },
    };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(0);
  });

  it('error if nested object filter has invalid expressions', () => {
    const context = mkContext('SimpleObjTest');
    const filter = {
      id: { eq: 'foo' },
      simpleObj: {
        exists: 'true',
        name: { eq: 12 },
        int: { xx: 1000 },
        list: { some: {ne: 'INVALID' } },
      },
    };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(4);

    expect(returned.results).to.deep.match(
      /has "exists" operator with invalid value within "simpleObj"/);
    expect(returned.results).to.deep.match(
      /Value passed to "exists" operator must be "Boolean" scalar\./);
    expect(returned.results).to.deep.match(
      /has "eq" operator with invalid value within "simpleObj\.name"/);
    expect(returned.results).to.deep.match(
      /Value passed to "eq" operator must be "String" scalar or array\./);
    expect(returned.results).to.deep.match(
      /has an invalid "xx" operator within "simpleObj\.int"/);
    expect(returned.results).to.deep.match(
      /operators are: "eq", "ne", "lt", "gt", "lte", "gte", "exists"\./);
    expect(returned.results).to.deep.match(
      /has "ne" operator with invalid value within "simpleObj\.list\.some"/);
    expect(returned.results).to.deep.match(
      /Value passed to "ne" operator must be "MyEnum" scalar or array\./);
  });

  it('filter expressions follow through object fields', () => {
    const context = mkContext('SimpleObjTest');
    const filter = {
      id: { eq: 'foo' },
      simpleObj: {
        exists: true,
        name: { eq: 'bar' },
        int: { lt: 1000 },
        list: { some: [ 'VALID_ONE', 'VALID_TWO' ] },
      },
    };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(0);
  });

  it('should filter by exists, type and fields on inner interface obj', () => {
    const context = mkContext('DisambiguationTest');
    const filter = {
      interfaceTwo: {
        exists: true,
        name: { eq: 'foo' },
        type: { eq: [ 'ObjTwoCount', 'ObjTwoCost' ] }
      },
    };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(0);
  });

  it('error if type is invalid on filter on inner interface obj', () => {
    const context = mkContext('DisambiguationTest');
    const filter = {
      interfaceTwo: { name: { eq: 123 } },
    };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /has "eq" operator with invalid value within "interfaceTwo\.name"/);
    expect(returned.results).to.deep.match(
      /Value passed to "eq" operator must be "String" scalar or array\./);
  });

  it('error if operator is invalid on filter on inner interface obj', () => {
    const context = mkContext('DisambiguationTest');
    const filter = {
      interfaceTwo: { name: { xx: 123 } },
    };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /has an invalid "xx" operator within "interfaceTwo\.name"/);
    expect(returned.results).to.deep.match(
      /are: "eq", "ne", "lt", "gt", "lte", "gte", "matches", "exists"\./);
  });

  it('should allow type filter to take a single String value', () => {
    const context = mkContext('DisambiguationTest');
    const filter = {
      interfaceTwo: { type: 'ObjTwoCount' }
    };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(0);
  });

  it('should allow type filter to take an array of String values', () => {
    const context = mkContext('DisambiguationTest');
    const filter = {
      interfaceTwo: { type: [ 'ObjTwoCount', 'ObjTwoCost' ] }
    };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(0);
  });

  it('error if type argument is wrong for inner interface object', () => {
    const context = mkContext('DisambiguationTest');
    const filter = {
      interfaceTwo: {
        exists: true,
        name: { eq: 'foo' },
        type: { eq: [ 'Foo', 'Bar' ] }
      },
    };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /has invalid "eq" operator value within "interfaceTwo\.type"/);
    expect(returned.results).to.deep.match(
      /Expected "String" array or scalar of: "ObjTwoCount", "ObjTwoCost"\./);
  });

  it('error if type string is wrong for inner interface object', () => {
    const context = mkContext('DisambiguationTest');
    const filter = {
      interfaceTwo: {
        exists: true,
        name: { eq: 'foo' },
        type: 'Foo'
      },
    };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /has invalid type name within "interfaceTwo\.type"/);
    expect(returned.results).to.deep.match(
      /Expected "String" array or scalar of: "ObjTwoCount", "ObjTwoCost"\./);
  });

  it('error if type array is wrong for inner interface object', () => {
    const context = mkContext('DisambiguationTest');
    const filter = {
      interfaceTwo: {
        exists: true,
        name: { eq: 'foo' },
        type: [ 'Foo', 'Bar' ]
      },
    };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /has invalid type name within "interfaceTwo\.type"/);
    expect(returned.results).to.deep.match(
      /Expected "String" array or scalar of: "ObjTwoCount", "ObjTwoCost"\./);
  });

  it('should filter by exists and type on inner union obj', () => {
    const context = mkContext('DisambiguationTest');
    const filter = {
      unionTwo: {
        exists: true,
        type: { eq: [ 'ObjTwoCount', 'ObjTwoCost' ] }
      },
    };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(0);
  });

  it('should allow type filter to take a single String value', () => {
    const context = mkContext('DisambiguationTest');
    const filter = {
      unionTwo: { type: 'ObjTwoCount' }
    };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(0);
  });

  it('should allow type filter to take an array of String values', () => {
    const context = mkContext('DisambiguationTest');
    const filter = {
      unionTwo: { type: [ 'ObjTwoCount', 'ObjTwoCost' ] }
    };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(0);
  });

  it('error if type argument is wrong for inner union object', () => {
    const context = mkContext('DisambiguationTest');
    const filter = {
      unionTwo: {
        exists: true,
        type: { eq: [ 'Foo', 'Bar' ] }
      },
    };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /has invalid "eq" operator value within "unionTwo\.type"/);
    expect(returned.results).to.deep.match(
      /Expected "String" array or scalar of: "ObjTwoCount", "ObjTwoCost"\./);
  });

  it('error if type argument is wrong for inner union object', () => {
    const context = mkContext('DisambiguationTest');
    const filter = {
      unionTwo: {
        exists: true,
        type: { ne: [ 'Foo', 'Bar' ] }
      },
    };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /has invalid "ne" operator value within "unionTwo\.type"/);
    expect(returned.results).to.deep.match(
      /Expected "String" array or scalar of: "ObjTwoCount", "ObjTwoCost"\./);
  });

  it('error if type string is wrong for inner union object', () => {
    const context = mkContext('DisambiguationTest');
    const filter = {
      unionTwo: {
        exists: true,
        type: 'Foo'
      },
    };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /has invalid type name within "unionTwo\.type"/);
    expect(returned.results).to.deep.match(
      /Expected "String" array or scalar of: "ObjTwoCount", "ObjTwoCost"\./);
  });

  it('error if type is given a wrong type for inner union object', () => {
    const context = mkContext('DisambiguationTest');
    const filter = {
      unionTwo: {
        exists: true,
        type: 123
      },
    };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /has an invalid value within "unionTwo\.type"/);
    expect(returned.results).to.deep.match(
      /Expected "String" array or scalar of: "ObjTwoCount", "ObjTwoCost"\./);
  });

  it('error if type array is wrong for inner union object', () => {
    const context = mkContext('DisambiguationTest');
    const filter = {
      unionTwo: {
        exists: true,
        type: [ 'Foo', 'Bar' ]
      },
    };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /has invalid type name within "unionTwo\.type"/);
    expect(returned.results).to.deep.match(
      /Expected "String" array or scalar of: "ObjTwoCount", "ObjTwoCost"\./);
  });

  it('simple filter expression should work on object list field', () => {
    const context = mkContext('SimpleObjTest');
    const filter = {
      simpleObjList: {
        exists: true,
        empty: true,
      },
    };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(0);
  });

  it('filter expressions follow through object list fields', () => {
    const context = mkContext('SimpleObjTest');
    const filter = {
      simpleObjList: {
        exists: true,
        length: 5,
        empty: false,
        some: {
          name: 'Nemanja',
          int: 21,
          list: { none: 'VALID_ONE' }
        },
        every: {
          name: { ne: '' },
          int: { exists: true },
          list: { some: 'VALID_TWO' }
        },
        none: {
          name: [ 'La', 'Boom' ],
        },
      },
    };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(0);
  });

  it('error if filter expressions on inner object is invalid', () => {
    const context = mkContext('SimpleObjTest');
    const filter = {
      simpleObjList: {
        exists: 'true',
        length: false,
        empty: 'false',
        some: {
          name: 123,
          int: 'foo',
          list: { none: 'Invalid' }
        },
        xx: {
          name: { ne: '' },
          int: { exists: true },
          list: { some: 'VALID_TWO' }
        },
        none: {
          name: [ 1, 2 ],
          int: '3'
        },
      },
    };
    const returned = validateFilter(context, filter);
    expect(returned.results).to.have.length(9);
    expect(returned.results).to.deep.match(
      /has an invalid "xx" operator within "simpleObjList"/);
    expect(returned.results).to.deep.match(
      /operators are: "exists", "length", "empty", "some", "every", "none"\./);
    expect(returned.results).to.deep.match(
      /has "exists" operator with invalid value within "simpleObjList"/);
    expect(returned.results).to.deep.match(
      /Value passed to "exists" operator must be "Boolean" scalar\./);
    expect(returned.results).to.deep.match(
      /has "length" operator with invalid value within "simpleObjList"/);
    expect(returned.results).to.deep.match(
      /Value passed to "length" operator must be "Int" scalar\./);
    expect(returned.results).to.deep.match(
      /has "empty" operator with invalid value within "simpleObjList"/);
    expect(returned.results).to.deep.match(
      /Value passed to "empty" operator must be "Boolean" scalar\./);
    expect(returned.results).to.deep.match(
      /has an invalid scalar value within "simpleObjList\.some\.name"/);
    expect(returned.results).to.deep.match(
      /Expected "String" scalar value or array\./);
    expect(returned.results).to.deep.match(
      /has an invalid scalar value within "simpleObjList\.some\.int"/);
    expect(returned.results).to.deep.match(
      /Expected "Int" scalar value or array\./);
    expect(returned.results).to.deep.match(
      /has an invalid scalar value within "simpleObjList\.some\.list\.none"/);
    expect(returned.results).to.deep.match(
      /Expected "MyEnum" scalar value or array\./);
    expect(returned.results).to.deep.match(
      /has an invalid scalar value within "simpleObjList\.none\.name"/);
    expect(returned.results).to.deep.match(
      /Expected "String" scalar value or array\./);
    expect(returned.results).to.deep.match(
      /has an invalid scalar value within "simpleObjList\.none\.int"/);
    expect(returned.results).to.deep.match(
      /Expected "Int" scalar value or array\./);
  });
});
