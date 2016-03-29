import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  tokenTypeDef,
} from '../../../__tests__/setup';

import { ConnectionMustBeOnNode as rule } from '../ConnectionMustBeOnNode';

describe('Schema Validation: TypeField / ConnectionMustBeOnNode: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Throws if NodeConnection is defined on a type that is not Node ', () => {
    const test = `
      ${tokenTypeDef}
      type TestCase {
        id: ID!
        conn: NodeConnection(RelatedType, testCase)
      }

      type RelatedType implements Node {
        id: ID!
        testCase: NodeConnection(TestCase, conn)
      }
      `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /Connection fields can only be defined on types that implement Node/);
  });

  it('Throws if ObjectConnection is defined on a type that is not Node ',
  () => {
    const test = `
      ${tokenTypeDef}
      type TestCase {
        id: ID!
        conn: ObjectConnection(TestCase)
      }  `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /Connection fields can only be defined on types that implement Node/);
  });

  it('Throws if ScalarConnection is defined on a type that is not Node ',
  () => {
    const test = `
      ${tokenTypeDef}
      type TestCase {
        id: ID!
        conn: ScalarConnection(Int)
      }  `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /Connection fields can only be defined on types that implement Node/);
  });

  it('Ok if NodeConnection is defined on a type that is Node ', () => {
    const test = `
      type TestCase implements Node {
        id: ID!
        conn: NodeConnection(RelatedType, testCase)
      }

      type RelatedType implements Node {
        id: ID!
        testCase: NodeConnection(TestCase, conn)
      }`;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Ok if ObjectConnection is defined on a type that is Node ', () => {
    const test = `
      type TestCase implements Node {
        id: ID!
        conn: ObjectConnection(Foo)
      }
      type Foo { foo: String }
      `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Ok if ScalarConnection is defined on a type that is Node ', () => {
    const test = `
      type TestCase implements Node {
        id: ID!
        conn: ScalarConnection(Int)
      }`;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });
});
