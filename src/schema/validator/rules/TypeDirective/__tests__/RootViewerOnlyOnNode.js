import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  tokenTypeDef,
} from '../../../__tests__/setup';

import { RootViewerOnlyOnNode as rule } from '../RootViewerOnlyOnNode';

describe('Schema Validation: TypeDirective / RootViewerOnlyOnNode: ',
() => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Throws if @rootViewer is on a type that is not Node', () => {
    const test = `
      type Foo @rootViewer(field: "viewer") { id: ID! }
      ${tokenTypeDef}
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /directive can only be specified on types that implement Node/);
  });

  it('Okay if @rootViewer is on a Node type', () => {
    const test = `
      type Foo implements Node @rootViewer(field: "viewer")
      {
        id: ID!
      }
    `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });
});
