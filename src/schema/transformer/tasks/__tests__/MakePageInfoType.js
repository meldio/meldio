import { expect } from 'chai';
import { describe, it } from 'mocha';
import { runTest, stripMargin } from '../../__tests__/setup';

describe('AST Transformer / MakePageInfoType: ', () => {
  it('Creates PageInfo type', () => {
    const result = runTest(` type Foo implements Node { id: ID! } `);

    expect(result).to.contain(stripMargin`
      |type PageInfo {
      |  hasPreviousPage: Boolean!
      |  hasNextPage: Boolean!
      |  startCursor: String
      |  endCursor: String
      |}`);
  });
});
