import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  tokenTypeDef
} from '../../../__tests__/setup';

import { ValueInCapitalCase as rule } from '../ValueInCapitalCase';

describe('Schema Validation: Enum / NameInSentenceCase: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Enum value CAPITAL_CASE_1 is okay', () => {
    const test = ` enum Enum { CAPITAL_CASE_1 CAPITAL_CASE_2 } ${tokenTypeDef}`;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Enum value _UNDERSCORE gives a warning', () => {
    const test = ` enum Enum { CAPITAL_CASE_1, _UNDERSCORE } ${tokenTypeDef}`;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.have.length(1);
    expect(warnings).to.deep.match(/should be in "CAPITAL_CASE"/);
  });

  it('Enum value UNDERSCORE_ gives a warning', () => {
    const test = ` enum Enum { CAPITAL_CASE_1, UNDERSCORE_ } ${tokenTypeDef}`;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.have.length(1);
    expect(warnings).to.deep.match(/should be in "CAPITAL_CASE"/);
  });

  it('Enum value camelCase gives a warning', () => {
    const test = ` enum Enum { CAPITAL_CASE_1, camelCase } ${tokenTypeDef}`;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.have.length(1);
    expect(warnings).to.deep.match(/should be in "CAPITAL_CASE"/);
  });

  it('Enum value SentenceCase gives a warning', () => {
    const test = ` enum Enum { CAPITAL_CASE_1, SentenceCase } ${tokenTypeDef}`;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.have.length(1);
    expect(warnings).to.deep.match(/should be in "CAPITAL_CASE"/);
  });
});
