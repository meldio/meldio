/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const NoListOfList: Rule = ({ input, argument }) => {
  if (!input || !argument) { throw Error('context not passed to rule.'); }
  const { name: inputName } = input;
  const { name, loc, isObjectList, type } = argument;

  if (isObjectList && type === undefined) {
    return error`Input object "${inputName}" defines a field "${name}" as a list
          ~ of list, which is currently not supported. ${loc}`;
  }
};
