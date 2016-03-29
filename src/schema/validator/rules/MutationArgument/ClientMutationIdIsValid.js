/* @flow */

import { error } from '../../utils.js';
import type { Rule } from '../../types';

export const ClientMutationIdIsValid: Rule = ({ mutation, argument }) => {
  if (!mutation || !argument) { throw Error('context not passed to rule.'); }
  const { name: mutationName } = mutation;
  const { name, loc, type, isScalar, isRequired } = argument;

  if (name === 'clientMutationId' &&
        (type !== 'String' || !isScalar || !isRequired)) {
    return error`Mutation "${mutationName}" declares argument clientMutationId
               ~ incorrectly (must be String!). Feel free to remove this
               ~ declaration since clientMutationId argument will be created
               ~ automatically. ${loc}`;
  }
};
