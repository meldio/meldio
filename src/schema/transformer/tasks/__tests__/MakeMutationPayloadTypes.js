import { expect } from 'chai';
import { describe, it } from 'mocha';
import { runTest, stripMargin } from '../../__tests__/setup';
import { getEdgeName } from '../../../analyzer';

describe('AST Transformer / MakeMutationPayloadTypes: ', () => {
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
        |type DoNothingPayload {
        |  clientMutationId: String!
        |}`).and
      .to.contain(stripMargin`
        |type AddFooPayload {
        |  newFoo: Foo
        |  namesEdge: ${getEdgeName('String')}
        |  clientMutationId: String!
        |}`).and
      .to.contain(stripMargin`
        |type AddFoosPayload {
        |  newFoos: [Foo]
        |  namesAndDatesEdge: ${getEdgeName('String', 'EdgeProps')}
        |  clientMutationId: String!
        |}`).and
      .to.contain(stripMargin`
        |type AddFoosDeuxPayload {
        |  newFoos: [Foo]
        |  namesAndDatesEdge: ${getEdgeName('String', 'EdgeProps')}
        |  clientMutationId: String!
        |}`);
  });
});
