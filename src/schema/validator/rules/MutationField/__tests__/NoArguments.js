import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  tokenTypeDef
} from '../../../__tests__/setup';

import { NoArguments as rule } from '../NoArguments';

describe('Schema Validation: MutationField / NoArguments: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Mutation fields cannot define arguments', () => {
    const test = ` mutation failFast(id: ID) {
      id: ID!, foo(param: Int): String } ${tokenTypeDef} `;

    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /Field "foo" of mutation "failFast" cannot have arguments/);
  });
});
