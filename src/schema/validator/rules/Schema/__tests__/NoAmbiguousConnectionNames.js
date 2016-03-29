import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
} from '../../../__tests__/setup';

describe('Schema Validation: Schema / NoAmbiguousConnectionNames: ', () => {
  it('Throws if connections with edge have the same name but different type',
  () => {
    const test = `
      type ConnNode implements Node {
        id: ID!
        main: NodeConnection(MainType, conn1, EdgeProps)
      }
      type Conn implements Node {
        id: ID!
        main: NodeConnection(MainType, conn2, NodeEdgeProps)
      }

      type EdgeProps { cost: Int }
      type NodeEdgeProps { cost: Int }

      type MainType implements Node {
        id: ID!
        conn1: NodeConnection(ConnNode, main, EdgeProps)
        conn2: NodeConnection(Conn, main, NodeEdgeProps)
      }
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep
      .match(/Connection name ConnNodeEdgePropsConnection is ambiguous/);
  });

  it('Throws if connection without edge has the same name but different type',
  () => {
    const test = `
      type ConnNodeEdgeProps implements Node {
        id: ID!
        main: NodeConnection(MainType, conn1)
      }
      type Conn implements Node {
        id: ID!
        main: NodeConnection(MainType, conn2, NodeEdgeProps)
      }

      type NodeEdgeProps { cost: Int }

      type MainType implements Node {
        id: ID!
        conn1: NodeConnection(ConnNodeEdgeProps, main)
        conn2: NodeConnection(Conn, main, NodeEdgeProps)
      }
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep
      .match(/Connection name ConnNodeEdgePropsConnection is ambiguous/);
  });
});
