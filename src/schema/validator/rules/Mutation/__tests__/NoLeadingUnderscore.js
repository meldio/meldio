import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  tokenTypeDef
} from '../../../__tests__/setup';

import { NoLeadingUnderscore as rule } from '../NoLeadingUnderscore';

describe('Schema Validation: Mutation / NoLeadingUnderscore: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Mutation name cannot start with _', () => {
    const test =
      ` mutation _Mutation(id: ID){ id: ID! } ${tokenTypeDef}`;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/cannot start with an underscore/);
  });

  it('Mutation name slimBoo is okay', () => {
    const test = ` mutation slimBoo(id: ID){ id: ID! } ${tokenTypeDef}`;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

});
