import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  tokenTypeDef
} from '../../../__tests__/setup';

import { NameInCamelCase as rule } from '../NameInCamelCase';

describe('Schema Validation: InputObjectField / NameInCamelCase: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Input object field name camelCase is okay', () => {
    const test = ` input SentanceCase {
      id: ID!
      camelCase: String
    } ${tokenTypeDef}  `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Input object field name SentanceCase gives a warning', () => {
    const test = ` input SentanceCaseType {
      id: ID! SentanceCase: String } ${tokenTypeDef} `;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.have.length(1);
    expect(warnings).to.deep.match(/should be in "camelCase"/);
  });

  it('Input object field name _Underscore gives a warning', () => {
    const test = ` input SentanceCase {
      id: ID! _Underscore: String } ${tokenTypeDef} `;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.have.length(1);
    expect(warnings).to.deep.match(/should be in "camelCase"/);
  });

  it('Input object field name _camelUnderscore gives a warning', () => {
    const test = ` input SentanceCase {
      id: ID! _camelUnderscore: String } ${tokenTypeDef} `;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.deep.match(/should be in "camelCase"/);
  });

  it('Input object field name Underscore_ gives a warning', () => {
    const test = ` input SentanceCase {
      id: ID! Underscore_: String } ${tokenTypeDef} `;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.have.length(1);
    expect(warnings).to.deep.match(/should be in "camelCase"/);
  });

  it('Input object field name Mid_Underscore gives a warning', () => {
    const test = ` input SentanceCase {
      id: ID! Mid_Underscore: String } ${tokenTypeDef} `;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.have.length(1);
    expect(warnings).to.deep.match(/should be in "camelCase"/);
  });
});
