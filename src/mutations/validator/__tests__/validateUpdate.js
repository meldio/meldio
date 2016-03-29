import { expect } from 'chai';
import { describe, it } from 'mocha';
import { parse, analyzeAST, validate } from '../../../schema';
import { validateUpdate, validateObjectUpdate } from '../validateUpdate';

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
    intList: [Int]
  }

  interface InterfaceTwo {
    name: String
  }

  type ObjTwoCount implements InterfaceTwo {
    name: String
    count: Int
    intList: [Int]
  }

  type ObjTwoCost implements InterfaceTwo {
    name: String
    cost: Float
    floatList: [Float]
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

  type ObjTest implements Node {
    id: ID!
    obj: ObjOne
    inter: InterfaceOne
    union: UnionOne
  }

  type ObjectListTest implements Node {
    id: ID!
    typeList: [ObjOne]
    reqList: [ObjOne]!
    interList: [InterfaceOne]
    unionList: [UnionOne]
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

    nodeRef: NodeWithScalars!
    nodeInterfaceRef: Named
    nodeUnionRef: NodeUnion

    nodeRefList: [NodeWithScalars]!
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
  function: 'update'
});

describe('mutations / validator / validateUpdate', () => {
  it('test schema is valid', () => {
    expect(validationResult).to.have.length(0);
  });

  it('throws when context is not passed', () => {
    expect(validateUpdate).to.throw(Error, /must pass context/);
  });

  it('throws when invalid context is passed', () => {
    let invalidCall = validateUpdate.bind(null, { });
    expect(invalidCall).to.throw(Error, /must pass Node context/);

    invalidCall = validateUpdate.bind(null, { schema: { } });
    expect(invalidCall).to.throw(Error, /must pass Node context/);

    invalidCall = validateUpdate.bind(null, { schema: { }, type: 'Foo' });
    expect(invalidCall).to.throw(Error, /must pass Node context/);

    invalidCall = validateUpdate.bind(
      null,
      { schema: { Foo: {} }, type: 'Foo' });
    expect(invalidCall).to.throw(Error, /must pass Node context/);

    invalidCall = validateUpdate.bind(
      null,
      { schema: { Foo: { kind: 'interface'} }, type: 'Foo' });
    expect(invalidCall).to.throw(Error, /must pass Node context/);
  });

  it('error if expression is nullish, array or scalar', () => {
    const context = mkContext('NodeWithScalars');
    let returned = validateUpdate(context, null);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /Update expression must be an object expression/);

    returned = validateUpdate(context);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /Update expression must be an object expression/);

    returned = validateUpdate(context, 123);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /Update expression must be an object expression/);

    returned = validateUpdate(context, [ { } ]);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /Update expression must be an object expression/);
  });

  it('error if unknown field is referenced in update expression', () => {
    const context = mkContext('NodeWithScalars');
    const expression = { boom: 123 };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /Update expression cannot have an undefined field "boom"\./);
  });

  it('error if connection field is referenced in update expression', () => {
    const context = mkContext('NodeWithConnections');
    const expression = {
      name: 'la boom!',
      scalarConn: [ ],
      objectConn: [ ],
      nodeConn: [ ],
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(3);
    expect(returned.results).to.deep.match(
      /cannot have a connection field "scalarConn"/);
    expect(returned.results).to.deep.match(
      /cannot have a connection field "objectConn"/);
    expect(returned.results).to.deep.match(
      /cannot have a connection field "nodeConn"/);
  });

  it('should not be able to update the id field', () => {
    const context = mkContext('NodeWithScalars');
    const expression = { id: '-K9KlCkTDbIIK3UUBtMI-dF45m9K8i31C1IJ' };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /Update expression can not include an id field\./);
  });

  it('should be able to update scalar field with value or clear op', () => {
    const context = mkContext('NodeWithScalars');
    const expression = {
      optInt: { clear: true },
      reqInt: 12,
      optFloat: { clear: false },
      reqFloat: 12.12,
      optStr: { clear: true },
      reqStr: 'foo',
      optBoolean: { clear: true },
      reqBoolean: false,
      optId: { clear: true },
      reqId: 'bar',
      optEnum: { clear: true },
      reqEnum: 'VALID_ONE',
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('error if clear op is applied to a required field', () => {
    const context = mkContext('NodeWithScalars');
    const expression = {
      reqInt: { clear: true },
      reqFloat: { clear: true },
      reqStr: { clear: true },
      reqBoolean: { clear: true },
      reqId: { clear: true },
      reqEnum: { clear: true },
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(6);
    expect(returned.results).to.deep.match(
      /Update expression has a "clear" operator in "reqInt"/);
    expect(returned.results).to.deep.match(
      /Update expression has a "clear" operator in "reqFloat"/);
    expect(returned.results).to.deep.match(
      /Update expression has a "clear" operator in "reqStr"/);
    expect(returned.results).to.deep.match(
      /Update expression has a "clear" operator in "reqBoolean"/);
    expect(returned.results).to.deep.match(
      /Update expression has a "clear" operator in "reqId"/);
    expect(returned.results).to.deep.match(
      /Update expression has a "clear" operator in "reqEnum"/);
    expect(returned.results).to.deep.match(
      /Clear operator can not be applied to a required field\./);
  });

  it('should be able to apply {clear: false} to required field (noop)', () => {
    const context = mkContext('NodeWithScalars');
    const expression = {
      reqInt: { clear: false },
      reqFloat: { clear: false },
      reqStr: { clear: false },
      reqBoolean: { clear: false },
      reqId: { clear: false },
      reqEnum: { clear: false },
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('error if attempting to assign an invalid value to a scalar field', () => {
    const context = mkContext('NodeWithScalars');
    const expression = {
      reqInt: { foo: 'bar' },
      reqFloat: [ 12.21 ],
      reqStr: 123,
      reqBoolean: 'false',
      reqId: 123,
      reqEnum: 'INVALID_VALUE',
    };
    const regexp = (field, type) => new RegExp(
      `has an unexpected value in "${field}" field\. ` +
      `Expected "${type}" scalar value or "clear" operator expression\.`);

    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(6);
    expect(returned.results).to.deep.match(regexp('reqInt', 'Int'));
    expect(returned.results).to.deep.match(regexp('reqFloat', 'Float'));
    expect(returned.results).to.deep.match(regexp('reqStr', 'String'));
    expect(returned.results).to.deep.match(regexp('reqBoolean', 'Boolean'));
    expect(returned.results).to.deep.match(regexp('reqId', 'ID'));
    expect(returned.results).to.deep.match(regexp('reqEnum', 'MyEnum'));
  });

  it('error if clear expression is invalid on a scalar field', () => {
    const context = mkContext('NodeWithScalars');
    const expression = {
      optInt: { clear: 1 },
      optBoolean: { clear: { foo: 'bar' } },
      optId: { clear: [ true ] },
      optFloat: { clear: null },
      optStr: { clear: true, foo: 123 },
    };

    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(5);
    expect(returned.results).to.deep.match(
      /has "clear" operator with invalid value in "optInt" field\./);
    expect(returned.results).to.deep.match(
      /Value passed to "clear" operator must be "Boolean" scalar\./);
    expect(returned.results).to.deep.match(
      /has "clear" operator with invalid value in "optBoolean" field\./);
    expect(returned.results).to.deep.match(
      /has "clear" operator with invalid value in "optId" field\./);
    expect(returned.results).to.deep.match(
      /has an unexpected value in "optFloat" field\./);
    expect(returned.results).to.deep.match(
      /has an invalid "foo" operator in "optStr" field\./);
    expect(returned.results).to.deep.match(
      /Allowed operators are: "clear"\./);
  });

  it('shoud allow add/sub/mul/div on numeric fields', () => {
    const context = mkContext('NodeWithScalars');
    const expression = {
      optInt: { add: 12 },
      reqInt: { sub: 12 },
      optFloat: { mul: 5 },
      reqFloat: { div: 5 },
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('error if add/sub/mul/div values are of the wrong type', () => {
    const context = mkContext('NodeWithScalars');
    const expression = {
      optInt: { add: '12' },
      reqInt: { sub: 12, boom: true },
      optFloat: { mul: { boom: false } },
      reqFloat: { div: [ 12.21 ] },
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(4);
    expect(returned.results).to.deep.match(
      /has "add" operator with invalid value in "optInt"/);
    expect(returned.results).to.deep.match(
      /Value passed to "add" operator must be "Int" scalar\./);
    expect(returned.results).to.deep.match(
      /has an invalid "boom" operator in "reqInt"/);
    expect(returned.results).to.deep.match(
      /Allowed operators are: "sub"\./);
    expect(returned.results).to.deep.match(
      /has "mul" operator with invalid value in "optFloat"/);
    expect(returned.results).to.deep.match(
      /Value passed to "mul" operator must be "Float" scalar\./);
    expect(returned.results).to.deep.match(
      /has "div" operator with invalid value in "reqFloat"/);
    expect(returned.results).to.deep.match(
      /Value passed to "div" operator must be "Float" scalar\./);
  });

  it('shoud allow min/max on numeric fields', () => {
    const context = mkContext('NodeWithScalars');
    const expression = {
      optInt: { min: 12 },
      reqInt: { max: 12 },
      optFloat: { min: 5 },
      reqFloat: { max: 5},
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('error if attempting to divide by 0', () => {
    const context = mkContext('NodeWithScalars');
    const expression = {
      reqFloat: { div: 0 },
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /has invalid "div" operator value of zero in "reqFloat"/);
    expect(returned.results).to.deep.match(
      /Division by zero is not allowed\./);
  });

  it('error if add/sub/mul/div/min/max are on a non-numeric field', () => {
    const context = mkContext('NodeWithScalars');
    const expression = {
      optStr: { add: 'foo' },
      reqStr: { sub: 'bar' },
      optBoolean: { mul: true },
      reqBoolean: { div: false },
      optId: { min: 'foo' },
      reqId: { max: 'bar' },
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(6);
    expect(returned.results).to.deep.match(
      /has an unexpected value in "optStr"/);
    expect(returned.results).to.deep.match(
      /Expected "String" scalar value or "clear" operator expression\./);
    expect(returned.results).to.deep.match(
      /has an unexpected value in "reqStr"/);
    expect(returned.results).to.deep.match(
      /has an unexpected value in "optBoolean"/);
    expect(returned.results).to.deep.match(
      /has an unexpected value in "reqBoolean"/);
    expect(returned.results).to.deep.match(
      /has an unexpected value in "optId"/);
    expect(returned.results).to.deep.match(
      /has an unexpected value in "reqId"/);
  });

  it('should be able to update node field with a value', () => {
    const context = mkContext('NodeWithNodeRefs');
    const expression = {
      nodeRef: '-K9dBa6PMGO9UQAocseW-dF45m9K8i31C1IJ',
      nodeInterfaceRef: '-K9dBkA-MsWkB5UMXXtG-dF45m9K8TFEE53K9FEJ',
      nodeUnionRef: '-K9dBffu_wHmjpJoPUGD-dF45m9K8i31C1IJ',
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('error if node field is updated with incorrect id', () => {
    const context = mkContext('NodeWithNodeRefs');
    const expression = {
      nodeRef: '-K9dCH8HdIyKpXGZ3ETC-WFF',
      nodeInterfaceRef: '-K9dCLaWkHheWVBjOdeo-d1D54',
      nodeUnionRef: '-K9dCQlakDkHH_69zXtK-dF45kE9FE',
    };
    const regexp = (field, type) => new RegExp(
      `has an invalid node id value in "${field}" field\. ` +
      `Expected "${type}" node id value\.`);

    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(3);
    expect(returned.results)
      .to.deep.match(regexp('nodeRef', 'NodeWithScalars'));
    expect(returned.results).to.deep.match(regexp('nodeInterfaceRef', 'Named'));
    expect(returned.results).to.deep.match(regexp('nodeUnionRef', 'NodeUnion'));
  });

  it('error if clear op is applied to a required node id field', () => {
    const context = mkContext('NodeWithNodeRefs');
    const expression = { nodeRef: { clear: true } };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /Update expression has a "clear" operator in "nodeRef"/);
  });

  it('should be able to apply {clear: false} to required node field', () => {
    const context = mkContext('NodeWithNodeRefs');
    const expression = { nodeRef: { clear: false } };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('error if attempting to assign an invalid type to a node field', () => {
    const context = mkContext('NodeWithNodeRefs');
    const expression = {
      nodeRef: { foo: '-K9dCH8HdIyKpXGZ3ETC-WFF' },
      nodeInterfaceRef: [ '-K9dCLaWkHheWVBjOdeo-d1D54' ],
      nodeUnionRef: 123,
    };
    const regexp = (field, type) => new RegExp(
      `has an invalid node id value in "${field}" field\. ` +
      `Expected "${type}" node id value\.`);

    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(3);
    expect(returned.results)
      .to.deep.match(regexp('nodeRef', 'NodeWithScalars'));
    expect(returned.results).to.deep.match(regexp('nodeInterfaceRef', 'Named'));
    expect(returned.results)
      .to.deep.match(regexp('nodeUnionRef', 'NodeUnion'));
  });

  it('error if clear expression is invalid on a node field', () => {
    const context = mkContext('NodeWithNodeRefs');
    const expression = {
      nodeRef: { clear: 1 },
      nodeInterfaceRef: { clear: { foo: 'bar' } },
      nodeUnionRef: { clear: true, foo: 123 },
    };

    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(3);
    expect(returned.results).to.deep.match(
      /has "clear" operator with invalid value in "nodeRef"/);
    expect(returned.results).to.deep.match(
      /has "clear" operator with invalid value in "nodeInterfaceRef"/);
    expect(returned.results).to.deep.match(
      /has an invalid "foo" operator in "nodeUnionRef"/);
  });

  it('error if attempting to assign a scalar to scalar list', () => {
    const context = mkContext('NodeWithScalars');
    const expression = { optIntList: 123 };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /has an unexpected value in "optIntList"/);
    expect(returned.results).to.deep.match(
      /Expected "Int" array or "insert", "delete", "pop", "clear" operator/);
  });

  it('should allow assigning an array to scalar list', () => {
    const context = mkContext('NodeWithScalars');
    const expression = {
      optIntList: [ ],
      reqIntList: [ 123, 321 ],
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('error if an element of an array assigned to scalar list is wrong', () => {
    const context = mkContext('NodeWithScalars');
    const expression = {
      optIntList: [ 123, 'boom!' ],
      reqIntList: [ 321, 123, { clear: true } ],
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(2);
    expect(returned.results).to.deep.match(
      /has an invalid array value in "optIntList"/);
    expect(returned.results).to.deep.match(
      /has an invalid array value in "reqIntList"/);
    expect(returned.results).to.deep.match(
      /Expected "Int" array or "insert", "delete", "pop", "clear" operator/);
  });

  it('should allow clear operation on scalar list', () => {
    const context = mkContext('NodeWithScalars');
    const expression = { optIntList: { clear: true } };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('error if clear operation is applied to required scalar list', () => {
    const context = mkContext('NodeWithScalars');
    const expression = { reqIntList: { clear: true } };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /has a "clear" operator in "reqIntList"/);
    expect(returned.results).to.deep.match(
      /Clear operator can not be applied to a required field\./);
  });

  it('should allow {clear: false} operation on required scalar list', () => {
    const context = mkContext('NodeWithScalars');
    const expression = { reqIntList: { clear: false } };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('should allow pop operation on scalar list', () => {
    const context = mkContext('NodeWithScalars');
    const expression = {
      reqIntList: { pop: 'first' },
      optIntList: { pop: 'last' },
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('error if pop operation on scalar list is invalid', () => {
    const context = mkContext('NodeWithScalars');
    const expression = {
      optIntList: { pop: { first: true } },
      reqIntList: { pop: 1 },
      optFloatList: { pop: 'first', foo: 'bar' },
      reqFloatList: { pop: null },
      optStrList: { pop: [ 'first' ] },
      reqStrList: { pop: 'boom!' },
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(6);
    expect(returned.results).to.deep.match(
      /has an invalid "pop" operator in "optIntList"/);
    expect(returned.results).to.deep.match(
      /has an invalid "pop" operator in "reqIntList"/);
    expect(returned.results).to.deep.match(
      /has an invalid "foo" operator in "optFloatList"/);
    expect(returned.results).to.deep.match(
      new RegExp('has an unexpected value in "reqFloatList" field\. ' +
                 'Expected "Float" array or "insert", "delete", ' +
                 '"pop", "clear" operator expression.'));

    expect(returned.results).to.deep.match(
      /has an invalid "pop" operator in "optStrList"/);
    expect(returned.results).to.deep.match(
      /has an invalid "pop" operator in "reqStrList"/);
  });

  it('should allow delete op with array or scalar on scalar list', () => {
    const context = mkContext('NodeWithScalars');
    const expression = {
      optIntList: { delete: [ 1, 2, 3 ] },
      reqIntList: { delete: 5 },
      optFloatList: { delete: [ 1.1, 2.2, 3.3 ] },
      reqFloatList: { delete: 4.4 },
      optStrList: { delete: [ 'only-one' ] },
      reqStrList: { delete: 'only-one' },
      optEnumList: { delete: [ 'VALID_ONE' ] },
      reqEnumList: { delete: 'VALID_TWO' },
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('should allow delete op with filter on scalar list', () => {
    const context = mkContext('NodeWithScalars');
    const expression = {
      optIntList: { delete: { lt: 4 } },
      optFloatList: { delete: { gte: 1.1, lte: 3.3 } },
      optStrList: { delete: { eq: 'only-one' } },
      optEnumList: { delete: { eq: 'VALID_ONE' } },
      reqEnumList: { delete: { ne: 'VALID_TWO' } },
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('error if element of delete op array on scalar list is wrong', () => {
    const context = mkContext('NodeWithScalars');
    const expression = {
      optIntList: { delete: [ 1, 2, '3' ] },
      reqIntList: { delete: 'foo' },
      optFloatList: { delete: [ 1.1, 2.2, {foo: 3.3} ] },
      reqFloatList: { delete: false },
      reqStrList: { delete: 123 },
      optStrList: { delete: {foo: 'only-one'} },
      optEnumList: { delete: 'INVALID_ONE' },
      reqEnumList: { delete: { eq: 'INVALID_TWO' } },
    };
    const regexp = (field, type) => new RegExp(
      `has "delete" operator with invalid value in "${field}" field\. ` +
      `Value passed to "delete" operator must be "${type}" scalar or array\.`);

    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(8);
    expect(returned.results).to.deep.match(regexp('optIntList', 'Int'));
    expect(returned.results).to.deep.match(regexp('reqIntList', 'Int'));
    expect(returned.results).to.deep.match(regexp('optFloatList', 'Float'));
    expect(returned.results).to.deep.match(regexp('reqFloatList', 'Float'));
    expect(returned.results).to.deep.match(regexp('reqStrList', 'String'));
    expect(returned.results).to.deep.match(
      /has an invalid "foo" operator within "optStrList\.delete"/);
    expect(returned.results).to.deep.match(
      /are: "eq", "ne", "lt", "gt", "lte", "gte", "matches", "exists"\./);
    expect(returned.results).to.deep.match(regexp('optEnumList', 'MyEnum'));
    expect(returned.results).to.deep.match(
      /has "eq" operator with invalid value within "reqEnumList.delete"/);
    expect(returned.results).to.deep.match(
      /Value passed to "eq" operator must be "MyEnum" scalar or array\./);
  });

  it('should allow insert op with array or scalar on scalar list', () => {
    const context = mkContext('NodeWithScalars');
    const expression = {
      optIntList: { insert: [ 1, 2, 3 ] },
      reqIntList: { insert: 5 },
      optFloatList: { insert: [ 1.1, 2.2, 3.3 ] },
      reqFloatList: { insert: 4.4 },
      optStrList: { insert: [ 'only-one' ] },
      reqStrList: { insert: 'only-one' },
      optEnumList: { insert: [ 'VALID_ONE' ] },
      reqEnumList: { insert: 'VALID_TWO' },
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('error if element of insert op array on scalar list is wrong', () => {
    const context = mkContext('NodeWithScalars');
    const expression = {
      optIntList: { insert: [ 1, 2, '3' ] },
      reqIntList: { insert: 'foo' },
      optFloatList: { insert: [ 1.1, 2.2, {foo: 3.3} ] },
      reqFloatList: { insert: false },
      reqStrList: { insert: 123 },
      optStrList: { insert: {foo: 'only-one'} },
      optEnumList: { insert: 'INVALID_ONE' },
      reqEnumList: { insert: [ 'INVALID_TWO' ] },
    };
    const regexp = (field, type) => new RegExp(
      `has "insert" operator with invalid value in "${field}" field\. ` +
      `Value passed to "insert" operator must be "${type}" scalar or array\.`);

    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(8);
    expect(returned.results).to.deep.match(regexp('optIntList', 'Int'));
    expect(returned.results).to.deep.match(regexp('reqIntList', 'Int'));
    expect(returned.results).to.deep.match(regexp('optFloatList', 'Float'));
    expect(returned.results).to.deep.match(regexp('reqFloatList', 'Float'));
    expect(returned.results).to.deep.match(regexp('reqStrList', 'String'));
    expect(returned.results).to.deep.match(regexp('optStrList', 'String'));
    expect(returned.results).to.deep.match(regexp('optEnumList', 'MyEnum'));
    expect(returned.results).to.deep.match(regexp('reqEnumList', 'MyEnum'));
  });

  it('should allow insert at a position in scalar list', () => {
    const context = mkContext('NodeWithScalars');
    const expression = { optIntList: { insert: [ 1, 2, 3 ], at: 0 } };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('should allow insert ascending in scalar list', () => {
    const context = mkContext('NodeWithScalars');
    const expression = { optIntList: { insert: [ 1, 2, 3 ], ascending: true } };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('should allow insert descending in scalar list', () => {
    const context = mkContext('NodeWithScalars');
    const expression = { optIntList: { insert: [ 1, 2, 3 ], descending: true }};
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('should allow insert keepFirst in scalar list', () => {
    const context = mkContext('NodeWithScalars');
    const expression = { optIntList: { insert: [ 1, 2, 3 ], keepFirst: 5 } };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('should allow insert keepLast in scalar list', () => {
    const context = mkContext('NodeWithScalars');
    const expression = { optIntList: { insert: [ 1, 2, 3 ], keepLast: 5 } };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('should allow insert keepFirst and keepLast in scalar list', () => {
    const context = mkContext('NodeWithScalars');
    const expression = {
      optIntList: {
        insert: [ 1, 2, 3 ],
        keepFirst: 5,
        keepLast: 5
      }
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('error if insert, at, asc and desc are combined on scalar list', () => {
    const context = mkContext('NodeWithScalars');
    const expression = {
      optIntList: {
        insert: [ 1, 2, 3 ],
        ascending: true,
        descending: true
      },
      reqIntList: {
        insert: [ 1, 2, 3 ],
        at: 0,
        descending: true
      },
      optFloatList: {
        insert: [ 1.1, 2.2, 3.3 ],
        at: 0,
        ascending: true
      }
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(3);
    expect(returned.results).to.deep.match(
      /has an invalid operator expression in "optIntList"/);
    expect(returned.results).to.deep.match(
      /has an invalid operator expression in "reqIntList"/);
    expect(returned.results).to.deep.match(
      /has an invalid operator expression in "optFloatList"/);
    expect(returned.results).to.deep.match(
    /at most one of the following operators: "at", "ascending", "descending"/);
  });

  it('error if at, asc, desc, keep ops have wrong type on scalar list', () => {
    const context = mkContext('NodeWithScalars');
    const expression = {
      optIntList: {
        insert: [ 1, 2, 3 ],
        ascending: 'true',
      },
      reqIntList: {
        insert: [ 1, 2, 3 ],
        descending: 'true'
      },
      optFloatList: {
        insert: [ 1.1, 2.2, 3.3 ],
        at: 'foo',
      },
      reqFloatList: {
        insert: [ 1.1, 2.2, 3.3 ],
        keepFirst: 'foo',
      },
      reqStrList: {
        insert: [ '1.1', '2.2', '3.3' ],
        keepLast: 'bar',
      },
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(5);
    expect(returned.results).to.deep.match(
      /has "ascending" operator with invalid value in "optIntList"/);
    expect(returned.results).to.deep.match(
      /Value passed to "ascending" operator must be "Boolean" scalar\./);
    expect(returned.results).to.deep.match(
      /has "descending" operator with invalid value in "reqIntList"/);
    expect(returned.results).to.deep.match(
      /Value passed to "descending" operator must be "Boolean" scalar\./);
    expect(returned.results).to.deep.match(
      /has "at" operator with invalid value in "optFloatList"/);
    expect(returned.results).to.deep.match(
      /Value passed to "at" operator must be "Int" scalar\./);
    expect(returned.results).to.deep.match(
      /has "keepFirst" operator with invalid value in "reqFloatList"/);
    expect(returned.results).to.deep.match(
      /Value passed to "keepFirst" operator must be "Int" scalar\./);
    expect(returned.results).to.deep.match(
      /has "keepLast" operator with invalid value in "reqStrList"/);
    expect(returned.results).to.deep.match(
      /Value passed to "keepLast" operator must be "Int" scalar\./);
  });

  it('error if unknown operators are on insert/delete on scalar list', () => {
    const context = mkContext('NodeWithScalars');
    const expression = {
      optIntList: {
        insert: [ 1, 2, 3 ],
        foo: 'bar',
      },
      reqIntList: {
        bar: 'foo',
      },
      optFloatList: {
        delete: [ 1.1, 2.2, 3.3 ],
        baz: 'zaz',
      },
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(3);
    expect(returned.results).to.deep.match(
      /has an invalid "foo" operator in "optIntList"/);
    expect(returned.results).to.deep.match(
      /"insert", "at", "ascending", "descending", "keepFirst", "keepLast"/);
    expect(returned.results).to.deep.match(
      /has an unexpected value in "reqIntList"/);
    expect(returned.results).to.deep.match(
      /Expected "Int" array or "insert", "delete", "pop", "clear" op/);
    expect(returned.results).to.deep.match(
      /has an invalid "baz" operator in "optFloatList"/);
    expect(returned.results).to.deep.match(
      /Allowed operators are: "delete"\./);
  });

  // node list
  it('error if attempting to assign an id to node id list', () => {
    const context = mkContext('NodeWithNodeRefs');
    const expression = { nodeRefList: '-K9eA7qN9lpcoUwz4I3n-dF45m9K8i31C1IJ' };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /has an unexpected value in "nodeRefList"/);
    expect(returned.results).to.deep.match(
      /"NodeWithScalars" node id array or "insert", "delete", "pop", "clear"/);
  });

  it('should allow assigning an array to node id list', () => {
    const context = mkContext('NodeWithNodeRefs');
    const expression = {
      nodeInterfaceRefList: [
        '-K9eAS1fUt9MyVP2ega3-dF45m9K8TFEE53K9FEJ',
        '-K9eAU9smmsHTpRuoJbC-dF45m9K8dF45h56J' ],
      nodeUnionRefList: [ ],
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('error if an element of an array assigned to node list is wrong', () => {
    const context = mkContext('NodeWithNodeRefs');
    const expression = {
      nodeRefList: [ '-K9eA7qN9lpcoUwz4I3n-dF45m9K8i31C1IJ' , 123 ],
      nodeInterfaceRefList: [
        '-K9eAS1fUt9MyVP2ega3-dF45m9K8TFEE53K9FEJ',
        '-K9eB08oZVXcohLVruUh-d1D54' // 'Named'
      ],
      nodeUnionRefList: [
        '-K9eB6HRwQMsviwQt2E5-dF45m9K8i31C1IJ',
        '-K9eBAa1nSVxpV1u7qjS-dF45kE9FE' // 'NodeUnion'
      ],
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(3);
    expect(returned.results).to.deep.match(
      /has an invalid array value in "nodeRefList"/);
    expect(returned.results).to.deep.match(
      /"NodeWithScalars" node id array or "insert", "delete", "pop", "clear"/);
    expect(returned.results).to.deep.match(
      /has an invalid array value in "nodeInterfaceRefList"/);
    expect(returned.results).to.deep.match(
      /"Named" node id array or "insert", "delete", "pop", "clear" op/);
    expect(returned.results).to.deep.match(
      /has an invalid array value in "nodeUnionRefList"/);
    expect(returned.results).to.deep.match(
      /"NodeUnion" node id array or "insert", "delete", "pop", "clear" op/);
  });

  it('should allow clear operation on node list', () => {
    const context = mkContext('NodeWithNodeRefs');
    const expression = { nodeInterfaceRefList: { clear: true } };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('error if clear operation is applied to required node list', () => {
    const context = mkContext('NodeWithNodeRefs');
    const expression = { nodeRefList: { clear: true } };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /has a "clear" operator in "nodeRefList"/);
    expect(returned.results).to.deep.match(
      /Clear operator can not be applied to a required field\./);
  });

  it('should allow {clear: false} operation on required node list', () => {
    const context = mkContext('NodeWithNodeRefs');
    const expression = { nodeRefList: { clear: false } };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('should allow pop operation on node list', () => {
    const context = mkContext('NodeWithNodeRefs');
    const expression = {
      nodeRefList: { pop: 'first' },
      nodeInterfaceRefList: { pop: 'last' },
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('error if pop operation on node list is invalid', () => {
    const context = mkContext('NodeWithNodeRefs');
    const expression = {
      nodeRefList: { pop: { first: true } },
      nodeInterfaceRefList: { pop: 1 },
      nodeUnionRefList: { pop: 'first', foo: 'bar' },
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(3);
    expect(returned.results).to.deep.match(
      /has an invalid "pop" operator in "nodeRefList"/);
    expect(returned.results).to.deep.match(
      /has an invalid "pop" operator in "nodeInterfaceRefList"/);
    expect(returned.results).to.deep.match(
      /has an invalid "foo" operator in "nodeUnionRefList"/);
  });

  it('should allow delete op with array or id value on node list', () => {
    const context = mkContext('NodeWithNodeRefs');
    const expression = {
      nodeRefList: { delete: '-K9eA7qN9lpcoUwz4I3n-dF45m9K8i31C1IJ' },
      nodeInterfaceRefList: {
        delete: [
          '-K9eAS1fUt9MyVP2ega3-dF45m9K8TFEE53K9FEJ',
          '-K9eAU9smmsHTpRuoJbC-dF45m9K8dF45h56J'
        ]
      },
      nodeUnionRefList: [ '-K9eB6HRwQMsviwQt2E5-dF45m9K8i31C1IJ' ],
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('should allow delete op with filter on node list', () => {
    const context = mkContext('NodeWithNodeRefs');
    const expression = {
      nodeRefList: { delete: { lt: '-K9eA7qN9lpcoUwz4I3n-dF45m9K8i31C1IJ' } },
      nodeInterfaceRefList: {
        delete: { gte: '-K9eAS1fUt9MyVP2ega3-dF45m9K8TFEE53K9FEJ' }
      },
      nodeUnionRefList: {
        delete: { ne: [ '-K9eB6HRwQMsviwQt2E5-dF45m9K8i31C1IJ' ] }
      },
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('error if delete op has element with invalid id on node list', () => {
    const context = mkContext('NodeWithNodeRefs');
    const expression = {
      nodeRefList: { delete: [
        '-K9eA7qN9lpcoUwz4I3n-dF45m9K8i31C1IJ',
        'foo-bar'
      ] },
      nodeInterfaceRefList: { delete: [
        '-K9eAS1fUt9MyVP2ega3-dF45m9K8TFEE53K9FEJ',
        '-K9hc50f-db3l0o0vBm3-d1D54', // Named
      ] },
      nodeUnionRefList: { delete: [
        '-K9eB6HRwQMsviwQt2E5-dF45m9K8i31C1IJ',
        '-K9hcE5ZN9BGYCSj5bj2-dF45kE9FE' // NodeUnion
      ] },
    };
    const regexp = (field, type) => new RegExp(
      `has "delete" operator with invalid value in "${field}" field\. ` +
      `Value passed to "delete" operator must be "${type}" node id or array`);

    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(3);
    expect(returned.results)
      .to.deep.match(regexp('nodeRefList', 'NodeWithScalars'));
    expect(returned.results)
      .to.deep.match(regexp('nodeInterfaceRefList', 'Named'));
    expect(returned.results)
      .to.deep.match(regexp('nodeUnionRefList', 'NodeUnion'));
  });

  it('error if delete op has element with invalid type on node list', () => {
    const context = mkContext('NodeWithNodeRefs');
    const expression = {
      nodeRefList: { delete: [
        false,
      ] },
      nodeInterfaceRefList: { delete: [
        { foo: 'bar' },
      ] },
      nodeUnionRefList: { delete: [
        [ '-K9eB6HRwQMsviwQt2E5-dF45m9K8i31C1IJ' ]
      ] },
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(3);
    expect(returned.results).to.deep.match(
      /has "delete" operator with invalid value in "nodeRefList"/);
    expect(returned.results).to.deep.match(
      /has "delete" operator with invalid value in "nodeInterfaceRefList"/);
    expect(returned.results).to.deep.match(
      /has "delete" operator with invalid value in "nodeUnionRefList"/);
  });


  it('should allow insert op with node id or array of ids on node list', () => {
    const context = mkContext('NodeWithNodeRefs');
    const expression = {
      nodeRefList: { insert: '-K9eA7qN9lpcoUwz4I3n-dF45m9K8i31C1IJ' },
      nodeInterfaceRefList: {
        insert: [
          '-K9eAS1fUt9MyVP2ega3-dF45m9K8TFEE53K9FEJ',
          '-K9eAU9smmsHTpRuoJbC-dF45m9K8dF45h56J'
        ]
      },
      nodeUnionRefList: { insert: [ '-K9eB6HRwQMsviwQt2E5-dF45m9K8i31C1IJ' ] },
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('error if element of insert op array on node list is wrong', () => {
    const context = mkContext('NodeWithNodeRefs');
    const expression = {
      nodeRefList: { insert: [
        '-K9eA7qN9lpcoUwz4I3n-dF45m9K8i31C1IJ',
        'foo-bar'
      ] },
      nodeInterfaceRefList: { insert: [
        '-K9eAS1fUt9MyVP2ega3-dF45m9K8TFEE53K9FEJ',
        '-K9hc50f-db3l0o0vBm3-d1D54', // Named
      ] },
      nodeUnionRefList: {
        insert: '-K9hcE5ZN9BGYCSj5bj2-dF45kE9FE' // NodeUnion
      },
    };
    const regexp = (field, type) => new RegExp(
      `has "insert" operator with invalid value in "${field}" field\. ` +
      `Value passed to "insert" operator must be "${type}" node id or array`);

    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(3);
    expect(returned.results)
      .to.deep.match(regexp('nodeRefList', 'NodeWithScalars'));
    expect(returned.results)
      .to.deep.match(regexp('nodeInterfaceRefList', 'Named'));
    expect(returned.results)
      .to.deep.match(regexp('nodeUnionRefList', 'NodeUnion'));
  });

  it('should allow insert at a position in node list', () => {
    const context = mkContext('NodeWithNodeRefs');
    const expression = {
      nodeRefList: {
        insert: [
          '-K9eA7qN9lpcoUwz4I3n-dF45m9K8i31C1IJ',
          '-K9hf7wOcEstI3Jpjea_-dF45m9K8i31C1IJ'
        ],
        at: 0
      }
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('should allow insert ascending in node list', () => {
    const context = mkContext('NodeWithNodeRefs');
    const expression = {
      nodeRefList: {
        insert: [
          '-K9eA7qN9lpcoUwz4I3n-dF45m9K8i31C1IJ',
          '-K9hf7wOcEstI3Jpjea_-dF45m9K8i31C1IJ'
        ],
        ascending: true
      }
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('should allow insert descending in node list', () => {
    const context = mkContext('NodeWithNodeRefs');
    const expression = {
      nodeRefList: {
        insert: [
          '-K9eA7qN9lpcoUwz4I3n-dF45m9K8i31C1IJ',
          '-K9hf7wOcEstI3Jpjea_-dF45m9K8i31C1IJ'
        ],
        descending: true
      }
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('should allow insert keepFirst in node list', () => {
    const context = mkContext('NodeWithNodeRefs');
    const expression = {
      nodeRefList: {
        insert: [
          '-K9eA7qN9lpcoUwz4I3n-dF45m9K8i31C1IJ',
          '-K9hf7wOcEstI3Jpjea_-dF45m9K8i31C1IJ'
        ],
        keepFirst: 5
      }
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('should allow insert keepLast in node list', () => {
    const context = mkContext('NodeWithNodeRefs');
    const expression = {
      nodeRefList: {
        insert: [
          '-K9eA7qN9lpcoUwz4I3n-dF45m9K8i31C1IJ',
          '-K9hf7wOcEstI3Jpjea_-dF45m9K8i31C1IJ'
        ],
        keepLast: 5
      }
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('should allow insert keepFirst and keepLast in node list', () => {
    const context = mkContext('NodeWithNodeRefs');
    const expression = {
      nodeRefList: {
        insert: [
          '-K9eA7qN9lpcoUwz4I3n-dF45m9K8i31C1IJ',
          '-K9hf7wOcEstI3Jpjea_-dF45m9K8i31C1IJ'
        ],
        keepFirst: 5,
        keepLast: 5,
      }
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });


  it('error if insert, at, asc and desc are combined on node list', () => {
    const context = mkContext('NodeWithNodeRefs');
    const expression = {
      nodeRefList: {
        insert: [
          '-K9eA7qN9lpcoUwz4I3n-dF45m9K8i31C1IJ',
          '-K9hf7wOcEstI3Jpjea_-dF45m9K8i31C1IJ'
        ],
        ascending: true,
        descending: true,
      },
      nodeInterfaceRefList: {
        insert: [ '-K9eAS1fUt9MyVP2ega3-dF45m9K8TFEE53K9FEJ' ],
        at: 0,
        descending: true
      },
      nodeUnionRefList: {
        insert: [ '-K9eAU9smmsHTpRuoJbC-dF45m9K8dF45h56J' ],
        at: 0,
        ascending: true
      }
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(3);
    expect(returned.results).to.deep.match(
      /has an invalid operator expression in "nodeRefList"/);
    expect(returned.results).to.deep.match(
      /has an invalid operator expression in "nodeInterfaceRefList"/);
    expect(returned.results).to.deep.match(
      /has an invalid operator expression in "nodeUnionRefList"/);
    expect(returned.results).to.deep.match(
    /at most one of the following operators: "at", "ascending", "descending"/);
  });

  it('error if at, asc, desc, keep ops have wrong type on node list', () => {
    const context = mkContext('NodeWithNodeRefs');
    const expression = {
      nodeRefList: {
        insert: [
          '-K9eA7qN9lpcoUwz4I3n-dF45m9K8i31C1IJ',
          '-K9hf7wOcEstI3Jpjea_-dF45m9K8i31C1IJ'
        ],
        ascending: 'true',
      },
      nodeInterfaceRefList: {
        insert: [ '-K9eAS1fUt9MyVP2ega3-dF45m9K8TFEE53K9FEJ' ],
        descending: 'true',
        keepFirst: 'foo',
      },
      nodeUnionRefList: {
        insert: [ '-K9eAU9smmsHTpRuoJbC-dF45m9K8dF45h56J' ],
        at: 'foo',
        keepLast: 'bar',
      }
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(5);
    expect(returned.results).to.deep.match(
      /has "ascending" operator with invalid value in "nodeRefList"/);
    expect(returned.results).to.deep.match(
      /Value passed to "ascending" operator must be "Boolean" scalar\./);
    expect(returned.results).to.deep.match(
      /"descending" operator with invalid value in "nodeInterfaceRefList"/);
    expect(returned.results).to.deep.match(
      /Value passed to "descending" operator must be "Boolean" scalar\./);
    expect(returned.results).to.deep.match(
      /has "at" operator with invalid value in "nodeUnionRefList"/);
    expect(returned.results).to.deep.match(
      /Value passed to "at" operator must be "Int" scalar\./);
    expect(returned.results).to.deep.match(
      /has "keepFirst" operator with invalid value in "nodeInterfaceRefList"/);
    expect(returned.results).to.deep.match(
      /Value passed to "keepFirst" operator must be "Int" scalar\./);
    expect(returned.results).to.deep.match(
      /has "keepLast" operator with invalid value in "nodeUnionRefList"/);
    expect(returned.results).to.deep.match(
      /Value passed to "keepLast" operator must be "Int" scalar\./);
  });

  it('error if unknown operators are on insert/delete on node list', () => {
    const context = mkContext('NodeWithNodeRefs');
    const expression = {
      nodeRefList: {
        insert: [
          '-K9eA7qN9lpcoUwz4I3n-dF45m9K8i31C1IJ',
          '-K9hf7wOcEstI3Jpjea_-dF45m9K8i31C1IJ'
        ],
        foo: 'bar',
      },
      nodeInterfaceRefList: {
        bar: 'foo',
      },
      nodeUnionRefList: {
        delete: [ '-K9eAU9smmsHTpRuoJbC-dF45m9K8dF45h56J' ],
        baz: 'zaz',
      }
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(3);
    expect(returned.results).to.deep.match(
      /has an invalid "foo" operator in "nodeRefList"/);
    expect(returned.results).to.deep.match(
      /"insert", "at", "ascending", "descending", "keepFirst", "keepLast"/);
    expect(returned.results).to.deep.match(
      /has an unexpected value in "nodeInterfaceRefList"/);
    expect(returned.results).to.deep.match(
      /Expected "Named" node id array or "insert", "delete", "pop", "clear"/);
    expect(returned.results).to.deep.match(
      /has an invalid "baz" operator in "nodeUnionRefList"/);
    expect(returned.results).to.deep.match(
      /Allowed operators are: "delete"\./);
  });

  // object disambiguation tests:
  it('refs to interfaces are disambiguated if there is one object type', () => {
    const context = mkContext('DisambiguationTest');
    const expression = {
      interfaceOne: {
        name: 'Foo',
        count: { add: 1 }
      }
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('error if ref to interface field is ambiguous', () => {
    const context = mkContext('DisambiguationTest');
    const expression = {
      interfaceTwo: {
        name: 'Foo',
        count: { add: 1 }
      }
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /must disambiguate object type with "_type" in "interfaceTwo"/);
  });

  it('error if ref to interface field is ambiguous and _type is wrong', () => {
    const context = mkContext('DisambiguationTest');
    const expression = {
      interfaceTwo: {
        _type: 'Boom',
        name: 'Foo',
        count: 21
      }
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /contains object with an invalid "_type" value in "interfaceTwo"/);
  });

  it('okay if ref to interface field is ambiguous and _type is given', () => {
    const context = mkContext('DisambiguationTest');
    const expression = {
      interfaceTwo: {
        _type: 'ObjTwoCost',
        cost: { add: 21.0 }
      }
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('refs to unions are disambiguated if there is one object type', () => {
    const context = mkContext('DisambiguationTest');
    const expression = {
      unionOne: {
        name: 'Foo',
        count: 21
      }
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('error if ref to union field is ambiguous', () => {
    const context = mkContext('DisambiguationTest');
    const expression = {
      unionTwo: {
        name: 'Foo',
        count: 21
      }
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /must disambiguate object type with "_type" in "unionTwo"/);
  });

  it('error if ref to union field is ambiguous and _type is wrong', () => {
    const context = mkContext('DisambiguationTest');
    const expression = {
      unionTwo: {
        _type: 'Boom',
        name: 'Foo',
        count: { clear: true }
      }
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /contains object with an invalid "_type" value in "unionTwo"/);
  });

  it('okay if ref to union field is ambiguous and _type is given', () => {
    const context = mkContext('DisambiguationTest');
    const expression = {
      unionTwo: {
        _type: 'ObjTwoCost',
        name: 'Bar',
        cost: { clear: true }
      }
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('should allow operators within inner object expression', () => {
    const context = mkContext('DisambiguationTest');
    const expression = {
      unionOne: {
        name: 'Foo',
        count: { sub: 25 },
        intList: { insert: [ 1, 2, 3 ], ascending: true, keepFirst: 10 }
      }
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('error if inner expression on object field is invalid', () => {
    const context = mkContext('DisambiguationTest');
    const expression = {
      unionOne: {
        name: 'Foo',
        count: { sub: 25 },
        intList: { insert: [ 1, 2, '3' ], ascending: true, keepFirst: 10 }
      }
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /has "insert" operator with invalid value in "unionOne\.intList"/);
    expect(returned.results).to.deep.match(
      /Value passed to "insert" operator must be "Int" scalar or array/);
  });

  it('should be able to update inner fields within object field', () => {
    const context = mkContext('ObjTest');
    const expression = {
      obj: {
        name: 'Foo',
        count: { add: 25 },
        intList: { insert: [ 1, 2, 3 ], ascending: true, keepFirst: 10 }
      }
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('error if object is not passed to object update expression', () => {
    const context = mkContext('ObjTest');
    const expression = {
      obj: [ { name: 'Foo' } ]
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(1);
  });

  it('validateObjectUpdate initialized suffix if not provided', () => {
    const returned = validateObjectUpdate(schema, 'ObjOne', { foo: 123 }, '');
    expect(returned).to.have.length(1);
    expect(returned).to.deep.match(/cannot have an undefined field "foo"/);
  });

  // object list

  // type ObjOne implements InterfaceOne {
  //   name: String
  //   count: Int
  //   intList: [Int]
  // }
  // type ObjectListTest implements Node {
  //   id: ID!
  //   typeList: [ObjOne]
  //   interList: [InterfaceOne]
  //   unionList: [UnionOne]
  // }

  it('error if attempting to assign an object to object list', () => {
    const context = mkContext('ObjectListTest');
    const expression = {
      typeList: {
        name: 'foo'
      }
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /has an unexpected value in "typeList"/);
    expect(returned.results).to.deep.match(
      /Expected "ObjOne" object array or "insert", "delete", "pop", "clear"/);
  });

  it('should allow assigning an object array to object list', () => {
    const context = mkContext('ObjectListTest');
    const expression = {
      typeList: [
        { name: 'instance1' },
        { name: 'instance2' },
      ]
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('error if invalid element of obj array is assigned to object list', () => {
    const context = mkContext('ObjectListTest');
    const expression = {
      typeList: [
        { name: 'instance1' },
        { _type: 'ObjOne', name: 'instance2' },
        { foo: 'bar' },
        'boom!',
        [ { name: 'invalid' } ]
      ]
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(3);
    expect(returned.results).to.deep.match(
      /Update expression cannot have an undefined field "typeList\[2\]\.foo"/);
    expect(returned.results).to.deep.match(
      /Update expression should have "ObjOne" object in "typeList\[3\]" field/);
    expect(returned.results).to.deep.match(
      /Update expression should have "ObjOne" object in "typeList\[4\]" field/);
  });

  it('should allow clear operation on object list', () => {
    const context = mkContext('ObjectListTest');
    const expression = { typeList: { clear: true } };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('error if clear operation is applied to required object list', () => {
    const context = mkContext('ObjectListTest');
    const expression = { reqList: { clear: true } };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /has a "clear" operator in "reqList"/);
    expect(returned.results).to.deep.match(
      /Clear operator can not be applied to a required field\./);
  });

  it('should allow {clear: false} operation on required object list', () => {
    const context = mkContext('ObjectListTest');
    const expression = { reqList: { clear: false } };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('should allow pop operation on object list', () => {
    const context = mkContext('ObjectListTest');
    const expression = {
      typeList: { pop: 'first' },
      reqList: { pop: 'last' },
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('error if pop operation on object list is invalid', () => {
    const context = mkContext('ObjectListTest');
    const expression = {
      typeList: { pop: { first: true } },
      reqList: { pop: 1 },
      interList: { pop: 'first', foo: 'bar' },
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(3);
    expect(returned.results).to.deep.match(
      /has an invalid "pop" operator in "typeList"/);
    expect(returned.results).to.deep.match(
      /has an invalid "pop" operator in "reqList"/);
    expect(returned.results).to.deep.match(
      /has an invalid "foo" operator in "interList"/);
  });

  it('should allow delete op with array on object list', () => {
    const context = mkContext('ObjectListTest');
    const expression = {
      typeList: {
        delete: [
          { name: 'foo' },
          { name: 'bar' },
        ]
      },
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('should allow delete op with filter on object list', () => {
    const context = mkContext('ObjectListTest');
    const expression = {
      typeList: {
        delete: { name: { eq: 'foo' } }
      },
      reqList: {
        delete: { intList: { some: 21 } }
      },
      interList: {
        delete: {
          name: 'bar'
        }
      },
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('error if delete op has invalid filter on object list', () => {
    const context = mkContext('ObjectListTest');
    const expression = {
      typeList: {
        delete: { name: { eq: 21 } }
      },
      reqList: {
        delete: { intList: { some: 'foo' } }
      },
      interList: {
        delete: {
          name: false
        }
      },
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(3);
    expect(returned.results).to.deep.match(
      /has "eq" operator with invalid value within "typeList\.delete\.name"/);
    expect(returned.results).to.deep.match(
      /has an invalid scalar value within "reqList\.delete\.intList\.some"/);
    expect(returned.results).to.deep.match(
      /has an invalid scalar value within "interList\.delete\.name"/);
  });

  it('error if delete op has invalid obj element on object list', () => {
    const context = mkContext('ObjectListTest');
    const expression = {
      typeList: {
        delete: [ { foo: 'bar' } ]
      },
      reqList: {
        delete: [ [ { name: 'foo' } ] ]
      },
      interList: {
        delete: [ 'foo' ]
      },
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(3);
    expect(returned.results).to.deep.match(
      /cannot have an undefined field "typeList\.delete\[0\]\.foo"/);
    expect(returned.results).to.deep.match(
      /should have "ObjOne" object in "reqList\.delete\[0\]" field/);
    expect(returned.results).to.deep.match(
      /should have "InterfaceOne" object in "interList\.delete\[0\]" field/);
  });

  it('should allow insert op with object or array on object list', () => {
    const context = mkContext('ObjectListTest');
    const expression = {
      typeList: {
        insert: [
          { name: 'foo' },
          { name: 'bar' },
        ]
      },
      reqList: {
        insert: { name: 'baz' }
      },
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('error if element of insert op array on object list is wrong', () => {
    const context = mkContext('ObjectListTest');
    const expression = {
      typeList: {
        insert: [
          { name: 'foo' },
          { name: 'bar' },
          { foo: 'boom' },
        ]
      },
      reqList: {
        insert: [ 123 ]
      },
      interList: {
        insert: 123
      },
    };

    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(3);
    expect(returned.results).to.deep.match(
      /cannot have an undefined field "typeList\.insert\[2\]\.foo"/);
    expect(returned.results).to.deep.match(
      /should have "ObjOne" object in "reqList\.insert\[0\]" field/);
    expect(returned.results).to.deep.match(
      /has an "insert" operator with invalid value in "interList" field/);
  });


  it('should allow insert at a position in object list', () => {
    const context = mkContext('ObjectListTest');
    const expression = {
      typeList: {
        insert: [
          { name: 'foo' },
          { name: 'bar' },
        ],
        at: 0
      }
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('should allow insert ascending in object list', () => {
    const context = mkContext('ObjectListTest');
    const expression = {
      typeList: {
        insert: [
          { name: 'foo' },
          { name: 'bar' },
        ],
        ascending: 'name'
      }
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('should allow insert descending in object list', () => {
    const context = mkContext('ObjectListTest');
    const expression = {
      typeList: {
        insert: [
          { name: 'foo' },
          { name: 'bar' },
        ],
        descending: 'name'
      }
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('error if asc/desc is not passed a scalar field name in obj list', () => {
    const context = mkContext('ObjectListTest');
    const expression = {
      typeList: {
        insert: [
          { name: 'foo' },
          { name: 'bar' },
        ],
        ascending: true
      },
      reqList: {
        insert: [
          { name: 'foo' },
          { name: 'bar' },
        ],
        ascending: 'goo'
      }
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(2);
    expect(returned.results).to.deep.match(
      /has "ascending" operator with invalid value in "typeList" field\./);
    expect(returned.results).to.deep.match(
      /has "ascending" operator with invalid value in "reqList" field\./);
    expect(returned.results).to.deep.match(
      /be "String" scalar with one of the following values: name, count\./);
  });

  it('error if asc/desc is used on interface or union type in obj list', () => {
    const context = mkContext('ObjectListTest');
    const expression = {
      interList: {
        insert: [
          { name: 'foo' },
          { name: 'bar' },
        ],
        ascending: 'name'
      },
      unionList: {
        insert: [
          { name: 'foo' },
          { name: 'bar' },
        ],
        ascending: 'count'
      }
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(2);
    expect(returned.results).to.deep.match(
      /has an invalid "ascending" operator in "interList" field\./);
    expect(returned.results).to.deep.match(
      /has an invalid "ascending" operator in "unionList" field\./);
    expect(returned.results).to.deep.match(
      /Allowed operators are: "insert", "at", "keepFirst", "keepLast"\./);
  });


  it('should allow insert keepFirst in object list', () => {
    const context = mkContext('ObjectListTest');
    const expression = {
      typeList: {
        insert: [
          { name: 'foo' },
          { name: 'bar' },
        ],
        keepFirst: 5
      }
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('should allow insert keepLast in object list', () => {
    const context = mkContext('ObjectListTest');
    const expression = {
      typeList: {
        insert: [
          { name: 'foo' },
          { name: 'bar' },
        ],
        keepLast: 5
      }
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('should allow insert keepFirst and keepLast in object list', () => {
    const context = mkContext('ObjectListTest');
    const expression = {
      typeList: {
        insert: [
          { name: 'foo' },
          { name: 'bar' },
        ],
        keepFirst: 5,
        keepLast: 5,
      }
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(0);
  });

  it('error if insert, at, asc and desc are combined on object list', () => {
    const context = mkContext('ObjectListTest');
    const expression = {
      typeList: {
        insert: [
          { name: 'foo' },
          { name: 'bar' },
        ],
        ascending: 'name',
        descending: 'name',
      },
      reqList: {
        insert: { name: 'foo' },
        at: 0,
        descending: 'count'
      },
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(2);
    expect(returned.results).to.deep.match(
      /has an invalid operator expression in "typeList"/);
    expect(returned.results).to.deep.match(
      /has an invalid operator expression in "reqList"/);
    expect(returned.results).to.deep.match(
    /at most one of the following operators: "at", "ascending", "descending"/);
  });

  it('error if at, keepFirst/Last ops have wrong type on object list', () => {
    const context = mkContext('ObjectListTest');
    const expression = {
      typeList: {
        insert: [
          { name: 'foo' },
          { name: 'bar' }
        ],
        keepLast: 'boom',
      },
      reqList: {
        insert: { name: 'foo' },
        at: 'boom',
        keepFirst: 'boom',
      },
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(3);
    expect(returned.results).to.deep.match(
      /has "keepLast" operator with invalid value in "typeList"/);
    expect(returned.results).to.deep.match(
      /Value passed to "keepLast" operator must be "Int" scalar\./);
    expect(returned.results).to.deep.match(
      /has "at" operator with invalid value in "reqList"/);
    expect(returned.results).to.deep.match(
      /Value passed to "at" operator must be "Int" scalar\./);
    expect(returned.results).to.deep.match(
      /has "keepFirst" operator with invalid value in "reqList"/);
    expect(returned.results).to.deep.match(
      /Value passed to "keepFirst" operator must be "Int" scalar\./);
  });

  it('error if unknown operators are on insert/delete on object list', () => {
    const context = mkContext('ObjectListTest');
    const expression = {
      typeList: {
        insert: [
          { name: 'foo' },
          { name: 'bar' }
        ],
        foo: 'bar',
      },
      reqList: {
        bar: 'foo',
      },
      interList: {
        delete: [ { name: 'foo' } ],
        baz: 'zaz',
      }
    };
    const returned = validateUpdate(context, expression);
    expect(returned.results).to.have.length(3);
    expect(returned.results).to.deep.match(
      /has an invalid "foo" operator in "typeList"/);
    expect(returned.results).to.deep.match(
      /"insert", "at", "ascending", "descending", "keepFirst", "keepLast"/);
    expect(returned.results).to.deep.match(
      /has an unexpected value in "reqList"/);
    expect(returned.results).to.deep.match(
      /Expected "ObjOne" object array or "insert", "delete", "pop", "clear"/);
    expect(returned.results).to.deep.match(
      /has an invalid "baz" operator in "interList"/);
    expect(returned.results).to.deep.match(
      /Allowed operators are: "delete"\./);
  });
});
