import { expect } from 'chai';
import { describe, it } from 'mocha';
import { runTest } from '../../../__tests__/setup';

describe('AST Transformer / visitor / RemoveOrderDefs: ', () => {
  it('Filter definitions are removed from the AST', () => {
    const result = runTest(`
      order on NodeConnection(Foo, Bar) {
        FOO: [{ node: { foo: ASCENDING } }]
      }
      order on ScalarConnection(String, Bar) {
        BAR: [{ node: ASCENDING }]
      }
      order on ObjectConnection(Obj, Bar) {
        BAR: [{ bar: ASCENDING }]
      }
      order on [Foo] {
        FOO: [{ foo: ASCENDING }]
      }
      order on [Obj] {
        FOO: [{ value: ASCENDING }]
      }
    `);
    expect(result).to.not.contain('order');
  });
});
