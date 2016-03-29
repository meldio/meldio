import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  tokenTypeDef
} from '../../../__tests__/setup';

import { NameInSentenceCase as rule } from '../NameInSentenceCase';

describe('Schema Validation: Interface / NameInSentenceCase: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Interface name SentanceCase is okay', () => {
    const test = ` interface SentanceCase { id: ID! } ${tokenTypeDef}`;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Interface name camelCase gives a warning', () => {
    const test = ` interface camelCase { id: ID! } ${tokenTypeDef}`;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.have.length(1);
    expect(warnings).to.deep.match(/should be in "SentenceCase"/);
  });

  it('Interface name Underscore_ gives a warning', () => {
    const test = ` interface Underscore_ { id: ID! } ${tokenTypeDef}`;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.have.length(1);
    expect(warnings).to.deep.match(/should be in "SentenceCase"/);
  });

  it('Interface name Mid_Underscore gives a warning', () => {
    const test = ` interface Mid_Underscore { id: ID! } ${tokenTypeDef}`;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.have.length(1);
    expect(warnings).to.deep.match(/should be in "SentenceCase"/);
  });
});
