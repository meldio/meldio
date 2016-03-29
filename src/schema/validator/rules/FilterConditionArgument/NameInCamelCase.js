/* @flow */

import { camelCase } from '../../../../jsutils/casing';
import { warning } from '../../utils.js';
import type { Rule } from '../../types';

export const NameInCamelCase: Rule = ({ filter, argument }) => {
  if (!filter || !argument) { throw Error('context not passed to rule.'); }
  const { name: filterName } = filter;
  const target = filterName.replace('Filter#', '');
  const { name, loc } = argument;

  if (name !== camelCase(name)) {
    return warning`Argument "${name}" of filter on ${target} should be in
                 ~ "camelCase". ${loc}`;
  }
};
