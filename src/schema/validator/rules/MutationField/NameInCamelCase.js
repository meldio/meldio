/* @flow */

import { camelCase } from '../../../../jsutils/casing';
import { warning } from '../../utils';
import type { Rule } from '../../types';

export const NameInCamelCase: Rule = ({ mutation, field }) => {
  if (!mutation || !field) { throw Error('context not passed to rule.'); }
  const { name: mutationName } = mutation;
  const { name, loc } = field;

  if (name !== camelCase(name)) {
    return warning`Field "${name}" of mutation "${mutationName}" should be in
                 ~ "camelCase". ${loc}`;
  }
};
