/* @flow */

import { warning } from '../../utils.js';
import type { Rule } from '../../types';

export const ClientMutationIdProvided: Rule = ({ mutation, field }) => {
  if (!mutation || !field) { throw Error('context not passed to rule.'); }
  const { name: mutationName } = mutation;
  const { name, loc } = field;

  if (name === 'clientMutationId') {
    return warning`You should not declare clientMutationId field explicitly
                 ~ on mutation "${mutationName}". The argument will be created
                 ~ automatically. ${loc}`;
  }
};
