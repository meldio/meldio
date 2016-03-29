import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
} from '../../../__tests__/setup';

import { NoArgumentsWithoutResolver as rule }
  from '../NoArgumentsWithoutResolver';

describe('Schema Validation: TypeField / NoArgumentsWithoutResolver: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Type fields without resolver cannot define arguments', () => {
    const test = `
      type FailFast implements Node {
        id: ID!
        foo(param: Int): String
      } `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/cannot have arguments/);
  });

  it('Type fields with resolver can define arguments', () => {
    const test = `
      type Okay implements Node {
        id: ID!
        foo(param: Int): String @resolver(function: "calcFoo")
      } `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });
});
