import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
} from '../../../__tests__/setup';

import { NodeConnectionPointsBack as rule } from '../NodeConnectionPointsBack';

describe('Schema Validation: InterfaceField / NodeConnectionPointsBack: ',
() => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Throws if NodeConnection to type does not point back', () => {
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
        testCase: NodeConnection(TestType, conn, MyEdgeType)
      }
      type MyEdgeType {
        numberOfFoos: Int
      } `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /Field "conn" on "TestCase" interface .* are not pointing back/);
  });

  it('Throws if NodeConnection to union does not point back', () => {
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
        testCase: NodeConnection(UnrelatedType, conn, MyEdgeType)
      }
      type UnrelatedType implements Node {
        id: ID!
        conn: NodeConnection(RelatedType, testCase, MyEdgeType)
      }
      type MyEdgeType {
        numberOfFoos: Int
      } `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /Field "conn" on "TestCase" interface .* are not pointing back/);
  });

  it('Throws if NodeConnection to interface does not point back', () => {
    const test = `
      interface TestCase {
        conn: NodeConnection(RelatedInterface, testCase, MyEdgeType)
      }
      type TestType implements Node, TestCase {
        id: ID!
        conn: NodeConnection(RelatedInterface, testCase, MyEdgeType)
      }

      interface RelatedInterface {
        testCase: NodeConnection(UnrelatedType, conn, MyEdgeType)
      }
      type RelatedType1 implements Node, RelatedInterface {
        id: ID!
        testCase: NodeConnection(TestCase, conn, MyEdgeType)
      }
      type RelatedType2 implements Node, RelatedInterface {
        id: ID!
        testCase: NodeConnection(UnrelatedType, conn, MyEdgeType)
      }
      type UnrelatedType implements Node {
        id: ID!
        conn: NodeConnection(RelatedType, testCase, MyEdgeType)
      }
      type MyEdgeType {
        numberOfFoos: Int
      } `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /Field "conn" on "TestCase" interface .* are not pointing back/);
  });
});
