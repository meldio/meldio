import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
} from '../../../__tests__/setup';

import { NameInCamelCase as rule } from '../NameInCamelCase';

describe('Schema Validation: TypeField / NameInCamelCase: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Field name camelCase is okay', () => {
    const test = ` type SentanceCase implements Node {
      id: ID!
      camelCase: String
    } `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Field name SentanceCase gives a warning', () => {
    const test = ` type SentanceCaseType implements Node {
      id: ID! SentanceCase: String } `;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.deep.match(/should be in "camelCase"/);
  });

  it('Field name Underscore_ gives a warning', () => {
    const test = ` type SentanceCase implements Node {
      id: ID! Underscore_: String } `;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.deep.match(/should be in "camelCase"/);
  });

  it('Field name Mid_Underscore gives a warning', () => {
    const test = ` type SentanceCase implements Node {
      id: ID! Mid_Underscore: String } `;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.deep.match(/should be in "camelCase"/);
  });
});
