import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
} from '../../../__tests__/setup';

import { ConnectionEdgeTypeIsDefined as rule }
  from '../ConnectionEdgeTypeIsDefined';

describe('Schema Validation: InterfaceField / ConnectionEdgeTypeIsDefined: ',
() => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Throw if NodeConnection defines an edge that doesn\'t exist', () => {
    const test = `
      interface TestCase {
        conn: NodeConnection(RelatedType, testCase, MyEdgeType)
      }
      type TestType implements Node, TestCase {
        id: ID!
        conn: NodeConnection(RelatedType, testCase, MyEdgeType)
      }
      type RelatedType implements Node {
        id: ID!
        testCase: NodeConnection(TestCase, conn, MyEdgeType)
      }
      `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /Field "conn" on "TestCase" interface .* edge type that is undefined/);
  });

  it('Throw if ObjectConnection defineds an edge that doesn\'t exist', () => {
    const test = `
      interface TestCase {
        conn: ObjectConnection(Foo, MyEdgeType)
      }
      type TestType implements Node, TestCase {
        id: ID!
        conn: ObjectConnection(Foo, MyEdgeType)
      }
      type Foo { foo: String }
      `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /Field "conn" on "TestCase" interface .* edge type that is undefined/);
  });

  it('Throw if ScalarConnection defineds an edge that doesn\'t exist', () => {
    const test = `
      interface TestCase {
        conn: ScalarConnection(Int, MyEdgeType)
      }
      type TestType implements Node, TestCase {
        id: ID!
        conn: ScalarConnection(Int, MyEdgeType)
      }
      `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /Field "conn" on "TestCase" interface .* edge type that is undefined/);
  });

  it('Works fine if edge type is properly defined', () => {
    const test = `
      interface TestCase {
        conn: NodeConnection(RelatedType, testCase, MyEdgeType)
        objConn: ObjectConnection(Foo, MyEdgeType)
        scalarConn: ScalarConnection(Int, MyEdgeType)
      }
      type TestType implements TestCase, Node {
        id: ID!
        conn: NodeConnection(RelatedType, testCase, MyEdgeType)
        objConn: ObjectConnection(Foo, MyEdgeType)
        scalarConn: ScalarConnection(Int, MyEdgeType)
      }
      type RelatedType implements Node {
        id: ID!
        testCase: NodeConnection(TestCase, conn, MyEdgeType)
      }
      type Foo { foo: String }
      type MyEdgeType { numberOfFoos: Int }
      `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

});
