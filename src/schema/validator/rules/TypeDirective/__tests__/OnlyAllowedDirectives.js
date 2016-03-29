import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
} from '../../../__tests__/setup';

import { OnlyAllowedDirectives as rule } from '../OnlyAllowedDirectives';

describe('Schema Validation: TypeDirective / OnlyAllowedDirectives: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Throws on unexpected directive', () => {
    const test = ` type Foo implements Node @boom { id: ID! } `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/that is currently unsupported/);
  });
});
