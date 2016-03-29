import { expect } from 'chai';
import { describe, it } from 'mocha';
import { parse } from '../../language/parser';
import { analyzeAST } from '../analyzeAST';

import {
  getConnectionName,
  getEdgeName,
  declaredLists,
  declaredConnections,
  rootConnectionDirectives,
  directiveConnections,
  allConnections,
  rootPluralIdDirectives,
  implicitRootPluralIdTypes
} from '../utils';

const runTest = str => analyzeAST(parse(str, {noLocation: true}));

describe('analyzer utilities', () => {
  it('getConnectionName works without edge', () => {
    const output = getConnectionName('Foo');
    expect(output).to.equal('FooConnection');
  });

  it('getConnectionName works with edge', () => {
    const output = getConnectionName('Foo', 'Bar');
    expect(output).to.equal('FooBarConnection');
  });

  it('getEdgeName works without edge', () => {
    const output = getEdgeName('Foo');
    expect(output).to.equal('FooEdge');
  });

  it('getEdgeName works with edge', () => {
    const output = getEdgeName('Foo', 'Bar');
    expect(output).to.equal('FooBarEdge');
  });

  it('declaredLists indetifies all declared lists', () => {
    const schema = runTest(`
      enum Enum { ONE, TWO, THREE }
      interface SimpleInter { name: String }
      type Obj implements SimpleInter { name: String }
      interface Inter {
        name: String
      }
      type TestType implements Node, Inter {
        id: ID!
        name: String
        connOfStr: [String]
        connOfID: [ID]
        connOfBool: [Boolean]
        connOfInter: [SimpleInter]
        connOfUnion: [SimpleUnion]
        connOfNodeInterface: [Node]
        connOfInteraceThatIsNode: [Inter]
        connOfUnionThatIsNode: [Union]
        connOfTypeThatIsNode: [TestType]
        anotherconnOfStr: [String]
        anotherconnOfID: [ID]
      }
      interface TestInterface {
        connOfFloat: [Float]
        connOfInt: [Int]
      }
      mutation addTestMutation(id: ID!) {
        connOfObj: [Obj]
        connOfEnum: [Enum]
      }
      union Union = TestType
      union SimpleUnion = Obj
    `);
    const output = declaredLists(schema);
    expect(output).to.have.length(13);
    expect(output)
      .to.deep.include({ kind: 'ScalarList', type: 'String' }).and
      .to.deep.include({ kind: 'ScalarList', type: 'ID' }).and
      .to.deep.include({ kind: 'ScalarList', type: 'Float' }).and
      .to.deep.include({ kind: 'ScalarList', type: 'Int' }).and
      .to.deep.include({ kind: 'ScalarList', type: 'Boolean' }).and
      .to.deep.include({ kind: 'ScalarList', type: 'Enum' }).and
      .to.deep.include({ kind: 'ObjectList', type: 'Obj' }).and
      .to.deep.include({ kind: 'ObjectList', type: 'SimpleInter' }).and
      .to.deep.include({ kind: 'ObjectList', type: 'SimpleUnion' }).and
      .to.deep.include({ kind: 'NodeList', type: 'Node' }).and
      .to.deep.include({ kind: 'NodeList', type: 'Inter' }).and
      .to.deep.include({ kind: 'NodeList', type: 'Union' }).and
      .to.deep.include({ kind: 'NodeList', type: 'TestType' });
  });

  it('declaredConnections indetifies all declared connections', () => {
    const schema = runTest(`
      enum Enum { ONE, TWO, THREE }
      type Edge { distance: Int }
      interface SimpleInter { name: String }
      type Obj implements SimpleInter { name: String }
      interface Inter {
        name: String
      }
      type TestType implements Node, Inter {
        id: ID!
        name: String
        connOfStr: ScalarConnection(String)
        connOfStrEdge: ScalarConnection(String, Edge)
        connOfID: ScalarConnection(ID)
        connOfIDEdge: ScalarConnection(ID, Edge)
        connOfBool: ScalarConnection(Boolean)
        connOfBoolEdge: ScalarConnection(Boolean, Edge)
        connOfInter: ObjectConnection(SimpleInter)
        connOfInterEdge: ObjectConnection(SimpleInter, Edge)
        connOfUnion: ObjectConnection(SimpleUnion)
        connOfUnionEdge: ObjectConnection(SimpleUnion, Edge)
        connOfInteraceThatIsNode: NodeConnection(Inter, any)
        connOfInteraceThatIsNodeEdge: NodeConnection(Inter, any, Edge)
        connOfUnionThatIsNode: NodeConnection(Union, any)
        connOfUnionThatIsNodeEdge: NodeConnection(Union, any, Edge)
        connOfTypeThatIsNode: NodeConnection(TestType, any)
        connOfTypeThatIsNodeEdge: NodeConnection(TestType, any, Edge)

        anotherconnOfStr: ScalarConnection(String)
        anotherconnOfIDEdge: ScalarConnection(ID, Edge)
      }
      interface TestInterface {
        connOfFloat: ScalarConnection(Float)
        connOfInt: ScalarConnection(Int)
        connOfObj: ObjectConnection(Obj)
        connOfEnum: ScalarConnection(Enum)
      }
      union Union = TestType
      union SimpleUnion = Obj
    `);
    const output = declaredConnections(schema);

    const scalar = (type, edgeType) => ({
      kind: 'ScalarConnection',
      name: getConnectionName(type, edgeType),
      type,
      edgeType: edgeType || ''
    });

    const object = (type, edgeType) => ({
      kind: 'ObjectConnection',
      name: getConnectionName(type, edgeType),
      type,
      edgeType: edgeType || ''
    });

    const node = (type, edgeType) => ({
      kind: 'NodeConnection',
      name: getConnectionName(type, edgeType),
      type,
      edgeType: edgeType || ''
    });

    expect(output).to.have.length(20);
    expect(output)
      .to.deep.include(scalar('String')).and
      .to.deep.include(scalar('String', 'Edge')).and
      .to.deep.include(scalar('ID')).and
      .to.deep.include(scalar('ID', 'Edge')).and
      .to.deep.include(scalar('Boolean')).and
      .to.deep.include(scalar('Boolean', 'Edge')).and
      .to.deep.include(scalar('Int')).and
      .to.deep.include(scalar('Float')).and
      .to.deep.include(scalar('Enum')).and
      .to.deep.include(object('Obj')).and
      .to.deep.include(object('SimpleInter')).and
      .to.deep.include(object('SimpleInter', 'Edge')).and
      .to.deep.include(object('SimpleUnion')).and
      .to.deep.include(object('SimpleUnion', 'Edge')).and
      .to.deep.include(node('Inter')).and
      .to.deep.include(node('Inter', 'Edge')).and
      .to.deep.include(node('Union')).and
      .to.deep.include(node('Union', 'Edge')).and
      .to.deep.include(node('TestType')).and
      .to.deep.include(node('TestType', 'Edge'));
  });

  it('rootConnectionDirectives identifies all @rootConnection', () => {
    const schema = runTest(`
      type TestType1 implements Node
        @rootConnection(field: "allTestTypes1s") {

        id: ID!
        name: String
      }

      type TestType2 implements Node
        @rootConnection(field: "allTestTypes2s", filter: Foo, order: Bar) {

        id: ID!
        name: String
      }

      type TestType3 implements Node
        @rootConnection(filter: Foo, order: Bar, field: "allTestTypes3s") {

        id: ID!
        name: String
      }
    `);
    const field = value =>
      ({kind: 'directive-argument', name: 'field', type: 'String', value});
    const filter = value =>
      ({kind: 'directive-argument', name: 'filter', type: 'Enum', value});
    const order = value =>
      ({kind: 'directive-argument', name: 'order', type: 'Enum', value});

    const rootConn = (parentTypeName, args) => ({
      kind: 'directive',
      name: 'rootConnection',
      arguments: args,
      parentTypeName
    });

    const output = rootConnectionDirectives(schema);
    expect(output).to.have.length(3);
    expect(output)
      .to.deep.include(rootConn('TestType1', [ field('allTestTypes1s') ])).and
      .to.deep.include(
        rootConn('TestType2', [
          field('allTestTypes2s'),
          filter('Foo'),
          order('Bar'),
        ])).and
      .to.deep.include(
        rootConn('TestType3', [
          filter('Foo'),
          order('Bar'),
          field('allTestTypes3s'),
        ]));
  });

  it('directiveConnections identifies all root connections', () => {
    const schema = runTest(`
      type TestType1 implements Node
        @rootConnection(field: "allTestTypes1s") {

        id: ID!
        name: String
      }

      type TestType2 implements Node
        @rootConnection(field: "allTestTypes2s", filter: Foo, order: Bar) {

        id: ID!
        name: String
      }

      type TestType3 implements Node
        @rootConnection(filter: Foo, order: Bar, field: "allTestTypes3s") {

        id: ID!
        name: String
      }
    `);

    const node = type => ({
      kind: 'NodeConnection',
      name: getConnectionName(type),
      type,
      edgeType: ''
    });

    const output = directiveConnections(schema);
    expect(output).to.have.length(3);
    expect(output)
      .to.deep.include(node('TestType1')).and
      .to.deep.include(node('TestType2')).and
      .to.deep.include(node('TestType3'));
  });

  it('allConnections identifies all connections (declared + root)', () => {
    const schema = runTest(`
      type Obj { name: String }
      type Edge { distance: Int }

      type TestType1 implements Node
        @rootConnection(field: "allTestTypes1s") {

        id: ID!
        name: String
      }

      type TestType2 implements Node
        @rootConnection(field: "allTestTypes2s", filter: Foo, order: Bar) {

        id: ID!
        name: String
      }

      type TestType3 implements Node
        @rootConnection(filter: Foo, order: Bar, field: "allTestTypes3s") {

        id: ID!
        name: String
        objConn: ObjectConnection(Obj)
        scalarConn: ScalarConnection(String, Edge)
        scalarConnNoEdge: ScalarConnection(String)
      }
    `);

    const scalar = (type, edgeType) => ({
      kind: 'ScalarConnection',
      name: getConnectionName(type, edgeType),
      type,
      edgeType: edgeType || ''
    });

    const object = (type, edgeType) => ({
      kind: 'ObjectConnection',
      name: getConnectionName(type, edgeType),
      type,
      edgeType: edgeType || ''
    });

    const node = type => ({
      kind: 'NodeConnection',
      name: getConnectionName(type),
      type,
      edgeType: ''
    });

    const output = allConnections(schema);
    expect(output).to.have.length(6);
    expect(output)
      .to.deep.include(node('TestType1')).and
      .to.deep.include(node('TestType2')).and
      .to.deep.include(node('TestType3')).and
      .to.deep.include(object('Obj')).and
      .to.deep.include(scalar('String', 'Edge')).and
      .to.deep.include(scalar('String'));
  });

  it('rootPluralIdDirectives identifies all plural id directives', () => {
    const schema = runTest(`

      type TestType implements Node
      {
        id: ID!
        name: String @rootPluralId(field: "testTypeByName")
      }

      type Foo implements Node
      {
        id: ID!
        location: Float @rootPluralId(field: "fooByLocation")
      }
    `);

    const rootPluralId =
      (fieldName, parentTypeName, parentFieldName, parentFieldType) => ({
        kind: 'directive',
        name: 'rootPluralId',
        arguments: [ {
          kind: 'directive-argument',
          name: 'field',
          type: 'String',
          value: fieldName,
        } ],
        parentTypeName,
        parentFieldName,
        parentFieldType
      });

    const output = rootPluralIdDirectives(schema);
    expect(output).to.have.length(2);
    expect(output)
      .to.deep.include(
        rootPluralId('testTypeByName', 'TestType', 'name', 'String')).and
      .to.deep.include(
        rootPluralId('fooByLocation', 'Foo', 'location', 'Float'));
  });

  it('implicitRootPluralIdTypes identifies all implicit plural id fields',
  () => {
    const schema = runTest(`
      enum Enum { ONE, TWO, THREE }
      type Edge { distance: Int }
      interface SimpleInter { name: String }
      type Obj implements SimpleInter { name: String }
      interface Inter {
        name: String
      }
      type TestType implements Node, Inter {
        id: ID!
        name: String
        connOfInterEdge: ObjectConnection(SimpleInter, Edge)
        connOfUnionEdge: ObjectConnection(SimpleUnion, Edge)
        connOfInteraceThatIsNodeEdge: NodeConnection(Inter, any, Edge)
        connOfUnionThatIsNodeEdge: NodeConnection(Union, any, Edge)
      }
      interface TestInterface {
        connOfObj: ObjectConnection(Obj)
        connOfEnum: ScalarConnection(Enum)
      }
      union Union = TestType
      union SimpleUnion = Obj `);


    const output = implicitRootPluralIdTypes(schema);
    expect(output).to.have.length(3);
    expect(output)
      .to.deep.include(schema['TestType']).and
      .to.deep.include(schema['Inter']).and
      .to.deep.include(schema['Union']);
  });

});
