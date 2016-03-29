import strip from '../../../jsutils/strip';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { parse, analyzeAST, validate } from '../../../schema';
import { validateNode } from '../validateNode';

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
  function: 'addNode'
});

const validScalarValues = {
  optInt: 100,
  reqInt: 200,
  optFloat: 300.300,
  reqFloat: 400.400,
  optStr: 'str500',
  reqStr: 'str600',
  optBoolean: true,
  reqBoolean: false,
  optId: 'id700',
  reqId: 'id800',
  optEnum: 'VALID_ONE',
  reqEnum: 'VALID_TWO',
  optIntList: [ 9, 10, 11 ],
  reqIntList: [ 12, 13, 14 ],
  optFloatList: [ 15.1, 16.1, 17.1 ],
  reqFloatList: [ 18.1, 19.1, 20.1 ],
  optStrList: [ 'str21', 'str22', 'str23' ],
  reqStrList: [ 'str24', 'str25', 'str26' ],
  optBooleanList: [ true, false, true, false ],
  reqBooleanList: [ false, true, false, true ],
  optIdList: [ 'id27', 'id28', 'id29' ],
  reqIdList: [ 'id30', 'id31', 'id32' ],
  optEnumList: [ 'VALID_ONE', 'VALID_ONE', 'VALID_TWO' ],
  reqEnumList: [ 'VALID_TWO', 'VALID_TWO', 'VALID_ONE' ],
};

const validNodeValues = {
  id: '-K9-64SKOO2gfgGMiB-D-dF45m9K8dF45h56J',
  name: 'NodeValuesTest',

  nodeRef: '-K9-5wfqFs50AC595vGB-dF45m9K8i31C1IJ',
  nodeInterfaceRef: '-K9-69xj0RCQgEav-m3t-dF45m9K8dF45h56J', // NodeWithNodeRefs
  nodeUnionRef: '-K9-6KtpDAIR5xUDbzea-dF45m9K8i31C1IJ', // NodeWithScalars

  nodeRefList: [
    '-K9-6U0wKa1M03XMXkrB-dF45m9K8i31C1IJ',
    '-K9-6UBKNLKi3qku1oOh-dF45m9K8i31C1IJ',
    '-K9-6UO3lydP5QoQotX5-dF45m9K8i31C1IJ',
  ],
  nodeInterfaceRefList: [
    '-K9-6opOlwyEXMUhqta--dF45m9K8TFEE53K9FEJ', // NodeWithConnections
    '-K9-6uuS3TBglhd0fPdm-dF45m9K8dF45h56J', // NodeWithNodeRefs
    '-K9-6r4Fcn1Q-kUTXLcY-dF45m9K8TFEE53K9FEJ', // NodeWithConnections
  ],
  nodeUnionRefList: [
    '-K9-77HDWli_ERcEHPGK-dF45m9K8dF45h56J', // NodeWithNodeRefs
    '-K9-7CJE8xdK0GvrzuUA-dF45m9K8i31C1IJ', // NodeWithScalars
    '-K9-78sofiD9c2RHgubT-dF45m9K8dF45h56J', // NodeWithNodeRefs
  ]
};

describe('mutations / validator / validateNode', () => {
  it('test schema is valid', () => {
    expect(validationResult).to.have.length(0);
  });

  it('throws when context is not passed', () => {
    expect(validateNode).to.throw(Error, /must pass context/);
  });

  it('throws when invalid context is passed', () => {
    let invalidCall = validateNode.bind(null, { });
    expect(invalidCall).to.throw(Error, /must pass Node context/);

    invalidCall = validateNode.bind(null, { schema: { } });
    expect(invalidCall).to.throw(Error, /must pass Node context/);

    invalidCall = validateNode.bind(null, { schema: { }, type: 'Foo' });
    expect(invalidCall).to.throw(Error, /must pass Node context/);

    invalidCall = validateNode.bind(null, { schema: { Foo: {} }, type: 'Foo' });
    expect(invalidCall).to.throw(Error, /must pass Node context/);

    invalidCall = validateNode.bind(
      null,
      { schema: { Foo: { kind: 'interface'} }, type: 'Foo' });
    expect(invalidCall).to.throw(Error, /must pass Node context/);
  });

  it('error if node is nullish, array or scalar', () => {
    const context = mkContext('NodeWithScalars');
    let returned = validateNode(context, null);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /Value passed to addNode must be a node object\./);

    returned = validateNode(context);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /Value passed to addNode must be a node object\./);

    returned = validateNode(context, 123);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /Value passed to addNode must be a node object\./);

    returned = validateNode(context, [ { } ]);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /Value passed to addNode must be a node object\./);
  });

  it('returns error if object id is not provided', () => {
    const context = mkContext('NodeWithScalars');
    const input = { };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.include(
      'Object passed to addNode is missing an id field.');
  });

  it('returns error if object id is not correctly formatted', () => {
    const context = mkContext('NodeWithScalars');
    let input = { id: 123 };
    let returned = validateNode(context, input);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.include(
      'Object passed to addNode has an invalid id field.');

    input = { id: '123' };
    returned = validateNode(context, input);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.include(
      'Object passed to addNode has an invalid id field.');

    input = { id: '12345678901234567890+' };
    returned = validateNode(context, input);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.include(
      'Object passed to addNode has an invalid id field.');
  });

  it('returns error if object id is not of correct type', () => {
    const context = mkContext('NodeWithScalars');
    const input = { id: '-K98IE4R2Rki6QzE3lDX-WFF' };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.include(
      strip`Object passed to addNode has an id field for "Foo" type where an id
           ~ for "NodeWithScalars" type is expected.`);
  });

  it('returns error if object has connection fields', () => {
    const context = mkContext('NodeWithConnections');
    const input = {
      id: '-K8zrcHkzVj3yTxs1lSW-dF45m9K8TFEE53K9FEJ',
      name: 'TestConns',
      scalarConn: [ ],
      objectConn: [ ],
      nodeConn: [ ]
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(3);
    expect(returned.results).to.include(
      'Object passed to addNode cannot have a connection field "scalarConn".');
    expect(returned.results).to.include(
      'Object passed to addNode cannot have a connection field "objectConn".');
    expect(returned.results).to.include(
      'Object passed to addNode cannot have a connection field "nodeConn".');
  });

  it('okay if connection fields are not specified', () => {
    const context = mkContext('NodeWithConnections');
    const input = {
      id: '-K8zrcHkzVj3yTxs1lSW-dF45m9K8TFEE53K9FEJ',
      name: 'TestConns',
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(0);
  });

  it('error if undefined fields are specified', () => {
    const context = mkContext('NodeWithConnections');
    const input = {
      id: '-K8zrcHkzVj3yTxs1lSW-dF45m9K8TFEE53K9FEJ',
      name: 'TestConns',
      undefined1: 'foo',
      undefined2: 'bar',
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(2);
    expect(returned.results).to.include(
      'Object passed to addNode cannot have an undefined field "undefined1".');
    expect(returned.results).to.include(
      'Object passed to addNode cannot have an undefined field "undefined2".');
  });

  it('error if required fields are not specified', () => {
    const context = mkContext('NodeWithScalars');
    const input = {
      id: '-K8zyRqrnPhQk70SQePR-dF45m9K8i31C1IJ',
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(12);
    expect(returned.results).to.include(
      'Object passed to addNode must have a required field "reqInt".');
    expect(returned.results).to.include(
      'Object passed to addNode must have a required field "reqFloat".');
    expect(returned.results).to.include(
      'Object passed to addNode must have a required field "reqStr".');
    expect(returned.results).to.include(
      'Object passed to addNode must have a required field "reqBoolean".');
    expect(returned.results).to.include(
      'Object passed to addNode must have a required field "reqId".');
    expect(returned.results).to.include(
      'Object passed to addNode must have a required field "reqEnum".');
    expect(returned.results).to.include(
      'Object passed to addNode must have a required field "reqIntList".');
    expect(returned.results).to.include(
      'Object passed to addNode must have a required field "reqFloatList".');
    expect(returned.results).to.include(
      'Object passed to addNode must have a required field "reqStrList".');
    expect(returned.results).to.include(
      'Object passed to addNode must have a required field "reqBooleanList".');
    expect(returned.results).to.include(
      'Object passed to addNode must have a required field "reqIdList".');
    expect(returned.results).to.include(
      'Object passed to addNode must have a required field "reqEnumList".');
  });

  it('ok if specified scalars and lists of scalars are valid', () => {
    const context = mkContext('NodeWithScalars');
    const input = {
      id: '-K8zyRqrnPhQk70SQePR-dF45m9K8i31C1IJ',
      ...validScalarValues,
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(0);
  });

  it('error if optional Int value is invalid', () => {
    const context = mkContext('NodeWithScalars');
    const input = {
      id: '-K8zyRqrnPhQk70SQePR-dF45m9K8i31C1IJ',
      ...validScalarValues,
      optInt: '100',
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.include(
      'Object passed to addNode should have "Int" value in field "optInt".');
  });

  it('error if required Int value is invalid', () => {
    const context = mkContext('NodeWithScalars');
    const input = {
      id: '-K8zyRqrnPhQk70SQePR-dF45m9K8i31C1IJ',
      ...validScalarValues,
      reqInt: '200',
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.include(
      'Object passed to addNode should have "Int" value in field "reqInt".');
  });

  it('error if Float value is invalid', () => {
    const context = mkContext('NodeWithScalars');
    const input = {
      id: '-K8zyRqrnPhQk70SQePR-dF45m9K8i31C1IJ',
      ...validScalarValues,
      optFloat: 'foobar',
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /Object passed to addNode should have "Float" value in field "optFloat"/);
  });

  it('error if String value is invalid', () => {
    const context = mkContext('NodeWithScalars');
    const input = {
      id: '-K8zyRqrnPhQk70SQePR-dF45m9K8i31C1IJ',
      ...validScalarValues,
      reqStr: 123,
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.include(
      'Object passed to addNode should have "String" value in field "reqStr".');
  });

  it('error if Boolean value is invalid', () => {
    const context = mkContext('NodeWithScalars');
    const input = {
      id: '-K8zyRqrnPhQk70SQePR-dF45m9K8i31C1IJ',
      ...validScalarValues,
      optBoolean: 'false',
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(1);
    expect(returned.results)
      .to.deep.match(/should have "Boolean" value in field "optBoolean"/);
  });

  it('error if ID value is invalid', () => {
    const context = mkContext('NodeWithScalars');
    const input = {
      id: '-K8zyRqrnPhQk70SQePR-dF45m9K8i31C1IJ',
      ...validScalarValues,
      reqId: 123,
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(1);
    expect(returned.results)
      .to.deep.match(/should have "ID" value in field "reqId"/);
  });

  it('error if enum value is invalid', () => {
    const context = mkContext('NodeWithScalars');
    const input = {
      id: '-K8zyRqrnPhQk70SQePR-dF45m9K8i31C1IJ',
      ...validScalarValues,
      optEnum: 'FOO',
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(1);
    expect(returned.results)
      .to.deep.match(/should have "MyEnum" value in field "optEnum"/);
  });

  it('error if list value is invalid', () => {
    const context = mkContext('NodeWithScalars');
    const input = {
      id: '-K8zyRqrnPhQk70SQePR-dF45m9K8i31C1IJ',
      ...validScalarValues,
      reqFloatList: [ 12.21, 'Foo' ],
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(1);
    expect(returned.results)
      .to.deep.match(/should have an array of "Float" in field "reqFloatList"/);
  });

  it('okay if node and node list values are correct', () => {
    const context = mkContext('NodeWithNodeRefs');
    const input = validNodeValues;
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(0);
  });

  it('okay if non-required node field is undefined', () => {
    const context = mkContext('NodeWithNodeRefs');
    const input = {
      ...validNodeValues,
      nodeRef: undefined,
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(0);
  });

  it('okay if non-required node list field is undefined', () => {
    const context = mkContext('NodeWithNodeRefs');
    const input = {
      ...validNodeValues,
      nodeUnionRefList: undefined,
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(0);
  });

  it('okay if node list field is empty', () => {
    const context = mkContext('NodeWithNodeRefs');
    const input = {
      ...validNodeValues,
      nodeUnionRefList: [ ],
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(0);
  });

  it('error if node field gets incorrectly formatted node id', () => {
    const context = mkContext('NodeWithNodeRefs');
    let input = {
      ...validNodeValues,
      nodeRef: 123,
    };
    let returned = validateNode(context, input);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /should have "NodeWithScalars" Node ID in field "nodeRef"/);

    input = {
      ...validNodeValues,
      nodeRef: '123',
    };
    returned = validateNode(context, input);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /should have "NodeWithScalars" Node ID in field "nodeRef"/);

    input = {
      ...validNodeValues,
      nodeRef: '12345678901234567890+f',
    };
    returned = validateNode(context, input);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /should have "NodeWithScalars" Node ID in field "nodeRef"/);

    input = {
      ...validNodeValues,
      nodeRef: '12345678901234567890-NodeWithScalars',
    };
    returned = validateNode(context, input);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /should have "NodeWithScalars" Node ID in field "nodeRef"/);

    input = {
      ...validNodeValues,
      nodeRef: '-K9-A2offzrGImfSOJfz-dF45m9K8TFEE53K9FEJ',
    };
    returned = validateNode(context, input);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /should have "NodeWithScalars" Node ID in field "nodeRef"/);
  });

  it('error if interface node field gets node id of incorrect type', () => {
    const context = mkContext('NodeWithNodeRefs');
    const input = {
      ...validNodeValues,
      nodeInterfaceRef: '-K9-AlSYkdaE2BWW7YHe-d1D54',
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /should have "Named" Node ID in field "nodeInterfaceRef"/);
  });

  it('error if union node field gets node id of incorrect type', () => {
    const context = mkContext('NodeWithNodeRefs');
    const input = {
      ...validNodeValues,
      nodeUnionRef: '-K9-B-eHTHEs4SYkaCy2-dF45kE9FE',
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /should have "NodeUnion" Node ID in field "nodeUnionRef"/);
  });

  it('error if node list field gets something that is not a list', () => {
    const context = mkContext('NodeWithNodeRefs');
    const input = {
      ...validNodeValues,
      nodeRefList: 123,
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /have an array of "NodeWithScalars" Node IDs in field "nodeRefList"/);
  });

  it('error if node list field gets an element of incorrect type', () => {
    const context = mkContext('NodeWithNodeRefs');
    const input = {
      ...validNodeValues,
      nodeRefList: [
        '-K9-Bg07DoqqG9u71gez-dF45m9K8dF45h56J',
        '-K9-CKZw0__G6OaW48yD-WFF',
      ],
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /have an array of "NodeWithScalars" Node IDs in field "nodeRefList"/);
  });

  it('error if node interface list field gets an element of incorrect type',
  () => {
    const context = mkContext('NodeWithNodeRefs');
    const input = {
      ...validNodeValues,
      nodeInterfaceRefList:
        validNodeValues.nodeInterfaceRefList.concat([
          '-K92hry1QL3N_0BJaCuW-d1D54' // Named
        ])
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /have an array of "Named" Node IDs in field "nodeInterfaceRefList"/);
  });

  it('error if node union list field gets an element of incorrect type', () => {
    const context = mkContext('NodeWithNodeRefs');
    const input = {
      ...validNodeValues,
      nodeUnionRefList:
        validNodeValues.nodeUnionRefList.concat([
          '-K92jbaKF-EL4304G9kK-dF45kE9FE' // NodeUnion
        ])
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /have an array of "NodeUnion" Node IDs in field "nodeUnionRefList"/);
  });

  it('error if required field is missing in a nested object', () => {
    const context = mkContext('SimpleObjTest');
    const input = {
      id: '-K937TJrcWUvqZfF6rCb-i9DGC5e2Aj5JK',
      simpleObj: { }
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /must have a required field "simpleObj\.name"/);
  });

  it('error if scalar field type is wrong in a nested object', () => {
    const context = mkContext('SimpleObjTest');
    const input = {
      id: '-K937TJrcWUvqZfF6rCb-i9DGC5e2Aj5JK',
      simpleObj: { name: 123 }
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /have "String" value in field "simpleObj\.name"/);
  });

  it('error if list field type is wrong in a nested object', () => {
    const context = mkContext('SimpleObjTest');
    const input = {
      id: '-K937TJrcWUvqZfF6rCb-i9DGC5e2Aj5JK',
      simpleObj: { name: '123', int: 123, list: 123 }
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /have an array of "MyEnum" in field "simpleObj\.list"/);
  });

  it('error if list element type is wrong in a nested object', () => {
    const context = mkContext('SimpleObjTest');
    const input = {
      id: '-K937TJrcWUvqZfF6rCb-i9DGC5e2Aj5JK',
      simpleObj: { name: '123', int: 123, list: [ 123 ] }
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /have an array of "MyEnum" in field "simpleObj\.list"/);
  });

  it('error if required field is missing in a deeply nested object', () => {
    const context = mkContext('NestedObjTest');
    const input = {
      id: '-K938vpdmr9TW6CK0xmw-d5JK54e2Aj5JK',
      nestedObj: {
        head: '0',
        tail: [
          { head: '1', tail: [ ] },
          { head: '2', tail: [ { } ]},
        ]
      }
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(2);
    expect(returned.results).to.deep.match(
      /must have a required field "nestedObj\.tail\[1\]\.tail\[0\]\.head"/);
    expect(returned.results).to.deep.match(
      /must have a required field "nestedObj\.tail\[1\]\.tail\[0\]\.tail"/);
  });

  it('error if scalar field type is wrong in a deeply nested object', () => {
    const context = mkContext('NestedObjTest');
    const input = {
      id: '-K938vpdmr9TW6CK0xmw-d5JK54e2Aj5JK',
      nestedObj: {
        head: '0',
        tail: [
          { head: '1', tail: [ ] },
          { head: '2', tail: [ { head: 21, tail: [ ] } ]},
        ]
      }
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /have "String" value in field "nestedObj\.tail\[1\]\.tail\[0\]\.head/);
  });

  it('error if list field type is wrong in a deeply nested object', () => {
    const context = mkContext('NestedObjTest');
    const input = {
      id: '-K938vpdmr9TW6CK0xmw-d5JK54e2Aj5JK',
      nestedObj: {
        head: '0',
        tail: [
          { head: '1', tail: [ ] },
          { head: '2', tail: [ { head: '21', tail: 'boom!' } ]},
        ]
      }
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /array of "NestedObj" objects.* "nestedObj\.tail\[1\]\.tail\[0\]\.tail"/);
  });

  it('error if list element type is wrong in a nested object', () => {
    const context = mkContext('NestedObjTest');
    const input = {
      id: '-K938vpdmr9TW6CK0xmw-d5JK54e2Aj5JK',
      nestedObj: {
        head: '0',
        tail: [
          { head: '1', tail: [ ] },
          { head: '2', tail: [ { head: '21', tail: [ [ ], 'foo' ] } ]},
        ]
      }
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(2);
    expect(returned.results).to.deep.match(
      /"NestedObj" object in "nestedObj\.tail\[1\]\.tail\[0\]\.tail\[0\]"/);
    expect(returned.results).to.deep.match(
      /"NestedObj" object in "nestedObj\.tail\[1\]\.tail\[0\]\.tail\[1\]"/);
  });

  it('refs to interfaces are disambiguated if there is one object type', () => {
    const context = mkContext('DisambiguationTest');
    const input = {
      id: '-K93KXcK_Cbgttd0XlYP-U9J1D297L1K9FEj5JK',
      interfaceOne: {
        name: 'Foo',
        count: 21
      }
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(0);
  });

  it('error if ref to interface field is ambiguous', () => {
    const context = mkContext('DisambiguationTest');
    const input = {
      id: '-K93KXcK_Cbgttd0XlYP-U9J1D297L1K9FEj5JK',
      interfaceTwo: {
        name: 'Foo',
        count: 21
      }
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /must disambiguate object type with "_type" in "interfaceTwo"/);
  });

  it('error if ref to interface field is ambiguous and _type is wrong', () => {
    const context = mkContext('DisambiguationTest');
    const input = {
      id: '-K93KXcK_Cbgttd0XlYP-U9J1D297L1K9FEj5JK',
      interfaceTwo: {
        _type: 'Boom',
        name: 'Foo',
        count: 21
      }
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /contains object with an invalid "_type" value in "interfaceTwo"/);
  });

  it('okay if ref to interface field is ambiguous and _type is given', () => {
    const context = mkContext('DisambiguationTest');
    const input = {
      id: '-K93KXcK_Cbgttd0XlYP-U9J1D297L1K9FEj5JK',
      interfaceTwo: {
        _type: 'ObjTwoCost',
        name: 'Bar',
        cost: 21.12
      }
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(0);
  });

  it('refs to unions are disambiguated if there is one object type', () => {
    const context = mkContext('DisambiguationTest');
    const input = {
      id: '-K93KXcK_Cbgttd0XlYP-U9J1D297L1K9FEj5JK',
      unionOne: {
        name: 'Foo',
        count: 21
      }
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(0);
  });

  it('error if ref to union field is ambiguous', () => {
    const context = mkContext('DisambiguationTest');
    const input = {
      id: '-K93KXcK_Cbgttd0XlYP-U9J1D297L1K9FEj5JK',
      unionTwo: {
        name: 'Foo',
        count: 21
      }
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /must disambiguate object type with "_type" in "unionTwo"/);
  });

  it('error if ref to union field is ambiguous and _type is wrong', () => {
    const context = mkContext('DisambiguationTest');
    const input = {
      id: '-K93KXcK_Cbgttd0XlYP-U9J1D297L1K9FEj5JK',
      unionTwo: {
        _type: 'Boom',
        name: 'Foo',
        count: 21
      }
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(1);
    expect(returned.results).to.deep.match(
      /contains object with an invalid "_type" value in "unionTwo"/);
  });

  it('okay if ref to union field is ambiguous and _type is given', () => {
    const context = mkContext('DisambiguationTest');
    const input = {
      id: '-K93KXcK_Cbgttd0XlYP-U9J1D297L1K9FEj5JK',
      unionTwo: {
        _type: 'ObjTwoCost',
        name: 'Bar',
        cost: 21.12
      }
    };
    const returned = validateNode(context, input);
    expect(returned.results).to.have.length(0);
  });

});
