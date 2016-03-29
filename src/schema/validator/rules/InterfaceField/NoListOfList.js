/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const NoListOfList: Rule = ({ interface: inter, field }) => {
  if (!inter || !field) { throw Error('context not passed to rule.'); }
  const { name: interfaceName } = inter;
  const { name, loc, isObjectList, type } = field;

  if (isObjectList && type === undefined) {
    return error`Interface "${interfaceName}" defines a field "${name}" as a
               ~ list of list, which is currently not supported. ${loc}`;
  }
};
