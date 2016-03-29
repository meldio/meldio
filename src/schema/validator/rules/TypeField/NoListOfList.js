/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const NoListOfList: Rule = ({ type: t, field }) => {
  if (!t || !field) { throw Error('context not passed to rule.'); }
  const { name: typeName } = t;
  const { name, loc, isObjectList, type } = field;

  if (isObjectList && type === undefined) {
    return error`Type "${typeName}" defines a field "${name}" as a
               ~ list of list, which is currently not supported. ${loc}`;
  }
};
