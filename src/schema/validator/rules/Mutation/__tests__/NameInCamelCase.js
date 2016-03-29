import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  tokenTypeDef
} from '../../../__tests__/setup';

import { NameInCamelCase as rule } from '../NameInCamelCase';

describe('Schema Validation: Mutation / NameInCamelCase: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Mutation name camelCase is okay', () => {
    const test = ` mutation camelCase(str: String) { new: String }
      ${tokenTypeDef}  `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Mutation name SentanceCase gives a warning', () => {
    const test = ` mutation SentanceCase(str: String) { new: String }
      ${tokenTypeDef}  `;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.deep.match(/should be in "camelCase"/);
  });

  it('Mutation name Underscore_ gives a warning', () => {
    const test = ` mutation Underscore_(str: String) { new: String }
      ${tokenTypeDef}  `;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.deep.match(/should be in "camelCase"/);
  });

  it('Mutation name Mid_Underscore gives a warning', () => {
    const test = ` mutation Mid_Underscore(str: String) { new: String }
      ${tokenTypeDef}  `;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.deep.match(/should be in "camelCase"/);
  });
});
