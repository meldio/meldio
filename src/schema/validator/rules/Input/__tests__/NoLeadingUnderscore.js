import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  tokenTypeDef,
} from '../../../__tests__/setup';

import { NoLeadingUnderscore as rule } from '../NoLeadingUnderscore';

describe('Schema Validation: InputObject / NoLeadingUnderscore: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Input object name cannot start with _', () => {
    const test = ` input _InputObj { id: ID! } ${tokenTypeDef}`;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.have.length(1);
    expect(errors).to.deep.match(/cannot start with an underscore/);
  });

  it('Input object name SlimBoo is okay', () => {
    const test = ` input SlimBoo { id: ID! } ${tokenTypeDef}`;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });
});
