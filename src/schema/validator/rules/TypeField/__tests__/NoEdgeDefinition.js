import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
} from '../../../__tests__/setup';

import { NoEdgeDefinition as rule } from '../NoEdgeDefinition';

describe('Schema Validation: TypeField / NoEdgeDefinition: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it(`Throws if edge is defined on a type`, () => {
    const test = `
      type TestCase implements Node {
        id: ID!
        edge: Edge(Foo, Bar)
      }
      type Foo { foo: String }
      type Bar { bar: String } `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
    /Type .* edges could only be defined on mutation and subscription fields/);
  });
});
