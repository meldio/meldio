import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
} from '../../../__tests__/setup';

import { ConnectionEdgeTypeIsNotNode as rule }
  from '../ConnectionEdgeTypeIsNotNode';

describe('Schema Validation: InterfaceField / ConnectionEdgeTypeIsNotNode: ',
() => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Throw if NodeConnection defines an edge that is a Node', () => {
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

      type MyEdgeType implements Node {
        id: ID!
        numberOfFoos: Int
      }
      `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /Field "conn" on "TestCase" interface .* edge type that implements Node/);
  });

  it('Throw if ObjectConnection defineds an edge that is a Node', () => {
    const test = `
      interface TestCase {
        conn: ObjectConnection(Foo, MyEdgeType)
      }
      type TestType implements Node, TestCase {
        id: ID!
        conn: ObjectConnection(Foo, MyEdgeType)
      }

      type Foo { foo: String }

      type MyEdgeType implements Node {
        id: ID!
        numberOfFoos: Int
      }
      `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /Field "conn" on "TestCase" interface .* edge type that implements Node/);
  });

  it('Throw if ScalarConnection defineds an edge that is a Node', () => {
    const test = `
      interface TestCase {
        conn: ScalarConnection(Int, MyEdgeType)
      }
      type TestType implements Node, TestCase {
        id: ID!
        conn: ScalarConnection(Int, MyEdgeType)
      }

      type MyEdgeType implements Node {
        id: ID!
        numberOfFoos: Int
      }
      `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /Field "conn" on "TestCase" interface .* edge type that implements Node/);
  });
});
