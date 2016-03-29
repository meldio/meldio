/* @flow */

import { error } from '../../utils.js';
import type { Rule } from '../../types';

export const ClientMutationIdIsValid: Rule = ({ mutation, field }) => {
  if (!mutation || !field) { throw Error('context not passed to rule.'); }
  const { name: mutationName } = mutation;
  const { name, loc, type, isScalar, isRequired } = field;

  if (name === 'clientMutationId' &&
        (type !== 'String' || !isScalar || !isRequired)) {
    return error`Mutation "${mutationName}" declares field clientMutationId
               ~ incorrectly (must be String!). Feel free to remove this
               ~ declaration since clientMutationId field will be created
               ~ automatically. ${loc}`;
  }
};
