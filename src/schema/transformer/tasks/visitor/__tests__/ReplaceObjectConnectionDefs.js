import { expect } from 'chai';
import { describe, it } from 'mocha';
import { runTest } from '../../../__tests__/setup';
import { getConnectionName } from '../../../../analyzer';

describe('AST Transformer / visitor / ReplaceObjectConnectionDefs: ', () => {
  it('ObjectConnection definitions are removed', () => {
    const result = runTest(`
      type EdgeProps {
        date: String
      }

      type SimpleFoo {
        foo: String
      }

      interface Named {
        conn: ObjectConnection(SimpleFoo)
        connWithEdge: ObjectConnection(SimpleFoo, EdgeProps)
      }

      type Foo implements Node, Named {
        id: ID!
        conn: ObjectConnection(SimpleFoo)
        connWithEdge: ObjectConnection(SimpleFoo, EdgeProps)
      }
    `);

    expect(result).to.not.contain('ObjectConnection');
    expect(result).to.contain(`: ${getConnectionName('SimpleFoo')}`).and
      .to.contain(`: ${getConnectionName('SimpleFoo', 'EdgeProps')}`);
  });
});
