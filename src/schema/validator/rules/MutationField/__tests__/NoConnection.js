import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  tokenTypeDef
} from '../../../__tests__/setup';

import { NoConnection as rule } from '../NoConnection';

describe('Schema Validation: MutationField / NoConnection: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Mutation field cannot be NodeConnection', () => {
    const test = ` mutation failFast(id: ID) {
      id: ID!,
      foo: NodeConnection(TokenTypeDef fooField)
    } ${tokenTypeDef} `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/Mutation fields cannot be connections/);
  });

  it('Mutation field cannot be ObjectConnection', () => {
    const test = `
    type Obj {
      foo: String
    }
    mutation failFast(id: ID) {
      id: ID!,
      foo: ObjectConnection(Obj)
    } ${tokenTypeDef} `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/Mutation fields cannot be connections/);
  });

  it('Mutation field cannot be ScalarConnection', () => {
    const test = `
    type Obj {
      foo: String
    }
    mutation failFast(id: ID) {
      id: ID!,
      foo: ScalarConnection(Int, Obj)
    } ${tokenTypeDef} `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/Mutation fields cannot be connections/);
  });
});
