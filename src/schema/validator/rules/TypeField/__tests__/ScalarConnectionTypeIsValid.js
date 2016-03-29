import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
} from '../../../__tests__/setup';

import { ScalarConnectionTypeIsValid as rule }
  from '../ScalarConnectionTypeIsValid';

describe('Schema Validation: TypeField / ScalarConnectionTypeIsValid: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Throws if ScalarConnection refereces a Node type', () => {
    const test = `
      type TestCase implements Node {
        id: ID!
        conn: ScalarConnection(RelatedType, MyEdgeType)
      }
      type RelatedType implements Node { id: ID! }
      type MyEdgeType {
        numberOfFoos: Int
      } `;

    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /defines a ScalarConnection with an invalid type/);
  });

  it('Throws if ScalarConnection refereces a non-Node type', () => {
    const test = `
      type TestCase implements Node {
        id: ID!
        conn: ScalarConnection(RelatedType, MyEdgeType)
      }
      type RelatedType { id: ID! }
      type MyEdgeType {
        numberOfFoos: Int
      } `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /defines a ScalarConnection with an invalid type/);
  });

  it('Throws if ScalarConnection refereces a union type', () => {
    const test = `
      type TestCase implements Node {
        id: ID!
        conn: ScalarConnection(RelatedUnion, MyEdgeType)
      }
      union RelatedUnion = RelatedType1 | RelatedType2
      type RelatedType1 { id: ID! }
      type RelatedType2 { id: ID! }
      type MyEdgeType {
        numberOfFoos: Int
      } `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /defines a ScalarConnection with an invalid type/);
  });

  it('ScalarConnection is okay with scalars and enums', () => {
    const test = `
      enum MyEnum { ONE TWO THREE }
      type TestCase implements Node {
        id: ID!
        conn1: ScalarConnection(Int, MyEdgeType)
        conn2: ScalarConnection(Float, MyEdgeType)
        conn3: ScalarConnection(Boolean, MyEdgeType)
        conn4: ScalarConnection(ID, MyEdgeType)
        conn5: ScalarConnection(String, MyEdgeType)
        conn6: ScalarConnection(MyEnum, MyEdgeType)
      }
      type MyEdgeType {
        numberOfFoos: Int
      } `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

});
