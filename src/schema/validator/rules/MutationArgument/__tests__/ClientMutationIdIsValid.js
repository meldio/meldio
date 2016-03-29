import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  tokenTypeDef
} from '../../../__tests__/setup';

import { ClientMutationIdIsValid as rule } from '../ClientMutationIdIsValid';

describe('Schema Validation: MutationArgument / ClientMutationIdIsValid: ',
() => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Declaring clientMutationId incorrectly gives an error', () => {
    const test = ` mutation testMutation(
      id: ID! clientMutationId: ID! ) {id: ID} ${tokenTypeDef} `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /declares argument clientMutationId incorrectly/);
  });

  it('Declaring clientMutationId incorrectly gives an error', () => {
    const test = ` mutation testMutation(
      id: ID! clientMutationId: [String]! ) {id: ID} ${tokenTypeDef} `;

    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /declares argument clientMutationId incorrectly/);
  });

  it('Declaring clientMutationId incorrectly gives an error', () => {
    const test = ` mutation testMutation(
      id: ID! clientMutationId: [String!] ) {id: ID} ${tokenTypeDef} `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /declares argument clientMutationId incorrectly/);
  });
});
