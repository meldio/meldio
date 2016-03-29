import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
} from '../../../__tests__/setup';

import {NodeConnectionTypeIsValid as rule} from '../NodeConnectionTypeIsValid';

describe('Schema Validation: TypeField / NodeConnectionTypeIsValid: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Throws if NodeConnection to refereces a non-Node type', () => {
    const test = `
      type TestCase implements Node {
        id: ID!
        conn: NodeConnection(RelatedType, testCase, MyEdgeType)
      }
      type RelatedType {
        id: ID!
        testCase: NodeConnection(TestCase, conn, MyEdgeType)
      }
      type MyEdgeType {
        numberOfFoos: Int
      } `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/NodeConnection with an invalid type/);
  });

  it('Throws if NodeConnection to refereces a union of non-Nodes', () => {
    const test = `
      type TestCase implements Node {
        id: ID!
        conn: NodeConnection(Union, testCase, MyEdgeType)
      }
      union Union = RelatedType1 | RelatedType2
      type RelatedType1 {
        testCase: NodeConnection(TestCase, conn, MyEdgeType)
      }
      type RelatedType2 {
        testCase: NodeConnection(TestCase, conn, MyEdgeType)
      }

      type MyEdgeType {
        numberOfFoos: Int
      } `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/NodeConnection with an invalid type/);
  });

});
