import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest, separateResults
} from '../../../__tests__/setup';

import { NoDirectives as rule } from '../NoDirectives';

describe('Schema Validation: InterfaceDirective / NoDirectives: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Throws on unexpected directive', () => {
    const test = `
      interface Foo @rootConnection(field: "allFoos") { id: ID! }
      type Bar implements Node, Foo { id: ID! }
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.have.length(1);
    expect(errors).to.deep.match(/that is currently unsupported/);
  });
});
