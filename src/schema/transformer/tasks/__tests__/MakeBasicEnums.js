import { expect } from 'chai';
import { describe, it } from 'mocha';
import { runTest, stripMargin } from '../../__tests__/setup';

describe('AST Transformer / MakeBasicEnums: ', () => {
  it('Creates basic enum definitions', () => {
    const result = runTest(` type Foo implements Node { id: ID! } `);

    expect(result).to.contain(stripMargin`
      |enum _NodeValue {
      |  value
      |}`);

    expect(result).to.contain(stripMargin`
      |enum _NumericAggregate {
      |  SUM
      |  COUNT
      |  MIN
      |  MAX
      |  AVERAGE
      |}`);

    expect(result).to.contain(stripMargin`
      |enum _Order {
      |  ASCENDING
      |  DESCENDING
      |}`);
  });
});
