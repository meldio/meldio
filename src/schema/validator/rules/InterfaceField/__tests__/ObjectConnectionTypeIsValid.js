import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
} from '../../../__tests__/setup';

import { ObjectConnectionTypeIsValid as rule }
  from '../ObjectConnectionTypeIsValid';

describe('Schema Validation: InterfaceField / ObjectConnectionTypeIsValid: ',
() => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Throws if ObjectConnection to refereces a Node type', () => {
    const test = `
      interface TestCase {
        conn: ObjectConnection(RelatedType, MyEdgeType)
      }
      type TestType implements Node, TestCase {
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
      /Field "conn" on "TestCase" interface defines an ObjectConnection/);
  });

  it('Throws if ObjectConnection to refereces a Node interface', () => {
    const test = `
      interface TestCase {
        conn: ObjectConnection(RelatedInterface, MyEdgeType)
      }
      type TestType implements Node, TestCase {
        id: ID!
        conn: ObjectConnection(RelatedType, MyEdgeType)
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
      /Field "conn" on "TestCase" interface defines an ObjectConnection/);
  });

  it('Throws if ObjectConnection to refereces a Node union', () => {
    const test = `
      interface TestCase {
        conn: ObjectConnection(RelatedUnion, MyEdgeType)
      }
      type TestType implements Node, TestCase {
        id: ID!
        conn: ObjectConnection(RelatedType, MyEdgeType)
      }

      union RelatedUnion = RelatedType
      type RelatedType implements Node { id: ID! }
      type MyEdgeType {
        numberOfFoos: Int
      } `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /Field "conn" on "TestCase" interface defines an ObjectConnection/);
  });

  it('Throws if ObjectConnection to refereces a scalar type', () => {
    const test = `
      interface TestCase {
        conn: ObjectConnection(Int, MyEdgeType)
      }
      type TestType implements Node, TestCase {
        id: ID!
        conn: ObjectConnection(Int, MyEdgeType)
      }

      type MyEdgeType {
        numberOfFoos: Int
      } `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /Field "conn" on "TestCase" interface defines an ObjectConnection/);
  });

  it('Throws if ObjectConnection to refereces an enum type', () => {
    const test = `
      enum Stuff { ONE TWO THREE }
      interface TestCase {
        conn: ObjectConnection(Stuff, MyEdgeType)
      }
      type TestType implements Node, TestCase {
        id: ID!
        conn: ObjectConnection(Stuff, MyEdgeType)
      }

      type MyEdgeType {
        numberOfFoos: Int
      } `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /Field "conn" on "TestCase" interface defines an ObjectConnection/);
  });

});
