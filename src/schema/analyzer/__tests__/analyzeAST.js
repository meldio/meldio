import { expect } from 'chai';
import { describe, it } from 'mocha';
import { parse } from '../../language/parser';
import { analyzeAST } from '../analyzeAST';

const runTest = str => analyzeAST(parse(str, { noLocation: true }));

const mkEnum = (name, values) => ({
  kind: 'enum',
  name,
  values
});

const field = (name, isRequired, kind, type, hasArguments, directives) => ({
  kind: 'field',
  name,
  isRequired,
  ...kind,
  type,
  hasArguments,
  directives: directives || [ ]
});

const argument = (name, isRequired, kind, type) =>
  ({ kind: 'argument', name, isRequired, ...kind, type });

const directive = (name, args) => ({kind: 'directive', name, arguments: args});
const directiveArg = (name, type, value) =>
  ({ kind: 'directive-argument', name, type, value });

const scalar = {isScalar: true};
const numeric = {isScalar: true, isNumeric: true};
const object = {isObject: true};
const node = {isNode: true};
const objectList = {isObjectList: true};
const nodeList = {isNodeList: true};
const scalarList = {isScalarList: true};

const scalarConnection = edgeType => ({
  isScalarConnection: true,
  edgeType: edgeType || null,
});

const edge = edgeType => ({
  isEdge: true,
  edgeType: edgeType || null,
});

const objectConnection = edgeType => ({
  isObjectConnection: true,
  edgeType: edgeType || null,
});

const nodeConnection = (relatedField, edgeType) => ({
  isNodeConnection: true,
  relatedField,
  edgeType: edgeType || null,
});

const expectNode = implementations => ({
  Node: {
    kind: 'interface',
    name: 'Node',
    implementations,
    everyTypeImplementsNode: true,
    noTypeImplementsNode: false,
    fields: [ {
      kind: 'field',
      name: 'id',
      isRequired: true,
      isScalar: true,
      type: 'ID',
      hasArguments: false,
      directives: [] } ],
    isSystemDefined: true,
    directives: [ ]
  }
});

const objectValue = (obj, isEnum) => {
  if (typeof obj === 'number') {
    return {
      kind: 'IntValue',
      loc: null,
      value: String(obj)
    };
  } else if (typeof obj === 'string') {
    return obj.startsWith('$') ? {
      kind: 'Variable',
      loc: null,
      name: {
        kind: 'Name',
        loc: null,
        value: obj.slice(1)
      }
    } : {
      kind: isEnum ? 'EnumValue' : 'StringValue',
      loc: null,
      value: String(obj)
    };
  } else if (typeof obj === 'object') {
    return {
      kind: 'ObjectValue',
      loc: null,
      fields: Object.keys(obj).map(key => ({
        kind: 'ObjectField',
        loc: null,
        name: {
          kind: 'Name',
          loc: null,
          value: key
        },
        value: objectValue(obj[key], isEnum)
      }))
    };
  }
};

describe('analyzeAST', () => {
  it('Throws when ast is not passed', () => {
    expect(analyzeAST).to.throw(Error, /must pass ast/);
  });

  it('Identifies enums as scalars', () => {
    const test = `
      enum SimpleEnum { FIRST_VALUE, SECOND_VALUE, THIRD_VALUE }
      enum ComplexEnum { ONE, TWO, THREE, BOOM }

      type TestEnums {
        simpleEnum: SimpleEnum
        simpleEnumRequired: SimpleEnum!
        complexEnum: ComplexEnum
        complexEnumRequired: ComplexEnum!
      } `;
    const expectedOutput = {
      SimpleEnum:
        mkEnum('SimpleEnum', [ 'FIRST_VALUE', 'SECOND_VALUE', 'THIRD_VALUE' ]),
      ComplexEnum:
        mkEnum('ComplexEnum',[ 'ONE', 'TWO', 'THREE', 'BOOM' ]),
      TestEnums: {
        kind: 'type',
        name: 'TestEnums',
        implementsInterfaces: [ ],
        implementsNode: false,
        memberOfUnions: [ ],
        fields: [
          field('simpleEnum', false, scalar, 'SimpleEnum', false),
          field('simpleEnumRequired', true, scalar, 'SimpleEnum', false),
          field('complexEnum', false, scalar, 'ComplexEnum', false),
          field('complexEnumRequired', true, scalar, 'ComplexEnum', false)
        ],
        directives: [ ]
      },
      ...expectNode([ ]),
    };

    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies Int and Float as scalars and numerics', () => {
    const test = `
      type TestNumerics {
        int: Int
        reqInt: Int!
        float: Float
        reqFloat: Float!
      } `;
    const expectedOutput = {
      TestNumerics: {
        kind: 'type',
        name: 'TestNumerics',
        implementsInterfaces: [ ],
        implementsNode: false,
        memberOfUnions: [ ],
        fields: [
          field('int', false, numeric, 'Int', false),
          field('reqInt', true, numeric, 'Int', false),
          field('float', false, numeric, 'Float', false),
          field('reqFloat', true, numeric, 'Float', false) ],
        directives: [ ]
      },
      ...expectNode([ ]),
    };

    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies String, ID and Boolean as scalars', () => {
    const test = `
      type TestScalars {
        str: String
        strReq: String!
        id: ID
        idReq: ID!
        bool: Boolean
        boolReq: Boolean!
      } `;
    const expectedOutput = {
      TestScalars: {
        kind: 'type',
        name: 'TestScalars',
        implementsInterfaces: [ ],
        implementsNode: false,
        memberOfUnions: [ ],
        fields: [
          field('str', false, scalar, 'String', false),
          field('strReq', true, scalar, 'String', false),
          field('id', false, scalar, 'ID', false),
          field('idReq', true, scalar, 'ID', false),
          field('bool', false, scalar, 'Boolean', false),
          field('boolReq', true, scalar, 'Boolean', false) ],
        directives: [ ]
      },
      ...expectNode([ ]),
    };

    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies objects, interfaces, unions and lists of objects', () => {
    const test = `
      interface Character {
        id: ID!
        name: String
        friends: [Character]
      }
      type Human implements Character {
        id: ID!
        name: String
        friends: [Character]
        homePlanet: String
      }
      type Droid implements Character {
        id: ID!
        name: String
        friends: [Character]
        owners: [Human]
        purpose: [String]
      }

      union Crew = Human | Droid

      type Ship {
        id: ID!
        captain: Human!
        crew: [Crew]
        crewReq: [Crew!]
        reqCrew: [Crew]!
        reqCrewReq: [Crew!]!
        hatchIDs: [ID!]
        hatchNames: [String!]!
      } `;
    const expectedOutput = {
      Human: {
        kind: 'type',
        name: 'Human',
        implementsInterfaces: [ 'Character' ],
        implementsNode: false,
        memberOfUnions: [ 'Crew' ],
        fields: [
          field('id', true, scalar, 'ID', false),
          field('name', false, scalar, 'String', false),
          field('friends', false, objectList, 'Character', false),
          field('homePlanet', false, scalar, 'String', false) ],
        directives: [ ]
      },
      Droid: {
        kind: 'type',
        name: 'Droid',
        implementsInterfaces: [ 'Character' ],
        implementsNode: false,
        memberOfUnions: [ 'Crew' ],
        fields: [
          field('id', true, scalar, 'ID', false),
          field('name', false, scalar, 'String', false),
          field('friends', false, objectList, 'Character', false),
          field('owners', false, objectList, 'Human', false),
          field('purpose', false, scalarList, 'String', false) ],
        directives: [ ]
      },
      Ship: {
        kind: 'type',
        name: 'Ship',
        implementsInterfaces: [],
        implementsNode: false,
        memberOfUnions: [ ],
        fields: [
          field('id', true, scalar, 'ID', false),
          field('captain', true, object, 'Human', false),
          field('crew', false, objectList, 'Crew', false),
          field('crewReq', false, objectList, 'Crew', false),
          field('reqCrew', true, objectList, 'Crew', false),
          field('reqCrewReq', true, objectList, 'Crew', false),
          field('hatchIDs', false, scalarList, 'ID', false),
          field('hatchNames', true, scalarList, 'String', false) ],
        directives: [ ]
      },
      ...expectNode([ ]),
      Character: {
        kind: 'interface',
        name: 'Character',
        implementations: [ 'Human', 'Droid' ],
        everyTypeImplementsNode: false,
        noTypeImplementsNode: true,
        fields: [
          field('id', true, scalar, 'ID', false),
          field('name', false, scalar, 'String', false),
          field('friends', false, objectList, 'Character', false),
        ],
        directives: [ ]
      },
      Crew: {
        kind: 'union',
        name: 'Crew',
        typeNames: [ 'Human', 'Droid' ],
        everyTypeImplementsNode: false,
        noTypeImplementsNode: true,
        directives: [ ]
      }
    };

    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies lists of lists as undefined', () => {
    const test = `
      interface Snafu {
        okay: [Snafu!]!
        undef1: [[String]]
        undef2: [[String!]]
        undef3: [[String]]!
        undef4: [[Snafu]]
        undef5: [[Snafu!]]
        undef6: [[Snafu]]!
        undef7: [[Snafu!]!]!
        undef8: [[String!]!]
        undef9: [[String!]!]!
        undef10: [[String]!]
        undef11: [[[[[[Int]]]]]]
        undef12: [[[[[[String]!]!]!]!]!]!
      }
      type Fubar {
        okay: [Fubar!]!
        undef1: [[String]]
        undef2: [[String!]]
        undef3: [[String]]!
        undef4: [[Fubar]]
        undef5: [[Fubar!]]
        undef6: [[Fubar]]!
        undef7: [[Fubar!]!]!
        undef8: [[String!]!]
        undef9: [[String!]!]!
        undef10: [[String]!]
        undef11: [[[[[[Int]]]]]]
        undef12: [[[[[[String]!]!]!]!]!]!
      } `;
    const expectedOutput = {
      Fubar: {
        kind: 'type',
        name: 'Fubar',
        implementsInterfaces: [],
        implementsNode: false,
        memberOfUnions: [ ],
        fields: [
          field('okay', true, objectList, 'Fubar', false),
          field('undef1', false, objectList, undefined, false),
          field('undef2', false, objectList, undefined, false),
          field('undef3', true, objectList, undefined, false),
          field('undef4', false, objectList, undefined, false),
          field('undef5', false, objectList, undefined, false),
          field('undef6', true, objectList, undefined, false),
          field('undef7', true, objectList, undefined, false),
          field('undef8', false, objectList, undefined, false),
          field('undef9', true, objectList, undefined, false),
          field('undef10', false, objectList, undefined, false),
          field('undef11', false, objectList, undefined, false),
          field('undef12', true, objectList, undefined, false) ],
        directives: [ ]
      },
      ...expectNode([ ]),
      Snafu: {
        kind: 'interface',
        name: 'Snafu',
        implementations: [],
        everyTypeImplementsNode: false,
        noTypeImplementsNode: true,
        fields: [
          field('okay', true, objectList, 'Snafu', false),
          field('undef1', false, objectList, undefined, false),
          field('undef2', false, objectList, undefined, false),
          field('undef3', true, objectList, undefined, false),
          field('undef4', false, objectList, undefined, false),
          field('undef5', false, objectList, undefined, false),
          field('undef6', true, objectList, undefined, false),
          field('undef7', true, objectList, undefined, false),
          field('undef8', false, objectList, undefined, false),
          field('undef9', true, objectList, undefined, false),
          field('undef10', false, objectList, undefined, false),
          field('undef11', false, objectList, undefined, false),
          field('undef12', true, objectList, undefined, false) ],
        directives: [ ]
      },
    };

    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies connections without edges correctly', () => {
    const test = `
      enum Emu { ONE, TWO }
      interface Snafu {
        conn1: ScalarConnection(Int)
        conn2: ScalarConnection(Int)!
        conn3: ScalarConnection(Boolean)
        conn4: ScalarConnection(Boolean)!
        conn5: ScalarConnection(String)
        conn6: ScalarConnection(String)!
        conn7: ScalarConnection(ID)
        conn8: ScalarConnection(ID)!
        conn9: ScalarConnection(Emu)
        conn10: ScalarConnection(Emu)!
        conn11: ObjectConnection(Snafu)
        conn12: ObjectConnection(Snafu)!
        conn13: NodeConnection(Fubar, conn14)
        conn14: NodeConnection(Fubar, conn13)!
      }
      type Fubar implements Node {
        conn1: ScalarConnection(Int)
        conn2: ScalarConnection(Int)!
        conn3: ScalarConnection(Boolean)
        conn4: ScalarConnection(Boolean)!
        conn5: ScalarConnection(String)
        conn6: ScalarConnection(String)!
        conn7: ScalarConnection(ID)
        conn8: ScalarConnection(ID)!
        conn9: ScalarConnection(Emu)
        conn10: ScalarConnection(Emu)!
        conn11: ObjectConnection(Snafu)
        conn12: ObjectConnection(Snafu)!
        conn13: NodeConnection(Fubar, conn14)
        conn14: NodeConnection(Fubar, conn13)!
      } `;
    const expectedOutput = {
      Emu: mkEnum('Emu', [ 'ONE', 'TWO' ]),
      Fubar: {
        kind: 'type',
        name: 'Fubar',
        implementsInterfaces: [ 'Node' ],
        implementsNode: true,
        memberOfUnions: [ ],
        fields: [
          field('conn1', false, scalarConnection(), 'Int', false),
          field('conn2', true, scalarConnection(), 'Int', false),
          field('conn3', false, scalarConnection(), 'Boolean', false),
          field('conn4', true, scalarConnection(), 'Boolean', false),
          field('conn5', false, scalarConnection(), 'String', false),
          field('conn6', true, scalarConnection(), 'String', false),
          field('conn7', false, scalarConnection(), 'ID', false),
          field('conn8', true, scalarConnection(), 'ID', false),
          field('conn9', false, scalarConnection(), 'Emu', false),
          field('conn10', true, scalarConnection(), 'Emu', false),
          field('conn11', false, objectConnection(), 'Snafu', false),
          field('conn12', true, objectConnection(), 'Snafu', false),
          field('conn13', false, nodeConnection('conn14'), 'Fubar', false),
          field('conn14', true, nodeConnection('conn13'), 'Fubar', false),
        ],
        directives: [ ]
      },
      ...expectNode([ 'Fubar' ]),
      Snafu: {
        kind: 'interface',
        name: 'Snafu',
        implementations: [],
        everyTypeImplementsNode: false,
        noTypeImplementsNode: true,
        fields: [
          field('conn1', false, scalarConnection(), 'Int', false),
          field('conn2', true, scalarConnection(), 'Int', false),
          field('conn3', false, scalarConnection(), 'Boolean', false),
          field('conn4', true, scalarConnection(), 'Boolean', false),
          field('conn5', false, scalarConnection(), 'String', false),
          field('conn6', true, scalarConnection(), 'String', false),
          field('conn7', false, scalarConnection(), 'ID', false),
          field('conn8', true, scalarConnection(), 'ID', false),
          field('conn9', false, scalarConnection(), 'Emu', false),
          field('conn10', true, scalarConnection(), 'Emu', false),
          field('conn11', false, objectConnection(), 'Snafu', false),
          field('conn12', true, objectConnection(), 'Snafu', false),
          field('conn13', false, nodeConnection('conn14'), 'Fubar', false),
          field('conn14', true, nodeConnection('conn13'), 'Fubar', false),
        ],
        directives: [ ]
      },
    };

    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies connections with edges correctly', () => {
    const test = `
      enum Emu { ONE, TWO }

      type EdgeProps {
        distance: Int
      }

      interface Snafu {
        conn1: ScalarConnection(Int, EdgeProps)
        conn2: ScalarConnection(Int, EdgeProps)!
        conn3: ScalarConnection(Boolean, EdgeProps)
        conn4: ScalarConnection(Boolean, EdgeProps)!
        conn5: ScalarConnection(String, EdgeProps)
        conn6: ScalarConnection(String, EdgeProps)!
        conn7: ScalarConnection(ID, EdgeProps)
        conn8: ScalarConnection(ID, EdgeProps)!
        conn9: ScalarConnection(Emu, EdgeProps)
        conn10: ScalarConnection(Emu, EdgeProps)!
        conn11: ObjectConnection(Snafu, EdgeProps)
        conn12: ObjectConnection(Snafu, EdgeProps)!
        conn13: NodeConnection(Fubar, conn14, EdgeProps)
        conn14: NodeConnection(Fubar, conn13, EdgeProps)!
      }
      type Fubar implements Node, Snafu {
        id: ID!
        conn1: ScalarConnection(Int, EdgeProps)
        conn2: ScalarConnection(Int, EdgeProps)!
        conn3: ScalarConnection(Boolean, EdgeProps)
        conn4: ScalarConnection(Boolean, EdgeProps)!
        conn5: ScalarConnection(String, EdgeProps)
        conn6: ScalarConnection(String, EdgeProps)!
        conn7: ScalarConnection(ID, EdgeProps)
        conn8: ScalarConnection(ID, EdgeProps)!
        conn9: ScalarConnection(Emu, EdgeProps)
        conn10: ScalarConnection(Emu, EdgeProps)!
        conn11: ObjectConnection(Snafu, EdgeProps)
        conn12: ObjectConnection(Snafu, EdgeProps)!
        conn13: NodeConnection(Fubar, conn14, EdgeProps)
        conn14: NodeConnection(Fubar, conn13, EdgeProps)!
      } `;

    const scalarConn = scalarConnection('EdgeProps');
    const objConn = objectConnection('EdgeProps');
    const nodeConn13 = nodeConnection('conn14', 'EdgeProps');
    const nodeConn14 = nodeConnection('conn13', 'EdgeProps');

    const expectedOutput = {
      Emu: mkEnum('Emu', [ 'ONE', 'TWO' ]),
      EdgeProps: {
        kind: 'type',
        name: 'EdgeProps',
        implementsInterfaces: [ ],
        implementsNode: false,
        memberOfUnions: [ ],
        fields: [ field('distance', false, numeric, 'Int', false) ],
        directives: [ ],
      },
      Fubar: {
        kind: 'type',
        name: 'Fubar',
        implementsInterfaces: [ 'Node', 'Snafu' ],
        implementsNode: true,
        memberOfUnions: [ ],
        fields: [
          field('id', true, scalar, 'ID', false),
          field('conn1', false, scalarConn, 'Int', false),
          field('conn2', true, scalarConn, 'Int', false),
          field('conn3', false, scalarConn, 'Boolean', false),
          field('conn4', true, scalarConn, 'Boolean', false),
          field('conn5', false, scalarConn, 'String', false),
          field('conn6', true, scalarConn, 'String', false),
          field('conn7', false, scalarConn, 'ID', false),
          field('conn8', true, scalarConn, 'ID', false),
          field('conn9', false, scalarConn, 'Emu', false),
          field('conn10', true, scalarConn, 'Emu', false),
          field('conn11', false, objConn, 'Snafu', false),
          field('conn12', true, objConn, 'Snafu', false),
          field('conn13', false,nodeConn13 , 'Fubar', false),
          field('conn14', true, nodeConn14, 'Fubar', false),
        ],
        directives: [ ]
      },
      ...expectNode([ 'Fubar' ]),
      Snafu: {
        kind: 'interface',
        name: 'Snafu',
        implementations: [ 'Fubar' ],
        everyTypeImplementsNode: true,
        noTypeImplementsNode: false,
        fields: [
          field('conn1', false, scalarConn, 'Int', false),
          field('conn2', true, scalarConn, 'Int', false),
          field('conn3', false, scalarConn, 'Boolean', false),
          field('conn4', true, scalarConn, 'Boolean', false),
          field('conn5', false, scalarConn, 'String', false),
          field('conn6', true, scalarConn, 'String', false),
          field('conn7', false, scalarConn, 'ID', false),
          field('conn8', true, scalarConn, 'ID', false),
          field('conn9', false, scalarConn, 'Emu', false),
          field('conn10', true, scalarConn, 'Emu', false),
          field('conn11', false, objConn, 'Snafu', false),
          field('conn12', true, objConn, 'Snafu', false),
          field('conn13', false,nodeConn13 , 'Fubar', false),
          field('conn14', true, nodeConn14, 'Fubar', false),
        ],
        directives: [ ]
      },
    };

    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies simple mutation', () => {
    const test = `
      type Foo {
        id: ID!
      }

      mutation addFoo(id: ID) {
        newFoo: Foo
      } `;
    const expectedOutput = {
      Foo: {
        kind: 'type',
        name: 'Foo',
        implementsInterfaces: [],
        implementsNode: false,
        memberOfUnions: [ ],
        fields: [ field('id', true, scalar, 'ID', false) ],
        directives: [ ]
      },
      ...expectNode([ ]),
      addFoo: {
        kind: 'mutation',
        name: 'addFoo',
        arguments: [
          {
            kind: 'argument',
            name: 'id',
            isRequired: false,
            isScalar: true,
            type: 'ID',
          }
        ],
        fields: [
          {
            kind: 'field',
            name: 'newFoo',
            isRequired: false,
            isObject: true,
            type: 'Foo',
            hasArguments: false,
            directives: [ ]
          }
        ],
        directives: [ ]
      }
    };

    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies input objects', () => {
    const test = `
      enum Switch { ONE TWO }
      input Foo {
        id: ID!
      }

      input Bar {
        simpleEnum: Switch,
        int: Int,
        float: Float,
        string: String,
        bool: Boolean,
        listOfEnum: [Switch],
        listOfInt: [Int],
        listOfFloat: [Float],
        listOfString: [String],
        listOfBool: [Boolean],
        simpleFoo: Foo,
        listOfFoo: [Foo]
      }`;
    const expectedOutput = {
      Switch: mkEnum('Switch', [ 'ONE', 'TWO' ]),
      ...expectNode([ ]),
      Foo: {
        kind: 'input',
        name: 'Foo',
        arguments: [ argument('id', true, scalar, 'ID') ]
      },
      Bar: {
        kind: 'input',
        name: 'Bar',
        arguments: [
          argument('simpleEnum', false, scalar, 'Switch'),
          argument('int', false, numeric, 'Int'),
          argument('float', false, numeric, 'Float'),
          argument('string', false, scalar, 'String'),
          argument('bool', false, scalar, 'Boolean'),

          argument('listOfEnum', false, scalarList, 'Switch'),
          argument('listOfInt', false, scalarList, 'Int'),
          argument('listOfFloat', false, scalarList, 'Float'),
          argument('listOfString', false, scalarList, 'String'),
          argument('listOfBool', false, scalarList, 'Boolean'),

          argument('simpleFoo', false, object, 'Foo'),
          argument('listOfFoo', false, objectList, 'Foo'),
        ]
      },
    };

    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies complex mutation', () => {
    const test = `
      enum Switch { ONE TWO }
      input Foo {
        id: ID!
      }

      type Bar implements Node {
        id: ID!,
        simpleEnum: Switch,
      }

      type EdgeType { name: String }

      mutation addBar(
        simpleFoo: Foo,
        str: String,
        int: Int,
        float: Float,
        bool: Boolean,
        simpleEnum: Switch,
        listOfFoo: [Foo],
        listOfStr: [String],
        listOfInt: [Int],
        listOfFloat: [Float],
        listOfBool: [Boolean],
        listOfSimpleEnum: [Switch]
      ) {
        simpleBar: Bar,
        simpleFoo: Foo,
        str: String,
        int: Int,
        float: Float,
        bool: Boolean,
        simpleEnum: Switch,
        listOfBar: [Bar],
        listOfFoo: [Foo],
        listOfStr: [String],
        listOfInt: [Int],
        listOfFloat: [Float],
        listOfBool: [Boolean],
        listOfSimpleEnum: [Switch],
        edge: Edge(Bar),
        edgeWithProps: Edge(Bar, EdgeType),
        edgeReq: Edge(Bar)!,
        edgeWithPropsReq: Edge(Bar, EdgeType)!,
      }
      `;
    const expectedOutput = {
      Switch: mkEnum('Switch', [ 'ONE', 'TWO' ]),
      Bar: {
        kind: 'type',
        name: 'Bar',
        implementsInterfaces: [ 'Node' ],
        implementsNode: true,
        memberOfUnions: [ ],
        fields: [
          field('id', true, scalar, 'ID', false),
          field('simpleEnum', false, scalar, 'Switch', false) ],
        directives: [ ]
      },
      EdgeType: {
        kind: 'type',
        name: 'EdgeType',
        implementsInterfaces: [ ],
        implementsNode: false,
        memberOfUnions: [ ],
        fields: [ field('name', false, scalar, 'String', false) ],
        directives: [ ]
      },
      ...expectNode([ 'Bar' ]),
      Foo: {
        kind: 'input',
        name: 'Foo',
        arguments: [ argument('id', true, scalar, 'ID') ]
      },
      addBar: {
        kind: 'mutation',
        name: 'addBar',
        arguments: [
          argument('simpleFoo', false, object, 'Foo'),
          argument('str', false, scalar, 'String'),
          argument('int', false, numeric, 'Int'),
          argument('float', false, numeric, 'Float'),
          argument('bool', false, scalar, 'Boolean'),
          argument('simpleEnum', false, scalar, 'Switch'),
          argument('listOfFoo', false, objectList, 'Foo'),
          argument('listOfStr', false, scalarList, 'String'),
          argument('listOfInt', false, scalarList, 'Int'),
          argument('listOfFloat', false, scalarList, 'Float'),
          argument('listOfBool', false, scalarList, 'Boolean'),
          argument('listOfSimpleEnum', false, scalarList, 'Switch')
        ],
        fields: [
          field('simpleBar', false, object, 'Bar', false),
          field('simpleFoo', false, object, 'Foo', false),
          field('str', false, scalar, 'String', false),
          field('int', false, numeric, 'Int', false),
          field('float', false, numeric, 'Float', false),
          field('bool', false, scalar, 'Boolean', false),
          field('simpleEnum', false, scalar, 'Switch', false),

          field('listOfBar', false, objectList, 'Bar', false),
          field('listOfFoo', false, objectList, 'Foo', false),
          field('listOfStr', false, scalarList, 'String', false),
          field('listOfInt', false, scalarList, 'Int', false),
          field('listOfFloat', false, scalarList, 'Float', false),
          field('listOfBool', false, scalarList, 'Boolean', false),
          field('listOfSimpleEnum', false, scalarList, 'Switch', false),

          field('edge', false, edge(), 'Bar', false),
          field('edgeWithProps', false, edge('EdgeType'), 'Bar', false),
          field('edgeReq', true, edge(), 'Bar', false),
          field('edgeWithPropsReq', true, edge('EdgeType'), 'Bar', false),
        ],
        directives: [ ]
      },
    };

    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies fields with arguments on types and interfaces', () => {
    const test = `
      type Foo {
        id: ID!,
        name: String
      }

      type Bar {
        id: ID!
        name(pretty: Boolean): String
        pictureUrl(size: Int): String
      }

      interface Baz {
        id: ID!
        name(pretty: Boolean): String
        pictureUrl(size: Int): String
      }
      `;
    const expectedOutput = {
      Foo: {
        kind: 'type',
        name: 'Foo',
        implementsInterfaces: [],
        implementsNode: false,
        memberOfUnions: [ ],
        fields: [
          field('id', true, scalar, 'ID', false),
          field('name', false, scalar, 'String', false) ],
        directives: [ ] },
      Bar: {
        kind: 'type',
        name: 'Bar',
        implementsInterfaces: [],
        implementsNode: false,
        memberOfUnions: [ ],
        fields: [
          field('id', true, scalar, 'ID', false),
          field('name', false, scalar, 'String', true),
          field('pictureUrl', false, scalar, 'String', true) ],
        directives: [ ] },
      ...expectNode([ ]),
      Baz: {
        kind: 'interface',
        name: 'Baz',
        implementations: [],
        everyTypeImplementsNode: false,
        noTypeImplementsNode: true,
        fields: [
          field('id', true, scalar, 'ID', false),
          field('name', false, scalar, 'String', true),
          field('pictureUrl', false, scalar, 'String', true) ],
        directives: [ ] },
    };

    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies types that implement Node interface', () => {
    const test = `
      type Foo implements Node {
        id: ID!
        name: String
      } `;
    const expectedOutput = {
      Foo: {
        kind: 'type',
        name: 'Foo',
        implementsInterfaces: [ 'Node' ],
        implementsNode: true,
        memberOfUnions: [ ],
        fields: [
          field('id', true, scalar, 'ID', false),
          field('name', false, scalar, 'String', false) ],
        directives: [ ]
      },
      ...expectNode([ 'Foo' ]),
    };

    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies unions of types that all implement Node interface', () => {
    const test = `
      type Foo implements Node { id: ID! foo: String }
      type Bar implements Node { id: ID! bar: String }
      union Baz = Foo | Bar `;
    const expectedOutput = {
      Foo: {
        kind: 'type',
        name: 'Foo',
        implementsInterfaces: [ 'Node' ],
        implementsNode: true,
        memberOfUnions: [ 'Baz' ],
        fields: [
          field('id', true, scalar, 'ID', false),
          field('foo', false, scalar, 'String', false) ],
        directives: [ ] },
      Bar: {
        kind: 'type',
        name: 'Bar',
        implementsInterfaces: [ 'Node' ],
        implementsNode: true,
        memberOfUnions: [ 'Baz' ],
        fields: [
          field('id', true, scalar, 'ID', false),
          field('bar', false, scalar, 'String', false) ],
        directives: [ ] },
      ...expectNode([ 'Foo', 'Bar' ]),
      Baz: {
        kind: 'union',
        name: 'Baz',
        typeNames: [ 'Foo', 'Bar' ],
        everyTypeImplementsNode: true,
        noTypeImplementsNode: false,
        directives: [ ]
      },
    };

    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies unions that mix Node and non-Node types', () => {
    const test = `
      type Foo { id: ID! foo: String }
      type Bar implements Node { id: ID! bar: String }
      union Baz = Foo | Bar `;
    const expectedOutput = {
      Foo: {
        kind: 'type',
        name: 'Foo',
        implementsInterfaces: [ ],
        implementsNode: false,
        memberOfUnions: [ 'Baz' ],
        fields: [
          field('id', true, scalar, 'ID', false),
          field('foo', false, scalar, 'String', false) ],
        directives: [ ] },
      Bar: {
        kind: 'type',
        name: 'Bar',
        implementsInterfaces: [ 'Node' ],
        implementsNode: true,
        memberOfUnions: [ 'Baz' ],
        fields: [
          field('id', true, scalar, 'ID', false),
          field('bar', false, scalar, 'String', false) ],
        directives: [ ] },
      ...expectNode([ 'Bar' ]),
      Baz: {
        kind: 'union',
        name: 'Baz',
        typeNames: [ 'Foo', 'Bar' ],
        everyTypeImplementsNode: false,
        noTypeImplementsNode: false,
        directives: [ ]
      },
    };

    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies root connection field directives correctly', () => {
    const test = `
      type Foo implements Node
        @rootConnection(field: "allFoos") {
        id: ID!
        foo: String
      }
      type Bar implements Node
        @rootConnection(field: "allBars") {
        id: ID!
        bar: String
      }
      union FooBar =
        Foo | Bar @rootConnection(field: "allFooBars")
    `;
    const expectedOutput = {
      Foo: {
        kind: 'type',
        name: 'Foo',
        implementsInterfaces: [ 'Node' ],
        implementsNode: true,
        memberOfUnions: [ 'FooBar' ],
        fields: [
          field('id', true, scalar, 'ID', false),
          field('foo', false, scalar, 'String', false) ],
        directives: [
          directive('rootConnection', [
            directiveArg('field', 'String', 'allFoos')
          ])
        ]
      },
      Bar: {
        kind: 'type',
        name: 'Bar',
        implementsInterfaces: [ 'Node' ],
        implementsNode: true,
        memberOfUnions: [ 'FooBar' ],
        fields: [
          field('id', true, scalar, 'ID', false),
          field('bar', false, scalar, 'String', false) ],
        directives: [
          directive('rootConnection', [
            directiveArg('field', 'String', 'allBars')
          ])
        ]
      },
      ...expectNode([ 'Foo', 'Bar' ]),
      FooBar: {
        kind: 'union',
        name: 'FooBar',
        typeNames: [ 'Foo', 'Bar' ],
        everyTypeImplementsNode: true,
        noTypeImplementsNode: false,
        directives: [
          directive('rootConnection', [
            directiveArg('field', 'String', 'allFooBars')
          ])
        ]
      },
    };

    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies root plural id field directives correctly', () => {
    const test = `
      type Foo implements Node {
        id: ID!
        fooKey: String @rootPluralId(field: "fooKey")
      }
    `;
    const expectedOutput = {
      Foo: {
        kind: 'type',
        name: 'Foo',
        implementsInterfaces: [ 'Node' ],
        implementsNode: true,
        memberOfUnions: [ ],
        fields: [
          field('id', true, scalar, 'ID', false),
          {
            ...field('fooKey', false, scalar, 'String', false, [
              directive('rootPluralId', [
                directiveArg('field', 'String', 'fooKey')
              ])
            ]),
          },
        ],
        directives: [ ]
      },
      ...expectNode([ 'Foo' ]),
    };

    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies node object references correctly', () => {
    const test = `
      interface ZazInt { zaz: Boolean }
      type Zaz implements Node, ZazInt { id: ID! zaz: Boolean }
      type Foo implements Node { id: ID! }
      union FooZaz = Foo | Zaz
      type Bar implements Node {
        id: ID!
        typeRef: Foo
        intRef: ZazInt
        unionRef: FooZaz
      }
    `;
    const expectedOutput = {
      Zaz: {
        kind: 'type',
        name: 'Zaz',
        implementsInterfaces: [ 'Node', 'ZazInt' ],
        implementsNode: true,
        memberOfUnions: [ 'FooZaz' ],
        fields: [
          field('id', true, scalar, 'ID', false),
          field('zaz', false, scalar, 'Boolean', false) ],
        directives: [ ]
      },
      Foo: {
        kind: 'type',
        name: 'Foo',
        implementsInterfaces: [ 'Node' ],
        implementsNode: true,
        memberOfUnions: [ 'FooZaz' ],
        fields: [ field('id', true, scalar, 'ID', false) ],
        directives: [ ]
      },
      Bar: {
        kind: 'type',
        name: 'Bar',
        implementsInterfaces: [ 'Node' ],
        implementsNode: true,
        memberOfUnions: [ ],
        fields: [
          field('id', true, scalar, 'ID', false),
          field('typeRef', false, node, 'Foo', false),
          field('intRef', false, node, 'ZazInt', false),
          field('unionRef', false, node, 'FooZaz', false),
        ],
        directives: [ ]
      },
      ...expectNode([ 'Zaz', 'Foo', 'Bar' ]),
      ZazInt: {
        kind: 'interface',
        name: 'ZazInt',
        implementations: [ 'Zaz' ],
        everyTypeImplementsNode: true,
        noTypeImplementsNode: false,
        fields: [ field('zaz', false, scalar, 'Boolean', false) ],
        directives: [ ]
      },
      FooZaz: {
        kind: 'union',
        name: 'FooZaz',
        typeNames: [ 'Foo', 'Zaz' ],
        everyTypeImplementsNode: true,
        noTypeImplementsNode: false,
        directives: [ ]
      },
    };

    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies node lists correctly', () => {
    const test = `
      interface ZazInt { zaz: Boolean }
      type Zaz implements Node, ZazInt { id: ID! zaz: Boolean }
      type Foo implements Node { id: ID! }
      union FooZaz = Foo | Zaz
      type Bar implements Node {
        id: ID!
        typeList: [Foo]
        intList: [ZazInt]
        unionList: [FooZaz]
      }
    `;
    const expectedOutput = {
      Zaz: {
        kind: 'type',
        name: 'Zaz',
        implementsInterfaces: [ 'Node', 'ZazInt' ],
        implementsNode: true,
        memberOfUnions: [ 'FooZaz' ],
        fields: [
          field('id', true, scalar, 'ID', false),
          field('zaz', false, scalar, 'Boolean', false) ],
        directives: [ ]
      },
      Foo: {
        kind: 'type',
        name: 'Foo',
        implementsInterfaces: [ 'Node' ],
        implementsNode: true,
        memberOfUnions: [ 'FooZaz' ],
        fields: [ field('id', true, scalar, 'ID', false) ],
        directives: [ ]
      },
      Bar: {
        kind: 'type',
        name: 'Bar',
        implementsInterfaces: [ 'Node' ],
        implementsNode: true,
        memberOfUnions: [ ],
        fields: [
          field('id', true, scalar, 'ID', false),
          field('typeList', false, nodeList, 'Foo', false),
          field('intList', false, nodeList, 'ZazInt', false),
          field('unionList', false, nodeList, 'FooZaz', false),
        ],
        directives: [ ]
      },
      ...expectNode([ 'Zaz', 'Foo', 'Bar' ]),
      ZazInt: {
        kind: 'interface',
        name: 'ZazInt',
        implementations: [ 'Zaz' ],
        everyTypeImplementsNode: true,
        noTypeImplementsNode: false,
        fields: [ field('zaz', false, scalar, 'Boolean', false) ],
        directives: [ ]
      },
      FooZaz: {
        kind: 'union',
        name: 'FooZaz',
        typeNames: [ 'Foo', 'Zaz' ],
        everyTypeImplementsNode: true,
        noTypeImplementsNode: false,
        directives: [ ]
      },
    };

    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  const expectedTestNode = {
    Test: {
      kind: 'type',
      name: 'Test',
      implementsInterfaces: [ 'Node' ],
      implementsNode: true,
      memberOfUnions: [ ],
      fields: [ field('id', true, scalar, 'ID', false) ],
      directives: [ ]
    },
    ...expectNode([ 'Test' ])
  };

  const expectedTestObject = {
    Test: {
      kind: 'type',
      name: 'Test',
      implementsInterfaces: [ ],
      implementsNode: false,
      memberOfUnions: [ ],
      fields: [ field('id', true, scalar, 'ID', false) ],
      directives: [ ]
    },
    ...expectNode([ ])
  };

  it('Identifies filter on scalar list correctly', () => {
    const test = ` filter on [String] { } `;
    const expectedOutput = {
      ...expectNode([ ]),
      'Filter#[String]': {
        kind: 'filter',
        name: 'Filter#[String]',
        isScalarList: true,
        type: 'String',
        conditions: [ ]
      },
    };
    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies filter on object list correctly', () => {
    const test = ` type Test { id: ID! } filter on [Test] { } `;
    const expectedOutput = {
      ...expectedTestObject,
      'Filter#[Test]': {
        kind: 'filter',
        name: 'Filter#[Test]',
        isObjectList: true,
        type: 'Test',
        conditions: [ ]
      },
    };
    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies filter on node list correctly', () => {
    const test = ` type Test implements Node { id: ID! } filter on [Test] { }`;
    const expectedOutput = {
      ...expectedTestNode,
      'Filter#[Test]': {
        kind: 'filter',
        name: 'Filter#[Test]',
        isNodeList: true,
        type: 'Test',
        conditions: [ ]
      },
    };
    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies filter on node connection without an edge correctly', () => {
    const test = `
      type Test implements Node { id: ID! }
      filter on NodeConnection(Test) { } `;
    const expectedOutput = {
      ...expectedTestNode,
      'Filter#NodeConnection(Test)': {
        kind: 'filter',
        name: 'Filter#NodeConnection(Test)',
        isNodeConnection: true,
        type: 'Test',
        edgeType: null,
        conditions: [ ]
      },
    };
    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies filter on node connection with an edge correctly', () => {
    const test = `
      type Test implements Node { id: ID! }
      filter on NodeConnection(Test, Foo) { } `;
    const expectedOutput = {
      ...expectedTestNode,
      'Filter#NodeConnection(Test, Foo)': {
        kind: 'filter',
        name: 'Filter#NodeConnection(Test, Foo)',
        isNodeConnection: true,
        type: 'Test',
        edgeType: 'Foo',
        conditions: [ ]
      },
    };
    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies filter on object connection without an edge correctly', () => {
    const test = `
      type Test { id: ID! }
      filter on ObjectConnection(Test) { } `;
    const expectedOutput = {
      ...expectedTestObject,
      'Filter#ObjectConnection(Test)': {
        kind: 'filter',
        name: 'Filter#ObjectConnection(Test)',
        isObjectConnection: true,
        type: 'Test',
        edgeType: null,
        conditions: [ ]
      },
    };
    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies filter on object connection with an edge correctly', () => {
    const test = `
      type Test { id: ID! }
      filter on ObjectConnection(Test, Foo) { } `;
    const expectedOutput = {
      ...expectedTestObject,
      'Filter#ObjectConnection(Test, Foo)': {
        kind: 'filter',
        name: 'Filter#ObjectConnection(Test, Foo)',
        isObjectConnection: true,
        type: 'Test',
        edgeType: 'Foo',
        conditions: [ ]
      },
    };
    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies filter on scalar connection without an edge correctly', () => {
    const test = ` filter on ScalarConnection(String) { } `;
    const expectedOutput = {
      ...expectNode([ ]),
      'Filter#ScalarConnection(String)': {
        kind: 'filter',
        name: 'Filter#ScalarConnection(String)',
        isScalarConnection: true,
        type: 'String',
        edgeType: null,
        conditions: [ ]
      },
    };
    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies filter on scalar connection with an edge correctly', () => {
    const test = ` filter on ScalarConnection(String, Foo) { } `;
    const expectedOutput = {
      ...expectNode([ ]),
      'Filter#ScalarConnection(String, Foo)': {
        kind: 'filter',
        name: 'Filter#ScalarConnection(String, Foo)',
        isScalarConnection: true,
        type: 'String',
        edgeType: 'Foo',
        conditions: [ ]
      },
    };
    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies order on scalar list correctly', () => {
    const test = ` order on [String] { } `;
    const expectedOutput = {
      ...expectNode([ ]),
      'Order#[String]': {
        kind: 'order',
        name: 'Order#[String]',
        isScalarList: true,
        type: 'String',
        expressions: [ ]
      },
    };
    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies order on object list correctly', () => {
    const test = ` type Test { id: ID! } order on [Test] { } `;
    const expectedOutput = {
      ...expectedTestObject,
      'Order#[Test]': {
        kind: 'order',
        name: 'Order#[Test]',
        isObjectList: true,
        type: 'Test',
        expressions: [ ]
      },
    };
    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies order on node list correctly', () => {
    const test = ` type Test implements Node { id: ID! } order on [Test] { }`;
    const expectedOutput = {
      ...expectedTestNode,
      'Order#[Test]': {
        kind: 'order',
        name: 'Order#[Test]',
        isNodeList: true,
        type: 'Test',
        expressions: [ ]
      },
    };
    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies order on node connection without an edge correctly', () => {
    const test = `
      type Test implements Node { id: ID! }
      order on NodeConnection(Test) { } `;
    const expectedOutput = {
      ...expectedTestNode,
      'Order#NodeConnection(Test)': {
        kind: 'order',
        name: 'Order#NodeConnection(Test)',
        isNodeConnection: true,
        type: 'Test',
        edgeType: null,
        expressions: [ ]
      },
    };
    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies order on node connection with an edge correctly', () => {
    const test = `
      type Test implements Node { id: ID! }
      order on NodeConnection(Test, Foo) { } `;
    const expectedOutput = {
      ...expectedTestNode,
      'Order#NodeConnection(Test, Foo)': {
        kind: 'order',
        name: 'Order#NodeConnection(Test, Foo)',
        isNodeConnection: true,
        type: 'Test',
        edgeType: 'Foo',
        expressions: [ ]
      },
    };
    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies order on object connection without an edge correctly', () => {
    const test = `
      type Test { id: ID! }
      order on ObjectConnection(Test) { } `;
    const expectedOutput = {
      ...expectedTestObject,
      'Order#ObjectConnection(Test)': {
        kind: 'order',
        name: 'Order#ObjectConnection(Test)',
        isObjectConnection: true,
        type: 'Test',
        edgeType: null,
        expressions: [ ]
      },
    };
    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies order on object connection with an edge correctly', () => {
    const test = `
      type Test { id: ID! }
      order on ObjectConnection(Test, Foo) { } `;
    const expectedOutput = {
      ...expectedTestObject,
      'Order#ObjectConnection(Test, Foo)': {
        kind: 'order',
        name: 'Order#ObjectConnection(Test, Foo)',
        isObjectConnection: true,
        type: 'Test',
        edgeType: 'Foo',
        expressions: [ ]
      },
    };
    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies order on scalar connection without an edge correctly', () => {
    const test = ` order on ScalarConnection(String) { } `;
    const expectedOutput = {
      ...expectNode([ ]),
      'Order#ScalarConnection(String)': {
        kind: 'order',
        name: 'Order#ScalarConnection(String)',
        isScalarConnection: true,
        type: 'String',
        edgeType: null,
        expressions: [ ]
      },
    };
    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies order on scalar connection with an edge correctly', () => {
    const test = ` order on ScalarConnection(String, Foo) { } `;
    const expectedOutput = {
      ...expectNode([ ]),
      'Order#ScalarConnection(String, Foo)': {
        kind: 'order',
        name: 'Order#ScalarConnection(String, Foo)',
        isScalarConnection: true,
        type: 'String',
        edgeType: 'Foo',
        expressions: [ ]
      },
    };
    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies filter conditions without arguments correctly', () => {
    const test = `
      filter on NodeConnection(Foo, Bar) {
        FOO: { node: { value: { eq: 10 }}}
        BAR: { node: { value: { eq: 20 }}}
      }
    `;

    const expectedOutput = {
      ...expectNode([ ]),
      'Filter#NodeConnection(Foo, Bar)': {
        kind: 'filter',
        name: 'Filter#NodeConnection(Foo, Bar)',
        isNodeConnection: true,
        type: 'Foo',
        edgeType: 'Bar',
        conditions: [
          {
            kind: 'filter-condition',
            key: 'FOO',
            arguments: [],
            conditionAST: objectValue({ node: { value: { eq: 10 }}})
          },
          {
            kind: 'filter-condition',
            key: 'BAR',
            arguments: [],
            conditionAST: objectValue({ node: { value: { eq: 20 }}})
          }
        ]
      },
    };

    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies filter conditions with arguments correctly', () => {
    const test = `
      filter on NodeConnection(Foo, Bar) {
        FOO: (foo: Int) { node: { value: { eq: $foo }}}
        BAR: (bar: String) { node: { name: { eq: $bar }}}
      }
    `;

    const expectedOutput = {
      ...expectNode([ ]),
      'Filter#NodeConnection(Foo, Bar)': {
        kind: 'filter',
        name: 'Filter#NodeConnection(Foo, Bar)',
        isNodeConnection: true,
        type: 'Foo',
        edgeType: 'Bar',
        conditions: [
          {
            kind: 'filter-condition',
            key: 'FOO',
            arguments: [ argument('foo', false, numeric, 'Int') ],
            conditionAST: objectValue({ node: { value: { eq: '$foo' }}})
          },
          {
            kind: 'filter-condition',
            key: 'BAR',
            arguments: [ argument('bar', false, scalar, 'String') ],
            conditionAST: objectValue({ node: { name: { eq: '$bar' }}})
          },
        ]
      },
    };

    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Identifies order expressions correctly', () => {
    const test = `
      order on NodeConnection(Foo, Bar) {
        FOO: [ { node: { value: ASCENDING }}, { node: { name: DESCENDING }} ]
        BAR: [ { node: { name: DESCENDING }}, { node: { value: ASCENDING }} ]
      }
    `;

    const expectedOutput = {
      ...expectNode([ ]),
      'Order#NodeConnection(Foo, Bar)': {
        kind: 'order',
        name: 'Order#NodeConnection(Foo, Bar)',
        isNodeConnection: true,
        type: 'Foo',
        edgeType: 'Bar',
        expressions: [
          {
            kind: 'order-expression',
            key: 'FOO',
            expressionASTs: [
              objectValue({node: {value: 'ASCENDING'}}, true),
              objectValue({node: {name: 'DESCENDING'}}, true),
            ]
          },
          {
            kind: 'order-expression',
            key: 'BAR',
            expressionASTs: [
              objectValue({node: {name: 'DESCENDING'}}, true),
              objectValue({node: {value: 'ASCENDING'}}, true),
            ]
          }
        ]
      },
    };

    const output = runTest(test);
    expect(output).to.deep.equal(expectedOutput);
  });

  it('Throws if Node is redefined', () => {
    const test = ` type Node { foo: Int } `;
    const result = runTest.bind(null, test);
    expect(result).to.throw(Error, /Name "Node" cannot be redefined/);
  });

  it('Throws if enum is redefined', () => {
    const test = ` enum Enum { ONE, TWO } enum Enum { ONE, TWO } `;
    const result = runTest.bind(null, test);
    expect(result).to.throw(Error, /Name "Enum" cannot be redefined/);
  });

  it('Throws if filter is redefined', () => {
    const test = ` filter on [String] { } filter on [String] { } `;
    const result = runTest.bind(null, test);
    expect(result).to.throw(Error, /Filter on \[String\] cannot be redefined/);
  });

  it('Throws if input is redefined', () => {
    const test = ` input In { i: Int } input In { i: Int } `;
    const result = runTest.bind(null, test);
    expect(result).to.throw(Error, /Name "In" cannot be redefined/);
  });

  it('Throws if interface is redefined', () => {
    const test = ` interface In { i: Int } interface In { i: Int } `;
    const result = runTest.bind(null, test);
    expect(result).to.throw(Error, /Name "In" cannot be redefined/);
  });

  it('Throws if mutation is redefined', () => {
    const test = ` mutation m { i: Int } mutation m { i: Int } `;
    const result = runTest.bind(null, test);
    expect(result).to.throw(Error, /Name "m" cannot be redefined/);
  });

  it('Throws if type is redefined', () => {
    const test = ` type t { i: Int } type t { i: Int } `;
    const result = runTest.bind(null, test);
    expect(result).to.throw(Error, /Name "t" cannot be redefined/);
  });

  it('Throws if order is redefined', () => {
    const test = ` order on [Foo] { } order on [Foo] { } `;
    const result = runTest.bind(null, test);
    expect(result).to.throw(Error, /Order on \[Foo\] cannot be redefined/);
  });

  it('Throws if union is redefined', () => {
    const test = ` type Tpe { i: Int } union U = Tpe union U = Tpe `;
    const result = runTest.bind(null, test);
    expect(result).to.throw(Error, /Name "U" cannot be redefined/);
  });
});
