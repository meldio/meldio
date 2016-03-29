import { expect } from 'chai';
import { describe, it } from 'mocha';
import { runTest, stripMargin } from '../../__tests__/setup';

describe('AST Transformer / MakeRootMutationsType: ', () => {
  it('Collects mutations into a root mutations type', () => {
    const result = runTest(`
      mutation doNothing { }

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

    expect(result).to.contain(stripMargin`
      |type _Mutations {
      |  doNothing(input: DoNothingInput!): DoNothingPayload
      |  addFoo(input: AddFooInput!): AddFooPayload
      |  addFoos(input: AddFoosInput!): AddFoosPayload
      |}`);
  });
});
