import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  tokenTypeDef
} from '../../../__tests__/setup';

import { ClientMutationIdProvided as rule } from '../ClientMutationIdProvided';

describe('Schema Validation: MutationArgument / ClientMutationIdProvided: ',
() => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Declaring clientMutationId gives a warning', () => {
    const test = ` mutation testMutation(
      id: ID! clientMutationId: String! ) {id: ID} ${tokenTypeDef} `;

    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.deep.match(/should not declare clientMutationId/);
  });

});
