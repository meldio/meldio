import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
} from '../../../__tests__/setup';

import { ConnectionEdgeTypeIsNotNode as rule }
  from '../ConnectionEdgeTypeIsNotNode';

describe('Schema Validation: TypeField / ConnectionEdgeTypeIsNotNode: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Throw if NodeConnection defineds an edge that is a Node', () => {
    const test = `
      type TestCase implements Node {
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
    expect(errors).to.deep.match(/Edge types cannot implement Node/);
  });

  it('Throw if ObjectConnection defineds an edge that is a Node', () => {
    const test = `
      type TestCase implements Node {
        id: ID!
        objConn: ObjectConnection(Foo, MyEdgeType)
      }

      type Foo { foo: String }

      type MyEdgeType implements Node {
        id: ID!
        numberOfFoos: Int
      }
      `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/Edge types cannot implement Node/);
  });

  it('Throw if ScalarConnection defineds an edge that is a Node', () => {
    const test = `
      type TestCase implements Node {
        id: ID!
        scalarConn: ScalarConnection(Int, MyEdgeType)
      }
      type MyEdgeType implements Node {
        id: ID!
        numberOfFoos: Int
      }
      `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/Edge types cannot implement Node/);
  });
});
