import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
} from '../../../__tests__/setup';

import { NoDirectives as rule } from '../NoDirectives';

describe('Schema Validation: InterfaceFieldDirective / OnlyAllowedDirectives: ',
() => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Throws on @pluralIdField directive', () => {
    const test = `
      interface Foo { id: ID! name: String @pluralIdField(field: "byName") }
      type Bar implements Node, Foo { id: ID! }
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/that is currently unsupported/);
  });

  it('Throws on @with directive', () => {
    const test = `
      interface Foo { id: ID! name: String @with(filter: Foo) }
      type Bar implements Node, Foo { id: ID! }
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/that is currently unsupported/);
  });

});
