import { expect } from 'chai';
import { describe, it } from 'mocha';
import { runTest, stripMargin } from '../../__tests__/setup';

describe('AST Transformer / MakeNodeInterface: ', () => {
  it('Creates PageInfo type', () => {
    const result = runTest(` type Foo implements Node { id: ID! } `);

    expect(result).to.contain(stripMargin`
      |interface Node {
      |  id: ID!
      |}`);
  });
});
