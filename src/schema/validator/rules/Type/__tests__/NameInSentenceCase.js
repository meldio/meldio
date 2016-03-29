import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
} from '../../../__tests__/setup';

import { NameInSentenceCase as rule } from '../NameInSentenceCase';

describe('Schema Validation: Type / NameInSentenceCase: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Type name SentanceCase is okay', () => {
    const test = ` type SentanceCase implements Node { id: ID! } `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Type name camelCase gives a warning', () => {
    const test = ` type camelCase implements Node { id: ID! } `;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.deep.match(/should be in "SentenceCase"/);
  });

  it('Type name Underscore_ gives a warning', () => {
    const test = ` type Underscore_ implements Node { id: ID! } `;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.deep.match(/should be in "SentenceCase"/);
  });

  it('Type name Mid_Underscore gives a warning', () => {
    const test = ` type Mid_Underscore implements Node { id: ID! } `;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.deep.match(/should be in "SentenceCase"/);
  });
});
