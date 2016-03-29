/* @flow */

import { error } from '../../utils.js';
import type { Rule } from '../../types';

export const NoListOfList: Rule = ({ filter, argument }) => {
  if (!filter || !argument) { throw Error('context not passed to rule.'); }
  const { name: filterName } = filter;
  const target = filterName.replace('Filter#', '');
  const { name, loc, isObjectList, type } = argument;

  if (isObjectList && type === undefined) {
    return error`Filter on ${target} defines an argument "${name}" as a
               ~ list of list, which is currently not supported. ${loc}`;
  }
};
