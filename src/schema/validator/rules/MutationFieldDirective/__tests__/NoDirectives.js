import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
} from '../../../__tests__/setup';

import { NoDirectives as rule } from '../NoDirectives';

describe('Schema Validation: MutationFieldDirective / NoDirectives: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Mutation field cannot have a directive',() => {
    const test = `
      type Bar implements Node { id: ID! }
      mutation addBar(id: ID) {
        bar: Bar @rootPluralId(field: "bar")
      }
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/that is currently unsupported/);
  });
});
