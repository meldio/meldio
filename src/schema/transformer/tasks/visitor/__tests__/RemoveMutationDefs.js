import { expect } from 'chai';
import { describe, it } from 'mocha';
import { runTest } from '../../../__tests__/setup';

describe('AST Transformer / visitor / RemoveMutationDefs: ', () => {
  it('Mutation definitions are removed', () => {
    const result = runTest(`
      type Foo implements Node {
        id: ID!
        name: String
      }
      mutation addFoo(name: String) {
        newFoo: Foo
      }
      mutation addFoos(names: [String!]) {
        newFoos: [Foo]
      }
    `);

    expect(result).to.not.contain('mutation addFoo(').and
                  .to.not.contain('mutation addFoos(');
  });
});
