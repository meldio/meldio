/* @flow */

import { warning } from '../../utils.js';
import type { Rule } from '../../types';

export const ClientMutationIdProvided: Rule = ({ mutation, argument }) => {
  if (!mutation || !argument) { throw Error('context not passed to rule.'); }
  const { name: mutationName } = mutation;
  const { name, loc } = argument;

  if (name === 'clientMutationId') {
    return warning`You should not declare clientMutationId argument explicitly
                 ~ on mutation "${mutationName}". The argument will be created
                 ~ automatically. ${loc}`;
  }
};
