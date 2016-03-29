import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  tokenTypeDef
} from '../../../__tests__/setup';

import { NoLeadingUnderscore as rule } from '../NoLeadingUnderscore';

describe('Schema Validation: Enum / NoLeadingUnderscore: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Enum name cannot start with _', () => {
    const test = ` enum _SentanceCase { ONE } ${tokenTypeDef} `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.have.length(1);
    expect(errors).to.deep.match(/cannot start with an underscore/);
  });

});
