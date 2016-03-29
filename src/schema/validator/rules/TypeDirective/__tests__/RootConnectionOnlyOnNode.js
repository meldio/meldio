import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  tokenTypeDef,
} from '../../../__tests__/setup';

import { RootConnectionOnlyOnNode as rule } from '../RootConnectionOnlyOnNode';

describe('Schema Validation: TypeDirective / RootConnectionOnlyOnNode: ',
() => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Throws if @rootConnection is on a type that is not Node', () => {
    const test = `
      type Foo @rootConnection(field: "allFoos") { id: ID! }
      ${tokenTypeDef}
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /directive can only be specified on types that implement Node/);
  });

  it('Okay if @rootConnection is on a Node type', () => {
    const test = `
      type Foo implements Node @rootConnection(field: "allFoos")
      {
        id: ID!
      }
    `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });
});
