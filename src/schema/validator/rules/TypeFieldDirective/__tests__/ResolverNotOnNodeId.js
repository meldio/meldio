import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
} from '../../../__tests__/setup';

import { ResolverNotOnNodeId as rule } from '../ResolverNotOnNodeId';

describe('Schema Validation: TypeDirective / ResolverNotOnNodeId: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Throws if @resolver is defined on id field of Node type', () => {
    const test = `
      type Foo implements Node
      {
        id: ID! @resolver(function: "foo")
        name: String
      } `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/@resolver cannot be defined on id field/);
  });
});
