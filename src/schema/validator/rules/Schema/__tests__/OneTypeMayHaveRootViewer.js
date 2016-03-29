import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
} from '../../../__tests__/setup';

describe('Schema Validation: Schema / OneTypeMayHaveRootViewer: ', () => {
  it('At most one type may have @rootViewer directive', () => {
    const test = `
      type SentanceCase implements Node
        @rootViewer(field: "one") {
        id: ID!
      }
      type AnotherCase implements Node
        @rootViewer(field: "two") {
        id: ID!
      }
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors)
      .to.deep.match(/At most one type can have @rootViewer directive/);
  });

  it('One type can have @rootViewer directive', () => {
    const test = `
      type SentanceCase implements Node
        @rootViewer(field: "one") {
        id: ID!
      }
      type AnotherCase implements Node  {
        id: ID!
      }
    `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('@rootViewer directive is not required', () => {
    const test = `
      type SentanceCase implements Node {
        id: ID!
      }
      type AnotherCase implements Node  {
        id: ID!
      }
    `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });
});
