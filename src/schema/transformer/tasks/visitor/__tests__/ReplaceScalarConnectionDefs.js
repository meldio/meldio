import { expect } from 'chai';
import { describe, it } from 'mocha';
import { runTest } from '../../../__tests__/setup';
import { getConnectionName } from '../../../../analyzer';

describe('AST Transformer / visitor / ReplaceScalarConnectionDefs: ', () => {
  it('ScalarConnection definitions are removed', () => {
    const result = runTest(`
      type EdgeProps {
        date: String
      }

      interface Named {
        conn: ScalarConnection(String)
        connWithEdge: ScalarConnection(String, EdgeProps)
      }

      type Foo implements Node, Named {
        id: ID!
        conn: ScalarConnection(String)
        connWithEdge: ScalarConnection(String, EdgeProps)
      }
    `);

    expect(result).to.not.contain('ScalarConnection');
    expect(result).to.contain(`: ${getConnectionName('String')}`).and
      .to.contain(`: ${getConnectionName('String', 'EdgeProps')}`);
  });
});
