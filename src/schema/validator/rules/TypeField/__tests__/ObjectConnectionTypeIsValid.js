import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
} from '../../../__tests__/setup';

import { ObjectConnectionTypeIsValid as rule }
  from '../ObjectConnectionTypeIsValid';

describe('Schema Validation: TypeField / ObjectConnectionTypeIsValid: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Throws if ObjectConnection to refereces a Node type', () => {
    const test = `
      type TestCase implements Node {
        id: ID!
        conn: ObjectConnection(RelatedType, MyEdgeType)
      }
      type RelatedType implements Node { id: ID! }
      type MyEdgeType {
        numberOfFoos: Int
      } `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /defines an ObjectConnection with an invalid type/);
  });

  it('Throws if ObjectConnection to refereces a Node interface', () => {
    const test = `
      type TestCase implements Node {
        id: ID!
        conn: ObjectConnection(RelatedInterface, MyEdgeType)
      }
      interface RelatedInterface {
        name: String
      }
      type RelatedType implements Node, RelatedInterface {
        id: ID!
        name: String
      }
      type MyEdgeType {
        numberOfFoos: Int
      } `;

    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /defines an ObjectConnection with an invalid type/);
  });

  it('Throws if ObjectConnection to refereces a Node union', () => {
    const test = `
      type TestCase implements Node {
        id: ID!
        conn: ObjectConnection(RelatedUnion, MyEdgeType)
      }
      union RelatedUnion = RelatedType
      type RelatedType implements Node { id: ID! }
      type MyEdgeType {
        numberOfFoos: Int
      } `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /defines an ObjectConnection with an invalid type/);
  });

  it('Throws if ObjectConnection to refereces a scalar type', () => {
    const test = `
      type TestCase implements Node {
        id: ID!
        conn: ObjectConnection(Int, MyEdgeType)
      }
      type MyEdgeType {
        numberOfFoos: Int
      } `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /defines an ObjectConnection with an invalid type/);
  });

  it('Throws if ObjectConnection to refereces an enum type', () => {
    const test = `
      enum Stuff { ONE TWO THREE }
      type TestCase implements Node {
        id: ID!
        conn: ObjectConnection(Stuff, MyEdgeType)
      }
      type MyEdgeType {
        numberOfFoos: Int
      } `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /defines an ObjectConnection with an invalid type/);
  });

});
