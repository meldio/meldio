/* @flow */

import { camelCase } from '../../../../jsutils/casing';
import { warning } from '../../utils';
import type { Rule } from '../../types';

export const NameInCamelCase: Rule = ({ type, field }) => {
  if (!type || !field) { throw Error('context not passed to rule.'); }
  const { name: typeName } = type;
  const { name, loc } = field;

  if (name !== camelCase(name)) {
    return warning`Field "${name}" in type "${typeName}" should be in
                 ~ "camelCase". ${loc}`;
  }
};
