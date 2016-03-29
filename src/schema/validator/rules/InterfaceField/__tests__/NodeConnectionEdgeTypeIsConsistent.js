import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
} from '../../../__tests__/setup';

import { NodeConnectionEdgeTypeIsConsistent as rule }
  from '../NodeConnectionEdgeTypeIsConsistent';

describe('Schema Validation: InterfaceField / ' +
         'NodeConnectionEdgeTypeIsConsistent: ', () => {

  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Throw if NodeConnection to type has an inconsistent edge', () => {
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
        testCase: NodeConnection(TestCase, conn)
      }
      type MyEdgeType {
        numberOfFoos: Int
      }
      `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /Field "conn" on "TestCase" interface .* Edge types must be consistent/);
  });


  it('Throw if NodeConnection to interface has an inconsistent edge', () => {
    const test = `
      interface TestCase {
        conn: NodeConnection(RelatedInterface, testCase, MyEdgeType)
      }
      type TestType implements Node, TestCase {
        id: ID!
        conn: NodeConnection(RelatedInterface, testCase, MyEdgeType)
      }

      interface RelatedInterface {
        testCase: NodeConnection(TestCase, conn)
      }
      type RelatedType implements Node, RelatedInterface {
        id: ID!
        testCase: NodeConnection(TestCase, conn)
      }
      type MyEdgeType {
        numberOfFoos: Int
      }
      `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /Field "conn" on "TestCase" interface .* Edge types must be consistent/);
  });

  it('Throw if NodeConnection to union has an inconsistent edge', () => {
    const test = `
      interface TestCase {
        conn: NodeConnection(RelatedUnion, testCase, MyEdgeType)
      }
      type TestType implements Node, TestCase {
        id: ID!
        conn: NodeConnection(RelatedUnion, testCase, MyEdgeType)
      }

      union RelatedUnion = RelatedType1 | RelatedType2

      type RelatedType1 implements Node {
        id: ID!
        testCase: NodeConnection(TestCase, conn, MyEdgeType)
      }
      type RelatedType2 implements Node {
        id: ID!
        testCase: NodeConnection(TestCase, conn)
      }

      type MyEdgeType {
        numberOfFoos: Int
      }
      `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /Field "conn" on "TestCase" interface .* Edge types must be consistent/);
  });

  it('Okay if NodeConnections have consistent edges', () => {
    const test = `
      interface TestCase {
        conn: NodeConnection(RelatedUnion, testCase, MyEdgeType)
        conn2: NodeConnection(RelatedInterface, testCase, MyEdgeType2)
        conn3: NodeConnection(RelatedType3, testCase, MyEdgeType3)
      }
      type TestType implements Node, TestCase {
        id: ID!
        conn: NodeConnection(RelatedUnion, testCase, MyEdgeType)
        conn2: NodeConnection(RelatedInterface, testCase, MyEdgeType2)
        conn3: NodeConnection(RelatedType3, testCase, MyEdgeType3)
      }

      type RelatedType3 implements Node {
        id: ID!
        testCase: NodeConnection(TestCase, conn3, MyEdgeType3)
      }

      type RelatedType2 implements Node, RelatedInterface {
        id: ID!
        testCase: NodeConnection(TestCase, conn2, MyEdgeType2)
      }

      interface RelatedInterface {
        testCase: NodeConnection(TestCase, conn2, MyEdgeType2)
      }

      type RelatedType implements Node {
        id: ID!
        testCase: NodeConnection(TestCase, conn, MyEdgeType)
      }
      union RelatedUnion = RelatedType

      type MyEdgeType {
        numberOfFoos: Int
      }
      type MyEdgeType2 {
        names: [String]
      }
      type MyEdgeType3 {
        bars: [Float!]!
      }
      `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

});
