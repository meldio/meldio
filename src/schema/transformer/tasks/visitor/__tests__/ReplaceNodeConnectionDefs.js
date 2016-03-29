import { expect } from 'chai';
import { describe, it } from 'mocha';
import { runTest } from '../../../__tests__/setup';
import { getConnectionName } from '../../../../analyzer';

describe('AST Transformer / visitor / ReplaceNodeConnectionDefs: ', () => {
  it('NodeConnection definitions are removed', () => {
    const result = runTest(`
      type EdgeProps {
        date: String
      }

      interface Named {
        conn: NodeConnection(RelatedType, named)
        connWithEdge: NodeConnection(RelatedType, namedWithEdge, EdgeProps)
      }

      type Foo implements Node, Named {
        id: ID!
        conn: NodeConnection(RelatedType, named)
        connWithEdge: NodeConnection(RelatedType, namedWithEdge, EdgeProps)
      }

      type RelatedType implements Node {
        id: ID!
        named: NodeConnection(Named, conn)
        namedWithEdge: NodeConnection(Named, connWithEdge, EdgeProps)
      }
    `);

    expect(result).to.not.contain('NodeConnection');
    expect(result).to.contain(`: ${getConnectionName('RelatedType')}`).and
      .to.contain(`: ${getConnectionName('RelatedType', 'EdgeProps')}`).and
      .to.contain(`: ${getConnectionName('Named')}`).and
      .to.contain(`: ${getConnectionName('Named', 'EdgeProps')}`);
  });
});
