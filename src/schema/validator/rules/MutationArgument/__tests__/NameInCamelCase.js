import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  tokenTypeDef
} from '../../../__tests__/setup';

import { NameInCamelCase as rule } from '../NameInCamelCase';

describe('Schema Validation: MutationArgument / NameInCamelCase: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Mutation argument name camelCase is okay', () => {
    const test = ` mutation testMutation(
      id: ID!
      camelCase: String
    ) { id: ID } ${tokenTypeDef}  `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Mutation argument name SentanceCase gives a warning', () => {
    const test = ` mutation testMutation(
      id: ID! SentanceCase: String) {id: ID} ${tokenTypeDef} `;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.deep.match(/should be in "camelCase"/);
  });

  it('Mutation argument name _Underscore gives a warning', () => {
    const test = ` mutation testMutation(
      id: ID! _Underscore: String) {id: ID} ${tokenTypeDef} `;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.deep.match(/should be in "camelCase"/);
  });

  it('Mutation argument name _camelUnderscore gives a warning', () => {
    const test = ` mutation testMutation(
      id: ID! _camelUnderscore: String ) {id: ID} ${tokenTypeDef} `;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.deep.match(/should be in "camelCase"/);
  });

  it('Mutation argument name Underscore_ gives a warning', () => {
    const test = ` mutation testMutation(
      id: ID! Underscore_: String ) {id: ID} ${tokenTypeDef} `;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.deep.match(/should be in "camelCase"/);
  });

  it('Mutation argument name Mid_Underscore gives a warning', () => {
    const test = ` mutation testMutation(
      id: ID! Mid_Underscore: String ) {id: ID} ${tokenTypeDef} `;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.deep.match(/should be in "camelCase"/);
  });
});
