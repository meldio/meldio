import { expect } from 'chai';
import { describe, it } from 'mocha';
import { runTest } from '../../../__tests__/setup';

describe('AST Transformer / visitor / RemoveFilterDefs: ', () => {
  it('Filter definitions are removed from the AST', () => {
    const result = runTest(`
      filter on NodeConnection(Foo, Bar) {
        FOO: { node: { foo: { eq: "foo" } } }
      }
      filter on ScalarConnection(String, Bar) {
        BAR: { node: { eq: "bar" } }
      }
      filter on ObjectConnection(Obj, Bar) {
        BAR: { bar: { eq: "bar" } }
      }
      filter on [Foo] {
        FOO: (foo: String) { foo: { eq: $foo } }
      }
      filter on [Obj] {
        FOO: (value: String) { value: { eq: $value } }
      }
      filter on [String] {
        VALUE: (value: String) { eq: $value }
      }
      filter on [Int] {
        VALUE: (value: Int) { eq: $value }
      }
      filter on [Boolean] {
        VALUE: (value: Boolean) { eq: $value }
        TRUE: { eq: true }
        FALSE: { eq: false }
      }
    `);
    expect(result).to.not.contain('filter');
  });
});
