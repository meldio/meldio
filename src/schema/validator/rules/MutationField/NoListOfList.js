/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const NoListOfList: Rule = ({ mutation, field }) => {
  if (!mutation || !field) { throw Error('context not passed to rule.'); }
  const { name: mutationName } = mutation;
  const { name, loc, isObjectList, type } = field;

  if (isObjectList && type === undefined) {
    return error`Mutation "${mutationName}" defines a field "${name}" as a
               ~ list of list, which is currently not supported. ${loc}`;
  }
};
