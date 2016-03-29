/* @flow */

import { camelCase } from '../../../../jsutils/casing';
import { warning } from '../../utils.js';
import type { Rule } from '../../types';

export const NameInCamelCase: Rule =
({ mutation }) => {
  if (!mutation) { throw Error('context not passed to rule.'); }
  const { name, loc } = mutation;

  if (name !== camelCase(name)) {
    return warning`Mutation name "${name}" should be in "camelCase". ${loc}`;
  }
};
