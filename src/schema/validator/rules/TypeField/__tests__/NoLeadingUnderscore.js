import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
} from '../../../__tests__/setup';

import { NoLeadingUnderscore as rule } from '../NoLeadingUnderscore';

describe('Schema Validation: TypeField / NoLeadingUnderscore: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Field name _Underscore throws an error', () => {
    const test = `
      type SentanceCase implements Node {
        id: ID! _Underscore: String
      } `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /Field name ".*" in type "SentanceCase" cannot start with an underscore/);
  });

  it('Field name _camelUnderscore throws an error', () => {
    const test = `
      type SentanceCase implements Node {
        id: ID! _camelUnderscore: String
      } `;

    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /Field name ".*" in type "SentanceCase" cannot start with an underscore/);
  });
});
