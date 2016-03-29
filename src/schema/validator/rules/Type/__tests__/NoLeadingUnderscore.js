import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
} from '../../../__tests__/setup';

import { NoLeadingUnderscore as rule } from '../NoLeadingUnderscore';

describe('Schema Validation: Type / NoLeadingUnderscore: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Type name cannot start with "_"', () => {
    const test = ` type _SentanceCase implements Node { id: ID! } `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/cannot start with an underscore/);
  });
});
