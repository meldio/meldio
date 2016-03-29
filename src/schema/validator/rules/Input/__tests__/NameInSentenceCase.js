import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  tokenTypeDef
} from '../../../__tests__/setup';

import { NameInSentenceCase as rule } from '../NameInSentenceCase';

describe('Schema Validation: InputObject / NameInSentenceCase: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Input object name SentanceCase is okay', () => {
    const test = ` input SentanceCase { id: ID! } ${tokenTypeDef} `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Input object name camelCase gives a warning', () => {
    const test = ` input camelCase { id: ID! } ${tokenTypeDef} `;
    const result = runTest(test);
    expect(result).to.deep.contain({
      kind: 'warning',
      description: 'Input object name "camelCase" should be in "SentenceCase".',
      loc: { kind: 'location', start: 1, end: 28 }
    });
  });

  it('Input object name Underscore_ gives a warning', () => {
    const test = ` input Underscore_ { id: ID! } ${tokenTypeDef} `;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.have.length(1);
    expect(warnings).to.deep.match(/should be in "SentenceCase"/);
  });

  it('Input object name Mid_Underscore gives a warning', () => {
    const test = ` input Mid_Underscore { id: ID! } ${tokenTypeDef} `;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.have.length(1);
    expect(warnings).to.deep.match(/should be in "SentenceCase"/);
  });
});
