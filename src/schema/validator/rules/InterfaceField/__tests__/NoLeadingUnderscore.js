import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  tokenTypeDef,
} from '../../../__tests__/setup';

import { NoLeadingUnderscore as rule } from '../NoLeadingUnderscore';

describe('Schema Validation: InterfaceField / NoLeadingUnderscore: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Interface field name _Underscore throws an error', () => {
    const test = ` interface SentanceCase { id: ID! _Underscore: String }
      ${tokenTypeDef}`;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /interface "SentanceCase" cannot start with an underscore/);
  });

  it('Interface field name _camelUnderscore throws an error', () => {
    const test = ` interface SentanceCase { id: ID! _camelUnderscore: String }
      ${tokenTypeDef}`;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /interface "SentanceCase" cannot start with an underscore/);
  });
});
