import { expect } from 'chai';
import { describe, it } from 'mocha';
import { runTest } from '../../../__tests__/setup';
import { getEdgeName } from '../../../../analyzer';

describe('AST Transformer / visitor / ReplaceEdgeDefs: ', () => {
  it('Edge definitions are removed', () => {
    const result = runTest(`
      type EdgeProps {
        date: String
      }
      type Foo implements Node {
        id: ID!
        names: ScalarConnection(String)
        namesAndDates: ScalarConnection(String, EdgeProps)
      }
      mutation addName(name: String) {
        namesEdge: Edge(String)
      }
      mutation addNameAndDate(name: String, date: String) {
        namesAndDatesEdge: Edge(String, EdgeProps)
      }
    `);

    expect(result).to.not.contain('Edge(');
    expect(result).to.contain(`: ${getEdgeName('String')}`).and
                  .to.contain(`: ${getEdgeName('String', 'EdgeProps')}`);
  });
});
