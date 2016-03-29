/* @flow */

import { camelCase } from '../../../../jsutils/casing';
import { warning } from '../../utils.js';
import type { Rule } from '../../types';

export const NameInCamelCase: Rule = ({ mutation, argument }) => {
  if (!mutation || !argument) { throw Error('context not passed to rule.'); }
  const { name: mutationName } = mutation;
  const { name, loc } = argument;

  if (name !== camelCase(name)) {
    return warning`Argument "${name}" of mutation "${mutationName}" should be in
                 ~ "camelCase". ${loc}`;
  }
};
