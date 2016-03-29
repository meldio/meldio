import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
} from '../../../__tests__/setup';

import { NodeConnectionRelatedFieldExists as rule }
  from '../NodeConnectionRelatedFieldExists';

describe('Schema Validation: TypeField / NodeConnectionRelatedFieldExists: ',
() => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Throws if NodeConnection to type references nonexistent field', () => {
    const test = `
      type TestCase implements Node {
        id: ID!
        conn: NodeConnection(RelatedType, testCase, MyEdgeType)
      }
      type RelatedType implements Node {
        id: ID!
        foo: NodeConnection(TestCase, conn, MyEdgeType)
      }
      type MyEdgeType {
        numberOfFoos: Int
      } `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/field is not defined/);
  });

  it('Throws if NodeConnection to a union references nonexistent field', () => {
    const test = `
      type TestCase implements Node {
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
      }
      type MyEdgeType {
        numberOfFoos: Int
      } `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/field is not defined/);
  });

  it('Throws if NodeConnection to an interface references nonexistent field',
  () => {
    const test = `
      type TestCase implements Node {
        id: ID!
        conn: NodeConnection(RelatedInterface, testCase, MyEdgeType)
      }
      interface RelatedInterface {
      }
      type RelatedType implements Node, RelatedInterface {
        id: ID!
        testCase: NodeConnection(TestCase, conn, MyEdgeType)
      }
      type MyEdgeType {
        numberOfFoos: Int
      } `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/field is not defined/);
  });

});
