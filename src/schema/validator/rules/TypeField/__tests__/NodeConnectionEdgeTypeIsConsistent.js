import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
} from '../../../__tests__/setup';

import { NodeConnectionEdgeTypeIsConsistent as rule }
  from '../NodeConnectionEdgeTypeIsConsistent';

describe('Schema Validation: TypeField / NodeConnectionEdgeTypeIsConsistent: ',
() => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Throw if NodeConnection to type has an inconsistent edge', () => {
    const test = `
      type TestCase implements Node {
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
    expect(errors).to.deep.match(/Edge types must be consistent/);
  });

  it('Throw if NodeConnection to type has an inconsistent edge', () => {
    const test = `
      type RelatedType implements Node {
        id: ID!
        testCase: NodeConnection(TestCase, conn)
      }
      type TestCase implements Node {
        id: ID!
        conn: NodeConnection(RelatedType, testCase, MyEdgeType)
      }
      type MyEdgeType {
        numberOfFoos: Int
      }
      `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/Edge types must be consistent/);
  });

  it('Throw if NodeConnection to interface has an inconsistent edge', () => {
    const test = `
      type TestCase implements Node {
        id: ID!
        conn: NodeConnection(RelatedInterface, testCase, MyEdgeType)
      }
      interface RelatedInterface {
        id: ID!
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
    expect(errors).to.deep.match(/Edge types must be consistent/);
  });

  it('Throw if NodeConnection to interface has an inconsistent edge', () => {
    const test = `
      interface RelatedInterface {
        id: ID!
        testCase: NodeConnection(TestCase, conn)
      }
      type RelatedType implements Node, RelatedInterface {
        id: ID!
        testCase: NodeConnection(TestCase, conn)
      }
      type TestCase implements Node {
        id: ID!
        conn: NodeConnection(RelatedInterface, testCase, MyEdgeType)
      }
      type MyEdgeType {
        numberOfFoos: Int
      }
      `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/Edge types must be consistent/);
  });

  it('Throw if NodeConnection to union has an inconsistent edge', () => {
    const test = `
      type TestCase implements Node {
        id: ID!
        conn: NodeConnection(RelatedUnion, testCase, MyEdgeType)
      }
      union RelatedUnion = RelatedType

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
    expect(errors).to.deep.match(/Edge types must be consistent/);
  });

  it('Throw if NodeConnection to union has an inconsistent edge', () => {
    const test = `
      union RelatedUnion = RelatedType
      type RelatedType implements Node {
        id: ID!
        testCase: NodeConnection(TestCase, conn)
      }
      type TestCase implements Node {
        id: ID!
        conn: NodeConnection(RelatedUnion, testCase, MyEdgeType)
      }
      type MyEdgeType {
        numberOfFoos: Int
      }
      `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/Edge types must be consistent/);
  });

  it('Okay if NodeConnections have consistent edges', () => {
    const test = `
      type TestCase implements Node {
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

      union RelatedUnion = RelatedType
      type RelatedType implements Node {
        id: ID!
        testCase: NodeConnection(TestCase, conn, MyEdgeType)
      }

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
