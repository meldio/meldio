import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  tokenTypeDef
} from '../../../__tests__/setup';

import { NameInSentenceCase as rule } from '../NameInSentenceCase';

describe('Schema Validation: Enum / NameInSentenceCase: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Enum name SentanceCase is okay', () => {
    const test = ` enum SentanceCase { ONE } ${tokenTypeDef} `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Enum name camelCase gives a warning', () => {
    const test = ` enum camelCase { ONE } ${tokenTypeDef} `;
    const result = runTest(test);
    expect(result).to.deep.contain({
      kind: 'warning',
      description: 'Enum name "camelCase" should be in "SentenceCase".',
      loc: { kind: 'location', start: 1, end: 23 }
    });
  });

  it('Enum name Underscore_ gives a warning', () => {
    const test = ` enum Underscore_ { ONE } ${tokenTypeDef} `;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.have.length(1);
    expect(warnings).to.deep.match(/should be in "SentenceCase"./);
  });

  it('Enum name Mid_Underscore gives a warning', () => {
    const test = ` enum Mid_Underscore { ONE } ${tokenTypeDef} `;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.have.length(1);
    expect(warnings).to.deep.match(/should be in "SentenceCase"./);
  });
});
