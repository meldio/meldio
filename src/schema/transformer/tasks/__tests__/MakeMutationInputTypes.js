import { expect } from 'chai';
import { describe, it } from 'mocha';
import { runTest, stripMargin } from '../../__tests__/setup';

describe('AST Transformer / MakeMutationInputTypes: ', () => {
  it('Creates mutation input types correctly', () => {
    const result = runTest(`
      mutation doNothing { }

      type EdgeProps {
        date: String
      }
      type Foo implements Node {
        id: ID!
        names: ScalarConnection(String)
        namesAndDates: ScalarConnection(String, EdgeProps)
      }

      mutation addFoo(name: String) {
        newFoo: Foo
        namesEdge: Edge(String)
      }
      mutation addFoos(names: [String!]!) {
        newFoos: [Foo]
        namesAndDatesEdge: Edge(String, EdgeProps)
      }

      mutation addFoosDeux(names: [String!]!, clientMutationId: String!) {
        newFoos: [Foo]
        namesAndDatesEdge: Edge(String, EdgeProps)
        clientMutationId: String!
      }
    `);

    expect(result)
      .to.contain(stripMargin`
        |input DoNothingInput {
        |  clientMutationId: String!
        |}`).and
      .to.contain(stripMargin`
        |input AddFooInput {
        |  name: String
        |  clientMutationId: String!
        |}`).and
      .to.contain(stripMargin`
        |input AddFoosInput {
          |  names: [String!]!
          |  clientMutationId: String!
        |}`).and
      .to.contain(stripMargin`
        |input AddFoosDeuxInput {
          |  names: [String!]!
          |  clientMutationId: String!
        |}`);
  });
});
