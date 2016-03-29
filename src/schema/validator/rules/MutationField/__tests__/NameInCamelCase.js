import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  tokenTypeDef
} from '../../../__tests__/setup';

import { NameInCamelCase as rule } from '../NameInCamelCase';

describe('Schema Validation: MutationField / NameInCamelCase: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Mutation field name camelCase is okay', () => {
    const test = ` mutation testMutation(id: ID!) {
      id: ID, camelCase: String } ${tokenTypeDef}  `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Mutation field name SentanceCase gives a warning', () => {
    const test = ` mutation testMutation(
      id: ID! ) {id: ID, SentanceCase: String} ${tokenTypeDef} `;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.deep.match(/should be in "camelCase"/);
  });

  it('Mutation field name _Underscore gives a warning', () => {
    const test = ` mutation testMutation(
      id: ID! ) {id: ID, _Underscore: String} ${tokenTypeDef} `;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.deep.match(/should be in "camelCase"/);
  });

  it('Mutation field name _camelUnderscore gives a warning', () => {
    const test = ` mutation testMutation(
      id: ID! ) {id: ID, _camelUnderscore: String} ${tokenTypeDef} `;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.deep.match(/should be in "camelCase"/);
  });

  it('Mutation field name Underscore_ gives a warning', () => {
    const test = ` mutation testMutation(
      id: ID! ) {id: ID, Underscore_: String} ${tokenTypeDef} `;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.deep.match(/should be in "camelCase"/);
  });

  it('Mutation field name Mid_Underscore gives a warning', () => {
    const test = ` mutation testMutation(
      id: ID!  ) {id: ID, Mid_Underscore: String} ${tokenTypeDef} `;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.deep.match(/should be in "camelCase"/);
  });
});
