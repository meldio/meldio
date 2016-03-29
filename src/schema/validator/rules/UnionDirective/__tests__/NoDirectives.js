import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
} from '../../../__tests__/setup';

import { NoDirectives as rule } from '../NoDirectives';

describe('Schema Validation: UnionDirective / NoDirectives:', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Throws on unexpected directive', () => {
    const test = `
      union FooBar = Foo | Bar @rootConnection(field: "allFooBars")
      type Foo implements Node { id: ID! }
      type Bar implements Node { id: ID! }
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/that is currently unsupported/);
  });
});
