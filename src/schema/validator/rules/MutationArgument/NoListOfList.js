/* @flow */

import { error } from '../../utils.js';
import type { Rule } from '../../types';

export const NoListOfList: Rule = ({ mutation, argument }) => {
  if (!mutation || !argument) { throw Error('context not passed to rule.'); }
  const { name: mutationName } = mutation;
  const { name, loc, isObjectList, type } = argument;

  if (isObjectList && type === undefined) {
    return error`Mutation "${mutationName}" defines an argument "${name}" as a
               ~ list of list, which is currently not supported. ${loc}`;
  }
};
